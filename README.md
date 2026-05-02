# Ireland Bus Tracking

Monorepo scaffold with:

- `apps/api`: Express + TypeScript backend
- `apps/web`: React + Vite + TypeScript frontend
- `packages/shared`: shared Zod schemas

## Quick start

1. Copy `apps/api/.env.example` to `apps/api/.env`
2. Install dependencies with `npm install`
3. Run the API with `npm run dev --workspace @bus-tracker/api`
4. Run the web app with `npm run dev --workspace @bus-tracker/web`

The API refuses to start if any required environment variable is missing or invalid.

CI deploy workflow is configured to run on pushes to `main`.

Remote repository name: `Bus-Tracker-v3-`.
