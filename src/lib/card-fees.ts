// Taxas da Pagar.me por nº de parcelas (em %), editáveis em Admin → Configurações.
// O cliente paga a taxa inteira: total = preço / (1 - taxa), e o vendedor recebe o preço cheio.

export const CARD_FEES_KEY = 'checkout_card_fees'
export const CARD_MAX_INSTALLMENTS = 18

export type CardFees = Record<number, number> // parcelas → % (ex.: 12 → 20.95)

export const DEFAULT_CARD_FEES: CardFees = {
    1: 4.19, 2: 7.26, 3: 9.40, 4: 11.00, 5: 12.33, 6: 13.63,
    7: 14.91, 8: 16.17, 9: 17.40, 10: 18.60, 11: 19.71, 12: 20.95,
    13: 21.04, 14: 22.09, 15: 22.84, 16: 23.89, 17: 24.94, 18: 25.69,
}

// Valor salvo é JSON { "1": 4.19, ... }; parcela ausente ou inválida cai no padrão.
export function parseCardFees(raw: string | null | undefined): CardFees {
    let saved: Record<string, unknown> = {}
    try { saved = raw ? JSON.parse(raw) : {} } catch { /* mantém padrão */ }
    const fees: CardFees = {}
    for (let n = 1; n <= CARD_MAX_INSTALLMENTS; n++) {
        const v = Number(saved[n])
        fees[n] = Number.isFinite(v) && v >= 0 && v < 100 ? v : DEFAULT_CARD_FEES[n]
    }
    return fees
}

export function cardTotalWithFee(price: number, n: number, fees: CardFees): number {
    return price / (1 - (fees[n] ?? 0) / 100)
}
