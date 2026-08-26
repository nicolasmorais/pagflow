// content-list.js — Roda na pagina Minhas Compras da Shopee
// Rola a pagina para carregar pedidos e depois coleta os links

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.action === 'collect_links') {
    scrollAndCollect().then(links => sendResponse({ links }));
    return true; // resposta assincrona
  }
});

async function scrollAndCollect() {
  const targetCount = 60;
  const maxScrolls = 25;
  const scrollDelay = 800;

  let prevCount = 0;

  for (let i = 0; i < maxScrolls; i++) {
    window.scrollTo(0, document.body.scrollHeight);
    await sleep(scrollDelay);

    const links = collectLinks();

    if (links.length >= targetCount || links.length === prevCount) {
      break;
    }
    prevCount = links.length;
  }

  window.scrollTo(0, 0);
  return collectLinks();
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function collectLinks() {
  const found = new Set();

  function addById(id) {
    if (id && /^\d{9,19}$/.test(String(id))) {
      found.add(`https://shopee.com.br/user/purchase/order/${id}`);
    }
  }

  // ── Metodo 1: <a href> diretos ────────────────────────────────
  document.querySelectorAll('a[href]').forEach(a => {
    const h = a.href || '';
    if (h.includes('purchase/order/') || h.includes('orderId=') || h.includes('purchase?')) {
      if (h.includes('shopee.com.br')) found.add(normalizeUrl(h));
    }
  });

  // ── Metodo 2: innerHTML — padroes de URL ──────────────────────
  const html = document.body.innerHTML;
  let m;

  const re1 = /\/user\/purchase\/order\/(\d{9,19})/g;
  while ((m = re1.exec(html)) !== null) addById(m[1]);

  const re1b = /href="[^"]*\/purchase\/order\/(\d{9,19})/g;
  while ((m = re1b.exec(html)) !== null) addById(m[1]);

  const re2 = /orderId[=:]"?(\d{9,19})/gi;
  while ((m = re2.exec(html)) !== null) addById(m[1]);

  // ── Metodo 3: JSON em <script> ────────────────────────────────
  document.querySelectorAll('script').forEach(s => {
    const content = s.textContent || '';
    if (!content.includes('orderId') && !content.includes('order_id') && !content.includes('orderid')) return;

    const re3 = /"(?:orderId|order_id|orderid)"\s*:\s*(\d{9,19})/g;
    while ((m = re3.exec(content)) !== null) addById(m[1]);

    const re3b = /orderId['":\s]+(\d{9,19})/g;
    while ((m = re3b.exec(content)) !== null) addById(m[1]);
  });

  // ── Metodo 4: data-* attributes ───────────────────────────────
  document.querySelectorAll('[data-order-id],[data-orderid],[data-order_id]').forEach(el => {
    addById(el.dataset.orderId || el.dataset.orderid || el.dataset.order_id);
  });

  // ── Metodo 5: onclick ─────────────────────────────────────────
  document.querySelectorAll('[onclick]').forEach(el => {
    const onclick = el.getAttribute('onclick') || '';
    const ids = onclick.match(/\d{9,19}/g) || [];
    ids.forEach(addById);
  });

  // ── Metodo 6: URL atual ───────────────────────────────────────
  const currentMatch = location.href.match(/\/purchase\/order\/(\d{9,19})/);
  if (currentMatch) addById(currentMatch[1]);

  // ── Metodo 7: window.__NEXT_DATA__ ────────────────────────────
  try {
    const nextData = window.__NEXT_DATA__;
    if (nextData) {
      const str = JSON.stringify(nextData);
      const re5 = /(?:orderId|order_id)['":\s]+(\d{9,19})/g;
      while ((m = re5.exec(str)) !== null) addById(m[1]);
    }
  } catch {}

  return [...found];
}

function normalizeUrl(url) {
  try {
    const u = new URL(url);
    const orderId = u.searchParams.get('orderId');
    const base = u.origin + u.pathname;
    return orderId ? `${base}?orderId=${orderId}` : base;
  } catch {
    return url;
  }
}
