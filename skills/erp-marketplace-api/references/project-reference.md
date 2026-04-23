# ERP Marketplace API Reference

Last reviewed: 2026-04-22

## Purpose

This repository is a Laravel 12 integration API that acts as a middleware layer between an ERP and several external marketplaces. Its job is to:

- expose ERP-facing HTTP endpoints for products, inventory, orders, payments, refunds, connections, and webhooks
- persist normalized local records in the database
- push ERP-originated changes out to marketplaces
- pull marketplace state back into local tables
- receive marketplace webhooks, normalize them, and route them into the correct orchestrator or queue job
- emit internal events back to the ERP through a queued webhook delivery pipeline

This is not just a thin proxy. It is an orchestration and normalization service with local persistence, async jobs, token management, and marketplace-specific rules.

## What The API Actually Does

At a high level the project has four main responsibilities:

1. ERP command surface

- The ERP calls this API to list or mutate local products, inventory, orders, refunds, payments, and marketplace connections.
- Most current production-facing endpoints are under `/api/v2/*`.

2. Marketplace sync layer

- Product, stock, order, payment, refund, and webhook workflows are normalized into local DTOs, models, and orchestrators.
- Each marketplace has its own connection, product, inventory, order, refund, payment, or webhook service.

3. Local system of record and coordination layer

- The database stores normalized entities such as `products`, `inventory`, `orders`, `marketplace_products`, `marketplace_orders`, `marketplace_connections`, `events_internal`, and related models.
- Async jobs handle bulk sync, pull-all operations, webhook processing, refund processing, and ERP event delivery.

4. ERP event egress

- Local changes and processed marketplace events create `InternalEvent` rows.
- `SendInternalEventsJob` sends those queued events to the ERP webhook URL configured in `config/services.php`.

## Architecture In One View

```text
ERP / Frontend
    |
    v
HTTP routes in routes/api.php
    |
    v
Controllers in app/Http/Controllers
    |
    v
Orchestrators in app/Application/Orchestrators
    |
    +--> Local models and DB writes
    |
    +--> Marketplace capability factories
             |
             v
        Marketplace services by domain
        - Connection
        - Products
        - Inventory
        - Orders
        - Payments
        - Refunds
        - Webhooks
             |
             v
        Marketplace APIs

Inbound marketplace webhooks
    |
    v
WebhooksController -> WebhookOrchestrator -> ProcessWebhookJob
    |
    +--> Order/Product/Refund orchestration
    +--> InternalEvent rows

InternalEvent rows
    |
    v
SendInternalEventsJob -> ErpWebhookService -> ERP webhook endpoint
```

## Canonical Surface And Important Aliases

- `/api/v2/*` is the main production API.
- `/api/products/*` is local CRUD only and does not represent the full v2 product sync model.
- `/api/payments/*` is still outside `v2` but is active.
- `/api/marketplace/{marketplace}/webhook` is legacy compatibility; prefer `/api/v2/webhooks/{marketplace}`.
- `nuvemshop` is treated as an alias of `tiendanube` in several orchestrators and controllers.

## Main Layers

### Controllers

Controllers are intentionally marketplace-agnostic. They validate inputs, choose sync versus async behavior, and call orchestrators.

### Orchestrators

Orchestrators own the use-case logic: pull all orders, import one marketplace order, bulk dispatch inventory, direct-update product, process refund pull, complete OAuth, and so on.

### Marketplace capability services

Factories resolve domain-specific services instead of forcing every marketplace into one giant driver. Capability contracts include:

- `ProductsCapable`
- `InventoryCapable`
- `OrdersCapable`
- `PaymentsCapable`
- `RefundsCapable`
- `WebhooksCapable`
- `WebhookAdministrationCapable`
- `AuthCapable`

### Shared base and older contract layer

`MarketplaceBase` and `MarketplaceInterface` still define a shared driver-style abstraction with shared HTTP client, retry logic, token refresh orchestration, logging, and write skipping behavior. The newer application flow relies more on factories plus domain-specific capability services.

## Core Endpoint Families

### Root and local product CRUD

