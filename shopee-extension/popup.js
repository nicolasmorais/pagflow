const DEFAULT_API_URL = 'https://mcp.elabela.store'
const DEFAULT_API_KEY = 'hermes-pagflow-key'

let allOrders = []
let processedIds = new Set()
let cfg = { url: DEFAULT_API_URL, key: DEFAULT_API_KEY }

async function loadConfig() {
  return new Promise(resolve => {
    chrome.storage.local.get(['apiUrl', 'apiKey', 'processedIds'], data => {
      if (data.apiUrl) cfg.url = data.apiUrl
      if (data.apiKey) cfg.key = data.apiKey
      if (data.processedIds) processedIds = new Set(data.processedIds)
      resolve()
    })
  })
}

function saveProcessed() {
  chrome.storage.local.set({ processedIds: [...processedIds] })
}

async function fetchOrders() {
  const url = `${cfg.url}/api/orders?paymentStatus=pago&limit=50`
  const res = await fetch(url, { headers: { 'x-api-key': cfg.key } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  return data.pedidos || []
}

function formatDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function formatPhone(raw) {
  if (!raw) return ''
  return raw.replace(/\D/g, '')
}

function addrLine(order) {
  const e = order.endereco
  if (!e) return 'Sem endereço'
  const parts = []
  if (e.rua) parts.push(e.rua)
  if (e.numero) parts.push(e.numero)
  const linha1 = parts.join(', ')
  const linha2 = [e.bairro, e.cidade, e.estado].filter(Boolean).join(' · ')
  return [linha1, linha2].filter(Boolean).join('\n')
}

function renderOrders(orders) {
  const list = document.getElementById('order-list')
  const statusEl = document.getElementById('status-text')

  const pending = orders.filter(o => !processedIds.has(o.id))
  const done = orders.filter(o => processedIds.has(o.id))

  const total = orders.length
  const pendingCount = pending.length
  statusEl.innerHTML = `<strong>${pendingCount}</strong> pendente${pendingCount !== 1 ? 's' : ''} · ${total} total`

  if (orders.length === 0) {
    list.innerHTML = '<div class="state-msg">Nenhum pedido pago encontrado</div>'
    return
  }

  const sorted = [...pending, ...done]
  const query = document.getElementById('search').value.toLowerCase().trim()

  const filtered = query
    ? sorted.filter(o => {
        const name = (o.cliente?.nome || '').toLowerCase()
        const city = (o.endereco?.cidade || '').toLowerCase()
        return name.includes(query) || city.includes(query)
      })
    : sorted

  if (filtered.length === 0) {
    list.innerHTML = '<div class="state-msg">Nenhum resultado para a busca</div>'
    return
  }

  list.innerHTML = filtered.map(order => {
    const isDone = processedIds.has(order.id)
    const addr = addrLine(order)
    const addrHtml = addr.split('\n').map(l => `<span>${l}</span>`).join('')
    const value = (order.valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

    const defaultQty = order.produto_quantidade ?? 1

    return `
      <div class="order-card${isDone ? ' processed' : ''}" data-id="${order.id}">
        <div class="order-top">
          <div class="order-name">${order.cliente?.nome || 'Sem nome'}</div>
          <span class="order-badge ${isDone ? 'badge-done' : 'badge-pago'}">${isDone ? 'Adicionado' : 'Pago'}</span>
        </div>
        <div class="order-addr">${addrHtml}</div>
        <div class="order-meta">
          <span class="order-value">${value}</span>
          <span class="order-date">${formatDate(order.data)}</span>
        </div>
        <div class="qty-row">
          <label class="qty-label">Qtd no nome (xx <span class="qty-preview">${defaultQty}</span>):</label>
          <input class="qty-input" type="number" min="1" max="99" value="${defaultQty}" data-id="${order.id}" ${isDone ? 'disabled' : ''} />
        </div>
        <button class="add-btn${isDone ? ' done' : ''}" data-id="${order.id}" ${isDone ? 'disabled' : ''}>
          ${isDone ? '✓ Endereço adicionado' : 'Abrir Shopee e adicionar endereço'}
        </button>
      </div>
    `
  }).join('')

  // Attach button listeners
  list.querySelectorAll('.add-btn:not(:disabled)').forEach(btn => {
    btn.addEventListener('click', () => handleAddToShopee(btn.dataset.id))
  })
}

async function handleAddToShopee(orderId) {
  const order = allOrders.find(o => o.id === orderId)
  if (!order) return

  // Lê a quantidade escolhida neste card
  const qtyInput = document.querySelector(`.qty-input[data-id="${orderId}"]`)
  const qty = qtyInput ? parseInt(qtyInput.value) || 1 : (order.produto_quantidade ?? 1)

  // Store the order + qty for the content script
  await new Promise(resolve => {
    chrome.storage.local.set({ pendingOrder: { ...order, qty } }, resolve)
  })

  // Open or focus Shopee address page
  chrome.tabs.query({ url: 'https://shopee.com.br/user/account/address*' }, tabs => {
    if (tabs.length > 0) {
      chrome.tabs.update(tabs[0].id, { active: true }, () => {
        chrome.tabs.reload(tabs[0].id)
      })
    } else {
      chrome.tabs.create({ url: 'https://shopee.com.br/user/account/address' })
    }
  })

  // Listen for completion
  chrome.runtime.onMessage.addListener(function listener(msg) {
    if (msg.type === 'ADDRESS_ADDED' && msg.orderId === orderId) {
      chrome.runtime.onMessage.removeListener(listener)
      processedIds.add(orderId)
      saveProcessed()
      renderOrders(allOrders)
    }
  })

  window.close()
}

async function fetchProducts() {
  const res = await fetch(`${cfg.url}/api/products`, { headers: { 'x-api-key': cfg.key } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

async function saveProductQty(productId, qty, btn) {
  btn.textContent = '...'
  btn.disabled = true
  try {
    const res = await fetch(`${cfg.url}/api/products/${productId}`, {
      method: 'PATCH',
      headers: { 'x-api-key': cfg.key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity: qty }),
    })
    if (!res.ok) throw new Error()
    btn.textContent = '✓'
    btn.classList.add('saved')
    setTimeout(() => { btn.textContent = 'Salvar'; btn.classList.remove('saved'); btn.disabled = false }, 1500)
    // Recarrega pedidos para refletir nova quantidade
    await loadAndRender()
  } catch {
    btn.textContent = 'Erro'
    btn.disabled = false
  }
}

async function renderProductConfig() {
  const container = document.getElementById('product-list-cfg')
  try {
    const products = await fetchProducts()
    if (!products.length) { container.textContent = 'Nenhum produto'; return }
    container.innerHTML = products.map(p => `
      <div class="prod-row" data-pid="${p.id}">
        <span class="prod-name" title="${p.nome}">${p.nome}</span>
        <input class="prod-qty-input" type="number" min="1" max="99" value="${p.quantidade ?? 1}" data-pid="${p.id}" />
        <button class="prod-save-btn" data-pid="${p.id}">Salvar</button>
      </div>
    `).join('')
    container.querySelectorAll('.prod-save-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const pid = btn.dataset.pid
        const input = container.querySelector(`.prod-qty-input[data-pid="${pid}"]`)
        const qty = parseInt(input.value) || 1
        saveProductQty(pid, qty, btn)
      })
    })
  } catch {
    container.textContent = 'Erro ao carregar produtos'
  }
}

async function init() {
  await loadConfig()

  // Settings form
  document.getElementById('cfg-url').value = cfg.url
  document.getElementById('cfg-key').value = cfg.key

  document.getElementById('settings-toggle').addEventListener('click', () => {
    const panel = document.getElementById('settings-panel')
    panel.classList.toggle('open')
    if (panel.classList.contains('open')) renderProductConfig()
  })

  document.getElementById('save-settings').addEventListener('click', () => {
    cfg.url = document.getElementById('cfg-url').value.trim() || DEFAULT_API_URL
    cfg.key = document.getElementById('cfg-key').value.trim() || DEFAULT_API_KEY
    chrome.storage.local.set({ apiUrl: cfg.url, apiKey: cfg.key }, () => {
      document.getElementById('settings-panel').classList.remove('open')
      loadAndRender()
    })
  })

  document.getElementById('search').addEventListener('input', () => {
    renderOrders(allOrders)
  })

  await loadAndRender()
}

async function loadAndRender() {
  const list = document.getElementById('order-list')
  const statusEl = document.getElementById('status-text')
  list.innerHTML = '<div class="state-msg"><div class="spinner"></div><br/>Buscando pedidos...</div>'
  statusEl.textContent = 'Carregando...'

  try {
    allOrders = await fetchOrders()
    renderOrders(allOrders)
  } catch (e) {
    list.innerHTML = `<div class="state-msg error">Erro ao buscar pedidos:<br/>${e.message}<br/><br/>Verifique as configurações (⚙).</div>`
    statusEl.textContent = 'Erro na conexão'
  }
}

document.addEventListener('DOMContentLoaded', init)
