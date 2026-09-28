const STORAGE_KEY = "savedAddresses";
const PAGFLOW_URL_KEY = "pagflowUrl";
const ORDER_PASTE_TRACKING = "orderPasteTracking";

const statusEl = document.getElementById("status");
const listEl = document.getElementById("savedList");
const nameForm = document.getElementById("nameForm");
const nameInput = document.getElementById("nameInput");
const ordersStatusEl = document.getElementById("ordersStatus");
const settingsPanel = document.getElementById("settingsPanel");
const pagflowUrlInput = document.getElementById("pagflowUrlInput");
const dateFromInput = document.getElementById("dateFrom");
const dateToInput = document.getElementById("dateTo");
const statusFilter = document.getElementById("statusFilter");

let pendingCapture = null;

// ---------- Helpers ----------
function showStatus(msg, isError = false) {
  statusEl.textContent = msg;
  statusEl.className = isError ? "error" : "";
}

function showOrdersStatus(msg, isError = false) {
  ordersStatusEl.textContent = msg;
  ordersStatusEl.className = isError ? "error" : "";
}

async function getActiveTab() {
  const windows = await chrome.windows.getAll({ populate: true });
  for (const win of windows) {
    if (win.type === "normal") {
      const tab = win.tabs.find((t) => t.active);
      if (tab) return tab;
    }
  }
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  return tab;
}

function sendMessageSafe(tabId, msg, cb) {
  chrome.tabs.sendMessage(tabId, msg, (response) => {
    if (chrome.runtime.lastError) {
      showStatus("Recarregue a pagina e tente de novo.", true);
      return;
    }
    cb(response);
  });
}

function getSaved(cb) {
  chrome.storage.local.get([STORAGE_KEY], (result) => cb(result[STORAGE_KEY] || []));
}

function setSaved(list, cb) {
  chrome.storage.local.set({ [STORAGE_KEY]: list }, cb || (() => {}));
}

function getTracking(cb) {
  chrome.storage.local.get([ORDER_PASTE_TRACKING], (result) => cb(result[ORDER_PASTE_TRACKING] || {}));
}

function setTracking(tracking, cb) {
  chrome.storage.local.set({ [ORDER_PASTE_TRACKING]: tracking }, cb || (() => {}));
}

function getPagflowUrl(cb) {
  chrome.storage.local.get([PAGFLOW_URL_KEY], (result) => cb(result[PAGFLOW_URL_KEY] || ""));
}

