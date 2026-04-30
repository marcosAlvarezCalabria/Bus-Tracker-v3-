# 🧪 CODEX — Testing (TDD / BDD / AAA)

> **Cuándo leer este MD:** Al escribir tests de cualquier tipo, al configurar el framework de testing, o al definir la estrategia de testing de un proyecto.

---

## 🎯 Filosofía

```
Código sin tests no está terminado. Está pendiente.
```

Los tests no son "extra trabajo". Son lo que permite refactorizar con confianza, detectar regresiones y documentar el comportamiento esperado del sistema.

**Pirámide de testing:**
```
        /\
       /E2E\          Pocos, lentos, costosos — flujos críticos de usuario
      /------\
     /Integr. \       Algunos — cómo interactúan las capas
    /----------\
   /  Unit Tests \    Muchos, rápidos, baratos — lógica de dominio
  /--------------\
```

---

## ⚙️ Setup (Vitest)

```bash
npm install -D vitest @vitest/coverage-v8 supertest @types/supertest
```

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/main.ts', 'src/**/*.d.ts'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
      },
    },
  },
})
```

```json
// package.json scripts
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:integration": "vitest run tests/integration",
    "test:e2e": "playwright test"
  }
}
```

---

## 🔬 Unit Tests — Dominio Puro

**Qué testear:** Entidades, Value Objects, lógica de negocio.  
**Qué NO usar:** BD, HTTP, servicios externos.  
**Herramienta:** Vitest.

### Patrón AAA (Arrange, Act, Assert)

```typescript
// tests/unit/domain/Order.spec.ts
import { describe, it, expect } from 'vitest'
import { Order } from '../../../src/domain/entities/Order'
import { UserId } from '../../../src/domain/value-objects/UserId'
import { Money } from '../../../src/domain/value-objects/Money'

describe('Order', () => {
  describe('create()', () => {
    it('should create an order with PENDING status', () => {
      // Arrange
      const userId = UserId.create('user-123')
      const total = Money.create(100, 'EUR')

      // Act
      const order = Order.create(userId, total)

      // Assert
      expect(order.status).toBe('PENDING')
      expect(order.total.amount).toBe(100)
      expect(order.userId.value).toBe('user-123')
    })

    it('should throw InvalidOrderError if total is zero', () => {
      // Arrange
      const userId = UserId.create('user-123')
      const total = Money.create(0, 'EUR')

      // Act & Assert
      expect(() => Order.create(userId, total)).toThrow('Total must be positive')
    })

    it('should throw InvalidOrderError if total is negative', () => {
      const userId = UserId.create('user-123')
      const total = Money.create(-50, 'EUR')

      expect(() => Order.create(userId, total)).toThrow('Total must be positive')
    })
  })

  describe('confirm()', () => {
    it('should confirm a PENDING order', () => {
      // Arrange
      const order = Order.create(UserId.create('u1'), Money.create(100, 'EUR'))

      // Act
      order.confirm()

      // Assert
      expect(order.status).toBe('CONFIRMED')
    })

    it('should throw if confirming an already CONFIRMED order', () => {
      const order = Order.create(UserId.create('u1'), Money.create(100, 'EUR'))
      order.confirm()

      expect(() => order.confirm()).toThrow('Only pending orders can be confirmed')
    })
  })
})
```

### Value Objects

```typescript
// tests/unit/domain/Email.spec.ts
describe('Email', () => {
  it('should create valid email normalized to lowercase', () => {
    const email = Email.create('USER@EXAMPLE.COM')
    expect(email.value).toBe('user@example.com')
  })

  it('should throw for invalid email format', () => {
    expect(() => Email.create('not-an-email')).toThrow('Invalid email')
    expect(() => Email.create('')).toThrow()
    expect(() => Email.create('   ')).toThrow()
  })
})
```

---

## 🔗 Integration Tests — Capas + BD

**Qué testear:** Use cases con repositorio real, endpoints HTTP.  
**Cuándo usar BD real:** Al testear repositorios. Usar una BD de test, nunca la de producción.  
**Alternativa más rápida:** InMemoryRepository para use cases.

### Use Case con InMemoryRepository (rápido)

```typescript
// tests/integration/application/CreateOrderUseCase.spec.ts
import { beforeEach, describe, it, expect, vi } from 'vitest'
import { CreateOrderUseCase } from '../../../src/application/use-cases/orders/CreateOrderUseCase'
import { InMemoryOrderRepository } from '../../../src/infrastructure/repositories/InMemoryOrderRepository'

