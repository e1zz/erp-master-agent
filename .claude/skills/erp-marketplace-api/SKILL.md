---
name: erp-marketplace-api
description: 'Understand and work on this Laravel ERP-facing marketplace integration API. Use when tracing endpoints, controllers, orchestrators, queue jobs, webhook processing, inventory/product/order/refund sync, connection and OAuth behavior, internal ERP webhook delivery, or marketplace-specific rules for Walmart, MercadoLibre, TikTok, TiendaNube, Amazon, and related integrations.'
argument-hint: 'Ask about endpoints, workflows, controllers, jobs, data flow, or marketplace-specific behavior'
user-invocable: true
---

# ERP Marketplace API

## When To Use

- Trace what an API endpoint actually does beyond the route definition.
- Understand how the API serves as the integration layer between the ERP, local database, and external marketplaces.
- Debug product, inventory, order, payment, refund, webhook, or connection flows.
- Identify the correct controller, orchestrator, service, mapper, or job to change.
- Work safely around fan-out, token refresh, webhook retries, inventory allocation, or marketplace-specific constraints.

## Working Model

This project is a Laravel 12 integration API that sits between the ERP and multiple marketplaces. The stable public surface is mostly under `routes/api.php` using `/api/v2/*` routes. Controllers stay marketplace-agnostic and delegate to orchestrators, which resolve marketplace-specific services through factories.

The local database is the canonical persistence layer. Marketplaces are treated as external systems that are pulled from, pushed to, and listened to via webhooks. Internal events are queued back out to the ERP through `events_internal` and `SendInternalEventsJob`.

## Core Rules

- Treat `/api/v2/*` as the canonical API. `/api/marketplace/*` is legacy or compatibility-only.
- Inventory is SKU-centric. Prefer `Inventory::resolveBySku()` and `Inventory::upsertBySku()` semantics over product-id-first logic.
- Shared stock may be pool-owned through `inventory_pool_id`; do not assume one store owns the canonical quantity.
- Respect `DISABLE_MARKETPLACE_PUSH`. It is the global outbound kill switch for writes to marketplaces.
- Marketplace-originated product writes must set `skipMarketplaceFanout` to avoid echo loops.
- Order webhooks must not overwrite local inventory quantities. Allocation and release are owned by order/refund transitions.
- `nuvemshop` is normalized to `tiendanube` in multiple connection and webhook paths.

## Recommended Trace Order

1. Start with `routes/api.php` to identify the endpoint family.
2. Read the owning controller in `app/Http/Controllers/`.
3. Jump to the orchestrator in `app/Application/Orchestrators/`.
4. Resolve the capability factory in `app/Marketplaces/Factories/`.
5. Follow the marketplace service in `app/Marketplaces/Services/` and its mapper in `app/Marketplaces/Mappers/`.
6. Check related jobs in `app/Jobs/` if the flow is async.
7. Check `app/Models/`, `config/marketplaces.php`, `config/services.php`, and repo memories for invariants and kill-switch behavior.

## High-Value References

- [Project reference](./references/project-reference.md)

## Fast Heuristics

- Products: `ProductsController` -> `ProductOrchestrator`
- Inventory push/pull: `InventorySyncController` or `InventoryController` -> `InventoryOrchestrator`
- Orders and labels: `OrdersController` -> `OrderOrchestrator` and `ShippingLabelOrchestrator`
- Refunds: `RefundsController` -> `RefundOrchestrator` and `ProcessMarketplaceRefund`
- Payments: `PaymentController` -> `PaymentOrchestrator`
- Webhooks: `WebhooksController` -> `WebhookOrchestrator` -> `ProcessWebhookJob`
- Connections/OAuth: `ConnectionsController` or `OAuthController` -> `ConnectionOrchestrator` and connection services
- ERP outbound events: `InternalEvent` -> `SendInternalEventsJob` -> `ErpWebhookService`