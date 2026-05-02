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

## CI/CD

Pushes to `main` trigger the GitHub Actions deploy workflow.

The workflow does the following:

1. Installs dependencies with `npm ci`
2. Runs API tests with `npm test --workspace=apps/api`
3. Builds the API with `npm run build --workspace=apps/api`
4. Deploys the API to the VPS over SSH and restarts `ireland-bus-api` with `pm2`
5. Builds the frontend with `npm run build --workspace=apps/web`
6. Deploys the frontend to Cloudflare Pages

Required GitHub Actions secrets:

- `VPS_HOST`
- `VPS_USER`
- `VPS_SSH_KEY`
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Remote repository name: `Bus-Tracker-v3-`.
