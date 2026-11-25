# Almeriq frontend

This directory contains the React 19 single-page application built with Vite 8, React Router and Tailwind CSS.

## Development

From this directory:

```bash
cp .env.example .env
npm ci
npm run dev
```

Set `VITE_API_BASE_URL=http://localhost:8000` in `.env` when using the local FastAPI backend.

## Available scripts

- `npm run dev` — start the Vite development server.
- `npm run build` — create the production build in `dist/`.
- `npm run preview` — serve the production build locally.
- `npm run lint` — run ESLint.
- `npm test` — run Vitest.

The scripts and dependency versions are defined in [package.json](package.json); the production bundling configuration is in [vite.config.js](vite.config.js).

## Source layout

- `src/App.jsx` — route registry, lazy imports and route composition.
- `src/Pages/` — route-level screens grouped by product area.
- `src/components/` — shared layout, navigation and UI.
- `src/context/` — shared application state providers.
- `src/hooks/` — feature workflows and server-state orchestration.
- `src/lib/client.js` and `src/lib/api/` — shared HTTP transport and domain API functions.

For full local setup, environment variables, API configuration and deployment notes, use the repository [Setup and operations guide](../docs/SETUP_AND_OPERATIONS.md). For the source map across all maintained docs, see [Documentation source map](../docs/SOURCE_OF_TRUTH.md).
