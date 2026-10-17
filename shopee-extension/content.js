// Injeta valor em campo React sem quebrar o state interno
function setReactValue(el, value) {
  const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set
  nativeSetter.call(el, value)
  el.dispatchEvent(new Event('input', { bubbles: true }))
  el.dispatchEvent(new Event('change', { bubbles: true }))
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

// Aguarda um seletor aparecer no DOM
function waitForEl(selector, timeout = 8000) {
  return new Promise((resolve, reject) => {
    const found = document.querySelector(selector)
    if (found) return resolve(found)
    const obs = new MutationObserver(() => {
      const el = document.querySelector(selector)
      if (el) { obs.disconnect(); resolve(el) }
    })
    obs.observe(document.body, { childList: true, subtree: true })
    setTimeout(() => { obs.disconnect(); reject(new Error('Timeout: ' + selector)) }, timeout)
  })
}

// Formata telefone: remove tudo exceto dígitos, remove DDI +55
function formatPhone(raw) {
  if (!raw) return ''
  const digits = raw.replace(/\D/g, '')
  // Remove DDI 55 se o número tiver 13 dígitos
  if (digits.length === 13 && digits.startsWith('55')) return digits.slice(2)
  return digits
}

async function fillAddressForm(order) {
  const addr = order.endereco || {}
  const cliente = order.cliente || {}
  const qty = order.qty || 1
  const nomeComQty = `${cliente.nome || ''} xx ${qty}`.trim()

  // 1. Abre o modal clicando em "Adicionar Endereço"
  const allBtns = Array.from(document.querySelectorAll('button'))
  const addBtn = allBtns.find(b => b.textContent.trim().includes('Adicionar Endereço'))
  if (!addBtn) throw new Error('Botão Adicionar Endereço não encontrado')
  addBtn.click()

  // 2. Aguarda o modal aparecer
  const nomeInput = await waitForEl('input[placeholder="Nome Completo"]')
  await sleep(300)

  const telefoneInput = document.querySelector('input[placeholder="Número de Telefone"]')
  const cepInput = document.querySelector('input[placeholder="CEP"]')
  const bairroInput = document.querySelector('input[placeholder="Bairro"]')
  const ruaInput = document.querySelector('input[placeholder="Rua / Avenida"]')
  const numeroInput = document.querySelector('input[placeholder="Número"]')
  const complementoInput = document.querySelector('input[placeholder="Complemento"]')

  // 3. Nome (com quantidade codificada) e telefone
  setReactValue(nomeInput, nomeComQty)
  await sleep(100)
  setReactValue(telefoneInput, formatPhone(cliente.telefone))
  await sleep(100)

  // 4. CEP — dispara o lookup automático de Estado/Cidade/Bairro/Rua
  const cepClean = (addr.cep || '').replace(/\D/g, '')
  setReactValue(cepInput, cepClean)

  // 5. Aguarda o lookup completar (a Shopee faz req ao correios)
  await sleep(2500)

  // 6. Substitui Bairro se o PagFlow tem dado mais preciso
  if (addr.bairro) setReactValue(bairroInput, addr.bairro)
  await sleep(100)

  // 7. Substitui Rua se o lookup não preencheu ou diverge
  if (addr.rua) setReactValue(ruaInput, addr.rua)
  await sleep(100)

  // 8. Número (não vem do lookup de CEP)
  if (addr.numero) setReactValue(numeroInput, addr.numero)
  await sleep(100)

  // 9. Complemento
  if (addr.complemento && complementoInput) setReactValue(complementoInput, addr.complemento)
  await sleep(100)

  // 10. Verifica Estado-Cidade — se o CEP não preencheu, tenta preencher manualmente
  const estadoCidadeInput = document.querySelector('input[placeholder="Estado - Cidade"]')
  if (estadoCidadeInput && !estadoCidadeInput.value && addr.estado && addr.cidade) {
    setReactValue(estadoCidadeInput, `${addr.estado} - ${addr.cidade}`)
    await sleep(300)
  }

  // 11. Clica em Enviar
  const enviarBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Enviar')
  if (!enviarBtn) throw new Error('Botão Enviar não encontrado')
  enviarBtn.click()

  // 12. Notifica o popup que o endereço foi adicionado
  await sleep(1500)
  chrome.runtime.sendMessage({ type: 'ADDRESS_ADDED', orderId: order.id })

  // Remove o pedido pendente do storage
  chrome.storage.local.remove('pendingOrder')
}

// ── Exclusão de endereços ────────────────────────────────────────────
// A Shopee ofusca os nomes de classe, então tudo aqui se guia por texto.

const PROTECTED_TAGS = [
  { text: 'Endereço de Coleta', reason: 'Endereço de coleta' },
  { text: 'Endereço de devolução', reason: 'Endereço de devolução' },
]
const PAGFLOW_MARKER = /\sxx\s*\d+\s*$/i

const isDeleteBtn = el => el.tagName === 'BUTTON' && el.textContent.trim() === 'Excluir'
const isEditBtn = el => el.tagName === 'BUTTON' && el.textContent.trim() === 'Editar'

// Linha de endereço = maior ancestral do botão "Editar" que contém só um "Editar"
function findAddressRows() {
  const edits = Array.from(document.querySelectorAll('button')).filter(isEditBtn)
  return edits.map(btn => {
    let row = btn
    while (
      row.parentElement &&
      Array.from(row.parentElement.querySelectorAll('button')).filter(isEditBtn).length === 1 &&
      !Array.from(row.parentElement.querySelectorAll('button')).some(b => b.textContent.includes('Adicionar Endereço')) &&
      !/Meus endereços/.test(row.parentElement.innerText.slice(0, 200))
    ) {
      row = row.parentElement
    }
    return row
  })
}

function describeRow(row) {
  const lines = row.innerText.split('\n').map(l => l.trim()).filter(Boolean)
  const name = lines[0] || 'Sem nome'
  const phone = lines.find(l => /^\(\+?\d+\)/.test(l)) || ''
  const street = lines.find(l => l !== name && l !== phone && !['Editar', 'Excluir', '|', 'Definir como padrão', 'Selecionar'].includes(l) && !l.startsWith('+ ')) || ''
  const deleteBtn = Array.from(row.querySelectorAll('button')).find(isDeleteBtn) || null
  const tag = PROTECTED_TAGS.find(t => row.innerText.includes(t.text))

  let protectedReason = null
  if (!deleteBtn) protectedReason = 'Endereço padrão'
  else if (tag) protectedReason = tag.reason

  return {
    key: [name, phone, street].join('|'),
    name,
    phone,
    street,
    fromPagflow: PAGFLOW_MARKER.test(name),
    protectedReason,
    row,
    deleteBtn,
  }
}

function scanAddresses() {
  return findAddressRows().map(describeRow)
}

function findConfirmButton(excludeRow) {
  const candidates = Array.from(document.querySelectorAll('button')).filter(b => {
    const t = b.textContent.trim().toLowerCase()
    if (!['excluir', 'confirmar', 'sim', 'ok', 'deletar', 'apagar'].includes(t)) return false
    if (excludeRow && excludeRow.contains(b)) return false
    if (b.closest && findAddressRows().some(r => r.contains(b))) return false
    const rect = b.getBoundingClientRect()
    return rect.width > 0 && rect.height > 0
  })
  return candidates[candidates.length - 1] || null
}

async function waitFor(fn, timeout = 6000, step = 150) {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    const v = fn()
    if (v) return v
    await sleep(step)
  }
  return null
}

