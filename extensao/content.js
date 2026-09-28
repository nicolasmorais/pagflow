// content.js — captura por semântica (nome, telefone, cep, rua, número, bairro, cidade, complemento)
// Funciona tanto em páginas com <label>+<input> quanto em painéis "somente leitura" (ex: PagFlow),
// onde o dado aparece como texto (ex: rótulo "RUA" seguido do valor "Rua Doze de Outubro").

// ---------- Dicionário semântico ----------
// Ordem importa: chaves mais específicas (telefone) devem vir antes das mais genéricas (numero)
// para "Número de Telefone" não ser confundido com "Número" do endereço.
const SEMANTIC_ORDER = [
  "nome", "telefone", "email", "cpf",
  "cep", "cidade_estado", "bairro", "rua", "numero", "complemento", "estado",
];

const SEMANTIC_KEYWORDS = {
  nome: ["nome completo", "nome do cliente", "cliente", "nome"],
  telefone: ["numero de telefone", "telefone", "celular", "whatsapp", "fone"],
  email: ["e-mail", "email"],
  cpf: ["cpf"],
  cep: ["cep"],
  cidade_estado: ["estado - cidade", "estado/cidade", "cidade/estado", "cidade"],
  bairro: ["bairro"],
  rua: ["rua / avenida", "rua/avenida", "rua", "avenida", "endereco", "logradouro"],
  numero: ["numero", "nº", "n°", " num"],
  complemento: ["complemento", "referencia", "descricao do predio"],
  estado: ["estado", "uf"],
};

