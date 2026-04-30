# ⚙️ CODEX — DevOps (CI/CD, Docker, Secrets)

> **Cuándo leer este MD:** Al inicializar un proyecto, configurar CI/CD, trabajar con Docker, gestionar variables de entorno o preparar un deployment.

---

## 🚀 Commit 0 — Lo que va SIEMPRE desde el primer commit

Estas configuraciones deben existir antes de escribir una sola línea de lógica:

```bash
# Estructura mínima desde commit 0
project/
├── .env.example        ← Variables con valores de ejemplo (SIN valores reales)
├── .env                ← Variables reales (en .gitignore, NUNCA se commitea)
├── .gitignore          ← node_modules, .env, dist, logs, coverage
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🚫 .gitignore — Completo

```gitignore
# Dependencies
node_modules/
.pnp
.pnp.js

# Build
dist/
build/
.next/
out/

# Environment
.env
.env.local
.env.*.local
!.env.example        # ← .env.example SÍ se commitea

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*

# Testing
coverage/
.nyc_output/
playwright-report/
test-results/
cucumber-report.html

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Docker
.docker/

# Misc
*.tgz
.cache/
```

---

## 🔐 Variables de Entorno

### .env.example (commitear esto)

```bash
# App
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# Auth
JWT_SECRET=GENERATE_WITH_crypto.randomBytes_32_hex
JWT_REFRESH_SECRET=ANOTHER_DIFFERENT_SECRET_32_bytes_minimum

# Security
ALLOWED_ORIGINS=http://localhost:5173,https://yourdomain.com
ENCRYPTION_KEY=GENERATE_WITH_crypto.randomBytes_32_hex_64chars

# External services (examples)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=

SENTRY_DSN=

# Generar secrets:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Validación con Zod (fail-fast)

```typescript
// src/shared/config/env.ts
import { z } from 'zod'
import dotenv from 'dotenv'

dotenv.config()

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().transform(Number).pipe(z.number().positive().max(65535)),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 chars'),
  JWT_REFRESH_SECRET: z.string().min(32),
  ALLOWED_ORIGINS: z.string().default('http://localhost:5173'),
  ENCRYPTION_KEY: z.string().length(64).optional(),
  SENTRY_DSN: z.string().url().optional(),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('❌ Invalid environment variables:')
  console.error(parsed.error.flatten().fieldErrors)
  process.exit(1)  // La app NO arranca con config inválida
}

export const env = parsed.data
export type Env = typeof env
```

---

## 🐳 Docker

### Dockerfile (producción)

```dockerfile
# ---- Build stage ----
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production=false

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---- Production stage ----
FROM node:20-alpine AS runner

WORKDIR /app

# Non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY --from=builder /app/dist ./dist

USER nodejs

EXPOSE 3000

CMD ["node", "dist/main.js"]
```

### docker-compose.yml (desarrollo local)

```yaml
version: '3.9'

services:
  app:
    build:
      context: .
      target: builder
    command: npm run dev
    ports:
      - '3000:3000'
    env_file:
      - .env
    volumes:
      - ./src:/app/src
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: ${DB_NAME:-appdb}
      POSTGRES_USER: ${DB_USER:-postgres}
      POSTGRES_PASSWORD: ${DB_PASS:-postgres}
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U postgres']
      interval: 5s
      timeout: 5s
      retries: 5

  db_test:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: appdb_test
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - '5433:5432'     # Puerto distinto para no pisar la BD de dev

volumes:
  postgres_data:
```

---

## 🔄 GitHub Actions — CI Pipeline

### Pipeline básico (todo proyecto)

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    name: Lint, Build & Test
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: testdb
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npm run typecheck

      - name: Run tests
        run: npm run test:coverage
        env:
          NODE_ENV: test
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/testdb
          JWT_SECRET: test-secret-minimum-32-characters-long
          JWT_REFRESH_SECRET: test-refresh-secret-minimum-32-chars
          ALLOWED_ORIGINS: http://localhost:3000

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          fail_ci_if_error: false

  security:
    name: Security Audit
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - name: Audit dependencies
        run: npm audit --audit-level=high
