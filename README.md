# GDM Company — Aula gratuita

Landing page em Next.js (App Router), React e TypeScript, responsiva e preparada para Cloudflare Workers Static Assets.

## Rodar localmente

Requer Node.js 22 ou superior.

```sh
npm ci
npm run dev
```

## Publicar diretamente no Cloudflare Workers

```sh
npx wrangler login
npm run deploy
```

O comando compila o Next.js em `out/` e publica os arquivos no Worker `gdm-aula`. Não precisa de GitHub Actions, banco de dados ou secrets da aplicação. O Wrangler precisa estar autenticado na conta Cloudflare correta.

No painel Workers Builds, se conectar um repositório, use `npm run build` como comando de build e `npx wrangler deploy` como comando de deploy. A raiz do projeto é a pasta que contém `package.json` e `wrangler.jsonc`.

## Verificações

```sh
npm run build
npm run check
npx wrangler deploy --dry-run
```

## Conteúdo e horário

- Link do WhatsApp: constante `WHATSAPP` em `app/page.tsx`.
- A próxima aula é sempre quinta-feira às 12h de Brasília (UTC−3), independentemente do fuso de quem acessa.
- Ao chegar no horário, o contador passa à próxima semana.
- Textos e identidade aproximada: `app/page.tsx`.
- Animações CSS: brilho pulsante e reflexo do botão, entrada dos elementos e movimento ambiente; respeitam `prefers-reduced-motion`.
- Cores e responsividade: `app/globals.css`.
- O logo original está em `public/gdm-logo.png`, preservado sem redesenho.
- A frase sobre o Vale do Silício foi mantida conforme a referência fornecida.

Esta página usa exportação estática do Next.js; o Workers serve HTML/CSS/JS e as interações rodam no navegador. Não há SSR ou rotas de API nesta implementação.
