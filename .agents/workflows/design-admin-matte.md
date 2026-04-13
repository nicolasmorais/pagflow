---
description: Padrão de Design Admin Preto Fosco (Minimalist Matte Black)
---

Este workflow descreve como implementar e manter a interface do administrador no estilo "Prody Dark Matte".

### 1. Paleta de Cores e Variáveis
Sempre utilize estas variáveis no CSS da Admin:
- `--admin-sidebar`: `#0F0F10` (Preto Fosco)
- `--sidebar-text`: `rgba(255, 255, 255, 0.65)`
- `--sidebar-text-active`: `#FFFFFF`
- `--sidebar-active-bg`: `rgba(255, 255, 255, 0.1)`
- `--admin-bg`: `#F8F9FA` (Fundo das páginas em Off-white para contraste)

### 2. Estrutura da Sidebar
- **Largura:** 270px fixa.
- **Posicionamento:** `fixed`, `top: 0`, `left: 0`, `bottom: 0`.
- **Bordas:** Sem arredondamento nas bordas da tela. Borda direita de `1px solid rgba(255, 255, 255, 0.08)`.
- **Logo:** Sempre aplicar `filter: brightness(0) invert(1)` para garantir visibilidade.

### 3. Navegação (Links)
- **Flattened List:** Nunca usar submenus ou dropdowns. Todos os links devem estar no mesmo nível.
- **Ícones:** Usar Lucide React com `strokeWidth={2}` e tamanho médio de `18px`.
- **Item Ativo:** Fundo `rgba(255, 255, 255, 0.1)`, texto negrito (`700`) e sombra leve.
- **Hover:** Fundo `rgba(255, 255, 255, 0.05)`.

### 4. Layout de Conteúdo
- O `main-content` deve ter `margin-left: 270px` para não sobrepor a sidebar.
- O fundo das páginas deve ser claro, criando um contraste "Premium SaaS" com a sidebar escura.