```

### Pipeline con deployment (CD)

```yaml
# .github/workflows/cd.yml
name: CD

on:
  push:
    branches: [main]

jobs:
  deploy:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: []    # Poner aquí el job de CI si quieres que dependa de él

    steps:
      - uses: actions/checkout@v4

      - name: Build Docker image
        run: docker build -t myapp:${{ github.sha }} .

      - name: Push to registry
        run: |
          echo ${{ secrets.REGISTRY_TOKEN }} | docker login registry.example.com -u user --password-stdin
          docker tag myapp:${{ github.sha }} registry.example.com/myapp:latest
          docker push registry.example.com/myapp:latest

      - name: Deploy to VPS
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /app
            docker pull registry.example.com/myapp:latest
            docker compose up -d --no-deps app
```

---

## 📦 package.json — Scripts Estándar

```json
{
  "scripts": {
    "dev": "tsx watch src/main.ts",
    "build": "tsc --noEmit false",
    "start": "node dist/main.js",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "format": "prettier --write src",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:integration": "vitest run tests/integration",
    "test:e2e": "playwright test",
    "test:bdd": "cucumber-js",
    "db:migrate": "prisma migrate dev",
    "db:push": "prisma db push",
    "db:seed": "tsx src/infrastructure/database/seed.ts",
    "db:studio": "prisma studio",
    "audit": "npm audit --audit-level=high"
  }
}
```

---

## 🔧 tsconfig.json — Estricto

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

---

## 📝 ESLint + Prettier

```bash
npm install -D eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser prettier eslint-config-prettier
```

```javascript
// .eslintrc.js
module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'prettier',
  ],
  parserOptions: {
    project: './tsconfig.json',
  },
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    'no-console': ['warn', { allow: ['error'] }],
  },
}
```

```json
// .prettierrc
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2
}
```

---

## 🔒 Secrets en GitHub Actions

Regla: **NUNCA** hardcodear secrets en los workflows. Usar siempre `${{ secrets.NAME }}`.

```yaml
# Secretos que todo proyecto necesita en GitHub Settings > Secrets:
# VPS_HOST          → IP o dominio del servidor
# VPS_USER          → Usuario SSH
# VPS_SSH_KEY       → Clave privada SSH (sin passphrase)
# REGISTRY_TOKEN    → Token del registro de Docker
# CODECOV_TOKEN     → Token de Codecov (opcional)
# SENTRY_DSN        → DSN de Sentry (opcional)
```

Para el servidor en producción, los secrets van en:
- Variables del sistema (`/etc/environment`)
- Secret manager del cloud provider (AWS Secrets Manager, etc.)
- Docker secrets
- **NUNCA** en el docker-compose.yml commiteado

---

## ✅ Checklist DevOps por Fase

### Commit 0
- [ ] `.gitignore` con `.env`, `node_modules`, `dist`, `logs`, `coverage`
- [ ] `.env.example` con todas las variables (sin valores reales)
- [ ] `tsconfig.json` con `strict: true`
- [ ] Scripts en `package.json` (dev, build, test, lint)
- [ ] Validación de env con Zod en `src/shared/config/env.ts`

### Antes del primer deployment
- [ ] Dockerfile con multi-stage build
- [ ] `docker-compose.yml` para desarrollo local
- [ ] GitHub Actions CI pipeline (lint + typecheck + tests)
- [ ] `npm audit` sin vulnerabilidades críticas/altas

### Producción
- [ ] Secrets en GitHub Secrets (nunca en código)
- [ ] CD pipeline configurado
- [ ] HTTPS activo (certificado Let's Encrypt)
- [ ] Variables de entorno en el servidor (no en docker-compose)
- [ ] Monitoring activo (Sentry o similar)
- [ ] Logs persistentes fuera del contenedor

---

**Versión:** 1.0  
**Actualizado:** 2026-04-29
