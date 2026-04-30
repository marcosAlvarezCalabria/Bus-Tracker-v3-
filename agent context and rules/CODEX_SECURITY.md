# 🔒 CODEX — Security (OWASP Top 10)

> **Cuándo leer este MD:** Al implementar autenticación, validar inputs, escribir queries, configurar CORS/headers, o antes de cualquier deployment.

---

## ⚡ Regla de Oro

```
El backend valida TODO. Siempre. Sin excepción.
El frontend valida para UX. El backend valida para seguridad.
```

---

## 🛡️ Setup de Seguridad Mínimo (Nuevo Proyecto)

```bash
npm install helmet cors express-rate-limit bcrypt jsonwebtoken zod
npm install -D @types/bcrypt @types/jsonwebtoken
```

```typescript
// infrastructure/http/server.ts
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import { env } from '../../shared/config/env'

export function createApp() {
  const app = express()

  // 1. Security headers
  app.use(helmet())

  // 2. CORS restrictivo (NUNCA '*' en producción)
  app.use(cors({
    origin: env.ALLOWED_ORIGINS.split(','),
    credentials: true,
  }))

  // 3. Rate limiting global
  app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  }))

  // 4. Body parser con límite
  app.use(express.json({ limit: '10kb' }))

  return app
}
```

---

## A01 — Control de Acceso

**Regla:** Verificar en CADA endpoint: ¿autenticado? + ¿tiene rol? + ¿es su recurso?

```typescript
// ✅ Middleware de autenticación
export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.cookies.accessToken  // HttpOnly cookie, nunca header manual para sesiones

  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  jwt.verify(token, env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Invalid token' })
    req.user = decoded as JWTPayload
    next()
  })
}

// ✅ Middleware de autorización por rol
export const requireRole = (...roles: string[]) =>
  (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' })
    }
    next()
  }

// ✅ Verificar ownership del recurso
app.get('/api/orders/:id', authenticateToken, async (req: AuthRequest, res) => {
  const order = await orderRepo.findById(req.params.id)

  if (!order) return res.status(404).json({ error: 'Not found' })

  // Solo el dueño o un admin puede ver la orden
  if (order.userId !== req.user!.sub && req.user!.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' })
  }

  res.json(order)
})
```

---

## A02 — Criptografía

### Passwords

```typescript
import bcrypt from 'bcrypt'

const BCRYPT_ROUNDS = 12

// Hash al registrar
const passwordHash = await bcrypt.hash(plainPassword, BCRYPT_ROUNDS)

// Verificar al hacer login
const isValid = await bcrypt.compare(plainPassword, storedHash)
```

### JWT con HttpOnly Cookies

```typescript
const ACCESS_TOKEN_TTL = '15m'
const REFRESH_TOKEN_TTL = '7d'

// Generar token
const accessToken = jwt.sign(
  { sub: user.id, role: user.role, email: user.email },
  env.JWT_SECRET,
  { expiresIn: ACCESS_TOKEN_TTL },
)

// Enviar como HttpOnly cookie (NUNCA en body para guardar en localStorage)
res.cookie('accessToken', accessToken, {
  httpOnly: true,      // No accesible desde JS → protege contra XSS
  secure: true,        // Solo HTTPS
  sameSite: 'strict',  // Protege contra CSRF
  maxAge: 15 * 60 * 1000,
})
```

### Datos sensibles en BD

```typescript
import crypto from 'crypto'

const ALGO = 'aes-256-cbc'
const KEY = Buffer.from(env.ENCRYPTION_KEY, 'hex')  // 32 bytes en .env

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGO, KEY, iv)
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`
}

export function decrypt(encryptedText: string): string {
  const [ivHex, encHex] = encryptedText.split(':')
  const decipher = crypto.createDecipheriv(ALGO, KEY, Buffer.from(ivHex, 'hex'))
  const decrypted = Buffer.concat([decipher.update(Buffer.from(encHex, 'hex')), decipher.final()])
  return decrypted.toString('utf8')
}
```

---

## A03 — Inyección

**Regla:** NUNCA concatenar strings para construir queries. Siempre parametrizar.

```typescript
// ❌ SQL Injection
db.query(`SELECT * FROM users WHERE email = '${email}'`)

// ✅ Prepared statement
db.query('SELECT * FROM users WHERE email = $1', [email])

// ✅ Prisma (seguro por defecto)
await prisma.user.findUnique({ where: { email } })

// ✅ Validar input con Zod antes de cualquier query
const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
})

app.post('/api/login', async (req, res) => {
  const result = loginSchema.safeParse(req.body)
  if (!result.success) return res.status(400).json({ error: 'Invalid input' })

  // Solo aquí usamos result.data — garantizado limpio
  const { email, password } = result.data
  // ...
})
```

---

## A04 — Diseño Seguro

### Rate Limiting por endpoint sensible

```typescript
// Más restrictivo en endpoints de auth
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hora
  max: 5,                     // 5 intentos
  message: { error: 'Too many attempts. Try again in 1 hour.' },
  skipSuccessfulRequests: true,
})

app.post('/api/login', authLimiter, loginController)
app.post('/api/register', authLimiter, registerController)
app.post('/api/forgot-password', authLimiter, forgotPasswordController)
```

### Mensajes de error genéricos

```typescript
// ❌ MAL: fuga de información
if (!user) return res.status(401).json({ error: 'User not found' })
if (!validPassword) return res.status(401).json({ error: 'Wrong password' })