function normalize(str) {
  return (str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

// Só usa "texto contém a palavra-chave" (não o inverso), pra "NÚMERO" não virar refém
// de "Número de Telefone" (ver comentário acima sobre ordem).
function detectSemanticKey(rawText) {
  const norm = normalize(rawText);
  if (!norm) return null;
  for (const key of SEMANTIC_ORDER) {
    for (const kw of SEMANTIC_KEYWORDS[key]) {
      if (norm.includes(kw)) return key;
    }
  }
  return null;
}

// ---------- Captura em formulários (input/textarea/select) ----------
function getFieldLabel(el) {
  if (el.id) {
    const label = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
    if (label) return label.innerText.trim();
  }
  const parentLabel = el.closest("label");
  if (parentLabel) return parentLabel.innerText.trim();
  return "";
}

function descriptorFor(el) {
  const label = getFieldLabel(el);
  return [el.placeholder, el.getAttribute("aria-label"), label, el.name, el.id]
    .filter(Boolean)
    .join(" ");
}

function captureFormFields() {
  const elements = document.querySelectorAll("input, textarea, select");
  const data = [];

  elements.forEach((el) => {
    const type = (el.type || el.tagName).toLowerCase();
    if (["hidden", "submit", "button", "reset", "file", "password"].includes(type)) return;
    if (!el.value) return;

    data.push({
      name: el.name || "",
      id: el.id || "",
      placeholder: el.placeholder || "",
      label: getFieldLabel(el),
      type,
      value: el.value,
      semantic: detectSemanticKey(descriptorFor(el)),
    });
  });

  return data;
}

// ---------- Captura em painéis "somente leitura" (rótulo + valor em texto) ----------
// Prioridade 1: se a página tiver o atributo data-copy-field="rua" (ou nome/telefone/cep/...),
// usa ele direto — 100% confiável. É o que eu recomendo adicionar no PagFlow.
function captureDataAttributes() {
  const els = document.querySelectorAll("[data-copy-field]");
  const data = [];
  els.forEach((el) => {
    const key = el.getAttribute("data-copy-field");
    const value = (el.value || el.innerText || el.textContent || "").split("\n")[0].trim();
    if (!key || !value) return;
    data.push({ name: "", id: "", placeholder: "", label: key, type: "text", value, semantic: key });
  });
  return data;
}

// Prioridade 2: heurística — acha um elemento "folha" (sem filhos) cujo texto bate com um rótulo
// conhecido (RUA, CEP, BAIRRO...) e pega o valor no elemento vizinho.
function getValueNearLabel(labelEl) {
  const parent = labelEl.parentElement;
  if (!parent) return "";

  const siblings = Array.from(parent.children);
  const idx = siblings.indexOf(labelEl);
  for (let i = idx + 1; i < siblings.length; i++) {
    const txt = siblings[i].innerText?.trim();
    if (txt) return txt;
  }

  if (parent.nextElementSibling) {
    const txt = parent.nextElementSibling.innerText?.trim();
    if (txt) return txt;
  }

  return "";
}

function scanLabelValuePairs() {
  const results = [];
  const seen = new Set();

  const leaves = Array.from(document.querySelectorAll("body *")).filter(
    (el) => el.children.length === 0 && el.tagName !== "SCRIPT" && el.tagName !== "STYLE"
  );

  leaves.forEach((el) => {
    const text = el.textContent.trim();
    if (!text || text.length > 25) return;

    const key = detectSemanticKey(text);
    if (!key) return;

    const rawValue = getValueNearLabel(el);
    if (!rawValue) return;

    const value = rawValue.split("\n")[0].trim();
    if (!value || value === text) return;

    const dedupeKey = key + ":" + value;
    if (seen.has(dedupeKey)) return;
    seen.add(dedupeKey);

    results.push({ name: "", id: "", placeholder: "", label: text, type: "text", value, semantic: key });
  });

  return results;
}

function captureFields() {
  const combined = [
    ...captureDataAttributes(),
    ...captureFormFields(),
    ...scanLabelValuePairs(),
  ];

  // remove duplicados (mesma chave semântica + mesmo valor)
  const seen = new Set();
  const deduped = [];
  combined.forEach((f) => {
    const dedupeKey = (f.semantic || f.name || f.id || f.label) + ":" + f.value;
    if (seen.has(dedupeKey)) return;
    seen.add(dedupeKey);
    deduped.push(f);
  });

  return deduped;
}

// ---------- Colar (preencher campos na página de destino) ----------
function setNativeValue(el, value) {
  const proto =
    el.tagName === "TEXTAREA"
      ? window.HTMLTextAreaElement.prototype
      : el.tagName === "SELECT"
      ? window.HTMLSelectElement.prototype
      : window.HTMLInputElement.prototype;

  const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
  if (setter) {
    setter.call(el, value);
  } else {
    el.value = value;
  }

  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

function findMatchingElementLegacy(field) {
  let el = null;
  if (field.id) el = document.getElementById(field.id);
  if (!el && field.name) el = document.querySelector(`[name="${CSS.escape(field.name)}"]`);
  if (!el && field.placeholder) {
    el = document.querySelector(`[placeholder="${CSS.escape(field.placeholder)}"]`);
  }
  if (!el && field.label) {
    const labels = document.querySelectorAll("label");
    for (const lb of labels) {
      if (lb.innerText.trim() === field.label) {
        el = lb.htmlFor ? document.getElementById(lb.htmlFor) : lb.querySelector("input, textarea, select");
        if (el) break;
      }
    }
  }
  return el;
}

function pasteFields(data) {
  let matched = 0;
  const unmatched = [];
  const used = new Set();

  const candidates = Array.from(document.querySelectorAll("input, textarea, select")).filter((el) => {
    const type = (el.type || "").toLowerCase();
    return !["hidden", "submit", "button", "reset", "file"].includes(type);
  });

  data.forEach((field) => {
    let el = null;

    // 1. campo com data-copy-field igual à chave semântica (se o site de destino também tiver isso)
    if (field.semantic) {
      const attrEl = document.querySelector(`[data-copy-field="${field.semantic}"]`);
      if (attrEl && !used.has(attrEl)) el = attrEl;
    }

    // 2. match semântico (placeholder/label/name/id do campo de destino "significa" a mesma coisa)
    if (!el && field.semantic) {
      el = candidates.find((c) => !used.has(c) && detectSemanticKey(descriptorFor(c)) === field.semantic);
    }

    // 3. fallback antigo: id/name/placeholder/label idênticos
    if (!el) {
      const legacy = findMatchingElementLegacy(field);
      if (legacy && !used.has(legacy)) el = legacy;
    }

    if (el) {
      let value = field.value;
      // Adicionar DDI 55 (Brasil) no telefone se nao comecar com 55
      if (field.semantic === "telefone" && value && !value.startsWith("55")) {
        value = "55" + value;
      }
      setNativeValue(el, value);
      used.add(el);
      matched++;
    } else {
      unmatched.push(field);
    }
  });

  return { matched, total: data.length, unmatched };
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "capture") {
    sendResponse({ data: captureFields() });
  } else if (msg.action === "paste") {
    sendResponse(pasteFields(msg.data));
  }
  return true;
});