async function deleteOne(key) {
  const target = scanAddresses().find(a => a.key === key)
  if (!target) return { ok: true, skipped: 'já não existe' }
  if (target.protectedReason) return { ok: false, error: `Protegido: ${target.protectedReason}` }

  target.deleteBtn.click()

  // A Shopee pede confirmação num modal; se não pedir, o endereço some direto
  const confirmBtn = await waitFor(() => findConfirmButton(target.row), 3000)
  if (confirmBtn) confirmBtn.click()

  const gone = await waitFor(() => !scanAddresses().some(a => a.key === key), 8000)
  return gone ? { ok: true } : { ok: false, error: 'A Shopee não confirmou a exclusão' }
}

let deleting = false

async function deleteAddresses(keys, onProgress) {
  if (deleting) return { ok: false, error: 'Já existe uma exclusão em andamento' }
  deleting = true
  const results = []
  try {
    for (let i = 0; i < keys.length; i++) {
      const name = keys[i].split('|')[0]
      chrome.runtime.sendMessage({ type: 'DELETE_PROGRESS', done: i, total: keys.length, name }).catch(() => {})
      if (onProgress) onProgress(i, keys.length, name)
      let res
      try {
        res = await deleteOne(keys[i])
      } catch (e) {
        res = { ok: false, error: e.message }
      }
      results.push({ key: keys[i], name, ...res })
      await sleep(900)
    }
  } finally {
    deleting = false
  }
  const summary = {
    total: keys.length,
    deleted: results.filter(r => r.ok && !r.skipped).length,
    failed: results.filter(r => !r.ok),
    finishedAt: Date.now(),
  }
  chrome.storage.local.set({ lastDeleteResult: summary })
  chrome.runtime.sendMessage({ type: 'DELETE_DONE', summary }).catch(() => {})
  return summary
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'SCAN_ADDRESSES') {
    const list = scanAddresses().map(({ row, deleteBtn, ...rest }) => rest)
    sendResponse({ ok: true, addresses: list, deleting })
    return false
  }
  if (msg.type === 'DELETE_ADDRESSES') {
    deleteAddresses(Array.isArray(msg.keys) ? msg.keys : [], pageProgress).then(pageDone)
    sendResponse({ ok: true, started: true })
    return false
  }
  return false
})

