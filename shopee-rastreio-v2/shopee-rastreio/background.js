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

    let order = null;
    const maxRetries = 3;

    for (let attempt = 0; attempt < maxRetries && !order; attempt++) {
      if (attempt > 0) {
        broadcast({ type: 'progress', current: i + 1, total: links.length, retry: attempt });
        await sleep(3000); // pausa antes de retry
      }
      order = await extractOrderFromTab(links[i]);
    }

    if (order) {
      extractState.orders.push(order);
      broadcast({ type: 'order_found', order });
    } else {
      broadcast({ type: 'order_skip', url: links[i] });
    }

    // Pausa entre pedidos: 2s normal, 5s a cada 10
    if (i < links.length - 1) {
      await sleep((i + 1) % 10 === 0 ? 5000 : 2000);
    }
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

    // Timeout generoso: 30s por aba
    const timeout = setTimeout(() => finish(null), 30000);

    chrome.tabs.create({ url, active: false }, (tab) => {
      tabId = tab.id;

      let loaded = false;

      const doExtraction = async () => {
        if (loaded) return;
        loaded = true;

        let data = null;
        const maxAttempts = 3;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          // No retry: recarrega a aba e espera de novo
          if (attempt > 0) {
            await new Promise((resolve) => {
              chrome.tabs.reload(tabId, {}, resolve);
            });
            await sleep(4000); // espera carregar apos reload
          }

          // Aguarda o React renderizar (mais tempo nas tentativas)
          await waitForPageContent(tabId, 15000 + (attempt * 5000));

          // Scroll para forcar lazy loading
          try {
            await chrome.scripting.executeScript({
              target: { tabId },
              func: () => {
                window.scrollTo(0, document.body.scrollHeight);
              }
            });
            await sleep(1500);
            window.scrollTo(0, 0);
            await sleep(500);
          } catch {}

          // Tenta extrair
          try {
            const [result] = await chrome.scripting.executeScript({
              target: { tabId },
              func: scrapeOrderPage
            });
            data = result?.result;

            if (data && (data.trackingCode || data.customerName)) break;
          } catch (e) {
            console.error('[Shopee Rastreio] Erro no script attempt ' + (attempt + 1) + ':', e);
          }
        }

        clearTimeout(timeout);
        finish(data && (data.trackingCode || data.customerName) ? { ...data, url } : null);
      };

      const onUpdated = (id, info) => {
        if (id !== tabId || info.status !== 'complete') return;
        chrome.tabs.onUpdated.removeListener(onUpdated);
        doExtraction();
      };

      chrome.tabs.onUpdated.addListener(onUpdated);

      // Fallback: se a aba ja carregou antes do listener
      chrome.tabs.get(tabId, (t) => {
        if (chrome.runtime.lastError) return;
        if (t && t.status === 'complete') {
          chrome.tabs.onUpdated.removeListener(onUpdated);
          doExtraction();
        }
      });
    });
  });
}

