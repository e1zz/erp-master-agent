# ERP Marketplace API Invariants

Last reviewed: 2026-04-30

## Contract Boundaries

- Treat `/api/v2/*` as the canonical ERP-facing API.
- Treat `/api/payments/*` as active but not yet folded into `/api/v2/*`.
- Treat `/api/products/*` as local selling-item CRUD only, not the marketplace product sync contract.
- Treat `/api/marketplace/{marketplace}/webhook` as compatibility-only. Prefer `/api/v2/webhooks/{marketplace}`.

## Inventory And SKU Ownership

- Inventory is SKU-centric. Prefer SKU-based resolution over product-id-first assumptions when tracing stock behavior.
- Shared stock is pool-owned when `inventory_pool_id` is present. Do not assume a single store owns the canonical quantity.
- Shared inventory helpers such as `Inventory::upsertSharedDefaultRow` and the default-row pool resolution helpers are the safe write paths for canonical stock.
- `InventorySyncController::syncSingle()` still falls back to `Product.stock` when no quantity is supplied. Treat that as a legacy convenience, not the preferred source of truth.
- Inventory fallback logic can read from `marketplace_inventory_sync` and then local inventory when a marketplace service returns no quantity.

## Fan-Out And Outbound Write Controls

- `DISABLE_MARKETPLACE_PUSH` is the repo-wide outbound kill switch for marketplace writes.
- The kill switch covers product fan-out, direct marketplace product writes, inventory pushes and bulk sync jobs, order acknowledge/ship/cancel flows, webhook subscription mutations, shipping-label creation, and legacy publish or pause paths.
- Marketplace-originated product writes must use `skipMarketplaceFanout` to avoid echo loops.
- Manual product fan-out returns HTTP 409 with a disabled message when outbound push is globally blocked.

## Webhooks, Orders, And Refunds

- Order webhook processing must not overwrite local `inventory.quantity` rows from marketplace-reported stock.
- Webhook stock updates should touch sync metadata, not the canonical local quantity or allocation fields.
- Inventory allocation and release are owned by order and refund transitions, not by webhook stock payloads.
- `ProcessMarketplaceRefund` must stay idempotent per `external_refund_id`.
- Refunded or canceled stock restoration must follow order state semantics rather than always mutating quantity directly.
- `inventory.updated` internal events should use the product SKU as `resource_id` and keep lower-level identifiers inside the payload.

## Marketplace-Specific Normalization Rules

- `nuvemshop` is normalized to `tiendanube` in connection and webhook flows.
- Walmart does not use a browser OAuth flow in this repo for seller credentials. The ERP-facing entrypoint is `POST /api/v2/connections/walmart/authorize`.
- When marketplace-specific behavior matters, keep ERP invariants above external API preferences.