// ── Controles na própria página da Shopee ────────────────────────────

const pageSelected = new Set()

function injectStyles() {
  if (document.getElementById('pf-style')) return
  const style = document.createElement('style')
  style.id = 'pf-style'
  style.textContent = `
    .pf-bar { display: inline-flex; align-items: center; gap: 10px; margin-right: 10px; }
    .pf-bar-btn {
      display: inline-flex; align-items: center; gap: 6px;
      height: 40px; padding: 0 14px; border-radius: 2px;
      border: 1px solid #dc2626; background: #fff; color: #dc2626;
      font-size: 14px; cursor: pointer; white-space: nowrap;
    }
    .pf-bar-btn:hover:not(:disabled) { background: #fef2f2; }
    .pf-bar-btn:disabled { border-color: #ddd; color: #aaa; cursor: not-allowed; }
    .pf-bar-btn.pf-busy { border-color: #dc2626; color: #dc2626; background: #fef2f2; }
    .pf-bar-link { background: none; border: none; color: #555; font-size: 13px; cursor: pointer; padding: 0; white-space: nowrap; }
    .pf-bar-link:hover { color: #ee4d2d; text-decoration: underline; }
    .pf-check {
      display: inline-flex; align-items: center; gap: 5px;
      margin-left: 12px; font-size: 13px; color: #555; cursor: pointer; user-select: none;
    }
    .pf-check input { width: 15px; height: 15px; accent-color: #dc2626; cursor: pointer; margin: 0; }
    .pf-row-selected { background: #fff7f5; }
  `
  document.head.appendChild(style)
}

function findAddButton() {
  return Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Adicionar Endereço') && !b.closest('.pf-bar'))
}

function setText(el, text) {
  if (el.textContent !== text) el.textContent = text
}

function pageProgress(i, total, name) {
  const btn = document.getElementById('pf-delete-btn')
  if (!btn) return
  btn.disabled = true
  btn.classList.add('pf-busy')
  setText(btn, `Excluindo ${i + 1} de ${total}: ${name}`)
}

function pageDone(summary) {
  pageSelected.clear()
  const btn = document.getElementById('pf-delete-btn')
  if (btn) btn.classList.remove('pf-busy')
  renderPageControls()
  if (summary && summary.failed && summary.failed.length) {
    alert(`PagFlow: ${summary.deleted} excluído(s), ${summary.failed.length} com erro.\n${summary.failed[0].name}: ${summary.failed[0].error || ''}`)
  }
}

