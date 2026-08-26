// background.js — extracao de rastreio Shopee + envio ao PagFlow

let popupWindowId = null;

chrome.action.onClicked.addListener(async () => {
  if (popupWindowId !== null) {
    try {
      const win = await chrome.windows.get(popupWindowId);
      if (win) {
        chrome.windows.update(popupWindowId, { focused: true });
        return;
      }
    } catch {
      popupWindowId = null;
    }
  }

  const win = await chrome.windows.create({
    url: chrome.runtime.getURL("popup.html"),
    type: "popup",
    width: 400,
    height: 700,
    focused: true,
  });

  popupWindowId = win.id;

  chrome.windows.onRemoved.addListener(function onRemoved(windowId) {
    if (windowId === popupWindowId) {
      popupWindowId = null;
      chrome.windows.onRemoved.removeListener(onRemoved);
    }
  });
});

// ─────────────────────────────────────────────
//  Estado da extracao de rastreio
// ─────────────────────────────────────────────
let extractState = {
  running: false,
  orders: [],
  total: 0,
  current: 0
};

// ─────────────────────────────────────────────
//  Roteador de mensagens
// ─────────────────────────────────────────────
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  switch (msg.action) {
    case 'start_extraction':
      runExtraction(msg.links).then(sendResponse);
      return true;

    case 'get_extract_state':
      sendResponse({ ...extractState });
      return false;

    case 'send_to_pagflow':
      sendToPagFlow(msg.order, msg.pagflowUrl).then(sendResponse);
      return true;

    case 'send_all_tracking':
      sendAllTracking(msg.pagflowUrl, msg.orders).then(sendResponse);
      return true;

    case 'clear_extraction':
      extractState = { running: false, orders: [], total: 0, current: 0 };
      sendResponse({ ok: true });
      return false;
  }
});

// ─────────────────────────────────────────────
//  Extracao principal
// ─────────────────────────────────────────────
async function runExtraction(links) {
  if (extractState.running) return { error: 'Ja em execucao' };

  extractState = { running: true, orders: [], total: links.length, current: 0 };
  broadcast({ type: 'started', total: links.length });

  for (let i = 0; i < links.length; i++) {
    extractState.current = i + 1;
    broadcast({ type: 'progress', current: i + 1, total: links.length });

    const order = await extractOrderFromTab(links[i]);

    if (order) {
      extractState.orders.push(order);
      broadcast({ type: 'order_found', order });
    } else {
      broadcast({ type: 'order_skip', url: links[i] });
    }

    if (i < links.length - 1) await sleep(900);
  }

  extractState.running = false;
  broadcast({ type: 'done', orders: extractState.orders });
  return { ok: true };
}

// ─────────────────────────────────────────────
//  Abre tab, aguarda render, extrai, fecha
// ─────────────────────────────────────────────
function extractOrderFromTab(url) {
  return new Promise((resolve) => {
    let tabId = null;
    let done = false;

    const finish = (data) => {
      if (done) return;
      done = true;
      if (tabId) chrome.tabs.remove(tabId, () => {});
      resolve(data);
    };

    const timeout = setTimeout(() => finish(null), 30000);

    chrome.tabs.create({ url, active: false }, (tab) => {
      tabId = tab.id;

      const onUpdated = async (id, info) => {
        if (id !== tabId || info.status !== 'complete') return;
        chrome.tabs.onUpdated.removeListener(onUpdated);

        // Tenta extrair dados com retry (Shopee é SPA e pode demorar para renderizar)
        for (let attempt = 1; attempt <= 3; attempt++) {
          await sleep(attempt === 1 ? 4000 : 3000);

          try {
            const [result] = await chrome.scripting.executeScript({
              target: { tabId },
              func: scrapeOrderPage
            });
            const data = result?.result;
            console.log(`[Shopee Rastreio] Tentativa ${attempt}:`, JSON.stringify(data));

            if (data && (data.trackingCode || data.customerName || data.orderId)) {
              clearTimeout(timeout);
              finish({ ...data, url });
              return;
            }
          } catch (e) {
            console.error(`[Shopee Rastreio] Erro tentativa ${attempt}:`, e);
          }
        }

        clearTimeout(timeout);
        finish(null);
      };

      chrome.tabs.onUpdated.addListener(onUpdated);
    });
  });
}