| Method | Path | Owner | What it does | Notes |
| --- | --- | --- | --- | --- |
| GET | `/api/` | `InventoryController@index` | Lists local inventory rows | Simple local DB listing |
| GET | `/api/products` | `SellingItemController@index` | Lists local `SellingItem` records | Local CRUD only |
| POST | `/api/products` | `SellingItemController@store` | Creates local selling item | No marketplace sync |
| GET | `/api/products/{id}` | `SellingItemController@show` | Gets local selling item | No marketplace sync |
| PUT | `/api/products/{id}` | `SellingItemController@update` | Updates local selling item | No marketplace sync |
| DELETE | `/api/products/{id}` | `SellingItemController@destroy` | Deletes local selling item | No marketplace sync |

### Payments

| Method | Path | Owner | What it does | Notes |
| --- | --- | --- | --- | --- |
| GET | `/api/payments` | `PaymentController@index` | Lists local payments with filters | DB-facing |
| POST | `/api/payments/register` | `PaymentController@registerPayment` | Registers a payment asynchronously or via orchestrator | ERP/manual registration path |
| POST | `/api/payments/register-sync` | `PaymentController@registerPaymentSync` | Registers a payment synchronously | Immediate response path |
| POST | `/api/payments/pull/{marketplace}` | `PaymentController@pullPayments` | Pulls payments from one marketplace | Uses `PaymentOrchestrator` |
| GET | `/api/payments/stats` | `PaymentController@getPaymentStats` | Returns payment stats | Reporting helper |
| GET | `/api/payments/{paymentId}` | `PaymentController@getPayment` | Returns a single payment | Local DB |
| POST | `/api/payments/{paymentId}/refund` | `PaymentController@refundPayment` | Triggers a payment refund | Marketplace-specific support required |
| GET | `/api/orders/{orderId}/payments` | `PaymentController@getOrderPayments` | Returns payments for one order | Local relation view |

### Refund test endpoints

These are development and troubleshooting endpoints under `/api/test/refunds/*`. They call marketplace refund services directly for fetch, parse, process, and connection inspection. They are not part of the production contract.

### Orders (`/api/v2/orders`)

| Method | Path | Owner | What it does | Notes |
| --- | --- | --- | --- | --- |
| GET | `/api/v2/orders/sync-progress` | `OrdersController@syncProgress` | Reports order pull progress | Queue/status helper |
| GET | `/api/v2/orders` | `OrdersController@index` | Lists local orders with optional relations and filters | Supports `exclude_returns` and `include` |
| GET | `/api/v2/orders/{id}` | `OrdersController@show` | Returns one local order | Resolves local order ID first |
| GET | `/api/v2/orders/{id}/label` | `OrdersController@getLabel` | Returns shipment label info | Uses `OrderOrchestrator` |
| POST | `/api/v2/orders/pull` | `OrdersController@pull` | Pulls orders from one marketplace immediately | Supports date/status filters and label fetch |
| POST | `/api/v2/orders/pull-all` | `OrdersController@pullAll` | Pulls orders from all connected marketplaces | Async by default, sync if `sync=true` |
| POST | `/api/v2/orders/import` | `OrdersController@import` | Imports one marketplace order by external ID | Explicit single-order ingest |
| POST | `/api/v2/orders/{id}/refresh` | `OrdersController@refresh` | Refreshes one local order from marketplace | Re-pulls current state |
| POST | `/api/v2/orders/{id}/acknowledge` | `OrdersController@acknowledge` | Acknowledges order at marketplace | Blocked by global push kill switch downstream |
| POST | `/api/v2/orders/{id}/ship` | `OrdersController@ship` | Ships order using carrier/tracking payload | Can trigger shipping label fetch |
| POST | `/api/v2/orders/{id}/cancel` | `OrdersController@cancel` | Cancels order at marketplace | Releases local stock when appropriate |
| GET | `/api/v2/orders/{orderId}/refunds` | `RefundsController@forOrder` | Returns refunds for order lines | Local refund projection |

Important order behavior:

- `pullAll` enqueues `PullAllOrdersJob` by default and only runs inline when `sync=true`.
- `index` always loads shipments and lines by default; extra relations like payments, refunds, and labels can be requested.
- `exclude_returns=true` or `module=logistics` filters out returned orders using both local and marketplace mapping state.

### Inventory (`/api/v2/inventory`)

