const defaultLink = 'https://chat.whatsapp.com/LneJSfjsBHq1RJG8RINFIa?s=cl&p=i&mlu=4&ilr=4&iam=2';
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
    const [totals, history] = await env.DB.batch([
      env.DB.prepare('SELECT COALESCE(SUM(pageviews), 0) AS pageviews, COALESCE(SUM(clicks), 0) AS clicks FROM daily_metrics WHERE day BETWEEN ? AND ?').bind(start.toISOString().slice(0, 10), today),
      env.DB.prepare('SELECT id, url, created_at FROM whatsapp_links ORDER BY id DESC LIMIT 15'),
    ]);
    const links = history.results;
    if (links.length < 15) links.push({ id: 0, url: defaultLink, created_at: null });
    return json({ ...totals.results[0], url: links[0].url, history: links.slice(1) });
  }
  return json({ error: 'Rota indisponível.' }, 404);
}

export default {
  async fetch(request, env, context) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, '') || '/';
    try {
      if (path.startsWith('/painel/api/')) return await panelApi(request, env, path);
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
