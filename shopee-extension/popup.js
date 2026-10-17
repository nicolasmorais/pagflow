const DEFAULT_PAGFLOW_URL = 'https://pay.elabela.store'
const DEFAULT_API_URL = 'https://mcp.elabela.store'
const DEFAULT_API_KEY = 'hermes-pagflow-key'

let allOrders = []
let processedIds = new Set()
// pagflow: de onde vêm os pedidos (login do admin no navegador)
// url/key: API do MCP, usada só na quantidade por produto
let cfg = { pagflow: DEFAULT_PAGFLOW_URL, url: DEFAULT_API_URL, key: DEFAULT_API_KEY }

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}

async function loadConfig() {
  return new Promise(resolve => {
    chrome.storage.local.get(['pagflowUrl', 'apiUrl', 'apiKey', 'processedIds'], data => {
      if (data.pagflowUrl) cfg.pagflow = data.pagflowUrl
      if (data.apiUrl) cfg.url = data.apiUrl
      if (data.apiKey) cfg.key = data.apiKey
      if (data.processedIds) processedIds = new Set(data.processedIds)
      resolve()
    })
  })
}

// Mesmo endpoint das extensões Copiador/Rastreio: usa o cookie de login do admin
async function fetchOrders() {
  const url = `${cfg.pagflow}/api/admin/extension-orders?status=processando`
  const res = await fetch(url, { credentials: 'include' })
  if (res.status === 401) {
    throw new Error(`Faça login no painel do PagFlow (${cfg.pagflow}/admin) neste navegador e abra a extensão de novo.`)
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  return (data.orders || []).filter(o => o.paymentStatus === 'pago').map(toOrder)
}

// Converte o pedido do PagFlow para o formato que o resto da extensão usa
function toOrder(o) {
  return {
    id: o.id,
    cliente: { nome: o.fullName, email: o.email, telefone: o.phone, cpf: o.cpf },
    endereco: {
      cep: o.cep, rua: o.rua, numero: o.numero, complemento: o.complemento,
      bairro: o.bairro, cidade: o.cidade, estado: o.estado,
    },
    produto: o.product?.name || '',
    produto_quantidade: o.productQuantity || 1,
    valor: o.totalPrice,
    data: o.createdAt,
  }
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

  const missingAll = orders.length > 0 && orders.every(o => !hasAddress(o))
  const apiNotice = missingAll
    ? `<div class="state-msg error" style="padding:12px 8px;text-align:left;line-height:1.5">
        Nenhum desses pedidos tem endereço completo (CEP e número), então não dá para cadastrar na Shopee.
       </div>`
    : ''

  list.innerHTML = apiNotice + filtered.map(order => {
    const noAddr = !hasAddress(order)
    const isDone = processedIds.has(order.id)
    const addr = addrLine(order)
    const addrHtml = addr.split('\n').map(l => `<span>${esc(l)}</span>`).join('')
    const value = (order.valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    const qty = qtyOf(order)
    const isSelected = !isDone && !noAddr && selectedOrders.has(order.id)
    const id = esc(order.id)

    if (noAddr && !isDone) {
      return `
      <div class="order-card processed" data-id="${id}">
        <div class="order-top">
          <div class="order-name">${esc(order.cliente?.nome || 'Sem nome')}</div>
          <span class="order-badge badge-done">Sem endereço</span>
        </div>
        <div class="order-meta">
          <span class="order-value">${value}</span>
          <span class="order-date">${formatDate(order.data)}</span>
        </div>
      </div>`
    }

    return `
      <div class="order-card${isDone ? ' processed' : ''}${isSelected ? ' selected' : ''}" data-id="${id}">
        <div class="order-top">
          ${isDone
            ? `<div class="order-name">${esc(order.cliente?.nome || 'Sem nome')}</div>`
            : `<label class="order-pick"><input type="checkbox" class="order-check" data-id="${id}" ${isSelected ? 'checked' : ''} /><span class="order-name">${esc(order.cliente?.nome || 'Sem nome')}</span></label>`}
          <span class="order-badge ${isDone ? 'badge-done' : 'badge-pago'}">${isDone ? 'Adicionado' : 'Pago'}</span>
        </div>
        <div class="order-addr">${addrHtml}</div>
        <div class="order-meta">
          <span class="order-value">${value}</span>
          <span class="order-date">${formatDate(order.data)}</span>
        </div>
        <div class="qty-row">
          <label class="qty-label">Qtd no nome (xx <span class="qty-preview">${qty}</span>):</label>
          <input class="qty-input" type="number" min="1" max="99" value="${qty}" data-id="${id}" ${isDone ? 'disabled' : ''} />
        </div>
        <button class="add-btn${isDone ? ' done' : ''}" data-id="${id}" ${isDone ? 'disabled' : ''}>
          ${isDone ? '✓ Endereço adicionado' : 'Adicionar só este'}
        </button>
      </div>
    `
  }).join('')

  list.querySelectorAll('.add-btn:not(:disabled)').forEach(btn => {
    btn.addEventListener('click', () => handleAddToShopee([btn.dataset.id]))
  })

  list.querySelectorAll('.order-check').forEach(cb => {
    cb.addEventListener('change', () => {
      if (cb.checked) selectedOrders.add(cb.dataset.id)
      else selectedOrders.delete(cb.dataset.id)
      cb.closest('.order-card')?.classList.toggle('selected', cb.checked)
      updateBulkBar()
    })
  })

  list.querySelectorAll('.qty-input').forEach(input => {
    input.addEventListener('input', () => {
      const n = parseInt(input.value)
      if (n >= 1) qtyOverrides.set(input.dataset.id, n)
      const preview = input.closest('.qty-row')?.querySelector('.qty-preview')
      if (preview && n >= 1) preview.textContent = n
    })
  })

  updateBulkBar()
}

// ── Seleção em lote ──────────────────────────────────────────────────

const selectedOrders = new Set()
const qtyOverrides = new Map()

function qtyOf(order) {
  return qtyOverrides.get(order.id) ?? order.produto_quantidade ?? 1
}

function hasAddress(order) {
  return !!(order.endereco && order.endereco.cep && order.endereco.numero)
}

function pendingOrders() {
  return allOrders.filter(o => !processedIds.has(o.id) && hasAddress(o))
}

function updateBulkBar() {
  const bar = document.getElementById('bulk-bar')
  const pending = pendingOrders()
  for (const id of [...selectedOrders]) if (!pending.some(o => o.id === id)) selectedOrders.delete(id)

  bar.style.display = pending.length ? 'flex' : 'none'
  const allSelected = pending.length > 0 && pending.every(o => selectedOrders.has(o.id))
  document.getElementById('bulk-all').textContent = allSelected ? 'Limpar' : `Selecionar todos (${pending.length})`

  const n = selectedOrders.size
  const btn = document.getElementById('bulk-add')
  btn.disabled = n === 0
  btn.textContent = n === 0 ? 'Selecione pedidos' : `Adicionar ${n} na Shopee`
}

function initBulkBar() {
  document.getElementById('bulk-all').addEventListener('click', () => {
    const pending = pendingOrders()
    const allSelected = pending.every(o => selectedOrders.has(o.id))
    selectedOrders.clear()
    if (!allSelected) pending.forEach(o => selectedOrders.add(o.id))
    renderOrders(allOrders)
  })
  document.getElementById('bulk-add').addEventListener('click', () => {
    // Mantém a ordem da lista (mais recentes primeiro, como vem da API)
    const ids = allOrders.filter(o => selectedOrders.has(o.id)).map(o => o.id)
    handleAddToShopee(ids)
  })
}

async function handleAddToShopee(orderIds) {
  const orders = orderIds
    .map(id => allOrders.find(o => o.id === id))
    .filter(o => o && !processedIds.has(o.id) && hasAddress(o))
    .map(o => ({ ...o, qty: qtyOf(o) }))
  if (!orders.length) return

  // Junta com o que ainda estiver na fila, sem repetir pedido
  const { addQueue = [] } = await chrome.storage.local.get('addQueue')
  const queued = new Set(addQueue.map(o => o.id))
  const nextQueue = [...addQueue, ...orders.filter(o => !queued.has(o.id))]
  await chrome.storage.local.set({ addQueue: nextQueue })
  await chrome.storage.local.remove('pendingOrder')

  // Abre (ou recarrega) a página de endereços; o content script processa a fila
  const tabs = await chrome.tabs.query({ url: 'https://shopee.com.br/user/account/address*' })
  if (tabs.length > 0) {
    await chrome.tabs.update(tabs[0].id, { active: true })
    await chrome.tabs.reload(tabs[0].id)
  } else {
    await chrome.tabs.create({ url: 'https://shopee.com.br/user/account/address' })
  }

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
  document.getElementById('cfg-pagflow').value = cfg.pagflow
  document.getElementById('cfg-url').value = cfg.url
  document.getElementById('cfg-key').value = cfg.key

  document.getElementById('settings-toggle').addEventListener('click', () => {
    const panel = document.getElementById('settings-panel')
    panel.classList.toggle('open')
    if (panel.classList.contains('open')) renderProductConfig()
  })

  document.getElementById('save-settings').addEventListener('click', () => {
    cfg.pagflow = document.getElementById('cfg-pagflow').value.trim().replace(/\/+$/, '') || DEFAULT_PAGFLOW_URL
    cfg.url = document.getElementById('cfg-url').value.trim() || DEFAULT_API_URL
    cfg.key = document.getElementById('cfg-key').value.trim() || DEFAULT_API_KEY
    chrome.storage.local.set({ pagflowUrl: cfg.pagflow, apiUrl: cfg.url, apiKey: cfg.key }, () => {
      document.getElementById('settings-panel').classList.remove('open')
      loadAndRender()
    })
  })

  document.getElementById('search').addEventListener('input', () => {
    renderOrders(allOrders)
  })

  initAddressPanel()
  initBulkBar()

  // Recebe atualizações enquanto o popup estiver aberto
  chrome.runtime.onMessage.addListener(msg => {
    if (msg.type === 'ADDRESS_ADDED') {
      processedIds.add(msg.orderId)
      selectedOrders.delete(msg.orderId)
      renderOrders(allOrders)
    }
  })

  await loadAndRender()

  const { addQueue = [] } = await chrome.storage.local.get('addQueue')
  if (addQueue.length) {
    document.getElementById('status-text').innerHTML += ` · <strong>${addQueue.length}</strong> na fila da Shopee`
  }
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
