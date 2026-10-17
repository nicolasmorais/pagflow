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

  // 3. Nome e telefone
  setReactValue(nomeInput, cliente.nome || '')
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
