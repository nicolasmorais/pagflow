# Copiador de Dados de Formulário — Extensão Chrome

Captura os valores preenchidos numa página e cola em campos de outra página, casando automaticamente por `id`, `name`, `placeholder` ou `label`.

## Como instalar

1. Abra `chrome://extensions` no navegador.
2. Ative o **Modo do desenvolvedor** (canto superior direito).
3. Clique em **Carregar sem compactação** ("Load unpacked").
4. Selecione a pasta `copiador-extensao` (esta pasta, com o `manifest.json`).
5. A extensão vai aparecer na barra de ferramentas.

## Como usar

1. Vá até a página com o endereço 1 (ex: pedido da Sandra no PagFlow).
2. Clique no ícone da extensão → **Capturar dados desta página**.
3. Dê um nome pro que foi capturado (ex: "Endereço 1" — já vem sugerido) → **Salvar**.
4. Vá até a página com o endereço 2 e repita: **Capturar** → nomeia como "Endereço 2" → **Salvar**.
   - Cada captura vira um item separado na lista — nada é sobrescrito.
5. Vá até a página de destino (o formulário "Novo Endereço").
6. Abra a extensão: você verá a lista com "Endereço 1", "Endereço 2" etc., cada um com seu botão **Colar aqui**.
7. Clique **Colar aqui** no item que quiser (ex: "Endereço 1") — só aquele é preenchido na página atual.
   - Mostra quantos campos foram preenchidos (ex: `6/6 campos preenchidos`).
8. Cada item da lista tem um botão **Excluir** individual, ou use **Limpar todos os salvos** pra apagar tudo de uma vez.

## Como funciona o "match" de campos (v2 — por significado)

A versão atual não depende de `id`/`name` iguais entre origem e destino (o painel do PagFlow nem é um formulário, é texto). Em vez disso, a extensão reconhece o **significado** de cada dado: `nome`, `telefone`, `cep`, `cidade_estado`, `bairro`, `rua`, `numero`, `complemento`.

**Na página de origem** (ex: painel do PagFlow), ela varre o texto da página procurando rótulos curtos como `RUA`, `CEP`, `BAIRRO`, `CIDADE`, `NÚMERO`, `COMPLEMENTO`, `TELEFONE`, `CLIENTE`, e pega o valor que aparece logo ao lado/abaixo.

**Na página de destino** (ex: o modal "Novo Endereço"), ela olha o `placeholder`/rótulo de cada campo — "Rua / Avenida", "Bairro", "CEP", "Estado - Cidade", "Número", "Complemento...", "Nome Completo", "Número de Telefone" — identifica o mesmo significado e preenche o campo certo, mesmo que o texto não seja idêntico.

Ordem de prioridade pra achar o campo de destino:
1. Atributo `data-copy-field="rua"` (se você adicionar isso no HTML — ver abaixo, é o mais confiável).
2. Match semântico (placeholder/label "significa" a mesma coisa).
3. Match antigo por `id`/`name`/`placeholder`/`label` idênticos (fallback pra formulários comuns).

Campos que não acharam par aparecem no console do navegador (F12 → Console) como "Campos não encontrados".

## Deixando 100% confiável no PagFlow (recomendado)

Como o PagFlow é seu, a forma mais garantida de capturar certo — sem depender de heurística de texto — é marcar os elementos de valor com `data-copy-field`:

```html
<div data-copy-field="rua">Rua Doze de Outubro</div>
<div data-copy-field="numero">214</div>
<div data-copy-field="complemento">Casa</div>
<div data-copy-field="bairro">Partenon</div>
<div data-copy-field="cidade_estado">Porto Alegre / RS</div>
<div data-copy-field="cep">90680140</div>
<div data-copy-field="nome">Sandra Regina Pereira de Souza</div>
<div data-copy-field="telefone">(51) 98687-2188</div>
```

Chaves aceitas: `nome`, `telefone`, `email`, `cpf`, `cep`, `cidade_estado`, `bairro`, `rua`, `numero`, `complemento`, `estado`.

Com isso a extensão nem precisa "adivinhar" — pega direto, sem risco de confundir número de telefone com número de endereço, por exemplo.

## Limitações

- Não funciona em `chrome://` internas do navegador (restrição do próprio Chrome).
- Campos de senha e arquivo nunca são capturados, por segurança.
- A heurística de texto (sem `data-copy-field`) pode falhar se o site de destino usar nomes muito diferentes do dicionário — nesse caso me manda um print do campo que não bateu que eu adiciono a variação na lista de palavras-chave.
- Não sincroniza entre computadores — os dados ficam salvos localmente no navegador.

## Personalização

Se quiser mapear campos manualmente (arrastar "campo X da origem" pro "campo Y do destino" via interface), me avisa que adiciono uma tela de mapeamento no popup.
