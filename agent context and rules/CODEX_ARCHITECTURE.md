# 🏗️ CODEX — Architecture & Clean Code

> **Cuándo leer este MD:** Al crear un proyecto nuevo, definir estructura de carpetas, diseñar entidades, casos de uso o repositorios.

---

## 📐 Principio Fundamental

```
La lógica de negocio (dominio) no depende de nada externo.
Todo lo demás depende del dominio.
```

Esto significa que puedes cambiar la base de datos, el framework HTTP o el proveedor de emails sin tocar una sola línea de lógica de negocio.

---

## 🗂️ Estructura de Carpetas

### Proyecto PEQUEÑO (MVP, TFM, prototipos)

```
project-name/
├── src/
│   ├── domain/                    # Reglas de negocio puras
│   │   ├── Entity.ts              # Entidades con lógica
│   │   ├── ValueObject.ts         # Objetos de valor inmutables
│   │   └── IRepository.ts         # Interfaces (contratos)
│   │
│   ├── application/               # Casos de uso (orquestadores)
│   │   ├── CreateSomething.ts
│   │   └── GetSomething.ts
│   │
│   ├── infrastructure/            # Implementaciones concretas
│   │   ├── PostgresRepository.ts  # BD real
│   │   ├── server.ts              # Express/Fastify
│   │   ├── routes.ts
│   │   └── middlewares/
│   │
│   └── main.ts                    # Entry point + DI manual
│
├── tests/
│   ├── unit/
│   └── integration/
│
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

### Proyecto ESCALABLE (producto a largo plazo, equipos)

```
project-name/
├── src/
│   ├── domain/
│   │   ├── entities/
│   │   ├── value-objects/
│   │   ├── interfaces/            # Repositorios, servicios externos
│   │   ├── exceptions/            # Errores de dominio tipados
│   │   └── events/                # Domain events
│   │
│   ├── application/
│   │   ├── use-cases/
│   │   │   ├── orders/
│   │   │   └── users/
│   │   ├── dtos/
│   │   └── ports/                 # Interfaces de servicios externos
│   │
│   ├── infrastructure/
│   │   ├── repositories/
│   │   ├── services/              # Email, storage, etc.
│   │   ├── database/
│   │   │   └── migrations/
│   │   ├── http/
│   │   │   ├── controllers/
│   │   │   ├── middlewares/
│   │   │   └── routes/
│   │   └── di/                    # Container de dependencias
│   │
│   ├── shared/
│   │   ├── utils/
│   │   ├── types/
│   │   └── constants/
│   │
│   └── main.ts
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── features/                      # Archivos .feature BDD (si aplica)
└── ...
```

---

## 🎯 Las 3 Capas — Regla de Dependencias

```
Infrastructure  →  Application  →  Domain
(código real)      (orquesta)      (reglas puras)
```

**Regla de oro:** Las flechas SIEMPRE apuntan hacia adentro (hacia Domain). Domain nunca importa nada de fuera.

### Domain — Qué va aquí
- Entidades con lógica de negocio real
- Value Objects inmutables
- Interfaces de repositorios (NO implementaciones)
- Excepciones de dominio
- Zero dependencias externas (ni Express, ni Prisma, ni nada)

```typescript
// ✅ domain/entities/Order.ts
export class Order {
  private constructor(
    public readonly id: OrderId,
    public readonly userId: UserId,
    private _status: OrderStatus,
    public readonly total: Money,
  ) {}

  static create(userId: UserId, total: Money): Order {
    if (total.value <= 0) throw new InvalidOrderError('Total must be positive')
    return new Order(OrderId.generate(), userId, OrderStatus.PENDING, total)
  }

  confirm(): void {
    if (this._status !== OrderStatus.PENDING) {
      throw new InvalidOrderError('Only pending orders can be confirmed')
    }
    this._status = OrderStatus.CONFIRMED
  }

  get status() { return this._status }
}
```

### Application — Qué va aquí
- Casos de uso (una clase = una acción del sistema)
- DTOs de entrada/salida
- Orquesta domain + infrastructure a través de interfaces
- NO tiene lógica de negocio directamente

```typescript
// ✅ application/use-cases/orders/CreateOrderUseCase.ts
export class CreateOrderUseCase {
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly logger: ILogger,
  ) {}

  async execute(dto: CreateOrderDTO): Promise<OrderResponseDTO> {
    const order = Order.create(
      new UserId(dto.userId),
      new Money(dto.total, dto.currency),
    )

    await this.orderRepository.save(order)
    this.logger.info('Order created', { orderId: order.id.value })

    return OrderResponseDTO.fromDomain(order)
  }
}
```

### Infrastructure — Qué va aquí
- Implementaciones de repositorios (Prisma, SQL raw, MongoDB)
- Controllers HTTP (Express)
- Middlewares (auth, rate limit, logging)
- Configuración de BD, servicios externos
- DI (inyección de dependencias)

```typescript
// ✅ infrastructure/repositories/PrismaOrderRepository.ts
export class PrismaOrderRepository implements IOrderRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(order: Order): Promise<void> {
    await this.prisma.order.create({
      data: {
        id: order.id.value,
        userId: order.userId.value,
        status: order.status,
        total: order.total.value,
        currency: order.total.currency,
      },
    })
  }

  async findById(id: OrderId): Promise<Order | null> {
    const row = await this.prisma.order.findUnique({
      where: { id: id.value },
    })
    if (!row) return null
    return OrderMapper.toDomain(row)
  }
}
```

---

## 🔑 Principios SOLID — Aplicados

### S — Single Responsibility
Cada clase hace una sola cosa. Si tienes que usar "y" para describir lo que hace una clase, divídela.

```typescript
// ❌ MAL: hace demasiado
class UserService {
  async register(dto) { /* auth + email + logging + BD */ }
}

