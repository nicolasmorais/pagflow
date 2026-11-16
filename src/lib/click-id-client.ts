// Click ID da Taboola no navegador: primeiro o tblci da URL; se não vier, o cookie tb_clid que o
// ControlPages grava no domínio da loja (vale para o checkout no subdomínio de pagamento).
export function getClickId(params?: { get(name: string): string | null } | null): string | null {
    if (typeof window === 'undefined') return null;
    const fromUrl = (params ?? new URLSearchParams(window.location.search)).get('tblci');
    const clean = (v: string | null | undefined) => {
        const s = String(v ?? '').trim();
        return s && s.length <= 512 && !/[{}\s]/.test(s) ? s : null;
    };
    if (clean(fromUrl)) return clean(fromUrl);
    const m = document.cookie.match(/(?:^|; )tb_clid=([^;]*)/);
    return m ? clean(decodeURIComponent(m[1])) : null;
}

// Código do visitante (pf_vid). Quando a pessoa chega do ControlPages, o vid dele vem na URL
// (?vid=...) ou no cookie cp_vid do domínio da loja, e passa a ser o pf_vid: o pedido e os passos
// do checkout ficam com o mesmo código das visitas ao advertorial e à página de vendas, e a jornada
// liga todos os cliques da pessoa até a compra. Sem vid de fora, segue o pf_vid salvo (ou cria um).
const VID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
export function getVisitorId(): string {
    if (typeof window === 'undefined') return '';
    try {
        const clean = (v: string | null | undefined) => { const s = String(v ?? '').trim().toLowerCase(); return VID_RE.test(s) ? s : null; };
        const m = document.cookie.match(/(?:^|; )cp_vid=([^;]*)/);
        const external = clean(new URLSearchParams(window.location.search).get('vid')) || (m ? clean(decodeURIComponent(m[1])) : null);
        let vid = window.localStorage.getItem('pf_vid');
        if (external && external !== vid) { vid = external; window.localStorage.setItem('pf_vid', vid); }
        if (!vid) { vid = crypto.randomUUID(); window.localStorage.setItem('pf_vid', vid); }
        return vid;
    } catch {
        return '';
    }
}
