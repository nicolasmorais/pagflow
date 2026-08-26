const PAGFLOW_URL_KEY = "pagflowUrl";

const ordersStatusEl = document.getElementById("ordersStatus");
const settingsPanel = document.getElementById("settingsPanel");
const pagflowUrlInput = document.getElementById("pagflowUrlInput");
const dateFromInput = document.getElementById("dateFrom");
const dateToInput = document.getElementById("dateTo");
const statusFilter = document.getElementById("statusFilter");
const pagflowOrdersList = document.getElementById("pagflowOrdersList");
const trackingWarn = document.getElementById("trackingWarn");
const trackingStatusBox = document.getElementById("trackingStatusBox");
const trackingDot = document.getElementById("trackingDot");
const trackingStatusTxt = document.getElementById("trackingStatusTxt");
const trackingProgWrap = document.getElementById("trackingProgWrap");
const trackingProgFill = document.getElementById("trackingProgFill");
const extractLimit = document.getElementById("extractLimit");
const startExtractionBtn = document.getElementById("startExtraction");
const sendAllTrackingBtn = document.getElementById("sendAllTracking");
const exportCsvBtn = document.getElementById("exportCsv");
const clearExtractionBtn = document.getElementById("clearExtraction");
const extractOrdersList = document.getElementById("extractOrdersList");

let pagflowOrders = []; // pedidos importados do PagFlow
let extractedOrders = []; // pedidos extraidos da Shopee

// ---------- Helpers ----------
function showOrdersStatus(msg, isError = false) {
  ordersStatusEl.textContent = msg;
  ordersStatusEl.className = isError ? "error" : "";
}

