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