// ✅ BIEN: responsabilidades separadas
class RegisterUserUseCase { /* solo orquesta */ }
class UserRepository { /* solo BD */ }
class EmailService { /* solo emails */ }
```

### O — Open/Closed
Abierto a extensión, cerrado a modificación. Usa interfaces.

```typescript
// ✅ BIEN: puedo añadir nuevos notificadores sin tocar el use case
interface INotifier {
  notify(userId: string, message: string): Promise<void>
}

class EmailNotifier implements INotifier { ... }
class SlackNotifier implements INotifier { ... }
class SMSNotifier implements INotifier { ... }
```

### D — Dependency Inversion
Depende de abstracciones (interfaces), no de implementaciones concretas.

```typescript
// ❌ MAL: acoplado a Prisma directamente
class CreateOrderUseCase {
  private prisma = new PrismaClient() // ← dependencia concreta
}

// ✅ BIEN: depende de la interfaz
class CreateOrderUseCase {
  constructor(private readonly repo: IOrderRepository) {} // ← abstracción
}
```

---

## 🧩 Value Objects — Cuándo y Cómo

Usa Value Objects para tipos primitivos con reglas de negocio.

```typescript
// ❌ MAL: string sin validación
function createOrder(userId: string, email: string, total: number) {}

// ✅ BIEN: tipos con invariantes
export class Email {
  private constructor(public readonly value: string) {}

  static create(value: string): Email {
    if (!value.includes('@')) throw new InvalidEmailError(value)
    return new Email(value.toLowerCase().trim())
  }
}

export class Money {
  private constructor(
    public readonly amount: number,
    public readonly currency: string,
  ) {}

  static create(amount: number, currency: string): Money {
    if (amount < 0) throw new InvalidMoneyError('Amount cannot be negative')
    if (!['EUR', 'USD', 'GBP'].includes(currency)) throw new InvalidMoneyError('Unknown currency')
    return new Money(amount, currency)
  }

  add(other: Money): Money {
    if (this.currency !== other.currency) throw new CurrencyMismatchError()
    return new Money(this.amount + other.amount, this.currency)
  }
}
```

---

## 🔄 Repository Pattern

La interfaz vive en Domain, la implementación en Infrastructure.

```typescript
// domain/interfaces/IOrderRepository.ts
export interface IOrderRepository {
  save(order: Order): Promise<void>
  findById(id: OrderId): Promise<Order | null>
  findByUserId(userId: UserId): Promise<Order[]>
  delete(id: OrderId): Promise<void>
}

// infrastructure/repositories/InMemoryOrderRepository.ts (para tests)
export class InMemoryOrderRepository implements IOrderRepository {
  private orders = new Map<string, Order>()

  async save(order: Order): Promise<void> {
    this.orders.set(order.id.value, order)
  }

  async findById(id: OrderId): Promise<Order | null> {
    return this.orders.get(id.value) ?? null
  }

  async findByUserId(userId: UserId): Promise<Order[]> {
    return [...this.orders.values()].filter(o => o.userId.value === userId.value)
  }

  async delete(id: OrderId): Promise<void> {
    this.orders.delete(id.value)
  }
}
```

---

## 💉 Dependency Injection — main.ts

En proyectos pequeños, el DI se hace manualmente en `main.ts`:

```typescript
// src/main.ts
import { PrismaClient } from '@prisma/client'
import { PrismaOrderRepository } from './infrastructure/repositories/PrismaOrderRepository'
import { WinstonLogger } from './infrastructure/services/WinstonLogger'
import { CreateOrderUseCase } from './application/use-cases/orders/CreateOrderUseCase'
import { OrderController } from './infrastructure/http/controllers/OrderController'
import { createApp } from './infrastructure/http/server'
import { env } from './shared/config/env'

async function bootstrap() {
  // Infraestructura
  const prisma = new PrismaClient()
  const logger = new WinstonLogger()

  // Repositorios
  const orderRepository = new PrismaOrderRepository(prisma)

  // Casos de uso
  const createOrderUseCase = new CreateOrderUseCase(orderRepository, logger)

  // Controllers
  const orderController = new OrderController(createOrderUseCase)

  // App
  const app = createApp({ orderController })
  app.listen(env.PORT, () => logger.info(`Server running on port ${env.PORT}`))
}

bootstrap()
```

---

## 🚦 Señales de que necesitas refactorizar

| Señal | Acción |
|---|---|
| Más de 5 entidades en `domain/` | Crear subcarpetas `domain/entities/`, `domain/value-objects/` |
| Más de 5 use cases | Organizar por módulo `use-cases/orders/`, `use-cases/users/` |
| `main.ts` con más de 50 líneas | Extraer DI a `infrastructure/di/container.ts` |
| Tests difíciles de escribir | Probable violación de SRP o DIP — refactorizar |
| Cambiar la BD requiere tocar muchos archivos | Falta el Repository Pattern |

---

## 📋 Checklist de Arquitectura

Antes de hacer merge de cualquier feature:

- [ ] ¿Domain no importa nada de Express, Prisma u otros frameworks?
- [ ] ¿Los use cases dependen de interfaces, no de implementaciones?
- [ ] ¿Las entidades tienen su propia validación de invariantes?
- [ ] ¿Existe `InMemoryRepository` para poder testear sin BD?
- [ ] ¿La estructura de carpetas refleja el dominio del negocio?
- [ ] ¿`main.ts` es el único lugar donde se ensamblan las dependencias?

---

**Versión:** 1.0  
**Actualizado:** 2026-04-29
