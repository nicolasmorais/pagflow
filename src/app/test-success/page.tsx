'use client'

import CheckoutForm from '../checkout/CheckoutForm'
import { useState, useEffect } from 'react'

export default function TestSuccessPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const mockProduct = {
    id: 'test-prod',
    name: 'Produto de Teste Premium',
    price: 197.00,
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1999&auto=format&fit=crop',
    isDigital: false
  }

  const mockCustomization = {
    storeName: 'LOJA TESTE',
    primaryColor: '#1D9A52',
    supportEmail: 'suporte@lojateste.com'
  }

  // This is a "hack" to show the success screen directly
  // We'll need to wrap it or modify CheckoutForm to accept a forceDone prop
  // But since we can't easily modify CheckoutForm's internal state from here,
  // I'll just tell the user to use a specific URL if I add the logic to CheckoutForm.
  
  return (
    <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <h1>Página de Teste de Sucesso</h1>
        <p>Para ver a página de sucesso, acesse o link do checkout e use os dados de teste.</p>
        <div style={{ background: '#f5f5f5', padding: '20px', borderRadius: '12px', marginTop: '20px', display: 'inline-block', textAlign: 'left' }}>
            <strong>Como testar:</strong>
            <ul style={{ marginTop: '10px' }}>
                <li>Link do Checkout: <a href="/checkout" target="_blank">http://localhost:3000/checkout</a></li>
                <li>Escolha <strong>PIX</strong> e clique em Finalizar para ver a nova tela do PIX.</li>
                <li>Para <strong>Cartão</strong>, use um cartão de teste do Mercado Pago.</li>
            </ul>
        </div>
    </div>
  )
}
