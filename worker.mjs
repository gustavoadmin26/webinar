const defaultLink = 'https://chat.whatsapp.com/LneJSfjsBHq1RJG8RINFIa?s=cl&p=i&mlu=4&ilr=4&iam=2';
const defaultContent = {
  event_date: 'QUINTA-FEIRA, ÀS 12H | AULA AO VIVO E GRATUITA',
  title: 'ARQUITETURA DE CRESCIMENTO',
  subtitle: 'Os 5 passos para atrair mais clientes, vender mais e fazer sua empresa crescer.',
  body_text: 'Sua empresa não precisa apenas de mais clientes. Precisa de um método para crescer.',
  cta: 'Entrar no grupo de WhatsApp',
  footer: 'Ao vivo pelo Google Meet | 45 a 60 minutos'
};
const defaultDesign = {"countdown":{"font_family":"Arial","desktop_size":34,"mobile_size":28,"background":"#02162c","color":"#f8fbff"},"brand":{"font_family":"Arial","desktop_size":195,"mobile_size":141,"background":"transparent","color":"#ffffff"},"schedule":{"font_family":"Arial","desktop_size":27,"mobile_size":18,"background":"transparent","color":"#ff744d"},"title":{"font_family":"Arial","desktop_size":64,"mobile_size":36,"background":"transparent","color":"#00d8f5"},"intro":{"font_family":"Arial","desktop_size":30,"mobile_size":19,"background":"transparent","color":"#f8fbff"},"subtitle":{"font_family":"Arial","desktop_size":36,"mobile_size":18,"background":"transparent","color":"#f8fbff"},"cta":{"font_family":"Arial","desktop_size":32,"mobile_size":17,"background":"#12bd70","color":"#ffffff"},"footer":{"font_family":"Arial","desktop_size":22,"mobile_size":14,"background":"transparent","color":"#e2e9f1"}};
const designSections = Object.keys(defaultDesign);
const sessionCookie = '__Host-webinar-panel';
const encoder = new TextEncoder();
const formatDay = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo' });

function json(body, status = 200, headers = {}) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store', ...headers } });
}

