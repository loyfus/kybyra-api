# Kybyra API

Backend Node.js + Express + Prisma + PostgreSQL/PostGIS para o app Kybyra.

## Pré-requisitos

- Node.js 20+
- Docker Desktop (para Postgres+PostGIS local) — ou um Postgres remoto (ex.: Neon free tier).

## Setup

```powershell
npm install
copy .env.example .env

# Subir Postgres local (quando Docker estiver disponível)
npm run db:up

# Gerar client Prisma
npm run prisma:generate

# Rodar migrações
npm run prisma:migrate

# Iniciar em modo dev (hot reload)
npm run dev
```

A API sobe em `http://localhost:3000`.

- `GET /health` — healthcheck (verifica conexão com banco).

## Scripts

| Comando | Descrição |
|---|---|
| `npm run dev` | Roda em modo desenvolvimento com hot reload (tsx watch). |
| `npm run build` | Compila TypeScript para `dist/`. |
| `npm run start` | Roda a build de produção. |
| `npm run typecheck` | Verifica tipos sem emitir. |
| `npm run lint` | Roda ESLint. |
| `npm run format` | Roda Prettier. |
| `npm test` | Roda testes Jest. |
| `npm run prisma:migrate` | Cria/aplica migrações no banco de dev. |
| `npm run prisma:studio` | Abre Prisma Studio (UI do banco). |
| `npm run db:up` / `db:down` | Sobe/derruba Postgres via Docker Compose. |

## Estrutura

```
src/
  config/        # env, logger, prisma, sentry
  middleware/    # auth, errorHandler, validate, rateLimit
  modules/
    health/
    auth/        # (próxima sprint)
    cars/        # (próxima sprint)
    stations/    # (próxima sprint)
  utils/
  app.ts         # builder do app Express
  server.ts      # bootstrap
prisma/
  schema.prisma
  seed.ts
```

## Variáveis de ambiente

Veja `.env.example`. As principais:

- `DATABASE_URL` — string de conexão Postgres (com extensão `postgis` habilitada).
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` — segredos JWT (use strings longas e aleatórias em produção).
- `CORS_ORIGINS` — origens permitidas (CSV).
- `OCM_API_KEY` — chave da [Open Charge Map](https://openchargemap.org/site/develop/api).
- `SENTRY_DSN` — opcional; deixe vazio para desabilitar.

## Deploy na Vercel

O backend está configurado para rodar como **Serverless Functions** na Vercel.

### Pré-requisitos

- Conta na [Vercel](https://vercel.com)
- Banco PostgreSQL acessível remotamente (ex: [Neon](https://neon.tech), [Supabase](https://supabase.com))
- CLI da Vercel instalada: `npm i -g vercel`

### Variáveis de ambiente na Vercel

Configure no dashboard ou via CLI:

```powershell
vercel env add DATABASE_URL production
vercel env add JWT_ACCESS_SECRET production
vercel env add JWT_REFRESH_SECRET production
vercel env add CORS_ORIGINS production
```

Valores mínimos obrigatórios:

- `DATABASE_URL` — string de conexão do Postgres remoto.
- `JWT_ACCESS_SECRET` — mínimo 16 caracteres.
- `JWT_REFRESH_SECRET` — mínimo 16 caracteres.

Opcionais:

- `CORS_ORIGINS` — origens permitidas (CSV; ex: `https://seu-app.vercel.app`).
- `SENTRY_DSN` — deixe vazio para desabilitar.
- `OCM_API_KEY` — chave da Open Charge Map.

### Deploy

```powershell
cd Api
vercel --prod
```

### Como funciona

- O entry point é `api/index.ts`, que usa `serverless-http` para adaptar o app Express ao formato de Serverless Functions da Vercel.
- O `vercel.json` redireciona todas as rotas para `api/index.ts`.
- O `postinstall` gera o Prisma Client automaticamente após `npm install` no build da Vercel.
- O `.vercelignore` exclui arquivos desnecessários (`data/`, `scripts/`, `tests/`, `uploads/`) para reduzir o bundle.

### Limitações do serverless

- **Arquivos estáticos (`/uploads`)**: a Vercel Functions não serve arquivos locais de forma persistente. As imagens dos carros devem ser hospedadas externamente (ex: Cloudinary, AWS S3 + CDN) ou o endpoint `/uploads` deve apontar para um storage remoto.
- **Rate limiting**: `express-rate-limit` funciona, mas o contador é reiniciado a cada cold start. Para rate limiting distribuído, use Redis (ex: Upstash Redis).
- **Banco de dados**: conexões do Prisma são reutilizadas dentro da mesma função, mas cada instância serverless mantém seu próprio pool. Monitore o número de conexões abertas no Postgres.

## Notas

- Atribuição obrigatória aos provedores de dados (Open Charge Map, OpenEV Data) nas telas correspondentes do app.
- LGPD: endpoints de exclusão de conta e exportação de dados são previstos na Sprint 1.