function getPagflowUrl(cb) {
  chrome.storage.local.get([PAGFLOW_URL_KEY], (result) => cb(result[PAGFLOW_URL_KEY] || ""));
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function normalizeName(name) {
  return (name || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function namesMatch(a, b) {
  if (!a || !b) return false;
  if (a === b) return true;
  const partsA = a.split(" ");
  const partsB = b.split(" ");
  if (partsA.length >= 2 && partsB.length >= 2) {
    if (partsA[0] === partsB[0] && partsA[partsA.length - 1] === partsB[partsB.length - 1]) return true;
  }
  if (a.includes(b) || b.includes(a)) return true;
  return false;
}

function normalizePhone(phone) {
  return (phone || "").replace(/\D/g, "");
}

function phonesMatch(phoneA, phoneB) {
  if (!phoneA || !phoneB) return false;
  const a = normalizePhone(phoneA);
  const b = normalizePhone(phoneB);
  if (a === b) return true;
  // Sem codigo do pais
  const aLocal = a.startsWith("55") ? a.slice(2) : a;
  const bLocal = b.startsWith("55") ? b.slice(2) : b;
  if (aLocal === bLocal) return true;
  // Ultimos 11 digitos (DDD + numero)
  if (a.slice(-11) === b.slice(-11)) return true;
  return false;
}

function formatPrice(val) {
  if (!val && val !== 0) return "";
  return "R$ " + Number(val).toFixed(2).replace(".", ",");
}

function formatDate(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString("pt-BR");
}

async function getActiveTab() {
  const windows = await chrome.windows.getAll({ populate: true });
  for (const win of windows) {
    if (win.type === "normal") {
      const tab = win.tabs.find((t) => t.active);
      if (tab) return tab;
    }
  }
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  return tab;
}

// ---------- Settings ----------
document.getElementById("settingsToggle").addEventListener("click", () => {
  settingsPanel.style.display = settingsPanel.style.display === "none" ? "block" : "none";
});

getPagflowUrl((url) => {
  pagflowUrlInput.value = url;
});

document.getElementById("saveSettings").addEventListener("click", () => {
  const url = pagflowUrlInput.value.trim().replace(/\/+$/, "");
  chrome.storage.local.set({ [PAGFLOW_URL_KEY]: url }, () => {
    showOrdersStatus(url ? "URL salva: " + url : "URL limpa.");
    settingsPanel.style.display = "none";
  });
});

document.getElementById("clearDates").addEventListener("click", () => {
  dateFromInput.value = "";
  dateToInput.value = "";
});

// =====================================================
//  1. IMPORTAR PEDIDOS DO PAGFLOW
// =====================================================
document.getElementById("importOrders").addEventListener("click", async () => {
  getPagflowUrl(async (pagflowUrl) => {
    if (!pagflowUrl) {
      showOrdersStatus("Configure a URL do PagFlow primeiro (engrenagem).", true);
      return;
    }

    let dateLabel = "";
    if (dateFromInput.value && dateToInput.value) {
      dateLabel = " (" + dateFromInput.value + " a " + dateToInput.value + ")";
    } else if (dateFromInput.value) {
      dateLabel = " (a partir de " + dateFromInput.value + ")";
    } else if (dateToInput.value) {
      dateLabel = " (ate " + dateToInput.value + ")";
    }
    showOrdersStatus("Buscando pedidos" + dateLabel + "...");

    try {
      const params = new URLSearchParams();
      if (dateFromInput.value) params.set("from", dateFromInput.value);
      if (dateToInput.value) params.set("to", dateToInput.value);
      if (statusFilter.value) params.set("status", statusFilter.value);
      const qs = params.toString();
      const fullUrl = pagflowUrl + "/api/admin/extension-orders" + (qs ? "?" + qs : "");
      const res = await fetch(fullUrl, { credentials: "include" });

      if (res.status === 401) {
        showOrdersStatus("Faca login no PagFlow primeiro.", true);
        return;
      }
      if (!res.ok) {
        showOrdersStatus("Erro na API: " + res.status, true);
        return;
      }

      const data = await res.json();
      if (!data.orders) {
        showOrdersStatus("Resposta invalida da API.", true);
        return;
      }

      pagflowOrders = data.orders;
      showOrdersStatus(pagflowOrders.length + " pedido(s) encontrado(s).");
      renderPagflowOrders();
      matchExtractedOrders(); // re-match se ja houver extracoes
    } catch (err) {
      showOrdersStatus("Erro de conexao: " + err.message, true);
    }
  });
});

function renderPagflowOrders() {
  if (pagflowOrders.length === 0) {
    pagflowOrdersList.innerHTML = '<div class="orders-empty">Nenhum pedido encontrado</div>';
    return;
  }

  pagflowOrdersList.innerHTML = pagflowOrders.map((o) => {
    const name = o.fullName || "Pedido #" + o.id.slice(0, 8);
    const tracking = o.trackingCode
      ? `<div class="order-tracking">${escapeHtml(o.trackingCode)}</div>`
      : '<div class="order-tracking pending">Sem rastreio</div>';
    const matchBadge = o.trackingCode
      ? '<span class="badge-match" style="background:#1a1a3a;color:#88f">JA TEM RASTREIO</span>'
      : o._matched
      ? '<span class="badge-match">MATCH</span>'
      : "";

    return `
      <div class="order-card${o._matched ? " matched" : ""}" data-order-id="${o.id}">
        <div class="order-name">${escapeHtml(name)} ${matchBadge}</div>
        <div class="order-meta">
          <span>${formatPrice(o.totalPrice)}</span>
          <span>${formatDate(new Date(o.createdAt))}</span>
        </div>
        ${tracking}
      </div>`;
  }).join("");
}

// =====================================================
//  2. EXTRAIR RASTREIO DA SHOPEE
// =====================================================
function showTrackingWarn(msg) {
  trackingWarn.textContent = msg;
  trackingWarn.style.display = "block";
}
function hideTrackingWarn() {
  trackingWarn.style.display = "none";
}

function setTrackingStatus(state, txt) {
  trackingStatusTxt.textContent = txt;
  trackingStatusTxt.className = "tracking-status-txt" + (state !== "idle" ? " bright" : "");
  trackingDot.className = "tracking-dot" + (state === "active" ? " blink" : state === "done" ? " ok" : "");
  trackingStatusBox.className = "tracking-status-box" + (state === "active" ? " active" : state === "done" ? " success" : "");
}

function updateTrackingProgress(cur, total) {
  const pct = total > 0 ? Math.round((cur / total) * 100) : 0;
  trackingProgFill.style.width = pct + "%";
}

// ---------- Start extraction ----------
startExtractionBtn.addEventListener("click", async () => {
  hideTrackingWarn();

  if (pagflowOrders.length === 0) {
    showTrackingWarn("Importe os pedidos do PagFlow primeiro!");
    return;
  }

  const tab = await getActiveTab();
  if (!tab || !tab.url || !tab.url.includes("shopee.com.br/user/purchase")) {
    showTrackingWarn("Abra a pagina de pedidos da Shopee primeiro!");
    return;
  }

  setTrackingStatus("active", "Coletando links de pedidos...");
  startExtractionBtn.disabled = true;

  let links = [];
  try {
    const res = await chrome.tabs.sendMessage(tab.id, { action: "collect_links" });
    links = res?.links || [];
  } catch {
    try {
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["content-list.js"] });
      await new Promise(r => setTimeout(r, 300));
      const res = await chrome.tabs.sendMessage(tab.id, { action: "collect_links" });
      links = res?.links || [];
    } catch (e) {
      showTrackingWarn("Nao foi possivel coletar links. Recarregue a pagina.");
      startExtractionBtn.disabled = false;
      setTrackingStatus("idle", "Erro ao iniciar");
      return;
    }
  }

  if (links.length === 0) {
    showTrackingWarn("Nenhum pedido encontrado na pagina.");
    startExtractionBtn.disabled = false;
    setTrackingStatus("idle", "Nenhum pedido encontrado");
    return;
  }

  const limit = Math.max(1, parseInt(extractLimit.value) || 30);
  const batch = links.slice(0, limit);

  extractedOrders = [];
  renderExtractedList();
  clearExtractionBtn.style.display = "none";
  sendAllTrackingBtn.disabled = true;
  exportCsvBtn.disabled = true;
  trackingProgWrap.style.display = "block";
  setTrackingStatus("active", `Iniciando — 0 / ${batch.length} pedidos...`);
  updateTrackingProgress(0, batch.length);

  chrome.runtime.sendMessage({ action: "start_extraction", links: batch });
});

// =====================================================
//  MATCH: Shopee <-> PagFlow (telefone > nome)
// =====================================================
function matchExtractedOrders() {
  // Reset match flags
  pagflowOrders.forEach(o => { o._matched = false; });

  extractedOrders.forEach((ext) => {
    const extNameNorm = normalizeName(ext.customerName);
    const extPhone = ext.phone;

    let candidates = [];

    for (const po of pagflowOrders) {
      if (po._matched) continue;
      if (po.trackingCode) continue; // ja tem rastreio

      const poNameNorm = normalizeName(po.fullName);
      const poPhone = po.phone;

      let score = 0;
      let reason = "";

      const phoneOk = phonesMatch(extPhone, poPhone);
      const nameOk = extNameNorm && poNameNorm && namesMatch(extNameNorm, poNameNorm);
      const exactName = extNameNorm && poNameNorm && extNameNorm === poNameNorm;

      if (phoneOk && nameOk) {
        score = 150;
        reason = "Telefone + nome";
      } else if (phoneOk) {
        score = 100;
        reason = "Telefone";
      } else if (exactName) {
        score = 50;
        reason = "Nome exato";
      } else if (nameOk) {
        score = 25;
        reason = "Nome aproximado";
      }

      if (score > 0) {
        candidates.push({ order: po, score, reason });
      }
    }

    // Ordena por score decrescente
    candidates.sort((a, b) => b.score - a.score);

    if (candidates.length === 0) {
      ext._pagflowOrder = null;
      ext._matchedName = null;
      ext._matchScore = 0;
      ext._matchReason = "";
    } else if (candidates.length > 1 && candidates[0].score === candidates[1].score) {
      // Ambiguo — multiplos candidatos com mesmo score
      ext._pagflowOrder = null;
      ext._matchedName = null;
      ext._matchScore = 0;
      ext._matchReason = "Ambiguo";
    } else {
      const best = candidates[0];
      best.order._matched = true;
      ext._pagflowOrder = best.order;
      ext._matchedName = best.order.fullName;
      ext._matchScore = best.score;
      ext._matchReason = best.reason;
    }
  });

  renderPagflowOrders();
  renderExtractedList();
}

// ---------- Send all to PagFlow ----------
sendAllTrackingBtn.addEventListener("click", async () => {
  sendAllTrackingBtn.disabled = true;
  sendAllTrackingBtn.textContent = "Enviando...";

  getPagflowUrl(async (pagflowUrl) => {
    if (!pagflowUrl) {
      showTrackingWarn("Configure a URL do PagFlow nas configuracoes.");
      sendAllTrackingBtn.disabled = false;
      sendAllTrackingBtn.textContent = "Enviar Tudo ao PagFlow";
      return;
    }

    let ok = 0, fail = 0, skipped = 0;
    for (let i = 0; i < extractedOrders.length; i++) {
      const ext = extractedOrders[i];
      if (!ext._pagflowOrder || !ext.trackingCode) continue;
      // So envia automaticamente matches com score >= 50 (confiaveis)
      if (ext._matchScore < 50) { skipped++; continue; }

      const card = extractOrdersList.querySelector(`[data-idx="${i}"]`);
      const btn = card?.querySelector(".mini-btn");
      if (btn) { btn.textContent = "..."; btn.disabled = true; }

      try {
        const r = await chrome.runtime.sendMessage({
          action: "send_to_pagflow",
          order: { ...ext, customerName: ext._matchedName || ext.customerName },
          pagflowUrl: pagflowUrl,
        });

        if (r?.ok) {
          if (btn) { btn.textContent = "Enviado"; btn.className = "mini-btn sent"; }
          ext._pagflowOrder.trackingCode = ext.trackingCode;
          ext._pagflowOrder._matched = true;
          ok++;
        } else {
          if (btn) { btn.textContent = "Erro"; btn.className = "mini-btn error"; btn.title = r?.error || ""; btn.disabled = false; }
          fail++;
        }
      } catch (e) {
        if (btn) { btn.textContent = "Erro"; btn.className = "mini-btn error"; btn.disabled = false; }
        fail++;
      }

      await new Promise(r => setTimeout(r, 300));
    }

    renderPagflowOrders();

    let msg = ok > 0 ? `${ok} enviado(s)` : "Erro ao enviar";
    if (fail) msg += ` · ${fail} erro(s)`;
    if (skipped) msg += ` · ${skipped} revisao(oes)`;
    sendAllTrackingBtn.textContent = msg;

    setTimeout(() => {
      sendAllTrackingBtn.textContent = "Enviar Tudo ao PagFlow";
      const hasSendable = extractedOrders.filter(o => o._pagflowOrder && o.trackingCode && o._matchScore >= 50).length > 0;
      sendAllTrackingBtn.disabled = !hasSendable;
    }, 3500);
  });
});

// ---------- Export CSV ----------
exportCsvBtn.addEventListener("click", () => {
  const rows = [["Nome Shopee", "Nome PagFlow", "Rastreio", "Match", "Qualidade", "Telefone", "URL"]];
  for (const o of extractedOrders) {
    rows.push([
      o.customerName || "",
      o._matchedName || "",
      o.trackingCode || "",
      o._pagflowOrder ? "SIM" : "NAO",
      o._matchReason || "",
      o.phone || "",
      o.url || ""
    ]);
  }
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), {
    href: url,
    download: `shopee-rastreio-${new Date().toISOString().slice(0, 10)}.csv`,
  });
  a.click();
  URL.revokeObjectURL(url);
});

