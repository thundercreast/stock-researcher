# Stock Researcher

Restricted-access equity research terminal for US and Indian equities. This public repository is intended to contain the frontend and non-sensitive documentation only. Backend implementation, credentials, local databases, cached market data and personal research must remain outside this repository.

## Stack
- React, TypeScript and Vite
- TradingView Lightweight Charts
- Cloudflare Pages for frontend hosting
- Cloudflare Access for authentication
- Private API service behind a Cloudflare Pages Service Binding

## Security
A public repository exposes every committed file and its Git history. Browser code is also inspectable. Never commit API keys, tokens, passwords, databases, provider caches, private research or backend source. Never put privileged values in frontend code or `VITE_*` variables. Protect production and preview deployments with Cloudflare Access. Keep all personal research owner-scoped in the server-side data layer.

## Current status
The local application is under active development. Cloud hosting is not production-ready until the private API, access controls, data ownership, provider compatibility and end-to-end tests are complete.

For research and educational use only. Market data may be delayed or incomplete and is subject to provider terms. Nothing here is investment advice.