function sessionKey(password) {
  return crypto.subtle.importKey('raw', encoder.encode(password), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

async function sign(key, message) {
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

async function isSigned(key, message, signature) {
  try {
    return await crypto.subtle.verify('HMAC', key, Uint8Array.from(atob(signature), c => c.charCodeAt(0)), encoder.encode(message));
  } catch {
    return false;
  }
}

function cookie(value, maxAge) {
  return sessionCookie + '=' + value + '; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=' + maxAge;
}

async function signedIn(request, key) {
  const token = request.headers.get('Cookie')?.split('; ').find(value => value.startsWith(sessionCookie + '='))?.slice(sessionCookie.length + 1);
  const [expiry, signature] = (token || '').split('.');
  return /^\d+$/.test(expiry) && Number(expiry) > Date.now() && !!signature && await isSigned(key, 'session:' + expiry, signature);
}

async function record(db, event) {
  await db.prepare(`
    INSERT INTO daily_metrics (day, pageviews, clicks) VALUES (?, ?, ?)
    ON CONFLICT(day) DO UPDATE SET
      pageviews = pageviews + excluded.pageviews,
      clicks = clicks + excluded.clicks
  `).bind(formatDay.format(new Date()), Number(event === 'view'), Number(event === 'click')).run();
}

function validInvite(value) {
  if (typeof value !== 'string' || value.length > 1024) return null;
  try {
    const url = new URL(value.trim());
    if (url.origin !== 'https://chat.whatsapp.com' || url.username || url.password || !/^\/[a-zA-Z0-9]+\/?$/.test(url.pathname)) return null;
    url.hash = '';
    return url.href;
  } catch {
    return null;
  }
}

async function activeLink(db) {
  return (await db.prepare('SELECT url FROM whatsapp_links ORDER BY id DESC LIMIT 1').first())?.url || defaultLink;
}


function safeDesign(value) {
  let parsed = {};
  try { parsed = typeof value === 'string' ? JSON.parse(value) : value || {}; } catch {}
  const result = {};
  for (const section of designSections) {
    const source = parsed?.[section] || {};
    const base = defaultDesign[section];
    const validColor = v => typeof v === 'string' && (/^#[0-9a-fA-F]{6}$/.test(v) || v === 'transparent') ? v : null;
    const font = ['Arial','Helvetica','Georgia','Verdana','Tahoma','Trebuchet MS','system-ui'].includes(source.font_family) ? source.font_family : base.font_family;
    const size = (v, fallback) => Number.isFinite(Number(v)) && Number(v) >= 10 && Number(v) <= 100 ? Math.round(Number(v)) : fallback;
    result[section] = { font_family: font, desktop_size: size(source.desktop_size, base.desktop_size), mobile_size: size(source.mobile_size, base.mobile_size), background: validColor(source.background) || base.background, color: validColor(source.color) || base.color };
  }
  return result;
}
function activeContent(db) {
  return db.prepare('SELECT event_date, title, subtitle, body_text, cta, footer, design_json FROM site_content WHERE id = 1').first()
    .then(row => row ? ({ ...defaultContent, ...row, title: String(row.title || defaultContent.title).replace(/™/g, '').trim(), design: safeDesign(row.design_json) }) : ({ ...defaultContent, design: defaultDesign }));
}
function validContent(body) {
  const fields = ['event_date','title','subtitle','body_text','cta','footer'];
  const limits = [180,180,300,500,100,220];
  if (!body || fields.some((field, i) => typeof body[field] !== 'string' || !body[field].trim() || body[field].length > limits[i])) return null;
  return { ...Object.fromEntries(fields.map(field => [field, body[field].trim()])), design: safeDesign(body.design) };
}

async function panelApi(request, env, path) {
  if (request.method !== 'GET' && request.headers.get('Origin') !== new URL(request.url).origin) return json({ error: 'Origem inválida.' }, 403);
  if (!env.PANEL_PASSWORD || !env.DB) return json({ error: 'Painel ainda não configurado.' }, 503);

  const key = await sessionKey(env.PANEL_PASSWORD);
  if (path === '/painel/api/login' && request.method === 'POST') {
    const body = await request.json().catch(() => ({}));
    if (typeof body?.password !== 'string' || body.password.length > 256 ||
        !await isSigned(key, 'login:' + body.password, await sign(key, 'login:' + env.PANEL_PASSWORD))) {
      return json({ error: 'Senha incorreta.' }, 401);
    }
    const duration = 12 * 60 * 60;
    const expiry = String(Date.now() + duration * 1000);
    const token = expiry + '.' + await sign(key, 'session:' + expiry);
    return json({ ok: true }, 200, { 'Set-Cookie': cookie(token, duration) });
  }
  if (!await signedIn(request, key)) return json({ error: 'Faça login para continuar.' }, 401);
  if (path === '/painel/api/logout' && request.method === 'POST') return json({ ok: true }, 200, { 'Set-Cookie': cookie('', 0) });

  if (path === '/painel/api/content' && request.method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const content = validContent(body);
    if (!content) return json({ error: 'Confira os campos: todos são obrigatórios e devem respeitar os limites de caracteres.' }, 400);
    await env.DB.prepare(`
      INSERT INTO site_content (id, event_date, title, subtitle, body_text, cta, footer, design_json, updated_at)
      VALUES (1, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        event_date = excluded.event_date,
        title = excluded.title,
        subtitle = excluded.subtitle,
        body_text = excluded.body_text,
        cta = excluded.cta,
        footer = excluded.footer,
        design_json = excluded.design_json,
        updated_at = CURRENT_TIMESTAMP
    `).bind(content.event_date, content.title, content.subtitle, content.body_text, content.cta, content.footer, JSON.stringify(content.design)).run();
    const savedContent = await activeContent(env.DB);
    if (!savedContent) return json({ error: 'O banco não confirmou a gravação. Tente novamente.' }, 503);
    return json({ ok: true, content: savedContent });
  }

  if (path === '/painel/api/link' && request.method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const url = validInvite(body?.url);
    if (!url) return json({ error: 'Informe um convite https://chat.whatsapp.com/ válido.' }, 400);
    await env.DB.prepare(`
      INSERT INTO whatsapp_links (url)
      SELECT ? WHERE ? <> COALESCE((SELECT url FROM whatsapp_links ORDER BY id DESC LIMIT 1), ?)
    `).bind(url, url, defaultLink).run();
    return json({ url });
  }

  if (path === '/painel/api/dashboard' && request.method === 'GET') {
    const days = Number(new URL(request.url).searchParams.get('days'));
    const range = [1, 7, 30].includes(days) ? days : 7;
    const today = formatDay.format(new Date());
    const start = new Date(today + 'T00:00:00Z');
    start.setUTCDate(start.getUTCDate() - range + 1);
    const [totals, history, content] = await env.DB.batch([
      env.DB.prepare('SELECT COALESCE(SUM(pageviews), 0) AS pageviews, COALESCE(SUM(clicks), 0) AS clicks FROM daily_metrics WHERE day BETWEEN ? AND ?').bind(start.toISOString().slice(0, 10), today),
      env.DB.prepare('SELECT id, url, created_at FROM whatsapp_links ORDER BY id DESC LIMIT 15'),
      env.DB.prepare('SELECT event_date, title, subtitle, body_text, cta, footer, design_json FROM site_content WHERE id = 1')
    ]);
    const links = history.results;
    if (links.length < 15) links.push({ id: 0, url: defaultLink, created_at: null });
    const saved = content.results?.[0];
    const currentContent = saved ? { ...defaultContent, ...saved, title: String(saved.title || defaultContent.title).replace(/™/g, '').trim(), design: safeDesign(saved.design_json) } : { ...defaultContent, design: defaultDesign };
    return json({ ...totals.results[0], url: links[0].url, history: links.slice(1), content: currentContent });
  }
  return json({ error: 'Rota indisponível.' }, 404);
}

export default {
  async fetch(request, env, context) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, '') || '/';
    try {
      if (path.startsWith('/painel/api/')) return await panelApi(request, env, path);
      if (path === '/conteudo' && request.method === 'GET') {
        const content = env.DB ? await activeContent(env.DB).catch(() => ({ ...defaultContent, design: defaultDesign })) : ({ ...defaultContent, design: defaultDesign });
        return json(content, 200, { 'Access-Control-Allow-Origin': url.origin });
      }
      if (path === '/eventos/visualizacao' && request.method === 'POST') {
        if (request.headers.get('Origin') !== url.origin && request.headers.get('Sec-Fetch-Site') !== 'same-origin') return json({ error: 'Origem inválida.' }, 403);
        if (env.DB) context.waitUntil(record(env.DB, 'view').catch(console.error));
        return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
      }
      if (path === '/ir/whatsapp' && ['GET', 'HEAD'].includes(request.method)) {
        let link = defaultLink;
        if (env.DB) {
          link = await activeLink(env.DB).catch(() => defaultLink);
          if (request.method === 'GET' && !request.headers.get('Sec-Purpose')?.includes('prefetch')) {
            context.waitUntil(record(env.DB, 'click').catch(console.error));
          }
        }
        return new Response(null, { status: 302, headers: { Location: link, 'Cache-Control': 'no-store' } });
      }
      return env.ASSETS.fetch(request);
    } catch (error) {
      console.error(error);
      return json({ error: 'Não foi possível concluir a operação. Confira a configuração e tente novamente.' }, 503);
    }
  },
};
