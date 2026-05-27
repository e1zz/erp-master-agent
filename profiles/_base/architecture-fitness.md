# Architecture Fitness Harness

Architecture fitness rules define the structural, performance, and observability constraints that the agent must preserve. These are feedforward guides that prevent architectural drift.

## Structural Boundaries (Controller → Orchestrator → Service)

The application follows a strict layered architecture. Respect these boundaries:

1. **Controllers** — Handle HTTP request/response only. NEVER put business logic here.
2. **Orchestrators** — Coordinate domain workflows. This is where business rules live.
3. **Factories** — Resolve marketplace-specific service implementations. NEVER hardcode marketplace selection in controllers or orchestrators.
4. **Services** — Implement marketplace-specific API interactions.
5. **Mappers** — Transform between local domain models and marketplace payloads.
6. **Jobs / Workers** — Async work. Always dispatch through the orchestrator, not directly from controllers.
7. **Models** — Domain entities. NEVER call external APIs from models.

### Violation Signals

If you find yourself doing any of these, stop and reconsider:

- Writing API calls directly in a controller → use an orchestrator + service
- Adding marketplace-specific `if/switch` statements in an orchestrator → use the factory pattern
- Putting business logic in a job → delegate to an orchestrator
- Making a model call an external service → use a service class

## Multi-Tenancy Invariants

- Every database query MUST be scoped to the current tenant (store).
- NEVER allow cross-tenant data access.
- Connection credentials are per-store. Always resolve connection via the connection service with store context.

## Observability Standards

When adding or modifying code:

1. **Logging**: Use structured logging with marketplace context (marketplace name, store ID, order ID, etc.).
2. **Error handling**: Catch marketplace API exceptions at the service level. Log the full response. Re-throw as domain exceptions for the orchestrator.
3. **Job failures**: All async jobs MUST implement retry logic and dead-letter visibility.
4. **Internal events**: State transitions that the ERP needs to know about MUST fire internal event records. Do not skip this.

## Performance Constraints

- **Bulk operations**: When syncing inventory or products, batch API calls. Never make N+1 individual calls.
- **Async processing**: Long-running marketplace API calls MUST be dispatched to background workers, not executed synchronously in HTTP requests.
- **Rate limiting**: Respect marketplace rate limits. Use the project's rate limiter configuration.
- **Token refresh**: OAuth token refresh MUST be handled transparently by the connection service. Callers should not manage tokens directly.

## Kill Switches

These must never be bypassed or removed:

| Switch | Purpose |
|---|---|
| `DISABLE_MARKETPLACE_PUSH` | Global outbound kill switch — stops all writes to marketplaces |
| `skipMarketplaceFanout` | Per-request flag — prevents echo loops on marketplace-originated writes |

## Adding New Marketplaces

When adding a new marketplace integration, follow the existing pattern exactly:

1. Create connection service for the new marketplace
2. Create mapper for payload transformations
3. Register in the capability factory
4. Add marketplace configuration
5. Create corresponding skill files: `<marketplace>-api/`, `<marketplace>-expert/`, `<marketplace>-order-worker/`, `<marketplace>-stock-worker/`
6. Wire webhook handler in the webhook orchestrator
