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

  // Store the order for the content script
  await new Promise(resolve => {
    chrome.storage.local.set({ pendingOrder: order }, resolve)
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

async function init() {
  await loadConfig()

  // Settings form
  document.getElementById('cfg-url').value = cfg.url
  document.getElementById('cfg-key').value = cfg.key

  document.getElementById('settings-toggle').addEventListener('click', () => {
    document.getElementById('settings-panel').classList.toggle('open')
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