// ---------- Clear ----------
clearExtractionBtn.addEventListener("click", () => {
  chrome.runtime.sendMessage({ action: "clear_extraction" });
  extractedOrders = [];
  pagflowOrders.forEach(o => { o._matched = false; });
  renderExtractedList();
  renderPagflowOrders();
  setTrackingStatus("idle", "Abra shopee.com.br/user/purchase e clique em Iniciar");
  sendAllTrackingBtn.disabled = true;
  exportCsvBtn.disabled = true;
  clearExtractionBtn.style.display = "none";
  startExtractionBtn.disabled = false;
  trackingProgWrap.style.display = "none";
});

// ---------- Listen for background messages ----------
chrome.runtime.onMessage.addListener((msg) => {
  if (msg._src !== "bg") return;

  switch (msg.type) {
    case "started":
      setTrackingStatus("active", `Extraindo — 0 / ${msg.total}`);
      trackingProgWrap.style.display = "block";
      updateTrackingProgress(0, msg.total);
      break;

    case "progress":
      setTrackingStatus("active", `Extraindo — ${msg.current} / ${msg.total}`);
      updateTrackingProgress(msg.current, msg.total);
      break;

    case "order_found":
      extractedOrders.push(msg.order);
      matchExtractedOrders();
      break;

    case "done":
      const n = extractedOrders.length;
      const matched = extractedOrders.filter(o => o._pagflowOrder).length;
      setTrackingStatus("done", `Concluido! ${n} extraido(s), ${matched} com match.`);
      startExtractionBtn.disabled = false;
      const hasSendable = extractedOrders.filter(o => o._pagflowOrder && o.trackingCode && o._matchScore >= 50).length > 0;
      sendAllTrackingBtn.disabled = !hasSendable;
      exportCsvBtn.disabled = n === 0;
      clearExtractionBtn.style.display = "block";
      updateTrackingProgress(msg.total || n, msg.total || n);
      break;
  }
});