function renderPageControls() {
  const addBtn = findAddButton()
  if (!addBtn) return
  injectStyles()

  const addresses = scanAddresses()
  const deletable = addresses.filter(a => !a.protectedReason)
  const validKeys = new Set(deletable.map(a => a.key))
  for (const k of [...pageSelected]) if (!validKeys.has(k)) pageSelected.delete(k)

  // Barra ao lado de "Adicionar Endereço"
  let bar = document.getElementById('pf-bar')
  if (!bar) {
    bar = document.createElement('span')
    bar.id = 'pf-bar'
    bar.className = 'pf-bar'
    bar.innerHTML = `
      <button type="button" class="pf-bar-link" id="pf-select-all"></button>
      <button type="button" class="pf-bar-btn" id="pf-delete-btn"></button>`
    addBtn.parentElement.insertBefore(bar, addBtn)

    bar.querySelector('#pf-select-all').addEventListener('click', () => {
      const all = scanAddresses().filter(a => !a.protectedReason)
      const allSelected = all.length > 0 && all.every(a => pageSelected.has(a.key))
      pageSelected.clear()
      if (!allSelected) all.forEach(a => pageSelected.add(a.key))
      renderPageControls()
    })

    bar.querySelector('#pf-delete-btn').addEventListener('click', async () => {
      const keys = scanAddresses().filter(a => !a.protectedReason && pageSelected.has(a.key)).map(a => a.key)
      if (!keys.length || deleting) return
      const ok = confirm(`Excluir ${keys.length} endereço(s) selecionado(s)?\n\nIsso não pode ser desfeito. O endereço padrão e os de coleta/devolução não são tocados.`)
      if (!ok) return
      const summary = await deleteAddresses(keys, pageProgress)
      pageDone(summary)
    })
  }

  const selectAll = document.getElementById('pf-select-all')
  const deleteBtn = document.getElementById('pf-delete-btn')
  const allSelected = deletable.length > 0 && deletable.every(a => pageSelected.has(a.key))
  setText(selectAll, allSelected ? 'Limpar seleção' : `Selecionar todos (${deletable.length})`)
  selectAll.style.display = deletable.length ? '' : 'none'
  if (!deleting) {
    const n = pageSelected.size
    setText(deleteBtn, n ? `Excluir selecionados (${n})` : 'Excluir selecionados')
    deleteBtn.disabled = n === 0
  }

  // Caixa "Selecionar" em cada endereço excluível, ao lado de "Editar | Excluir"
  for (const a of addresses) {
    const existing = a.row.querySelector('.pf-check')
    if (a.protectedReason) {
      if (existing) existing.remove()
      continue
    }
    const checked = pageSelected.has(a.key)
    a.row.classList.toggle('pf-row-selected', checked)
    if (existing) {
      const cb = existing.querySelector('input')
      cb.dataset.key = a.key
      if (cb.checked !== checked) cb.checked = checked
      cb.disabled = deleting
      continue
    }
    const label = document.createElement('label')
    label.className = 'pf-check'
    label.innerHTML = '<input type="checkbox" /> Selecionar'
    const cb = label.querySelector('input')
    cb.dataset.key = a.key
    cb.checked = checked
    cb.disabled = deleting
    cb.addEventListener('change', () => {
      if (cb.checked) pageSelected.add(cb.dataset.key)
      else pageSelected.delete(cb.dataset.key)
      renderPageControls()
    })
    a.deleteBtn.parentElement.appendChild(label)
  }
}

let renderTimer = null
const pageObserver = new MutationObserver(() => {
  clearTimeout(renderTimer)
  renderTimer = setTimeout(renderPageControls, 300)
})
pageObserver.observe(document.body, { childList: true, subtree: true })
renderPageControls()

// Entry point: verifica se há pedido pendente quando a página carrega
chrome.storage.local.get(['pendingOrder'], async ({ pendingOrder }) => {
  if (!pendingOrder) return

  // Aguarda a página estar pronta (React renderizado)
  try {
    await waitForEl('button')
    await sleep(800)
    await fillAddressForm(pendingOrder)
  } catch (e) {
    console.error('[PagFlow→Shopee]', e.message)
    // Remove o pendente para não ficar em loop
    chrome.storage.local.remove('pendingOrder')
  }
})
