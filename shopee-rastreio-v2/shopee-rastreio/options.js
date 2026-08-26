const FIELDS = ['pagflowUrl', 'pagflowKey', 'pagflowEndpoint'];

// Carrega valores salvos
chrome.storage.local.get(FIELDS, (data) => {
  FIELDS.forEach(f => {
    const el = document.getElementById(f);
    if (el && data[f]) el.value = data[f];
  });
});

// Salva
document.getElementById('saveBtn').onclick = () => {
  const data = {};
  FIELDS.forEach(f => {
    const el = document.getElementById(f);
    if (el) data[f] = el.value.trim();
  });

  chrome.storage.local.set(data, () => {
    const msg = document.getElementById('savedMsg');
    msg.style.display = 'inline';
    setTimeout(() => { msg.style.display = 'none'; }, 2500);
  });
};