// ─────────────────────────────────────────────
//  Funcao executada NO CONTEXTO DA PAGINA
//  ⚠️ DEVE ser self-contained (sem closures externas)
// ─────────────────────────────────────────────
function scrapeOrderPage() {

  // ── Helpers (self-contained) ────────────────────────────────
  function normalizeText(text) {
    return (text || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  }

  function normalizePhone(phone) {
    return (phone || "").replace(/\D/g, "");
  }

  function looksLikePersonName(text) {
    if (!text || text.length < 3 || text.length > 80) return false;
    if (!/[a-zA-ZÀ-ÖØ-öø-ÿ]/.test(text)) return false;
    if (/^\d/.test(text)) return false;
    // Rejeita telefone
    if (/^\+?\d[\d\s\-().]{6,}$/.test(text)) return false;
    // Rejeita codigos de rastreio
    if (/^(BR|PX|AA|EE)\d/i.test(text)) return false;

    var norm = normalizeText(text);

    // Termos bloqueados da UI da Shopee / endereco
    var blocked = [
      'endereco', 'entrega', 'padrao', 'transito', 'pedido',
      'logistico', 'coletado', 'preparando', 'finalizado',
      'rastreio', 'transportadora', 'envio', 'pacote',
      'comprador', 'vendedor', 'produto', 'quantidade',
      'preco', 'total', 'frete', 'desconto', 'cupom',
      'avaliacao', 'devolucao', 'reembolso', 'garantia',
      'secao', 'section', 'codigo', 'rastreamento',
      'rua', 'avenida', 'travessa', 'alameda', 'bairro',
      'cep', 'numero', 'complemento', 'referencia',
      'pago', 'pendente', 'cancelado', 'devolvido',
      'caminho', 'separacao', 'nota fiscal', 'seguir',
      'loja', 'compra', 'carrinho', 'nota', 'rastrear'
    ];
    for (var i = 0; i < blocked.length; i++) {
      if (norm.includes(blocked[i])) return false;
    }

    // Deve ser alfabetico (espacos, acentos, apostrofos, hifens ok)
    if (!/^[a-zA-ZÀ-ÖØ-öø-ÿ\s'.\-]+$/.test(text)) return false;

    return true;
  }

  // ── Resultado ───────────────────────────────────────────────
  var result = {
    trackingCode: null,
    customerName: null,
    phone: null,
    shopeeOrderId: null,
    status: null,
    _debug: []
  };

  // Extrair Shopee order ID da URL
  var urlMatch = location.href.match(/\/order\/(\d+)/) ||
                 location.href.match(/[?&]orderId=(\d+)/);
  result.shopeeOrderId = urlMatch ? urlMatch[1] : null;

  var bodyText = document.body.innerText || '';

  // ══════════════════════════════════════════════
  //  PASSO 1: Encontrar <section> de entrega
  // ══════════════════════════════════════════════
  var deliverySection = null;
  var sections = document.querySelectorAll('section');
  for (var si = 0; si < sections.length; si++) {
    var sectionText = normalizeText(sections[si].innerText || '');
    if (sectionText.includes('endereco de entrega')) {
      deliverySection = sections[si];
      result._debug.push('delivery_section_found');
      break;
    }
  }
  if (!deliverySection) {
    result._debug.push('delivery_section_not_found');
  }

  // Escopo: preferir section, fallback para body
  var scope = deliverySection || document.body;
  var scopeText = scope.innerText || '';

  // Query unica de todos os elementos do escopo (performance)
  var allInScope = scope.querySelectorAll('*');

  // ══════════════════════════════════════════════
  //  PASSO 2: Codigo de rastreio
  // ══════════════════════════════════════════════
  var trackPatterns = [
    [/\b(BR[0-9]{9,14}[A-Z0-9]{0,3})\b/i, 'BR'],
    [/\b(PX[0-9]{9,14}[A-Z0-9]{0,3})\b/i, 'PX'],
    [/\b([A-Z]{2}[0-9]{9}[A-Z]{2})\b/i, 'intl']
  ];

  // Estrategia 1: Proximo a "Entrega Padrao" dentro do escopo
  for (var ti = 0; ti < allInScope.length; ti++) {
    var el = allInScope[ti];
    if (el.children.length > 0) continue;
    var t = (el.textContent || '').trim();
    var tn = normalizeText(t);
    if (tn === 'entrega padrao' || tn.startsWith('entrega padrao')) {
      // Verifica irmaos, filhos do pai, irmao do pai
      var candidates = [
        el.nextElementSibling,
        el.parentElement ? el.parentElement.nextElementSibling : null
      ];
      if (el.parentElement) {
        var pChildren = el.parentElement.children;
        for (var ci = 0; ci < pChildren.length; ci++) {
          candidates.push(pChildren[ci]);
        }
      }
      for (var ci2 = 0; ci2 < candidates.length; ci2++) {
        var c = candidates[ci2];
        if (!c) continue;
        var ct = (c.textContent || '').trim();
        for (var pi = 0; pi < trackPatterns.length; pi++) {
          var m = ct.match(trackPatterns[pi][0]);
          if (m) {
            result.trackingCode = m[1].toUpperCase();
            result._debug.push('tracking_near_entrega_padrao:' + m[1]);
            break;
          }
        }
        if (result.trackingCode) break;
      }
      // Fallback: texto do pai
      if (!result.trackingCode && el.parentElement) {
        var pt = el.parentElement.innerText || '';
        for (var pi2 = 0; pi2 < trackPatterns.length; pi2++) {
          var m2 = pt.match(trackPatterns[pi2][0]);
          if (m2) {
            result.trackingCode = m2[1].toUpperCase();
            result._debug.push('tracking_parent_text:' + m2[1]);
            break;
          }
        }
      }
      break;
    }
  }

  // Estrategia 2: Regex no texto do escopo
  if (!result.trackingCode) {
    for (var pi3 = 0; pi3 < trackPatterns.length; pi3++) {
      var m3 = scopeText.match(trackPatterns[pi3][0]);
      if (m3) {
        result.trackingCode = m3[1].toUpperCase();
        result._debug.push('tracking_regex_scope:' + m3[1]);
        break;
      }
    }
  }

  // Estrategia 3: Regex no body (fallback)
  if (!result.trackingCode) {
    for (var pi4 = 0; pi4 < trackPatterns.length; pi4++) {
      var m4 = bodyText.match(trackPatterns[pi4][0]);
      if (m4) {
        result.trackingCode = m4[1].toUpperCase();
        result._debug.push('tracking_regex_body:' + m4[1]);
        break;
      }
    }
  }

  // Estrategia 4: TreeWalker fallback
  if (!result.trackingCode) {
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    var wNode;
    while ((wNode = walker.nextNode())) {
      var wt = (wNode.textContent || '').trim();
      if (/^BR[0-9]{9,14}[A-Z0-9]{0,3}$/.test(wt) ||
          /^PX[0-9]{9,14}[A-Z0-9]{0,3}$/.test(wt) ||
          /^[A-Z]{2}[0-9]{9}[A-Z]{2}$/.test(wt)) {
        result.trackingCode = wt.toUpperCase();
        result._debug.push('tracking_walker:' + wt);
        break;
      }
    }
  }

  if (!result.trackingCode) result._debug.push('tracking_not_found');

  // ══════════════════════════════════════════════
  //  PASSO 3: Telefone
  // ══════════════════════════════════════════════
  var phoneRegexes = [
    /\(\+?55\)\s*\d{2}\s*\d[\d\s\-\.]{7,}/,
    /\+55\s*\d{2}\s*\d[\d\s\-\.]{7,}/,
    /\(\d{2}\)\s*\d{4,5}[\-\s]?\d{4}/,
    /\d{2}\s*\d{4,5}[\-\s]?\d{4}/
  ];

  for (var phi = 0; phi < phoneRegexes.length; phi++) {
    var pm = scopeText.match(phoneRegexes[phi]);
    if (pm) {
      result.phone = pm[0].trim();
      result._debug.push('phone_scope:' + pm[0].trim());
      break;
    }
  }
  if (!result.phone) {
    for (var phi2 = 0; phi2 < phoneRegexes.length; phi2++) {
      var pm2 = bodyText.match(phoneRegexes[phi2]);
      if (pm2) {
        result.phone = pm2[0].trim();
        result._debug.push('phone_body:' + pm2[0].trim());
        break;
      }
    }
  }
  if (!result.phone) result._debug.push('phone_not_found');

  // ══════════════════════════════════════════════
  //  PASSO 4: Nome do cliente
  // ══════════════════════════════════════════════

  // Estrategia 1: Telefone como ancora — encontrar nome perto do elemento de telefone
  if (result.phone) {
    var phoneDigits = normalizePhone(result.phone).slice(-10);

    for (var ni = 0; ni < allInScope.length; ni++) {
      var nel = allInScope[ni];
      if (nel.children.length > 0) continue;
      var nelDigits = normalizePhone(nel.textContent || '');
      if (!nelDigits.includes(phoneDigits)) continue;

      result._debug.push('phone_anchor_found');
      var current = nel;

      for (var depth = 0; depth < 5; depth++) {
        current = current.parentElement;
        if (!current) break;

        // Verifica irmaos anteriores
        var prev = current.previousElementSibling;
        while (prev) {
          var prevLines = (prev.innerText || '').split('\n');
          for (var li = 0; li < prevLines.length; li++) {
            var line = prevLines[li].trim();
            if (looksLikePersonName(line)) {
              result.customerName = line;
              result._debug.push('name_phone_prev_d' + depth + ':' + line);
              break;
            }
          }
          if (result.customerName) break;
          prev = prev.previousElementSibling;
        }
        if (result.customerName) break;

        // Verifica filhos do pai (excluindo o ramo do telefone)
        var parent = current.parentElement;
        if (parent) {
          var parentChildren = parent.children;
          for (var pci = 0; pci < parentChildren.length; pci++) {
            if (parentChildren[pci].contains(nel)) continue;
            var pcLines = (parentChildren[pci].innerText || '').split('\n');
            for (var li2 = 0; li2 < pcLines.length; li2++) {
              var line2 = pcLines[li2].trim();
              if (looksLikePersonName(line2)) {
                result.customerName = line2;
                result._debug.push('name_phone_parent_d' + depth + ':' + line2);
                break;
              }
            }
            if (result.customerName) break;
          }
        }
        if (result.customerName) break;
      }
      break;
    }
  }

  // Estrategia 2: Nome apos heading na section de entrega
  if (!result.customerName && deliverySection) {
    var heading = deliverySection.querySelector('h2');
    if (heading) {
      var foundHeading = false;
      var walkerH = document.createTreeWalker(deliverySection, NodeFilter.SHOW_ELEMENT);
      var hNode;
      while ((hNode = walkerH.nextNode())) {
        if (hNode === heading || heading.contains(hNode)) { foundHeading = true; continue; }
        if (!foundHeading) continue;
        if (hNode.children.length > 0) continue;
        var ht = (hNode.textContent || '').trim();
        if (looksLikePersonName(ht)) {
          result.customerName = ht;
          result._debug.push('name_after_heading:' + ht);
          break;
        }
      }
    }
  }

  // Estrategia 3: Linhas de texto apos "endereco de entrega"
  if (!result.customerName) {
    var normBody = normalizeText(bodyText);
    var eIdx = normBody.indexOf('endereco de entrega');
    if (eIdx !== -1) {
      // Encontra posicao aproximada no texto original
      var origIdx = bodyText.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').indexOf('endereco de entrega');
      if (origIdx === -1) origIdx = 0;
      var afterText = bodyText.substring(origIdx, origIdx + 600);
      var afterLines = afterText.split('\n');
      var passedHeading = false;
      for (var ali = 0; ali < afterLines.length; ali++) {
        var aLine = afterLines[ali].trim();
        if (normalizeText(aLine).includes('endereco de entrega')) { passedHeading = true; continue; }
        if (!passedHeading) continue;
        if (looksLikePersonName(aLine)) {
          result.customerName = aLine;
          result._debug.push('name_text_lines:' + aLine);
          break;
        }
      }
    }
  }

  // Estrategia 4: Fallback — busca DOM no container de endereco
  if (!result.customerName) {
    var addressHeading = null;
    var walkerA = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    var aNode;
    while ((aNode = walkerA.nextNode())) {
      var atn = normalizeText(aNode.textContent || '');
      if (atn === 'endereco de entrega' || atn === 'endereco de entrega:') {
        addressHeading = aNode.parentElement;
        break;
      }
    }

    if (addressHeading) {
      var container = addressHeading;
      for (var ci3 = 0; ci3 < 6; ci3++) container = container.parentElement || container;
      var allInContainer = container.querySelectorAll('*');
      for (var aci = 0; aci < allInContainer.length; aci++) {
        if (allInContainer[aci].children.length > 0) continue;
        var act = (allInContainer[aci].textContent || '').trim();
        if (looksLikePersonName(act)) {
          result.customerName = act;
          result._debug.push('name_dom_fallback:' + act);
          break;
        }
      }
    }
  }

  if (!result.customerName) result._debug.push('name_not_found');

  // ══════════════════════════════════════════════
  //  PASSO 5: Status
  // ══════════════════════════════════════════════
  var statuses = ['A CAMINHO', 'PREPARANDO', 'FINALIZADO', 'A PAGAR', 'CANCELADO', 'EM TRANSITO', 'EM TRÂNSITO', 'COLETADO'];
  var upper = bodyText.toUpperCase();
  for (var si2 = 0; si2 < statuses.length; si2++) {
    if (upper.includes(statuses[si2])) { result.status = statuses[si2]; break; }
  }

  result._debug.push('bodyTextLen:' + bodyText.length);
  result._debug.push('url:' + location.href.substring(0, 80));

  return result;
}

// ─────────────────────────────────────────────
//  Polling: aguarda React renderizar o conteudo
// ─────────────────────────────────────────────
async function waitForPageContent(tabId, maxWait = 15000) {
  const start = Date.now();
  // Minimo de 3s para o React hidratar
  await sleep(3000);

  while (Date.now() - start < maxWait) {
    try {
      const [r] = await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          const text = document.body.innerText || '';
          const normText = text.toLowerCase().normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
          const hasTracking = /\bBR[0-9]{9,13}[A-Z]{0,2}\b/.test(text);
          const hasAddress = normText.includes('endereco de entrega');
          const hasEntregaPadrao = normText.includes('entrega padrao');
          const hasStatus = /A CAMINHO|PREPARANDO|FINALIZADO|EM TRANS|COLETADO/.test(text.toUpperCase());
          const hasPhone = /\(\d{2}\)\s*\d/.test(text) || /\+55\s*\d/.test(text);
          return hasTracking || hasAddress || hasEntregaPadrao || hasStatus || hasPhone;
        }
      });
      if (r?.result === true) {
        await sleep(1000); // hidratacao final maior
        return;
      }
    } catch { /* tab pode estar carregando ainda */ }

    await sleep(1000);
  }
  // Timeout: tenta mesmo assim
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
    // Usa APENAS o ID interno do PagFlow (nunca o Shopee orderId)
    let orderId = order._pagflowOrder?.id || null;

    // Fallback: busca por nome se nao tem orderId
    if (!orderId) {
      const searchRes = await fetch(url + '?status=enviado', {
        credentials: 'include'
      });
      const searchData = await searchRes.json();
      const pagflowOrders = searchData.orders || [];

      const orderName = normalizeName(order.customerName);
      for (const po of pagflowOrders) {
        if (po.trackingCode) continue;
        const poName = normalizeName(po.fullName);
        if (namesMatch(orderName, poName)) {
          orderId = po.id;
          break;
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
        // Nao envia trackingUrl — API gera automaticamente rastreio.elabela.store
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

function namesMatch(a, b) {
  if (!a || !b) return false;
  if (a === b) return true;
  const partsA = a.split(' ');
  const partsB = b.split(' ');
  if (partsA.length >= 2 && partsB.length >= 2) {
    if (partsA[0] === partsB[0] && partsA[partsA.length - 1] === partsB[partsB.length - 1]) return true;
  }
  if (a.includes(b) || b.includes(a)) return true;
  return false;
}