// ---------- Render extracted list ----------
function renderExtractedList() {
  if (extractedOrders.length === 0) {
    extractOrdersList.innerHTML = '<div class="extract-empty">Nenhum pedido extraido ainda</div>';
    return;
  }

  extractOrdersList.innerHTML = extractedOrders.map((o, idx) => {
    const name = o.customerName || "(nome nao detectado)";
    const track = o.trackingCode ? o.trackingCode : "Codigo nao encontrado";
    const trackCls = o.trackingCode ? "" : " missing";
    const phone = o.phone ? `<div class="extract-phone">${escapeHtml(o.phone)}</div>` : "";

    // Badge de qualidade do match
    let matchLine = "";
    if (o._pagflowOrder) {
      let badgeCls = "badge-match";
      let badgeText = "MATCH";
      if (o._matchScore >= 100) {
        badgeCls += " strong";
        badgeText = "MATCH FORTE";
      } else if (o._matchScore >= 50) {
        // MATCH normal (verde)
      } else {
        badgeCls += " review";
        badgeText = "REVISAR";
      }
      matchLine = `<div class="extract-match-name"><span class="${badgeCls}">${badgeText}</span> ${escapeHtml(o._matchedName)} <span style="color:#666;font-size:9px">— ${escapeHtml(o._matchReason)}</span></div>`;
    } else if (o._matchReason === "Ambiguo") {
      matchLine = '<div class="extract-match-name"><span class="badge-match ambiguous">AMBIGUO</span> Varios candidatos com mesmo nome</div>';
    } else if (o.customerName) {
      matchLine = '<div class="extract-match-name" style="color:#f66">Sem match no PagFlow</div>';
    }

    const debugLine = (!o.trackingCode || !o.customerName) && o._debug && o._debug.length
      ? `<div class="extract-phone" title="${escapeHtml(o._debug.join(' | '))}" style="color:#555;cursor:help">debug (hover)</div>`
      : "";
    const cardCls = o._pagflowOrder ? " extract-card matched" : "extract-card";
    const canSend = o._pagflowOrder && o.trackingCode;

    return `
      <div class="${cardCls}" data-idx="${idx}">
        <div class="extract-info">
          <div class="extract-name">${escapeHtml(name)}</div>
          ${matchLine}
          <div class="extract-track${trackCls}">${escapeHtml(track)}</div>
          ${phone}
          ${debugLine}
        </div>
        <button class="mini-btn" data-idx="${idx}"
          ${!canSend ? 'disabled title="Sem match ou sem rastreio"' : ""}>
          Enviar
        </button>
      </div>`;
  }).join("");

  // Individual send buttons
  extractOrdersList.querySelectorAll(".mini-btn:not([disabled])").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const idx = parseInt(btn.dataset.idx);
      const o = extractedOrders[idx];
      if (!o._pagflowOrder) return;

      btn.textContent = "...";
      btn.disabled = true;

      getPagflowUrl(async (pagflowUrl) => {
        const r = await chrome.runtime.sendMessage({
          action: "send_to_pagflow",
          order: { ...o, customerName: o._matchedName || o.customerName },
          pagflowUrl: pagflowUrl,
        });

        if (r?.ok) {
          btn.textContent = "Enviado";
          btn.className = "mini-btn sent";
          o._pagflowOrder.trackingCode = o.trackingCode;
          renderPagflowOrders();
        } else {
          btn.textContent = "Erro";
          btn.className = "mini-btn error";
          btn.title = r?.error || `HTTP ${r?.status}`;
          btn.disabled = false;
        }
      });
    });
  });
}

// ---------- Restore extraction state on popup open ----------
chrome.runtime.sendMessage({ action: "get_extract_state" }, (s) => {
  if (!s) return;
  extractedOrders = s.orders || [];

  if (s.running) {
    startExtractionBtn.disabled = true;
    setTrackingStatus("active", `Extraindo — ${s.current} / ${s.total}`);
    trackingProgWrap.style.display = "block";
    updateTrackingProgress(s.current, s.total);
  } else if (extractedOrders.length > 0) {
    const matched = extractedOrders.filter(o => o._pagflowOrder).length;
    setTrackingStatus("done", `${extractedOrders.length} extraido(s)`);
    clearExtractionBtn.style.display = "block";
    trackingProgWrap.style.display = "block";
    updateTrackingProgress(extractedOrders.length, extractedOrders.length);
  }

  // Se ja tem pedidos PagFlow salvos, re-match
  if (pagflowOrders.length > 0) {
    matchExtractedOrders();
  }
});