// ✅ BIEN: mensaje genérico siempre
if (!user || !validPassword) {
  return res.status(401).json({ error: 'Invalid credentials' })
}
```

### Reset de password seguro

```typescript
app.post('/api/forgot-password', authLimiter, async (req, res) => {
  const { email } = forgotPasswordSchema.parse(req.body)

  const token = crypto.randomBytes(32).toString('hex')
  const tokenHash = await bcrypt.hash(token, 10)

  await db.resetTokens.create({
    userId: user?.id,  // null si no existe el email (no revelar si existe)
    tokenHash,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),  // 15 min
  })

  // Siempre la misma respuesta, exista o no el email
  res.json({ message: 'If that email exists, you will receive a reset link.' })
})
```

---

## A05 — Configuración Segura

```typescript
// ✅ Helmet con CSP
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
  },
}))

// ✅ Errores genéricos en producción
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  })

  // El cliente NUNCA ve el stack trace
  res.status(500).json({ error: 'Internal server error' })
})
```

---

## A07 — Autenticación

### Validación de password fuerte

```typescript
const passwordSchema = z.string()
  .min(12, 'Minimum 12 characters')
  .regex(/[A-Z]/, 'At least 1 uppercase')
  .regex(/[a-z]/, 'At least 1 lowercase')
  .regex(/[0-9]/, 'At least 1 number')
  .regex(/[^A-Za-z0-9]/, 'At least 1 special character')
```

### Refresh token rotation

```typescript
app.post('/api/refresh', async (req, res) => {
  const refreshToken = req.cookies.refreshToken
  if (!refreshToken) return res.status(401).json({ error: 'No refresh token' })

  const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as JWTPayload

  // Verificar que existe en BD (revocable)
  const stored = await db.refreshTokens.findOne({
    userId: decoded.sub,
    tokenHash: await bcrypt.hash(refreshToken, 10),
  })

  if (!stored || stored.expiresAt < new Date()) {
    return res.status(403).json({ error: 'Invalid or expired refresh token' })
  }

  // Rotar: eliminar el viejo, crear uno nuevo
  await db.refreshTokens.delete(stored.id)
  const newAccessToken = jwt.sign(
    { sub: decoded.sub, role: decoded.role },
    env.JWT_SECRET,
    { expiresIn: '15m' },
  )

  res.cookie('accessToken', newAccessToken, {
    httpOnly: true, secure: true, sameSite: 'strict', maxAge: 900000,
  })

  res.json({ ok: true })
})

// Logout: eliminar cookies y revocar refresh token
app.post('/api/logout', authenticateToken, async (req: AuthRequest, res) => {
  await db.refreshTokens.deleteByUserId(req.user!.sub)
  res.clearCookie('accessToken')
  res.clearCookie('refreshToken')
  res.json({ ok: true })
})
```

---

## A09 — Logging y Monitoreo

```typescript
import winston from 'winston'

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    ...(process.env.NODE_ENV !== 'production'
      ? [new winston.transports.Console()]
      : []),
  ],
})

// ✅ Qué loguear en eventos de seguridad
logger.info('Login successful', { userId: user.id, ip: req.ip })
logger.warn('Login failed', { email, ip: req.ip, reason: 'Invalid credentials' })
logger.warn('Rate limit hit', { ip: req.ip, endpoint: req.path })
logger.info('Password changed', { userId: req.user.sub, ip: req.ip })
logger.info('User logout', { userId: req.user.sub })

// ❌ NUNCA loguear
// - Passwords (ni hasheados)
// - Tokens completos
// - Tarjetas de crédito
// - process.env completo
```

---

## 🔐 Variables de Entorno — Validación con Zod

```typescript
// shared/config/env.ts
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  PORT: z.string().transform(Number).pipe(z.number().positive()),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 chars'),
  JWT_REFRESH_SECRET: z.string().min(32),
  ALLOWED_ORIGINS: z.string(),
  ENCRYPTION_KEY: z.string().length(64, 'Must be 32 bytes in hex = 64 chars'),
})

// 💥 Si falta una variable, la app NO ARRANCA
export const env = envSchema.parse(process.env)
```

```bash
# .env.example (commitear esto)
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
JWT_SECRET=generate-with-node-crypto-randomBytes-32-hex
JWT_REFRESH_SECRET=another-different-secret-32-bytes-minimum
ALLOWED_ORIGINS=http://localhost:5173,https://yourdomain.com
ENCRYPTION_KEY=generate-with-node-crypto-randomBytes-32-hex-64chars

# Generar secrets:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## ✅ Security Checklist Completo

### Auth & Sesiones
- [ ] Passwords hasheados con bcrypt (12+ rounds)
- [ ] JWT en HttpOnly cookies (no localStorage)
- [ ] `sameSite: 'strict'` en todas las cookies de auth
- [ ] Access token: 15 min / Refresh token: 7 días máximo
- [ ] Refresh tokens guardados en BD (revocables)
- [ ] Logout elimina cookies y revoca refresh token

### Input & Queries
- [ ] Zod valida TODO input en el límite de entrada
- [ ] Queries parametrizadas / ORM (nunca concatenación)
- [ ] Límite de tamaño en body (`limit: '10kb'`)
- [ ] Mensajes de error genéricos al cliente

### Infraestructura
- [ ] Helmet activo con CSP
- [ ] CORS con whitelist explícita (nunca `'*'`)
- [ ] Rate limiting global + específico en auth
- [ ] HTTPS en producción (redirect HTTP → HTTPS)
- [ ] Stack traces nunca al cliente

### Secrets
- [ ] `.env` en `.gitignore` desde commit 0
- [ ] Variables validadas con Zod al arrancar
- [ ] Secrets generados con `crypto.randomBytes`
- [ ] `console.log(process.env)` no existe en el código

### Logging
- [ ] Login OK/FAIL logueado con IP y timestamp
- [ ] Cambios de permisos logueados
- [ ] Logs no contienen passwords/tokens/PII
- [ ] Sentry o similar en producción

---

**Versión:** 1.0  
**Actualizado:** 2026-04-29