describe('CreateOrderUseCase', () => {
  let useCase: CreateOrderUseCase
  let repo: InMemoryOrderRepository
  const mockLogger = { info: vi.fn(), error: vi.fn(), warn: vi.fn() }

  beforeEach(() => {
    repo = new InMemoryOrderRepository()
    useCase = new CreateOrderUseCase(repo, mockLogger)
    vi.clearAllMocks()
  })

  it('should create an order and persist it', async () => {
    // Arrange
    const dto = { userId: 'user-123', total: 150, currency: 'EUR' }

    // Act
    const result = await useCase.execute(dto)

    // Assert
    expect(result.id).toBeDefined()
    expect(result.status).toBe('PENDING')

    const saved = await repo.findById(result.id)
    expect(saved).not.toBeNull()
    expect(saved!.total.amount).toBe(150)
  })

  it('should log the order creation', async () => {
    await useCase.execute({ userId: 'u1', total: 50, currency: 'EUR' })

    expect(mockLogger.info).toHaveBeenCalledWith(
      'Order created',
      expect.objectContaining({ orderId: expect.any(String) }),
    )
  })
})
```

### Endpoint HTTP con Supertest

```typescript
// tests/integration/http/orders.spec.ts
import { beforeAll, afterAll, describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from '../../../src/infrastructure/http/server'
import type { Express } from 'express'

describe('POST /api/orders', () => {
  let app: Express
  let authToken: string

  beforeAll(async () => {
    app = createApp()
    // Login para obtener token
    const res = await request(app)
      .post('/api/login')
      .send({ email: 'test@test.com', password: 'TestPass123!' })
    authToken = res.body.accessToken
  })

  it('should return 201 with order data when input is valid', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Cookie', `accessToken=${authToken}`)
      .send({ total: 100, currency: 'EUR' })

    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({
      id: expect.any(String),
      status: 'PENDING',
      total: { amount: 100, currency: 'EUR' },
    })
  })

  it('should return 400 with validation errors for invalid input', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Cookie', `accessToken=${authToken}`)
      .send({ total: -50 })

    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('should return 401 without auth token', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({ total: 100, currency: 'EUR' })

    expect(res.status).toBe(401)
  })
})
```

---

## 🌐 E2E Tests — Flujos de Usuario (Playwright)

```bash
npm install -D @playwright/test
npx playwright install
```

```typescript
// tests/e2e/orders.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Order creation flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login antes de cada test
    await page.goto('/login')
    await page.fill('input[name="email"]', 'user@test.com')
    await page.fill('input[name="password"]', 'TestPass123!')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
  })

  test('user can create an order from dashboard', async ({ page }) => {
    // Navigate
    await page.click('[data-testid="new-order-btn"]')

    // Fill form
    await page.fill('[data-testid="order-amount"]', '150')
    await page.selectOption('[data-testid="order-currency"]', 'EUR')

    // Submit
    await page.click('[data-testid="submit-order"]')

    // Assert
    await expect(page.locator('[data-testid="order-status"]')).toHaveText('PENDING')
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible()
  })

  test('shows validation error for invalid amount', async ({ page }) => {
    await page.click('[data-testid="new-order-btn"]')
    await page.fill('[data-testid="order-amount"]', '-50')
    await page.click('[data-testid="submit-order"]')

    await expect(page.locator('[data-testid="amount-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="amount-error"]')).toContainText('positive')
  })
})
```

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
})
```

---

## 🥒 BDD — Cucumber.js + Gherkin

Para proyectos con requisitos funcionales formales (TFM, proyectos con stakeholders).

```bash
npm install -D @cucumber/cucumber ts-node
```

### Escribir el .feature