| Method | Path | Owner | What it does | Notes |
| --- | --- | --- | --- | --- |
| POST | `/api/v2/inventory/push` | `InventorySyncController@syncSingle` | Synchronously pushes one SKU to selected marketplaces and stores | If quantity omitted, controller falls back to `Product.stock` |
| POST | `/api/v2/inventory/batches` | `InventorySyncController@bulkDispatch` | Enqueues bulk inventory sync jobs for selected marketplaces and stores | Main async push API |
| POST | `/api/v2/inventory/batches/all-stores` | `InventorySyncController@bulkDispatchToAll` | Enqueues bulk inventory sync jobs to all supported marketplaces | Async |
| POST | `/api/v2/inventory/pull-all` | `InventoryController@syncAllMarketplaces` | Enqueues marketplace inventory pull jobs | Local inventory import |
| GET | `/api/v2/inventory/pull-all/sync-progress` | `InventorySyncController@syncProgress` | Reports inventory sync progress | Queue/status helper |
| GET | `/api/v2/inventory/all` | `InventoryController@all` | Returns paginated inventory grouped by SKU for frontend use | Heavy query; use with caution |
| GET | `/api/v2/inventory/item/{sku}` | `InventoryController@itemBySku` | Returns local inventory detail by SKU | Reads local DB only |
| GET | `/api/v2/inventory/{sku}` | `InventoryController@itemBySku` | Convenience alias for single local SKU inventory | Short path alias |
| POST | `/api/v2/inventory/pull-per-marketplace` | `InventoryController@pullPerMarketplace` | Pulls inventory per marketplace once, sync or async | Optional `marketplace_code`, `sync`, `only_changed` |
| POST | `/api/v2/inventory/push-all-to/{marketplace}` | `InventorySyncController@pushAllToMarketplace` | Chunks all local products into inventory push jobs for one marketplace | Async dispatch helper |
| GET | `/api/v2/inventory/supported-marketplaces` | `InventorySyncController@supportedMarketplaces` | Returns supported inventory marketplaces | Factory-backed |
| POST | `/api/v2/inventory/push-from-erp/{marketplace}` | `InventorySyncController@syncFromErp` | Pushes ERP stock payload to one marketplace | ERP-driven stock fan-out entrypoint |

Inventory operational notes:

- Inventory push uses `InventoryOrchestrator`, not direct model writes.
- Bulk inventory max size is 1000 items per request.
- Async inventory push short-circuits under `DISABLE_MARKETPLACE_PUSH`.
- SKU resolution for marketplace writes prefers `MarketplaceProduct.external_sku` when mapping exists.
- `syncSingle` controller fallback to `Product.stock` is a weak point; callers should pass explicit quantity whenever possible.

### Catalogs (`/api/v2/catalogs`)

| Method | Path | Owner | What it does | Notes |
| --- | --- | --- | --- | --- |
| GET | `/api/v2/catalogs/products/categories/tiktok` | `CatalogsController@getTikTokCategories` | Returns TikTok categories | Marketplace helper |
| GET | `/api/v2/catalogs/brands` | `CatalogsController@getGlobalBrands` | Lists global brands | Shared ERP-wide brand table |
| POST | `/api/v2/catalogs/brands` | `CatalogsController@createGlobalBrand` | Creates global brand | Shared brand registry |
| GET | `/api/v2/catalogs/brands/{brandId}` | `CatalogsController@getGlobalBrand` | Gets one global brand | Numeric ID only |
| PUT | `/api/v2/catalogs/brands/{brandId}` | `CatalogsController@updateGlobalBrand` | Updates one global brand | Numeric ID only |
| DELETE | `/api/v2/catalogs/brands/{brandId}` | `CatalogsController@deleteGlobalBrand` | Deletes one global brand | Numeric ID only |
| GET | `/api/v2/catalogs/brands/{marketplace}` | `CatalogsController@getBrands` | Lists marketplace brand mappings | Per marketplace/connection |
| POST | `/api/v2/catalogs/brands/{marketplace}` | `CatalogsController@createBrand` | Creates marketplace brand mapping | Links global brand to marketplace brand |
| DELETE | `/api/v2/catalogs/brands/{marketplace}/{brandId}` | `CatalogsController@deleteBrand` | Deletes marketplace brand mapping | Mapping cleanup |

### Products (`/api/v2/products`)