// ─────────────────────────────────────────────
//  Funcao executada NO CONTEXTO DA PAGINA
// ─────────────────────────────────────────────
function scrapeOrderPage() {
  const result = {
    trackingCode: null,
    customerName: null,
    phone: null,
    orderId: null,
    status: null
  };

  const urlMatch = location.href.match(/\/order\/(\d+)/) ||
                   location.href.match(/[?&]orderId=(\d+)/);
  result.orderId = urlMatch ? urlMatch[1] : null;

  const bodyText = document.body.innerText || '';

  // ── Nome do cliente — metodo primario: classes Shopee ──
  const nameEl = document.querySelector('.S4vMsq, [class*="S4vMsq"]');
  if (nameEl) {
    const nameText = (nameEl.textContent || '').trim();
    if (nameText.length >= 3 && nameText.length <= 80) {
      result.customerName = nameText;
    }
  }

  // ── Telefone — metodo primario: dentro de LBTJ9j ──
  const addrEl = document.querySelector('.LBTJ9j, [class*="LBTJ9j"]');
  if (addrEl) {
    const phoneMatch = (addrEl.textContent || '').match(/\(\+?\d+\)\s*\d[\d\s\-\.]{6,}/);
    if (phoneMatch) result.phone = phoneMatch[0].trim();
  }

  // ── Codigo de rastreio — padroes brasileiros ──
  const trackPatterns = [
    /\b(BR[0-9]{9,13}[A-Z]{0,2})\b/,
    /\b([A-Z]{2}[0-9]{9}[A-Z]{2})\b/,
    /\b(PX[0-9]{9,13}[A-Z]{0,2})\b/
  ];

  for (const p of trackPatterns) {
    const m = bodyText.match(p);
    if (m) { result.trackingCode = m[1]; break; }
  }

  if (!result.trackingCode) {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const t = (node.textContent || '').trim();
      if (/^BR[0-9]{9}/.test(t) || /^[A-Z]{2}[0-9]{9}[A-Z]{2}$/.test(t)) {
        result.trackingCode = t;
        break;
      }
    }
  }

  // ── Nome fallback: busca por "Endereco De Entrega" ──
  if (!result.customerName) {
    let addressHeading = null;
    const walker2 = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = walker2.nextNode())) {
      const t = (n.textContent || '').trim();
      if (t === 'Endereco De Entrega' || t === 'Endereco de Entrega' || t === 'Endereco de entrega') {
        addressHeading = n.parentElement;
        break;
      }
    }

    if (addressHeading) {
      let container = addressHeading;
      for (let i = 0; i < 5; i++) container = container.parentElement || container;

      const allInContainer = container.querySelectorAll('*');
      for (const el of allInContainer) {
        if (el.children.length > 0) continue;
        const t = (el.textContent || '').trim();
        if (
          t.length >= 3 && t.length <= 80 &&
          !t.includes('Endereco') && !t.includes('Entrega') &&
          !t.includes('(+') && !t.startsWith('+') && !/^\d/.test(t) &&
          /^[A-Za-zÀ-ÖØ-öø-ÿ\s'.\-]+$/.test(t)
        ) {
          result.customerName = t;
          break;
        }
      }
    }
  }

  if (!result.customerName) {
    const idx = bodyText.indexOf('Endereco De Entrega');
    if (idx !== -1) {
      const after = bodyText.substring(idx + 19, idx + 300);
      const lines = after.split('\n').map(l => l.trim()).filter(Boolean);
      for (const line of lines) {
        if (
          /^[A-Za-zÀ-ÖØ-öø-ÿ\s'.\-]+$/.test(line) &&
          line.length >= 3 && line.length <= 70 &&
          !line.includes('Endereco') && !line.includes('Padrao')
        ) {
          result.customerName = line;
          break;
        }
      }
    }
  }

  // ── Telefone fallback ──
  if (!result.phone) {
    const phoneMatch = bodyText.match(/\(\+?\d+\)\s*\d[\d\s\-\.]{6,}/);
    if (phoneMatch) result.phone = phoneMatch[0].trim();
  }

  // ── Status ──
  const statuses = ['A CAMINHO', 'PREPARANDO', 'FINALIZADO', 'A PAGAR', 'CANCELADO', 'EM TRANSITO'];
  const upper = bodyText.toUpperCase();
  for (const s of statuses) {
    if (upper.includes(s)) { result.status = s; break; }
  }

  return result;
}

