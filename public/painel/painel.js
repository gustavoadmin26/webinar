const byId = id => document.getElementById(id);
const status = byId('status');
const login = byId('login');
const dashboard = byId('dashboard');
const link = byId('link');
const range = byId('range');
const toast = byId('toast');
const toastAction = byId('toast-action');
const counts = new Intl.NumberFormat('pt-BR');
let installPrompt;
let activeUrl;
let requestNumber = 0;
let submitting = false;
const draftKey = 'webinar-link-draft';

async function api(route, body) {
  const options = { cache: 'no-store' };
  if (body !== undefined) {
    options.method = 'POST';
    options.headers = { 'Content-Type': 'application/json' };
    options.body = JSON.stringify(body);
  }
  const response = await fetch('/painel/api/' + route, options);
  const result = await response.json();
  if (!response.ok) throw Object.assign(new Error(result.error), { status: response.status });
  return result;
}

async function refresh() {
  const current = ++requestNumber;
  try {
    const data = await api('dashboard?days=' + range.value);
    if (current !== requestNumber) return;
    activeUrl = data.url;
    link.value = sessionStorage.getItem(draftKey) ?? activeUrl;
    byId('test-link').href = activeUrl;
    byId('views').textContent = counts.format(data.pageviews);
    byId('clicks').textContent = counts.format(data.clicks);
    byId('rate').textContent = data.pageviews ? (data.clicks / data.pageviews).toLocaleString('pt-BR', { style: 'percent', maximumFractionDigits: 1 }) : '—';
    byId('history').replaceChildren(...data.history.map(item => {
      const row = document.createElement('li');
      const text = document.createElement('span');
      text.textContent = item.url;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'secondary';
      button.textContent = 'Restaurar';
      button.onclick = () => {
        link.value = item.url;
        sessionStorage.setItem(draftKey, link.value);
        link.focus();
        status.textContent = 'Confira o convite e toque em Publicar link.';
      };
      row.append(text, button);
      return row;
    }));
    if (!data.history.length) byId('history').textContent = 'Nenhuma troca registrada.';
    login.hidden = true;
    dashboard.hidden = false;
    byId('logout').hidden = false;
    status.textContent = '';
  } catch (error) {
    if (current !== requestNumber) return;
    if (error.status === 401) {
      login.hidden = false;
      dashboard.hidden = true;
      byId('logout').hidden = true;
      status.textContent = '';
      return;
    }
    status.textContent = navigator.onLine ? error.message : 'Sem conexão. Reconecte para acessar o painel.';
  }
}

function submit(form, action) {
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (submitting) return;
    submitting = true;
    const button = form.querySelector('button');
    button.disabled = true;
    try {
      await action();
    } catch (error) {
      status.textContent = error.message;
    } finally {
      submitting = false;
      button.disabled = false;
    }
  });
}

submit(login, async () => {
  await api('login', { password: byId('password').value });
  login.reset();
  await refresh();
});
submit(byId('link-form'), async () => {
  await api('link', { url: link.value });
  sessionStorage.removeItem(draftKey);
  await refresh();
  status.textContent = 'Link publicado.';
});
link.addEventListener('input', () => sessionStorage.setItem(draftKey, link.value));
range.addEventListener('change', refresh);
window.addEventListener('online', refresh);
byId('logout').addEventListener('click', async () => {
  try {
    await api('logout', {});
    sessionStorage.removeItem(draftKey);
    await refresh();
  } catch (error) {
    status.textContent = error.message;
  }
});

function showToast(message, action) {
  byId('toast-text').textContent = message;
  toastAction.hidden = !action;
  toastAction.onclick = action || null;
  toast.hidden = false;
}

byId('toast-close').onclick = () => {
  toast.hidden = true;
  sessionStorage.setItem('webinar-install-dismissed', '1');
};
window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  installPrompt = event;
  if (sessionStorage.getItem('webinar-install-dismissed')) return;
  showToast('Instale o painel para abrir direto da tela inicial.', async () => {
    const prompt = installPrompt;
    installPrompt = undefined;
    toast.hidden = true;
    if (prompt) await prompt.prompt();
  });
});
window.addEventListener('appinstalled', () => { toast.hidden = true; });
if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !navigator.standalone && !sessionStorage.getItem('webinar-install-dismissed')) {
  showToast('Para instalar no iPhone, toque em Compartilhar e em Adicionar à Tela de Início.');
}

if ('serviceWorker' in navigator) {
  let hadController = !!navigator.serviceWorker.controller;
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController) { hadController = true; return; }
    if (reloading) return;
    reloading = true;
    showToast('Nova versão instalada. Atualizando o painel…');
    const reloadWhenIdle = () => {
      if (submitting || (!login.hidden && byId('password').value)) {
        setTimeout(reloadWhenIdle, 1500);
        return;
      }
      location.reload();
    };
    setTimeout(reloadWhenIdle, 2000);
  });
  navigator.serviceWorker.register('/painel/sw.js', { updateViaCache: 'none' }).then(registration => {
    const check = () => registration.update().catch(() => {});
    check();
    window.addEventListener('focus', check);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
    setInterval(() => { if (!document.hidden) check(); }, 60000);
  }).catch(() => {});
}

refresh();
