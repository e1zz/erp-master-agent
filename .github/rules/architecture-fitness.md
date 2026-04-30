# Architecture Fitness Harness

Architecture fitness rules define the structural, performance, and observability constraints that the agent must preserve. These are feedforward guides that prevent architectural drift.

## Structural Boundaries (Controller → Orchestrator → Service)

The Laravel application follows a strict layered architecture. Respect these boundaries:

1. **Controllers** (`app/Http/Controllers/`) — Handle HTTP request/response only. NEVER put business logic here.
2. **Orchestrators** (`app/Application/Orchestrators/`) — Coordinate domain workflows. This is where business rules live.
3. **Factories** (`app/Marketplaces/Factories/`) — Resolve marketplace-specific service implementations. NEVER hardcode marketplace selection in controllers or orchestrators.
4. **Services** (`app/Marketplaces/Services/`) — Implement marketplace-specific API interactions.
5. **Mappers** (`app/Marketplaces/Mappers/`) — Transform between local domain models and marketplace payloads.
6. **Jobs** (`app/Jobs/`) — Async work. Always dispatch through the orchestrator, not directly from controllers.
7. **Models** (`app/Models/`) — Eloquent models. NEVER call external APIs from models.

### Violation Signals

If you find yourself doing any of these, stop and reconsider:

- Writing API calls directly in a controller → use an orchestrator + service
- Adding marketplace-specific `if/switch` statements in an orchestrator → use the factory pattern
- Putting business logic in a job → delegate to an orchestrator
- Making a model call an external service → use a service class

## Multi-Tenancy Invariants

- Every database query MUST be scoped to the current tenant (store).
- NEVER allow cross-tenant data access.
- Connection credentials are per-store. Always resolve connection via `ConnectionService` with store context.

## Observability Standards

When adding or modifying code:

1. **Logging**: Use structured logging with marketplace context: `Log::info('message', ['marketplace' => $marketplace, 'store_id' => $storeId, 'order_id' => $orderId])`.
2. **Error handling**: Catch marketplace API exceptions at the service level. Log the full response. Re-throw as domain exceptions for the orchestrator.
3. **Job failures**: All jobs MUST implement `$tries`, `$backoff`, and `failed()` method for dead-letter visibility.
4. **Internal events**: State transitions that the ERP needs to know about MUST fire `InternalEvent` records. Do not skip this.

## Performance Constraints

- **Bulk operations**: When syncing inventory or products, batch API calls. Never make N+1 individual calls.
- **Queue jobs**: Long-running marketplace API calls MUST be dispatched to the queue, not executed synchronously in HTTP requests.
- **Rate limiting**: Respect marketplace rate limits. Use the rate limiter configuration in `config/marketplaces.php`.
- **Token refresh**: OAuth token refresh MUST be handled transparently by the connection service. Callers should not manage tokens directly.

## Kill Switches

These must never be bypassed or removed:

| Switch | Purpose |
|---|---|
| `DISABLE_MARKETPLACE_PUSH` | Global outbound kill switch — stops all writes to marketplaces |
| `skipMarketplaceFanout` | Per-request flag — prevents echo loops on marketplace-originated writes |

## Adding New Marketplaces

When adding a new marketplace integration, follow the existing pattern exactly:

1. Create connection service in `app/Marketplaces/Services/<Marketplace>/`
2. Create mapper in `app/Marketplaces/Mappers/<Marketplace>/`
3. Register in the capability factory
4. Add configuration in `config/marketplaces.php`
5. Create corresponding skill files: `<marketplace>-api/`, `<marketplace>-expert/`, `<marketplace>-order-worker/`, `<marketplace>-stock-worker/`
6. Wire webhook handler in `WebhookOrchestrator`
