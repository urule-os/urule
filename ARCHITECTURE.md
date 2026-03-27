# Urule Architecture

Architecture decisions, system design, and rationale for the Urule platform.

## Design Decisions

### Why Fastify (not Express)

- **Performance**: Fastify is significantly faster than Express for JSON serialization
- **TypeScript-first**: Built-in TypeScript support with plugin type inference
- **Schema validation**: Native JSON Schema validation with decorators
- **Plugin system**: Encapsulated plugins with proper registration order
- **Logging**: Built-in Pino integration (structured JSON logging)
- **Testing**: `app.inject()` enables in-process testing without starting a server

### Why Schema-Per-Service (not shared database)

- **Independence**: Each service can evolve its schema without coordinating migrations
- **Scaling**: Services can be deployed to separate databases if needed
- **Ownership**: Clear data ownership — no ambiguity about who manages a table
- **Testing**: Services can be tested in isolation with their own schema
- **Trade-off**: Cross-service queries require HTTP calls (slightly slower, but explicit)

### Why NATS (not Kafka, RabbitMQ)

- **Simplicity**: Single binary, zero dependencies, minimal configuration
- **JetStream**: Built-in persistence, exactly-once delivery when needed
- **KV Store**: NATS KV used by the state service (room presence, widget state)
- **Performance**: Sub-millisecond latency for pub/sub
- **Cloud-native**: Designed for Kubernetes with automatic clustering
- **Trade-off**: Smaller ecosystem than Kafka, but sufficient for our event-driven needs

### Why Drizzle ORM (not Prisma, TypeORM)

- **SQL-first**: Queries look like SQL, not a custom DSL
- **Type safety**: Full TypeScript inference from schema definitions
- **Performance**: No runtime query engine — compiles to SQL at build time
- **Migration**: `drizzle-kit` for schema-driven migrations
- **Bundle size**: Minimal footprint compared to Prisma's heavy client
- **Trade-off**: Fewer ORM features (no automatic relations), but we prefer explicit joins

### Why Zustand (not Redux, Jotai, MobX)

- **Simplicity**: Minimal boilerplate, no actions/reducers/dispatchers
- **TypeScript**: Full type inference without extra configuration
- **Persistence**: Built-in `persist` middleware for localStorage
- **Size**: ~1KB gzipped vs Redux Toolkit ~11KB
- **React Query**: Combined with TanStack React Query for server state — Zustand handles only client state (auth, theme, sidebar)
- **Trade-off**: Less structured than Redux for very large state trees

### Why ULID (not UUID)

- **Sortable**: ULIDs are lexicographically sortable by creation time
- **Compact**: 26 characters vs UUID's 36
- **Database-friendly**: Better index performance due to monotonic sorting
- **Collision-resistant**: 80 bits of randomness (same as UUID v4)

## System Design

### Service Communication

```
┌─────────┐     HTTP      ┌─────────┐
│ Service A├──────────────►│ Service B│
└────┬────┘               └─────────┘
     │
     │ NATS publish
     │
┌────▼────┐
│  NATS   │
│ JetStream│
└────┬────┘
     │ NATS subscribe
     │
┌────▼────┐
│ Service C│
└─────────┘
```

- **Synchronous**: HTTP REST for queries and commands that need responses
- **Asynchronous**: NATS events for notifications and side effects
- **No shared state**: Services never import code from other services

### Auth Flow

```
User → Keycloak (JWT) → Service → @urule/auth-middleware → request.uruleUser
                                                          ↓
                                                   Route Handler
                                                          ↓
                                            urule-governance (policy check)
```

### Data Flow (Example: Agent Creation)

```
1. User clicks "Deploy Agent" in Office UI
2. UI sends POST /api/v1/agents to registry (via API router)
3. Registry validates JWT (auth middleware)
4. Registry validates body (Zod schema)
5. Registry inserts into PostgreSQL (Drizzle)
6. Registry publishes AGENT_REGISTERED event to NATS
7. Registry returns 201 with agent data
8. UI redirects to agent live/success page
9. Audit logger records the creation event (fire-and-forget)
```

### Frontend Architecture

```
Next.js App Router
  ├── Layouts (auth check, sidebar, header)
  ├── Pages (file-based routing)
  ├── Components
  │     ├── layout/ (AppSidebar, AppHeader)
  │     ├── ui/ (Toast, Skeleton, ErrorBoundary)
  │     └── office/ (OfficeView, SandboxMonitor)
  ├── Stores (Zustand — client state only)
  │     ├── useAuthStore (tokens, user)
  │     ├── useThemeStore (dark/light/system)
  │     ├── useSidebarStore (mobile toggle)
  │     ├── useChatStore (streaming messages)
  │     └── useToastStore (notifications)
  ├── Widgets (native + iframe-based)
  │     ├── manifests.ts (widget definitions)
  │     ├── registry.ts (widget discovery)
  │     └── builtin/ (9 built-in widgets)
  └── lib/
        └── api.ts (multi-service API router)
```

### Event Envelope

Every event published to NATS follows this envelope:

```typescript
interface UruleEvent<T> {
  id: string;           // ULID
  type: string;         // e.g., "urule.registry.agent.registered"
  source: string;       // Service name
  timestamp: string;    // ISO 8601
  version: number;      // Schema version
  correlationId: string; // For tracing
  data: T;              // Payload
}
```

Topic convention: `urule.{domain}.{entity}.{action}`

### Widget System

```
Host (Office UI)                    Widget (iframe or React)
    │                                      │
    ├── widget:init ──────────────────────►│
    │◄─────────────────────── widget:ready ┤
    ├── host:config ──────────────────────►│
    ├── host:data ────────────────────────►│
    ├── host:theme ───────────────────────►│
    │◄──────────────────── widget:action   ┤
    │◄──────────────────── widget:config   ┤
```

Widgets can be:
- **Native**: React components rendered directly (shared state access)
- **External**: iframe-based with postMessage bridge (sandboxed)

## Infrastructure

```
PostgreSQL 16     — schema-per-service, Drizzle ORM
NATS + JetStream  — events, KV store (state service)
Keycloak          — OIDC authentication
OpenFGA           — fine-grained authorization
OPA               — policy evaluation
Temporal          — workflow orchestration (approvals)
Jaeger            — distributed tracing
OpenTelemetry     — observability pipeline
```

All infrastructure runs via Docker Compose (see `infra/compose/`).
