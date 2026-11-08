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

O comando compila o Next.js em `out/` e publica os arquivos no Worker `gdm-aula`. O deploy provisiona o banco D1 do painel, se necessário. O Wrangler precisa estar autenticado na conta Cloudflare correta.

No painel Workers Builds, se conectar um repositório, use `npm run build` como comando de build e `npx wrangler deploy` como comando de deploy. A raiz do projeto é a pasta que contém `package.json` e `wrangler.jsonc`.

## Verificações

```sh
npm run build
npm run check
npx wrangler deploy --dry-run
```

## Conteúdo e horário

- O link do WhatsApp é publicado em `/painel/`. Antes da primeira publicação, vale o convite padrão do Worker.
- A próxima aula é sempre quinta-feira às 12h de Brasília (UTC−3), independentemente do fuso de quem acessa.
- Ao chegar no horário, o contador passa à próxima semana.
- Textos e identidade aproximada: `app/page.tsx`.
- Animações CSS: brilho pulsante e reflexo do botão, entrada dos elementos e movimento ambiente; respeitam `prefers-reduced-motion`.
- Cores e responsividade: `app/globals.css`.
- O logo original está em `public/gdm-logo.png`, preservado sem redesenho.
- A frase sobre o Vale do Silício foi mantida conforme a referência fornecida.

Esta página usa exportação estática do Next.js; o Workers serve HTML/CSS/JS e as interações rodam no navegador. O Worker atende as APIs do painel e registra os eventos sem SSR.

## Ativar o painel

Após o primeiro deploy autenticado, execute:

```sh
npx wrangler d1 migrations apply DB --remote
npx wrangler secret put PANEL_PASSWORD
```

Use uma senha longa e aleatória, guardada no seu gerenciador de senhas. Abra
`/painel/` no domínio do webinar e entre com essa senha. Trocar a senha invalida
as sessões anteriores. Nenhuma senha é armazenada no repositório.

Em desenvolvimento, execute `npm run build`, aplique a migração com
`npx wrangler d1 migrations apply DB --local`, defina `PANEL_PASSWORD` em
`.dev.vars` e execute `npm run preview`.

As métricas são agregadas por dia no horário de Brasília e começam a contar
após a ativação do banco. O histórico mostra até 14 convites anteriores.
Restaurar preenche o formulário para revisão antes de publicar.

O navegador verifica novas versões da PWA ao abrir, ao voltar para o painel
e a cada minuto em primeiro plano. A atualização é automática e preserva o
rascunho do convite. A PWA exige conexão para acessar métricas e publicar.
