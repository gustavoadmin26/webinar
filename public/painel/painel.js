const byId = id => document.getElementById(id);
const status = byId('status');
const login = byId('login');
const dashboard = byId('dashboard');
const link = byId('link');
const contentForm = byId('content-form');
let contentDirty = false;
const range = byId('range');
const toast = byId('toast');
const toastAction = byId('toast-action');
const counts = new Intl.NumberFormat('pt-BR');
let installPrompt;
let activeUrl;
let requestNumber = 0;
let submitting = false;
const draftKey = 'webinar-link-draft';
const designDefaults = {"countdown":{"font_family":"Arial","desktop_size":34,"mobile_size":28,"background":"#02162c","color":"#f8fbff"},"brand":{"font_family":"Arial","desktop_size":195,"mobile_size":141,"background":"transparent","color":"#ffffff"},"schedule":{"font_family":"Arial","desktop_size":27,"mobile_size":18,"background":"transparent","color":"#ff744d"},"title":{"font_family":"Arial","desktop_size":64,"mobile_size":36,"background":"transparent","color":"#00d8f5"},"intro":{"font_family":"Arial","desktop_size":30,"mobile_size":19,"background":"transparent","color":"#f8fbff"},"subtitle":{"font_family":"Arial","desktop_size":36,"mobile_size":18,"background":"transparent","color":"#f8fbff"},"cta":{"font_family":"Arial","desktop_size":32,"mobile_size":17,"background":"#12bd70","color":"#ffffff"},"footer":{"font_family":"Arial","desktop_size":22,"mobile_size":14,"background":"transparent","color":"#e2e9f1"}};
const designLabels = {"countdown":"Contagem regressiva","brand":"Logo","schedule":"Data / chamada","title":"Título principal","intro":"Texto de apoio","subtitle":"Subtítulo","cta":"Botão WhatsApp","footer":"Rodapé"};
const designFields = byId('design-fields');
designFields.innerHTML = Object.entries(designDefaults).map(([section, d]) => '<fieldset class="design-section"><legend>'+designLabels[section]+'</legend><div class="design-grid"><label>Fonte<select data-design="'+section+'" data-key="font_family"><option>Arial</option><option>Helvetica</option><option>Georgia</option><option>Verdana</option><option>Tahoma</option><option>Trebuchet MS</option><option>system-ui</option></select></label><label>Tamanho desktop (px)<input type="number" min="10" max="'+(section === 'brand' ? 240 : 100)+'" data-design="'+section+'" data-key="desktop_size"></label><label>Tamanho celular (px)<input type="number" min="10" max="'+(section === 'brand' ? 240 : 100)+'" data-design="'+section+'" data-key="mobile_size"></label><label>Fundo (#hex ou transparent)<input type="text" maxlength="16" data-design="'+section+'" data-key="background"></label><label>Cor do texto (#hex)<input type="text" maxlength="7" data-design="'+section+'" data-key="color"></label></div></fieldset>').join('');
function readDesign() { const result = {}; for (const [section, base] of Object.entries(designDefaults)) { result[section] = { ...base }; designFields.querySelectorAll('[data-design="'+section+'"]').forEach(input => { result[section][input.dataset.key] = input.type === 'number' ? Number(input.value) : input.value; }); } return result; }
function fillDesign(value) { const design = value || designDefaults; designFields.querySelectorAll('[data-design]').forEach(input => { const d = design[input.dataset.design] || designDefaults[input.dataset.design]; input.value = d[input.dataset.key] ?? designDefaults[input.dataset.design][input.dataset.key]; }); }

async function api(route, body) {
  const options = { cache: 'no-store' };
  if (body !== undefined) {
    options.method = 'POST';
    options.headers = { 'Content-Type': 'application/json' };
    options.body = JSON.stringify(body);
  }
  const response = await fetch('/painel/api/' + route, options);
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(result.error || 'O servidor recusou a operação (HTTP ' + response.status + ').'), { status: response.status });
  if (!result || typeof result !== 'object') throw new Error('O servidor retornou uma resposta inválida.');
  return result;
}

async function refresh() {
  const current = ++requestNumber;
  try {
    const data = await api('dashboard?days=' + range.value);
    if (current !== requestNumber) return;
    activeUrl = data.url;
    if (data.content && !contentDirty) {
      byId('content-date').value = data.content.event_date || '';
      byId('content-title').value = (data.content.title || '').replace(/™/g, '').trim();
      byId('content-subtitle').value = data.content.subtitle || '';
      byId('content-text').value = data.content.body_text || '';
      byId('content-cta').value = data.content.cta || 'Entrar no grupo de WhatsApp';
      byId('content-footer').value = data.content.footer || '';
      fillDesign(data.content.design);
    }
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
    if (!form.checkValidity()) {
      const invalidField = form.querySelector(':invalid');
      const fieldLabel = invalidField
        ? (invalidField.labels?.[0]?.textContent || invalidField.closest('label')?.textContent || invalidField.closest('fieldset')?.querySelector('legend')?.textContent || invalidField.name || invalidField.id || 'campo sem identificação').replace(/\\s+/g, ' ').trim()
        : 'campo não identificado';
      status.dataset.state = 'error';
      status.textContent = 'Campo com problema: ' + fieldLabel + '. Preencha ou corrija esse campo e tente salvar novamente.';
      if (invalidField) {
        invalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        invalidField.focus({ preventScroll: true });
        invalidField.reportValidity();
      }
      return;
    }
    const button = form.querySelector('button[type="submit"], button:not([type])');
    const originalLabel = button?.textContent;
    submitting = true;
    if (button) {
      button.disabled = true;
      if (form === contentForm) button.textContent = 'Salvando…';
      else if (form.id === 'link-form') button.textContent = 'Publicando…';
    }
    status.dataset.state = 'pending';
    status.textContent = 'Enviando alterações e aguardando confirmação do servidor…';
    try {
      await action();
    } catch (error) {
      status.dataset.state = 'error';
      status.textContent = error.message || 'Não foi possível salvar. Tente novamente.';
    } finally {
      submitting = false;
      if (button) {
        button.disabled = false;
        button.textContent = originalLabel;
      }
    }
  });
}

submit(login, async () => {
  await api('login', { password: byId('password').value });
  login.reset();
  await refresh();
});
contentForm.addEventListener('input', () => { contentDirty = true; });
submit(contentForm, async () => {
  const content = {
    event_date: byId('content-date').value,
    title: byId('content-title').value,
    subtitle: byId('content-subtitle').value,
    body_text: byId('content-text').value,
    cta: byId('content-cta').value,
    footer: byId('content-footer').value,
    design: readDesign()
  };
  const result = await api('content', content);
  if (!result.content) throw new Error('O servidor não confirmou a gravação do conteúdo. Nenhuma confirmação foi exibida.');
  contentDirty = false;
  await refresh();
  status.dataset.state = 'success';
  status.textContent = '✓ Conteúdo salvo no banco e publicado na página.';
});
submit(byId('link-form'), async () => {
  const result = await api('link', { url: link.value });
  if (!result.url) throw new Error('O servidor não confirmou a gravação do link.');
  sessionStorage.removeItem(draftKey);
  await refresh();
  status.dataset.state = 'success';
  status.textContent = '✓ Link salvo e publicado.';
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