function formatDate(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString("pt-BR") + " " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function formatPrice(val) {
  if (!val && val !== 0) return "";
  return "R$ " + Number(val).toFixed(2).replace(".", ",");
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ---------- Settings ----------
document.getElementById("settingsToggle").addEventListener("click", () => {
  settingsPanel.style.display = settingsPanel.style.display === "none" ? "block" : "none";
});

getPagflowUrl((url) => {
  pagflowUrlInput.value = url;
});

document.getElementById("saveSettings").addEventListener("click", () => {
  const url = pagflowUrlInput.value.trim().replace(/\/+$/, "");
  chrome.storage.local.set({ [PAGFLOW_URL_KEY]: url }, () => {
    showOrdersStatus(url ? "URL salva: " + url : "URL limpa.");
    settingsPanel.style.display = "none";
  });
});

// ---------- Order-to-address transformation ----------
function orderToAddress(order) {
  const fieldMap = [
    { db: "fullName", semantic: "nome", label: "Nome" },
    { db: "phone", semantic: "telefone", label: "Telefone" },
    { db: "email", semantic: "email", label: "E-mail" },
    { db: "cpf", semantic: "cpf", label: "CPF" },
    { db: "cep", semantic: "cep", label: "CEP" },
    { db: "bairro", semantic: "bairro", label: "Bairro" },
    { db: "rua", semantic: "rua", label: "Rua" },
    { db: "numero", semantic: "numero", label: "Numero" },
    { db: "complemento", semantic: "complemento", label: "Complemento" },
    { db: "estado", semantic: "estado", label: "Estado" },
    { db: "recipient", semantic: "destinatario", label: "Destinatario" },
    { db: "referencia", semantic: "referencia", label: "Referencia" },
  ];

  const data = fieldMap
    .filter((f) => order[f.db])
    .map((f) => ({
      name: "",
      id: "",
      placeholder: "",
      label: f.label,
      type: "text",
      value: order[f.db],
      semantic: f.semantic,
    }));

  if (order.cidade) {
    data.push({
      name: "",
      id: "",
      placeholder: "",
      label: "Cidade",
      type: "text",
      value: order.cidade + (order.estado ? " - " + order.estado : ""),
      semantic: "cidade_estado",
    });
  }

  return data;
}

// ---------- Fetch orders from PagFlow ----------
async function fetchOrdersFromPagFlow() {
  return new Promise((resolve) => {
    getPagflowUrl(async (pagflowUrl) => {
      if (!pagflowUrl) {
        showOrdersStatus("Configure a URL do PagFlow primeiro (engrenagem).", true);
        resolve(null);
        return;
      }

      let dateLabel = "";
      if (dateFromInput.value && dateToInput.value) {
        dateLabel = " (" + dateFromInput.value + " a " + dateToInput.value + ")";
      } else if (dateFromInput.value) {
        dateLabel = " (a partir de " + dateFromInput.value + ")";
      } else if (dateToInput.value) {
        dateLabel = " (ate " + dateToInput.value + ")";
      }
      showOrdersStatus("Buscando pedidos" + dateLabel + "...");
      try {
        const params = new URLSearchParams();
        if (dateFromInput.value) params.set("from", dateFromInput.value);
        if (dateToInput.value) params.set("to", dateToInput.value);
        if (statusFilter.value) params.set("status", statusFilter.value);
        const qs = params.toString();
        const fullUrl = pagflowUrl + "/api/admin/extension-orders" + (qs ? "?" + qs : "");
        const res = await fetch(fullUrl, {
          credentials: "include",
        });

        if (res.status === 401) {
          showOrdersStatus("Faca login no PagFlow primeiro.", true);
          resolve(null);
          return;
        }

        if (!res.ok) {
          showOrdersStatus("Erro na API: " + res.status, true);
          resolve(null);
          return;
        }

        const data = await res.json();
        if (!data.orders) {
          showOrdersStatus("Resposta invalida da API.", true);
          resolve(null);
          return;
        }

        showOrdersStatus(data.orders.length + " pedido(s) encontrado(s).");
        resolve(data.orders);
      } catch (err) {
        showOrdersStatus("Erro de conexao: " + err.message, true);
        resolve(null);
      }
    });
  });
}

// ---------- Merge orders into saved list ----------
function mergeOrdersIntoSaved(fetchedOrders, cb) {
  getSaved((saved) => {
    getTracking((tracking) => {
      fetchedOrders.forEach((order) => {
        const savedId = "order_" + order.id;
        const existing = saved.find((s) => s.id === savedId);

        if (existing) {
          existing.name = order.fullName || "Pedido #" + order.id.slice(0, 8);
          existing.data = orderToAddress(order);
          existing.paymentStatus = order.paymentStatus;
          existing.orderStatus = order.status;
          existing.totalPrice = order.totalPrice;
          existing.productName = order.product?.name || "Produto";
          if (order.trackingCode) {
            existing.trackingCode = order.trackingCode;
            existing.trackingUrl = order.trackingUrl;
          }
        } else {
          saved.push({
            id: savedId,
            name: order.fullName || "Pedido #" + order.id.slice(0, 8),
            data: orderToAddress(order),
            from: "pagflow:" + order.id,
            at: new Date(order.createdAt).getTime(),
            isOrder: true,
            orderId: order.id,
            paymentStatus: order.paymentStatus,
            orderStatus: order.status,
            totalPrice: order.totalPrice,
            productName: order.product?.name || "Produto",
            trackingCode: order.trackingCode || "",
            trackingUrl: order.trackingUrl || "",
          });
        }

        if (!tracking[order.id]) {
          tracking[order.id] = { domains: [], lastPastedAt: null };
        }
      });

      setTracking(tracking);
      setSaved(saved, () => cb(saved));
    });
  });
}

// ---------- Render list ----------
function renderList(list) {
  listEl.innerHTML = "";
  if (!list || list.length === 0) {
    listEl.innerHTML = '<div id="empty">Nenhum endereco salvo ainda</div>';
    return;
  }

  const currentStatus = statusFilter.value;
  const orders = list
    .filter((i) => i.isOrder && i.paymentStatus === "pago" && i.orderStatus === currentStatus)
    .sort((a, b) => b.at - a.at);
  const manual = list.filter((i) => !i.isOrder).sort((a, b) => b.at - a.at);
  const ordered = [...orders, ...manual];

  getTracking((tracking) => {
    ordered.forEach((item) => {
      const div = document.createElement("div");

      if (item.isOrder) {
        div.className = "saved-item order-item";
        const trackInfo = tracking[item.orderId] || { domains: [], lastPastedAt: null };
        const isPasted = trackInfo.domains && trackInfo.domains.length > 0;
        if (isPasted) div.classList.add("pasted");

        const statusBadge =
          item.paymentStatus === "pago"
            ? '<span class="badge-pago">PAGO</span>'
            : item.paymentStatus === "processando"
            ? '<span class="badge-processando">PROCESSANDO</span>'
            : "";

        const orderStatusBadge =
          item.orderStatus === "enviado"
            ? '<span class="badge-enviado">ENVIADO</span>'
            : item.orderStatus === "cl_shopee"
            ? '<span class="badge-cl-shopee">CL SHOPEE</span>'
            : "";

        const pastedHtml = isPasted
          ? '<div class="pasted-info">&#10003; Colado em: ' + escapeHtml(trackInfo.domains.join(", ")) + "</div>"
          : '<div class="pasted-info not-pasted">&#9888; Nao colado</div>';

        const addrPreview = [item.data.find((f) => f.semantic === "rua")?.value, item.data.find((f) => f.semantic === "numero")?.value]
          .filter(Boolean)
          .join(", ");
        const cityPreview = item.data.find((f) => f.semantic === "cidade_estado")?.value || "";

        const isSent = item.orderStatus === "enviado" || item.orderStatus === "cl_shopee";

        const trackingBadge = item.trackingCode
          ? `<span class="badge-tracking" title="Clique para copiar" data-tracking="${escapeHtml(item.trackingCode)}">${escapeHtml(item.trackingCode)}</span>`
          : "";

        div.innerHTML = `
          <div class="top">
            <span class="name">${escapeHtml(item.name)}</span>
            <span class="date">${formatDate(item.at)}</span>
          </div>
          <div class="meta">
            ${statusBadge}
            ${orderStatusBadge}
            ${trackingBadge}
            <span class="product-name">${escapeHtml(item.productName || "")}</span>
            <span class="price">${formatPrice(item.totalPrice)}</span>
          </div>
          <div class="address-preview">${escapeHtml(addrPreview)}${cityPreview ? " - " + escapeHtml(cityPreview) : ""}</div>
          ${pastedHtml}
          <div class="actions">
            <button class="btn-paste" data-id="${item.id}">Colar aqui</button>
            <button class="btn-mark-sent" data-id="${item.id}" ${isSent ? "disabled" : ""}>${isSent ? "Enviado" : "Marcar enviado"}</button>
            <button class="btn-delete" data-id="${item.id}">Excluir</button>
          </div>
        `;
      } else {
        div.className = "saved-item";
        const previewFields = item.data
          .slice(0, 3)
          .map((f) => f.value)
          .join(" . ");

        div.innerHTML = `
          <div class="top">
            <span class="name">${escapeHtml(item.name)}</span>
            <span class="date">${formatDate(item.at)}</span>
          </div>
          <div class="fields">${item.data.length} campo(s): ${escapeHtml(previewFields)}${item.data.length > 3 ? "..." : ""}</div>
          <div class="actions">
            <button class="btn-paste" data-id="${item.id}">Colar aqui</button>
            <button class="btn-delete" data-id="${item.id}">Excluir</button>
          </div>
        `;
      }

      listEl.appendChild(div);
    });
  });
}

function refreshList() {
  getSaved(renderList);
}

// ---------- Import orders ----------
document.getElementById("importOrders").addEventListener("click", async () => {
  const orders = await fetchOrdersFromPagFlow();
  if (!orders) return;
  mergeOrdersIntoSaved(orders, (list) => {
    renderList(list);
  });
});

document.getElementById("refreshOrders").addEventListener("click", async () => {
  const orders = await fetchOrdersFromPagFlow();
  if (!orders) return;
  mergeOrdersIntoSaved(orders, (list) => {
    renderList(list);
  });
});

// ---------- Capture ----------
document.getElementById("capture").addEventListener("click", async () => {
  const tab = await getActiveTab();
  sendMessageSafe(tab.id, { action: "capture" }, (response) => {
    if (!response.data || response.data.length === 0) {
      showStatus("Nenhum dado encontrado nesta pagina.", true);
      return;
    }
    pendingCapture = { data: response.data, from: tab.url };
    getSaved((list) => {
      nameInput.value = "Endereco " + (list.filter((i) => !i.isOrder).length + 1);
      nameForm.style.display = "block";
      nameInput.focus();
      nameInput.select();
    });
    showStatus(response.data.length + " campo(s) capturado(s). De um nome e salve.");
  });
});

document.getElementById("saveName").addEventListener("click", () => {
  if (!pendingCapture) return;
  const name = nameInput.value.trim() || "Endereco sem nome";

  getSaved((list) => {
    const newItem = {
      id: Date.now().toString(),
      name,
      data: pendingCapture.data,
      from: pendingCapture.from,
      at: Date.now(),
    };
    list.push(newItem);
    setSaved(list, () => {
      pendingCapture = null;
      nameForm.style.display = "none";
      renderList(list);
      showStatus('Salvo como "' + name + '".');
    });
  });
});

document.getElementById("cancelName").addEventListener("click", () => {
  pendingCapture = null;
  nameForm.style.display = "none";
  showStatus("");
});

// ---------- Paste / Delete / Mark sent (event delegation) ----------
listEl.addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-id]");
  if (!btn) return;
  const id = btn.dataset.id;

  // Paste
  if (btn.classList.contains("btn-paste")) {
    getSaved(async (list) => {
      const item = list.find((i) => i.id === id);
      if (!item) return;
      const tab = await getActiveTab();
      sendMessageSafe(tab.id, { action: "paste", data: item.data }, (response) => {
        showStatus('"' + item.name + '": ' + response.matched + "/" + response.total + " campo(s) preenchido(s).");

        if (item.isOrder) {
          let domain = "";
          try {
            domain = new URL(tab.url).hostname;
          } catch {}
          if (domain) {
            if (domain.includes("shopee") && item.orderStatus !== "cl_shopee") {
              getPagflowUrl(async (pagflowUrl) => {
                if (pagflowUrl) {
                  try {
                    const res = await fetch(pagflowUrl + "/api/admin/extension-orders", {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      credentials: "include",
                      body: JSON.stringify({ orderId: item.orderId, status: "cl_shopee" }),
                    });
                    if (res.ok) {
                      item.orderStatus = "cl_shopee";
                      setSaved(list);
                      const orderDiv = btn.closest(".order-item");
                      if (orderDiv) {
                        orderDiv.style.transition = "opacity 0.3s, max-height 0.3s";
                        orderDiv.style.opacity = "0";
                        orderDiv.style.maxHeight = "0";
                        orderDiv.style.overflow = "hidden";
                        orderDiv.style.padding = "0";
                        orderDiv.style.margin = "0";
                        setTimeout(() => orderDiv.remove(), 300);
                      }
                      showStatus('Status atualizado para "CL Shopee". Pedido removido da lista.');
                    }
                  } catch {}
                }
              });
            }

            getTracking((tracking) => {
              if (!tracking[item.orderId]) {
                tracking[item.orderId] = { domains: [], lastPastedAt: null };
              }
              const entry = tracking[item.orderId];
              if (!entry.domains.includes(domain)) {
                entry.domains.push(domain);
              }
              entry.lastPastedAt = Date.now();
              setTracking(tracking);
              item.pastedDomains = entry.domains;
              item.lastPastedAt = entry.lastPastedAt;
              setSaved(list);

              const orderDiv = btn.closest(".order-item");
              if (orderDiv) {
                orderDiv.classList.add("pasted");
                const pastedEl = orderDiv.querySelector(".pasted-info");
                const newContent = '&#10003; Colado em: ' + escapeHtml(entry.domains.join(", "));
                if (pastedEl) {
                  pastedEl.innerHTML = newContent;
                  pastedEl.className = "pasted-info";
                } else {
                  const addrEl = orderDiv.querySelector(".address-preview");
                  if (addrEl) {
                    const newPasted = document.createElement("div");
                    newPasted.className = "pasted-info";
                    newPasted.innerHTML = newContent;
                    addrEl.after(newPasted);
                  }
                }
              }
            });
          }
        }

        if (response.unmatched && response.unmatched.length > 0) {
          console.log('Campos nao encontrados ao colar "' + item.name + '":', response.unmatched);
        }
      });
    });
  }

  // Delete
  if (btn.classList.contains("btn-delete")) {
    getSaved((list) => {
      const item = list.find((i) => i.id === id);
      const filtered = list.filter((i) => i.id !== id);
      setSaved(filtered, () => {
        renderList(filtered);
        showStatus(item ? '"' + item.name + '" excluido.' : "Excluido.");
      });
    });
  }

  // Mark as sent
  if (btn.classList.contains("btn-mark-sent")) {
    getSaved(async (list) => {
      const item = list.find((i) => i.id === id);
      if (!item || !item.isOrder) return;

      btn.disabled = true;
      btn.textContent = "Enviando...";

      getPagflowUrl(async (pagflowUrl) => {
        if (!pagflowUrl) {
          showOrdersStatus("URL do PagFlow nao configurada.", true);
          btn.disabled = false;
          btn.textContent = "Marcar enviado";
          return;
        }

        try {
          const res = await fetch(pagflowUrl + "/api/admin/extension-orders", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ orderId: item.orderId, status: "enviado" }),
          });

          if (res.ok) {
            item.orderStatus = "enviado";
            setSaved(list, () => {
              renderList(list);
              showStatus('"' + item.name + '" marcado como enviado.');
            });
          } else {
            showOrdersStatus("Erro ao marcar enviado: " + res.status, true);
            btn.disabled = false;
            btn.textContent = "Marcar enviado";
          }
        } catch (err) {
          showOrdersStatus("Erro de conexao: " + err.message, true);
          btn.disabled = false;
          btn.textContent = "Marcar enviado";
        }
      });
    });
  }
});

// ---------- Clear all ----------
document.getElementById("clearAll").addEventListener("click", () => {
  setSaved([], () => {
    setTracking({}, () => {
      renderList([]);
      showStatus("Todos os enderecos salvos foram apagados.");
    });
  });
});

// ---------- Clear dates ----------
document.getElementById("clearDates").addEventListener("click", () => {
  dateFromInput.value = "";
  dateToInput.value = "";
});

// ---------- Status filter ----------
statusFilter.addEventListener("change", () => {
  refreshList();
});

// ---------- Copy tracking code on click ----------
listEl.addEventListener("click", (e) => {
  const badge = e.target.closest(".badge-tracking");
  if (!badge) return;
  const code = badge.dataset.tracking;
  if (code) {
    navigator.clipboard.writeText(code).then(() => {
      badge.textContent = "Copiado!";
      setTimeout(() => { badge.textContent = code; }, 1500);
    });
  }
});

// ---------- Init ----------
refreshList();
