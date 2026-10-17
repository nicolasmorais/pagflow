const DEFAULT_API_URL = 'https://mcp.elabela.store'
const DEFAULT_API_KEY = 'hermes-pagflow-key'

let allOrders = []
let processedIds = new Set()
let cfg = { url: DEFAULT_API_URL, key: DEFAULT_API_KEY }

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}

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
    const addrHtml = addr.split('\n').map(l => `<span>${esc(l)}</span>`).join('')
    const value = (order.valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

    const defaultQty = order.produto_quantidade ?? 1

    return `
      <div class="order-card${isDone ? ' processed' : ''}" data-id="${esc(order.id)}">
        <div class="order-top">
          <div class="order-name">${esc(order.cliente?.nome || 'Sem nome')}</div>
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
        <span class="prod-name" title="${esc(p.nome)}">${esc(p.nome)}</span>
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

  initAddressPanel()

  await loadAndRender()
}

// ── Excluir endereços da Shopee ──────────────────────────────────────

const ADDR_URL = 'https://shopee.com.br/user/account/address'
const addr = { tabId: null, list: [], selected: new Set(), deleting: false }

const sleep = ms => new Promise(r => setTimeout(r, ms))

async function getShopeeTab() {
  const tabs = await chrome.tabs.query({ url: `${ADDR_URL}*` })
  if (tabs.length) return { tab: tabs[0], created: false }
  const tab = await chrome.tabs.create({ url: ADDR_URL, active: false })
  return { tab, created: true }
}

// Tenta ler a página; se a aba tiver um content script antigo (extensão recém-atualizada), recarrega uma vez
async function scanAddresses(tabId, timeout = 25000) {
  const start = Date.now()
  let reloaded = false
  while (Date.now() - start < timeout) {
    try {
      const res = await chrome.tabs.sendMessage(tabId, { type: 'SCAN_ADDRESSES' })
      if (res?.ok && (res.addresses.length > 0 || Date.now() - start > 8000)) return res
    } catch {
      if (!reloaded && Date.now() - start > 2500) {
        reloaded = true
        await chrome.tabs.reload(tabId)
      }
    }
    await sleep(800)
  }
  throw new Error('Não consegui ler a página de endereços. Confira se você está logado na Shopee.')
}

function setAddrSub(text) {
  document.getElementById('addr-sub').textContent = text
}

function setProgress(text, tone, pct) {
  const el = document.getElementById('addr-progress')
  el.className = `addr-progress${tone ? ` ${tone}` : ''}`
  el.innerHTML = esc(text) + (pct !== undefined ? `<div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>` : '')
}

function updateDeleteButton() {
  const btn = document.getElementById('addr-delete')
  const n = addr.selected.size
  btn.disabled = addr.deleting || n === 0
  btn.textContent = addr.deleting
    ? 'Excluindo...'
    : n === 0 ? 'Selecione endereços para excluir' : `Excluir ${n} endereço${n > 1 ? 's' : ''}`
}

function renderAddressList() {
  const listEl = document.getElementById('addr-list')
  const deletable = addr.list.filter(a => !a.protectedReason)
  const locked = addr.list.length - deletable.length

  setAddrSub(addr.list.length === 0
    ? 'Nenhum endereço encontrado'
    : `${deletable.length} excluíve${deletable.length === 1 ? 'l' : 'is'}${locked ? ` · ${locked} protegido${locked > 1 ? 's' : ''}` : ''}`)
  document.getElementById('addr-filters').style.display = deletable.length ? 'flex' : 'none'

  if (addr.list.length === 0) {
    listEl.innerHTML = '<div class="state-msg">Nenhum endereço na sua conta Shopee</div>'
    updateDeleteButton()
    return
  }

  listEl.innerHTML = addr.list.map((a, i) => {
    const isLocked = !!a.protectedReason
    const checked = !isLocked && addr.selected.has(a.key)
    return `
      <label class="addr-item${isLocked ? ' locked' : ''}" title="${isLocked ? esc(`Protegido: ${a.protectedReason}`) : ''}">
        <input type="checkbox" data-i="${i}" ${checked ? 'checked' : ''} ${isLocked || addr.deleting ? 'disabled' : ''} />
        <div class="addr-item-body">
          <div class="addr-item-name">${esc(a.name)}${a.fromPagflow ? '<span class="addr-tag pf">PagFlow</span>' : ''}${isLocked ? `<span class="addr-tag lock">${esc(a.protectedReason)}</span>` : ''}</div>
          <div class="addr-item-line">${esc(a.street || a.phone)}</div>
        </div>
      </label>`
  }).join('')

  listEl.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', () => {
      const a = addr.list[Number(cb.dataset.i)]
      if (cb.checked) addr.selected.add(a.key)
      else addr.selected.delete(a.key)
      updateDeleteButton()
    })
  })
  updateDeleteButton()
}

async function refreshAddresses({ keepSelection = false } = {}) {
  document.getElementById('addr-list').innerHTML = '<div class="state-msg"><div class="spinner"></div><br/>Lendo endereços na Shopee...</div>'
  setAddrSub('Abrindo a página de endereços...')
  try {
    const { tab } = await getShopeeTab()
    addr.tabId = tab.id
    const res = await scanAddresses(tab.id)
    addr.list = res.addresses
    addr.deleting = !!res.deleting
    const valid = new Set(addr.list.filter(a => !a.protectedReason).map(a => a.key))
    addr.selected = keepSelection
      ? new Set([...addr.selected].filter(k => valid.has(k)))
      : new Set(valid)
    if (addr.deleting) setProgress('Uma exclusão está em andamento na aba da Shopee...', null)
    renderAddressList()
  } catch (e) {
    addr.list = []
    document.getElementById('addr-list').innerHTML = `<div class="state-msg error">${esc(e.message)}</div>`
    setAddrSub('Erro ao ler endereços')
    updateDeleteButton()
  }
}

async function deleteSelected() {
  const keys = addr.list.filter(a => !a.protectedReason && addr.selected.has(a.key)).map(a => a.key)
  if (!keys.length || addr.deleting) return
  const ok = window.confirm(
    `Excluir ${keys.length} endereço${keys.length > 1 ? 's' : ''} da sua conta Shopee?\n\nIsso não pode ser desfeito. O endereço padrão e os de coleta/devolução não serão tocados.`
  )
  if (!ok) return

  addr.deleting = true
  renderAddressList()
  setProgress(`Excluindo 0 de ${keys.length}...`, null, 0)
  try {
    await chrome.tabs.sendMessage(addr.tabId, { type: 'DELETE_ADDRESSES', keys })
  } catch {
    addr.deleting = false
    renderAddressList()
    setProgress('A aba da Shopee não respondeu. Recarregue a página de endereços e tente de novo.', 'err')
  }
}

function initAddressPanel() {
  const panel = document.getElementById('addr-panel')
  const toggle = document.getElementById('addr-toggle')

  const close = () => {
    panel.classList.remove('open')
    document.body.classList.remove('addr-mode')
    toggle.classList.remove('active')
  }

  toggle.addEventListener('click', async () => {
    if (panel.classList.contains('open')) return close()
    document.getElementById('settings-panel').classList.remove('open')
    panel.classList.add('open')
    document.body.classList.add('addr-mode')
    toggle.classList.add('active')
    setProgress('', null)

    const { lastDeleteResult } = await chrome.storage.local.get('lastDeleteResult')
    if (lastDeleteResult && Date.now() - lastDeleteResult.finishedAt < 10 * 60 * 1000) {
      showDeleteSummary(lastDeleteResult)
    }
    refreshAddresses()
  })

  document.getElementById('addr-back').addEventListener('click', close)
  document.getElementById('addr-delete').addEventListener('click', deleteSelected)

  document.getElementById('addr-filters').addEventListener('click', e => {
    const mode = e.target?.dataset?.select
    if (!mode || addr.deleting) return
    const deletable = addr.list.filter(a => !a.protectedReason)
    addr.selected = new Set(
      mode === 'all' ? deletable.map(a => a.key)
        : mode === 'pagflow' ? deletable.filter(a => a.fromPagflow).map(a => a.key)
        : []
    )
    renderAddressList()
  })

  chrome.runtime.onMessage.addListener(msg => {
    if (msg.type === 'DELETE_PROGRESS') {
      setProgress(`Excluindo ${msg.done + 1} de ${msg.total}: ${msg.name}`, null, Math.round((msg.done / msg.total) * 100))
    }
    if (msg.type === 'DELETE_DONE') {
      addr.deleting = false
      showDeleteSummary(msg.summary)
      refreshAddresses({ keepSelection: true })
    }
  })
}

function showDeleteSummary(s) {
  if (s.failed.length === 0) {
    setProgress(`${s.deleted} endereço${s.deleted !== 1 ? 's' : ''} excluído${s.deleted !== 1 ? 's' : ''}.`, 'ok')
  } else {
    const names = s.failed.slice(0, 3).map(f => f.name).join(', ')
    setProgress(`${s.deleted} excluído${s.deleted !== 1 ? 's' : ''}, ${s.failed.length} com erro (${names}${s.failed.length > 3 ? '...' : ''}). ${s.failed[0].error || ''}`, 'err')
  }
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
    list.innerHTML = `<div class="state-msg error">Erro ao buscar pedidos:<br/>${esc(e.message)}<br/><br/>Verifique as configurações (⚙).</div>`
    statusEl.textContent = 'Erro na conexão'
  }
}

document.addEventListener('DOMContentLoaded', init)