| Method | Path | Owner | What it does | Notes |
| --- | --- | --- | --- | --- |
| GET | `/api/v2/products` | `ProductsController@index` | Lists local products, optionally triggers synchronous pull with query `pull=true` | Includes marketplace summary |
| GET | `/api/v2/products/sku/{sku}` | `ProductsController@searchBySku` | Returns product plus aggregated inventory and marketplace mapping info | Uses local DB joins |
| GET | `/api/v2/products/marketplace/{marketplace}/list` | `ProductsController@listByMarketplace` | Lists products scoped to a marketplace | DB/view helper |
| POST | `/api/v2/products/pull` | `ProductsController@pull` | Pulls products from one marketplace | Immediate execution |
| POST | `/api/v2/products/pull-all` | `ProductsController@pullAll` | Pulls products from all marketplaces | Can run sync or async depending on implementation path |
| POST | `/api/v2/products/pull-all/{marketplace}` | `ProductsController@pullAllFromMarketplace` | Pulls all products from one marketplace | Marketplace-specific helper |
| GET | `/api/v2/products/duplicates` | `ProductsController@duplicates` | Finds duplicate products | Works with merge service |
| POST | `/api/v2/products/merge` | `ProductsController@merge` | Merges duplicates | Uses `MergeProductsService` |
| GET | `/api/v2/products/{sku}/marketplaces` | `ProductsController@getMarketplaces` | Returns marketplace presence for a SKU | Route is defined twice in `routes/api.php`; treat later definition as effective |
| GET | `/api/v2/products/{sku}/details` | `ProductsController@details` | Returns extended product detail | Local plus marketplace projections |
| POST | `/api/v2/products/push-all-to/{marketplace}` | `ProductsController@pushAllToMarketplace` | Dispatches batch product push jobs for one marketplace | Async chunking |
| PUT | `/api/v2/products/{sku}/price` | `ProductsController@updatePrice` | Updates marketplace price | Delegates to orchestrator |
| PUT | `/api/v2/products/{sku}/update` | `ProductsController@updateProduct` | Updates local product record only | Can suppress or control fan-out |
| POST | `/api/v2/products/{sku}/fan-out` | `ProductsController@fanOutBySku` | Explicitly fans out local product changes to marketplaces | Returns 409 when kill switch active |
| PUT | `/api/v2/products/{sku}` | `ProductsController@directUpdate` | Direct marketplace update across relevant marketplaces plus local persistence | Marketplace-agnostic entrypoint |
| PUT | `/api/v2/products/{sku}/{marketplace}` | `ProductsController@directUpdateToMarketplace` | Direct marketplace update to one marketplace | Explicit target |
| POST | `/api/v2/products/{sku}/pull/{marketplace}` | `ProductsController@pullBySkuFromMarketplace` | Pulls one product by SKU from one marketplace | Single-item import |
| POST | `/api/v2/products/{sku}/push-stock/{marketplace}` | `ProductsController@pushStockBySku` | Pushes local stock by SKU to one marketplace | Uses inventory resolution |
| DELETE | `/api/v2/products/{sku}/{marketplace}` | `ProductsController@deleteFromMarketplace` | Deletes or unpublishes one marketplace listing | Outbound write |
| POST | `/api/v2/products/direct-create` | `ProductsController@directCreate` | Directly creates product on marketplaces and persists mapping | Bypasses initial local-only flow |
| POST | `/api/v2/products/direct-create/{marketplace}` | `ProductsController@directCreateToMarketplace` | Directly creates product on one marketplace | Explicit target |

Important product behavior:

- Inbound product pulls create `InternalEvent` rows of `product.updated`.
- Duplicate products are merged after pull using `MergeProductsService`.
- Stale marketplace products may be cleaned up after pull.
- Direct updates and internal marketplace-originated updates must set `skipMarketplaceFanout` to avoid feedback loops.

### Refunds (`/api/v2/refunds`)

| Method | Path | Owner | What it does | Notes |
| --- | --- | --- | --- | --- |
| GET | `/api/v2/refunds` | `RefundsController@index` | Lists local refunds | DB-facing |
| POST | `/api/v2/refunds/pull` | `RefundsController@pull` | Pulls refunds from one marketplace | Uses filters and orchestrator |
| POST | `/api/v2/refunds/pull-all` | `RefundsController@pullAll` | Pulls refunds from all marketplaces | Multi-marketplace |

### Webhooks (`/api/v2/webhooks`)

| Method | Path | Owner | What it does | Notes |
| --- | --- | --- | --- | --- |
| POST | `/api/v2/webhooks/{marketplace}` | `WebhooksController@handle` | Receives inbound webhook for a marketplace | Returns `200 OK` on success, `401` on failed verification |
| POST | `/api/v2/webhooks/subscribe` | `WebhooksController@subscribe` | Creates generic subscription | Uses `WebhookOrchestrator` |