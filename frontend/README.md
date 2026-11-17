# Stock Researcher frontend

React + TypeScript + Vite frontend. The browser calls `/api/*` on the same origin.

- Local Vite development defaults to `http://127.0.0.1:8000` (the local FastAPI API).
- Cloudflare Pages production uses `functions/api/[[path]].ts` to forward same-origin API calls through the `API` Service Binding to the private Worker.
- The Pages hostname must be protected by Cloudflare Access. The Pages Function forwards the authenticated email as a server-created identity header; it overwrites any browser-supplied value.

Cloudflare Pages build: `npm run build`; output directory: `dist`.