// ─────────────────────────────────────────────
//  Envio ao PagFlow (salva tracking code)
// ─────────────────────────────────────────────
async function sendToPagFlow(order, pagflowUrl) {
  if (!pagflowUrl) {
    return { error: 'URL do PagFlow nao configurada' };
  }

  const base = pagflowUrl.replace(/\/$/, '');
  const url = base + '/api/admin/extension-orders';

  try {
    // Se ja tem orderId (match feito no popup), envia direto
    let orderId = order._pagflowOrder?.id || order.orderId || null;

    // Fallback: busca por nome ou telefone se nao tem orderId
    if (!orderId) {
      const searchRes = await fetch(url + '?status=enviado', {
        credentials: 'include'
      });
      const searchData = await searchRes.json();
      const pagflowOrders = searchData.orders || [];

      const orderName = normalizeName(order.customerName);
      const orderPhone = normalizePhone(order.phone);

      // Tenta por nome
      for (const po of pagflowOrders) {
        if (po.trackingCode) continue;
        const poName = normalizeName(po.fullName);
        if (namesMatch(orderName, poName)) {
          orderId = po.id;
          break;
        }
      }

      // Fallback: por telefone
      if (!orderId && orderPhone) {
        for (const po of pagflowOrders) {
          if (po.trackingCode) continue;
          const poPhone = normalizePhone(po.phone);
          if (poPhone && poPhone === orderPhone) {
            orderId = po.id;
            break;
          }
        }
      }
    }

    if (!orderId) {
      return { error: 'Nenhum pedido PagFlow encontrado para: ' + order.customerName };
    }

    const saveRes = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        orderId: orderId,
        trackingCode: order.trackingCode,
        trackingUrl: order.url || '',
      }),
    });

    const body = await saveRes.json().catch(() => ({}));
    return { ok: saveRes.ok, status: saveRes.status, body, orderId: orderId };
  } catch (e) {
    return { error: e.message };
  }
}

async function sendAllTracking(pagflowUrl, orders) {
  const results = [];
  const list = orders || extractState.orders;
  for (const order of list) {
    const r = await sendToPagFlow(order, pagflowUrl);
    results.push({ order, result: r });
    await sleep(300);
  }
  return results;
}

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────
function broadcast(data) {
  chrome.runtime.sendMessage({ _src: 'bg', ...data }).catch(() => {});
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function normalizeName(name) {
  return (name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizePhone(phone) {
  return (phone || '').replace(/\D/g, '').replace(/^55/, '');
}

function namesMatch(a, b) {
  if (!a || !b) return false;
  if (a === b) return true;
  const partsA = a.split(' ');
  const partsB = b.split(' ');
  if (partsA.length >= 2 && partsB.length >= 2) {
    if (partsA[0] === partsB[0] && partsA[partsA.length - 1] === partsB[partsB.length - 1]) return true;
  }
  if (a.includes(b) || b.includes(a)) return true;
  const minLen = Math.min(a.length, b.length);
  if (minLen >= 4 && levenshtein(a, b) <= Math.ceil(minLen * 0.3)) return true;
  return false;
}

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return dp[m][n];
}
