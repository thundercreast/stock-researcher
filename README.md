# Stock Researcher

A restricted-access equity research terminal for US and Indian equities.

This **public repository contains the frontend and non-sensitive project documentation only**. Backend implementation, provider credentials, local databases, cached market data, personal research and unpublished analysis are maintained outside this repository.

## Stack

- React, TypeScript and Vite
- TradingView Lightweight Charts
- Cloudflare Pages for the frontend
- Cloudflare Access for sign-in and access restriction
- A separately deployed private API and managed data services

## Security boundary

A public repository exposes every committed file and its complete Git history. The browser bundle is also inspectable. Therefore:

- Never commit API keys, tokens, passwords, database files, exports or private research.
- Never put provider credentials or privileged calculations in frontend code or `VITE_*` variables.
- Keep backend implementation in a separate private location.
- Keep personal notes, watchlists, saved valuation assumptions and unpublished analyses owner-scoped in the backend.
- Protect production and preview website deployments with Cloudflare Access.

See [Architecture](docs/ARCHITECTURE.md) for the public, high-level system design.

## Local frontend development

Requirements: Node.js 20+ and npm.

```bash
cd frontend
npm install
npm run dev
```

During local development, the frontend uses the local FastAPI API at `http://127.0.0.1:8000`. The hosted frontend uses same-origin `/api/*` requests through a Cloudflare Pages Function.

## Current status

The local application includes historical market data, technical indicators and normalized fundamental statement views. The hosted API migration is still in progress; do not consider the cloud deployment production-ready until all required routes, access controls, data ownership checks and provider integrations have been tested.

For research and educational use only. Market data may be delayed, incomplete or subject to provider terms. Nothing here is investment advice.
