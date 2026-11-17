# Stock Researcher architecture

Stock Researcher is designed as a restricted-access research workspace with a public frontend codebase and private server-side services.

## High-level components

- **Frontend:** React + TypeScript application, charts and research interface.
- **Website hosting:** Cloudflare Pages.
- **Access control:** Cloudflare Access, with an allow-list for the intended users.
- **Private API:** Server-side service that owns provider integrations and analytical calculations.
- **Structured storage:** Relational database for normalized market/fundamental records and owner-scoped research metadata.
- **Object storage:** Private storage for filings, source documents and exports.

## Data separation

- Shared market/reference data and explicitly shared research may be reused within the authenticated workspace.
- Personal notes, watchlists, saved models, unpublished research and generated private files must be scoped to the authenticated owner.
- The browser receives only the data needed to render the requested view.
- Provider credentials and privileged calculations remain server-side.

## Repository boundary

This repository contains the frontend and public documentation. The backend source, local storage, secrets and private deployment configuration are maintained separately and must not be added to this public repository.

## Release principle

A cloud deployment is not considered production-ready until authentication, access policies for preview deployments, data ownership enforcement, provider compatibility, database migrations and end-to-end API tests have passed.