```gherkin
# features/orders/create-order.feature
Feature: Create Order
  As a registered user
  I want to create an order
  So that I can purchase products

  Background:
    Given I am logged in as a registered user

  Scenario: Successfully create an order with valid data
    When I submit an order with amount 150 EUR
    Then the order should be created with status "PENDING"
    And I should receive a confirmation with the order ID

  Scenario: Fail to create an order with negative amount
    When I submit an order with amount -50 EUR
    Then I should receive a 400 error
    And the error message should contain "positive"

  Scenario: Fail to create an order without authentication
    Given I am not authenticated
    When I submit an order with amount 100 EUR
    Then I should receive a 401 error
```

### Implementar los step definitions

```typescript
// features/step-definitions/orders.steps.ts
import { Given, When, Then, Before } from '@cucumber/cucumber'
import request from 'supertest'
import { expect } from 'chai'
import { app } from '../../src/infrastructure/http/server'

let response: request.Response
let authCookie: string

Before(async function () {
  // Reset BD de test antes de cada escenario
  await resetTestDatabase()
})

Given('I am logged in as a registered user', async function () {
  const res = await request(app)
    .post('/api/login')
    .send({ email: 'test@test.com', password: 'TestPass123!' })
  authCookie = res.headers['set-cookie'][0]
})

Given('I am not authenticated', function () {
  authCookie = ''
})

When('I submit an order with amount {int} EUR', async function (amount: number) {
  response = await request(app)
    .post('/api/orders')
    .set('Cookie', authCookie || '')
    .send({ total: amount, currency: 'EUR' })
})

Then('the order should be created with status {string}', function (status: string) {
  expect(response.status).to.equal(201)
  expect(response.body.status).to.equal(status)
})

Then('I should receive a confirmation with the order ID', function () {
  expect(response.body.id).to.be.a('string')
  expect(response.body.id).to.have.length.greaterThan(0)
})

Then('I should receive a {int} error', function (statusCode: number) {
  expect(response.status).to.equal(statusCode)
})

Then('the error message should contain {string}', function (text: string) {
  expect(response.body.error).to.include(text)
})
```

```json
// cucumber.json
{
  "default": {
    "require": ["features/step-definitions/**/*.ts"],
    "requireModule": ["ts-node/register"],
    "format": ["progress-bar", "html:cucumber-report.html"]
  }
}
```

---

## 🎭 Mocks — Cuándo y Cómo

```typescript
import { vi, describe, it, expect, beforeEach } from 'vitest'

// ✅ Mockear servicios externos (email, SMS, Stripe, etc.)
const mockEmailService = {
  send: vi.fn().mockResolvedValue({ messageId: 'msg-123' }),
}

// ✅ Mockear logger (para verificar que se llama)
const mockLogger = {
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
}

// ✅ Espiar un método específico sin mockear todo el objeto
const spy = vi.spyOn(emailService, 'send')

// ✅ Resetear entre tests
beforeEach(() => vi.clearAllMocks())

// ❌ NO mockear lo que quieres testear (el dominio)
// ❌ NO mockear la BD si el test es de repositorio
// ❌ NO usar vi.mock() en exceso — indica acoplamiento
```

---

## 📊 Qué Testear por Capa

| Capa | Qué testear | Tipo | Fixtures |
|---|---|---|---|
| Entidades | Invariantes, métodos de negocio | Unit | Ninguna |
| Value Objects | Validaciones, operaciones | Unit | Ninguna |
| Use Cases | Flujos OK, errores esperados | Integration | InMemoryRepo + mock servicios |
| Repositorios | CRUD contra BD real | Integration | BD de test |
| Controllers | Status codes, formato respuesta | Integration | Supertest |
| Flujos completos | Happy path, error path | E2E/BDD | BD de test |

---

## 📋 Checklist de Tests

Para cada feature:

- [ ] Tests unitarios para entidades y value objects nuevos
- [ ] Tests del use case (OK + errores de dominio)
- [ ] Test del endpoint (201/200, 400, 401, 403, 404)
- [ ] .feature BDD si hay requisitos funcionales formales
- [ ] Coverage no baja del umbral configurado (`npm run test:coverage`)
- [ ] Tests no dependen del orden de ejecución
- [ ] Setup/teardown limpia el estado entre tests
- [ ] Los mocks se resetean en `beforeEach`

---

**Versión:** 1.0  
**Actualizado:** 2026-04-29
