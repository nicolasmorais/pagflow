// content-list.js — Roda na pagina Minhas Compras da Shopee
// Coleta todos os links de pedidos individuais

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.action === 'collect_links') {
    // Scrolla para baixo para carregar mais pedidos (lazy load)
    // Depois coleta os links
    scrollAndCollect().then(links => sendResponse({ links }));
    return true; // async response
  }
});

async function scrollAndCollect() {
  // Coleta inicial
  let links = collectLinks();
  const initialCount = links.length;

  // Tenta scrollar 3 vezes para carregar mais pedidos
  for (let i = 0; i < 3; i++) {
    window.scrollTo(0, document.body.scrollHeight);
    await new Promise(r => setTimeout(r, 1500));
    const newLinks = collectLinks();
    if (newLinks.length <= links.length) break; // nao carregou mais
    links = newLinks;
  }

  console.log(`[Shopee Rastreio] ${initialCount} links iniciais, ${links.length} apos scroll`);
  return links;
}

function collectLinks() {
  const found = new Set();

  // Metodo 1: <a href> diretos
  document.querySelectorAll('a[href]').forEach(a => {
    const h = a.href || '';
    if (h.includes('purchase/order/') || h.includes('orderId=')) {
      found.add(normalizeUrl(h));
    }
  });

  // Metodo 2: varrer innerHTML por padroes de URL
  const html = document.body.innerHTML;

  // /user/purchase/order/123456789012
  const re1 = /\/user\/purchase\/order\/(\d{9,19})/g;
  let m;
  while ((m = re1.exec(html)) !== null) {
    found.add(`https://shopee.com.br/user/purchase/order/${m[1]}`);
  }

  // orderId=123456789012
  const re2 = /orderId[=:]"?(\d{9,19})/g;
  while ((m = re2.exec(html)) !== null) {
    found.add(`https://shopee.com.br/user/purchase/order/${m[1]}`);
  }

  // Metodo 3: JSON embutido nos <script>
  document.querySelectorAll('script').forEach(s => {
    const content = s.textContent || '';
    if (!content.includes('orderId') && !content.includes('order_id')) return;

    const re3 = /"(?:orderId|order_id)"\s*:\s*(\d{9,19})/g;
    while ((m = re3.exec(content)) !== null) {
      found.add(`https://shopee.com.br/user/purchase/order/${m[1]}`);
    }
  });

  // Metodo 4: atributos data-*
  document.querySelectorAll('[data-order-id], [data-orderid]').forEach(el => {
    const id = el.dataset.orderId || el.dataset.orderid;
    if (id && /^\d{9,19}$/.test(id)) {
      found.add(`https://shopee.com.br/user/purchase/order/${id}`);
    }
  });

  // Metodo 5: scrollar a pagina para carregar mais pedidos (lazy load)
  // e repetir a coleta
  const initialCount = found.size;
  window.scrollTo(0, document.body.scrollHeight);

  return [...found];
}

function normalizeUrl(url) {
  try {
    const u = new URL(url);
    return u.origin + u.pathname;
  } catch {
    return url;
  }
}
