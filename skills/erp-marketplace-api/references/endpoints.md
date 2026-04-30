# ERP Marketplace API Endpoints

Last reviewed: 2026-04-30

Source: `routes/api.php`, registered by `bootstrap/app.php`.

Use this file as the route inventory. If a controller docblock disagrees with the path below, trust `routes/api.php` first.

## Root And Auth Helper

| Method | Path | Owner | Purpose | Notes |
| --- | --- | --- | --- | --- |
| GET | `/api/user` | Laravel route closure | Return the authenticated user | Explicit `auth:sanctum` middleware. |
| GET | `/api/` | `InventoryController` -> `InventoryOrchestrator` | List local inventory rows | Root landing endpoint outside `/api/v2/*`. |

## Local Product CRUD

| Method | Path | Owner | Purpose | Notes |
| --- | --- | --- | --- | --- |
| GET | `/api/products` | `SellingItemController` | List local selling items | Local DB only. |
| POST | `/api/products` | `SellingItemController` | Create a local selling item | No marketplace sync. |
| GET | `/api/products/{id}` | `SellingItemController` | Show one local selling item | No marketplace sync. |
| PUT | `/api/products/{id}` | `SellingItemController` | Update one local selling item | No marketplace sync. |
| DELETE | `/api/products/{id}` | `SellingItemController` | Delete one local selling item | No marketplace sync. |

## Payments

| Method | Path | Owner | Purpose | Notes |
| --- | --- | --- | --- | --- |
| GET | `/api/payments` | `PaymentController` -> `PaymentOrchestrator` | List local payments | Supports status, marketplace, limit, and offset filters. |
| POST | `/api/payments/register` | `PaymentController` -> `RegisterPaymentJob` | Register a payment asynchronously | Requires local `order_id`. |
| POST | `/api/payments/register-sync` | `PaymentController` -> `PaymentOrchestrator` | Register a payment synchronously | Testing and webhook-friendly path. |
| POST | `/api/payments/pull/{marketplace}` | `PaymentController` -> `PaymentOrchestrator` | Pull payments from one marketplace | Active non-v2 surface. |
| GET | `/api/payments/stats` | `PaymentController` | Return payment stats | Reporting helper. |
| GET | `/api/payments/{paymentId}` | `PaymentController` | Show one local payment | Local DB read. |
| POST | `/api/payments/{paymentId}/refund` | `PaymentController` -> `PaymentOrchestrator` | Refund a payment | Marketplace support depends on connection and service. |
| GET | `/api/orders/{orderId}/payments` | `PaymentController` -> `PaymentOrchestrator` | List payments for one order | Cross-links orders to payments. |

## Refund Test Endpoints

| Method | Path | Owner | Purpose | Notes |
| --- | --- | --- | --- | --- |
| POST | `/api/test/refunds/fetch` | `Api\RefundTestController` -> `FetchMarketplaceRefunds` | Dispatch refund fetch job for all connections | Development and troubleshooting only. |
| GET | `/api/test/refunds/fetch/{connectionId}` | `Api\RefundTestController` -> `MarketplaceRefundFactory` | Fetch refunds for one connection synchronously | Debug helper. |
| POST | `/api/test/refunds/parse/{connectionId}` | `Api\RefundTestController` -> `MarketplaceRefundFactory` | Parse one refund payload | Debug helper. |
| POST | `/api/test/refunds/process` | `Api\RefundTestController` -> `ProcessMarketplaceRefund` | Dispatch normalized refund processing | Debug helper. |
| GET | `/api/test/refunds/connections` | `Api\RefundTestController` -> `MarketplaceRefundFactory` | List refund-capable connections | Debug helper. |

## Legacy Compatibility Webhook

| Method | Path | Owner | Purpose | Notes |
| --- | --- | --- | --- | --- |
| POST | `/api/marketplace/{marketplace}/webhook` | `MarketplaceWebhookController` -> legacy `MarketplaceFactory` path | Receive marketplace webhook through the older driver abstraction | Compatibility path; prefer `/api/v2/webhooks/{marketplace}`. |

## V2 Orders

| Method | Path | Owner | Purpose | Notes |
| --- | --- | --- | --- | --- |
| GET | `/api/v2/orders/sync-progress` | `OrdersController` | Return pull-progress status | Queue and sync helper. |
| GET | `/api/v2/orders` | `OrdersController` -> `OrderOrchestrator` | List local orders | Supports filters and optional relation loading. |
| GET | `/api/v2/orders/{id}` | `OrdersController` -> `OrderOrchestrator` | Show one local order | Local DB projection. |
| GET | `/api/v2/orders/{id}/label` | `OrdersController` -> `OrderOrchestrator` | Get shipping label info for an order | Label retrieval surface. |
| POST | `/api/v2/orders/pull` | `OrdersController` -> `OrderOrchestrator` | Pull orders from one marketplace | Marketplace-agnostic import entrypoint. |
| POST | `/api/v2/orders/pull-all` | `OrdersController` -> `OrderOrchestrator` | Pull orders from all connected marketplaces | Bulk import entrypoint. |
| POST | `/api/v2/orders/import` | `OrdersController` -> `OrderOrchestrator` | Import one marketplace order by external ID | Single-order ingest. |
| POST | `/api/v2/orders/{id}/refresh` | `OrdersController` -> `OrderOrchestrator` | Refresh one order from marketplace state | Re-fetch current order state. |
| POST | `/api/v2/orders/{id}/acknowledge` | `OrdersController` -> `OrderOrchestrator` | Acknowledge an order at the marketplace | Outbound write path. |
| POST | `/api/v2/orders/{id}/ship` | `OrdersController` -> `OrderOrchestrator` | Ship an order | Outbound write path. |
| POST | `/api/v2/orders/{id}/cancel` | `OrdersController` -> `OrderOrchestrator` | Cancel an order | Outbound write path. |
| GET | `/api/v2/orders/{orderId}/refunds` | `RefundsController` -> `RefundOrchestrator` | List refunds for one order | Order-scoped refund view. |

## V2 Inventory

| Method | Path | Owner | Purpose | Notes |
| --- | --- | --- | --- | --- |
| POST | `/api/v2/inventory/push` | `InventorySyncController` -> `InventoryOrchestrator` | Push one SKU to selected marketplaces and stores | Synchronous push. |
| POST | `/api/v2/inventory/batches` | `InventorySyncController` -> `InventoryOrchestrator` | Dispatch bulk inventory sync jobs | Main async push path. |
| POST | `/api/v2/inventory/batches/all-stores` | `InventorySyncController` -> `InventoryOrchestrator` | Dispatch bulk sync jobs across all stores | Async. |
| POST | `/api/v2/inventory/pull-all` | `InventoryController` -> `InventoryOrchestrator` | Pull inventory from all connected marketplaces | Dispatches pull jobs. |
| GET | `/api/v2/inventory/pull-all/sync-progress` | `InventorySyncController` | Return inventory sync progress | Queue helper. |
| GET | `/api/v2/inventory/all` | `InventoryController` | Return grouped inventory for frontend use | Heavy query path. |
| GET | `/api/v2/inventory/item/{sku}` | `InventoryController` -> `InventoryOrchestrator` | Return one inventory item by SKU | Local inventory read. |
| GET | `/api/v2/inventory/{sku}` | `InventoryController` -> `InventoryOrchestrator` | Return one inventory item by SKU | Convenience alias of the item route. |
| POST | `/api/v2/inventory/pull-per-marketplace` | `InventoryController` -> `InventoryOrchestrator` | Pull inventory once per marketplace code | Sync or async depending on implementation path. |
| POST | `/api/v2/inventory/push-all-to/{marketplace}` | `InventorySyncController` -> `InventoryOrchestrator` | Push all inventory to one marketplace | Chunked async helper. |
| GET | `/api/v2/inventory/supported-marketplaces` | `InventorySyncController` -> `InventoryOrchestrator` | List supported inventory marketplaces | Discovery helper. |
| POST | `/api/v2/inventory/push-from-erp/{marketplace}` | `InventorySyncController` -> `InventoryOrchestrator` | Push ERP stock payload to one marketplace | ERP-driven stock fan-out path. |

## V2 Catalogs

| Method | Path | Owner | Purpose | Notes |
| --- | --- | --- | --- | --- |
| GET | `/api/v2/catalogs/products/categories/tiktok` | `CatalogsController` | Return TikTok categories | Marketplace helper. |
| GET | `/api/v2/catalogs/brands` | `CatalogsController` | List global brands | Shared brand registry. |
| POST | `/api/v2/catalogs/brands` | `CatalogsController` | Create a global brand | Shared brand registry. |
| GET | `/api/v2/catalogs/brands/{brandId}` | `CatalogsController` | Show one global brand | Numeric `brandId` constraint. |
| PUT | `/api/v2/catalogs/brands/{brandId}` | `CatalogsController` | Update one global brand | Numeric `brandId` constraint. |
| DELETE | `/api/v2/catalogs/brands/{brandId}` | `CatalogsController` | Delete one global brand | Numeric `brandId` constraint. |
| GET | `/api/v2/catalogs/brands/{marketplace}` | `CatalogsController` | List marketplace brand mappings | Per-marketplace mapping surface. |
| POST | `/api/v2/catalogs/brands/{marketplace}` | `CatalogsController` | Create marketplace brand mapping | Links global and marketplace brands. |
| DELETE | `/api/v2/catalogs/brands/{marketplace}/{brandId}` | `CatalogsController` | Delete marketplace brand mapping | Mapping cleanup. |

## V2 Products

| Method | Path | Owner | Purpose | Notes |
| --- | --- | --- | --- | --- |
| GET | `/api/v2/products` | `ProductsController` -> `ProductOrchestrator` | List local products | Supports listing and a synchronous pull shortcut through query params. |
| GET | `/api/v2/products/sku/{sku}` | `ProductsController` | Return one product with aggregated inventory and marketplace data | SKU lookup view. |
| GET | `/api/v2/products/marketplace/{marketplace}/list` | `ProductsController` | List products scoped to one marketplace | Marketplace listing helper. |
| POST | `/api/v2/products/pull` | `ProductsController` -> `ProductOrchestrator` | Pull products from one marketplace | Immediate pull entrypoint. |
| POST | `/api/v2/products/pull-all` | `ProductsController` -> `ProductOrchestrator` | Pull products from all marketplaces | Bulk pull entrypoint. |
| POST | `/api/v2/products/pull-all/{marketplace}` | `ProductsController` -> `ProductOrchestrator` | Pull all products from one marketplace | Marketplace-specific bulk pull. |
| GET | `/api/v2/products/duplicates` | `ProductsController` | Find duplicate products | Merge preparation helper. |
| POST | `/api/v2/products/merge` | `ProductsController` -> merge services | Merge duplicate products | Local consolidation path. |
| GET | `/api/v2/products/{sku}/marketplaces` | `ProductsController` | Return marketplaces for one SKU | Declared twice in `routes/api.php`; verify live routing before editing behavior. |
| GET | `/api/v2/products/{sku}/details` | `ProductsController` | Return extended product details | Local plus marketplace projection. |
| POST | `/api/v2/products/push-all-to/{marketplace}` | `ProductsController` -> `PushProductBatchJob` | Push all products to one marketplace | Async chunking path. |
| PUT | `/api/v2/products/{sku}/price` | `ProductsController` -> `ProductOrchestrator` | Update marketplace price | Outbound write path. |
| PUT | `/api/v2/products/{sku}/update` | `ProductsController` -> `ProductOrchestrator` | Update local product data | Local-first update path. |
| POST | `/api/v2/products/{sku}/fan-out` | `ProductsController` -> `FanOutProductUpdateJob` | Fan out a local product update to marketplaces | Blocked by global push kill switch. |
| PUT | `/api/v2/products/{sku}` | `ProductsController` -> `ProductOrchestrator` | Directly update marketplaces and local persistence for one SKU | Marketplace-agnostic direct write. |
| PUT | `/api/v2/products/{sku}/{marketplace}` | `ProductsController` -> `ProductOrchestrator` | Directly update one marketplace for one SKU | Explicit target write path. |
| POST | `/api/v2/products/{sku}/pull/{marketplace}` | `ProductsController` -> `ProductOrchestrator` | Pull one product by SKU from one marketplace | Single-item import. |
| POST | `/api/v2/products/{sku}/push-stock/{marketplace}` | `ProductsController` -> `ProductOrchestrator` | Push local stock for one SKU to one marketplace | Stock-specific outbound write. |
| DELETE | `/api/v2/products/{sku}/{marketplace}` | `ProductsController` -> `ProductOrchestrator` | Delete or unpublish a marketplace listing | Outbound write path. |
| POST | `/api/v2/products/direct-create` | `ProductsController` -> `ProductOrchestrator` | Directly create a product through marketplace flows | Persists returned mapping. |
| POST | `/api/v2/products/direct-create/{marketplace}` | `ProductsController` -> `ProductOrchestrator` | Directly create a product on one marketplace | Explicit target create path. |

## V2 Refunds

| Method | Path | Owner | Purpose | Notes |
| --- | --- | --- | --- | --- |
| GET | `/api/v2/refunds` | `RefundsController` -> `RefundOrchestrator` | List local refunds | Supports marketplace and since filters. |
| POST | `/api/v2/refunds/pull` | `RefundsController` -> `RefundOrchestrator` | Pull refunds from one marketplace | Marketplace-agnostic pull path. |
| POST | `/api/v2/refunds/pull-all` | `RefundsController` -> `RefundOrchestrator` | Pull refunds from all connected marketplaces | Multi-marketplace pull. |

## V2 Webhooks

| Method | Path | Owner | Purpose | Notes |
| --- | --- | --- | --- | --- |
| POST | `/api/v2/webhooks/subscribe` | `WebhooksController` -> `WebhookOrchestrator` | Create a generic webhook subscription | Administration helper. |
| DELETE | `/api/v2/webhooks/subscribe/{subscriptionId}` | `WebhooksController` -> `WebhookOrchestrator` | Delete a generic webhook subscription | Requires `marketplace_code` in request data. |
| GET | `/api/v2/webhooks/subscriptions` | `WebhooksController` -> `WebhookOrchestrator` | List generic webhook subscriptions | Requires `marketplace_code` query input. |
| GET | `/api/v2/webhooks/{marketplace}/subscriptions` | `WebhooksController` | List marketplace-specific subscriptions | Administration path. |
| POST | `/api/v2/webhooks/{marketplace}/subscriptions` | `WebhooksController` | Create marketplace-specific subscription | Administration path. |
| PATCH | `/api/v2/webhooks/{marketplace}/subscriptions/{subscriptionId}` | `WebhooksController` | Update marketplace-specific subscription | Administration path. |
| DELETE | `/api/v2/webhooks/{marketplace}/subscriptions/{subscriptionId}` | `WebhooksController` | Delete marketplace-specific subscription | Administration path. |
| POST | `/api/v2/webhooks/{marketplace}/test-notification` | `WebhooksController` | Trigger marketplace webhook test notification | Administration path. |
| GET | `/api/v2/webhooks/{marketplace}/event-types` | `WebhooksController` | List supported event types | Discovery helper. |
| POST | `/api/v2/webhooks/{marketplace}` | `WebhooksController` -> `WebhookOrchestrator` | Receive an inbound marketplace webhook | Canonical inbound webhook path. |
| POST | `/api/v2/webhooks/{marketplace}/register` | `WebhooksController` | Register webhooks for a marketplace | Administration helper. |
| GET | `/api/v2/webhooks/{marketplace}/list` | `WebhooksController` | List registered webhooks | Administration helper. |
| DELETE | `/api/v2/webhooks/{marketplace}/delete-all` | `WebhooksController` | Delete all registered webhooks for a marketplace | Administration helper. |
| POST | `/api/v2/webhooks/test/{marketplace}` | `WebhooksController` -> `WebhookOrchestrator` | Simulate inbound webhook delivery | Test helper. |
| ANY | `/api/v2/webhooks/debug/{marketplace}` | Route closure | Log request method, headers, and body | Debug-only endpoint. |

## V2 Connections

| Method | Path | Owner | Purpose | Notes |
| --- | --- | --- | --- | --- |
| GET | `/api/v2/connections` | `ConnectionsController` -> `ConnectionOrchestrator` | List marketplace connections | Returns simplified connection objects. |
| GET | `/api/v2/connections/{marketplace}` | `ConnectionsController` -> `ConnectionOrchestrator` | Return connection status for one marketplace | Route-order hazard for `test-all`; verify live resolution before changing. |
| POST | `/api/v2/connections/init/{marketplace}` | `ConnectionsController` -> `ConnectionOrchestrator` | Initialize one marketplace connection | Accepts `store_id`. |
| POST | `/api/v2/connections/init-all` | `ConnectionsController` -> `ConnectionOrchestrator` | Initialize all marketplace connections | Bulk init path. |
| GET | `/api/v2/connections/{marketplace}/test` | `ConnectionsController` -> `ConnectionOrchestrator` | Test one marketplace connection | Verification helper. |
| GET | `/api/v2/connections/test-all` | `ConnectionsController` -> `ConnectionOrchestrator` | Test all marketplace connections | Declared after `/{marketplace}`; likely shadowed until route constraints are tightened. |
| POST | `/api/v2/connections/{marketplace}/refresh` | `ConnectionsController` -> `ConnectionOrchestrator` | Refresh tokens for one marketplace | Token lifecycle helper. |
| POST | `/api/v2/connections/refresh-all` | `ConnectionsController` -> `ConnectionOrchestrator` | Refresh tokens for all marketplaces | Bulk token refresh. |
| GET | `/api/v2/connections/oauth/callback` | `ConnectionsController` -> `ConnectionOrchestrator` | Complete connection OAuth callback flow | Separate from `/api/v2/oauth/{marketplace}/callback`. |
| POST | `/api/v2/connections/walmart/authorize` | `ConnectionsController` -> `WalmartConnectionService` | Authorize Walmart with ERP-supplied seller credentials | No browser OAuth required for this repo path. |
| POST | `/api/v2/connections/authorize` | `ConnectionsController` -> `ConnectionOrchestrator` | Store credentials for a marketplace | Non-OAuth and direct token flow. |
| DELETE | `/api/v2/connections/{marketplace}/delete` | `ConnectionsController` -> `ConnectionOrchestrator` | Disconnect a marketplace | Cleanup entrypoint. |
| DELETE | `/api/v2/connections/{marketplace}/cleanup` | `ConnectionsController` -> `ConnectionOrchestrator` | Clean up a marketplace connection | Destructive maintenance path. |
| DELETE | `/api/v2/connections/cleanup-all` | `ConnectionsController` -> `ConnectionOrchestrator` | Clean up all marketplace connections | Destructive bulk maintenance. |

## V2 OAuth

| Method | Path | Owner | Purpose | Notes |
| --- | --- | --- | --- | --- |
| GET | `/api/v2/oauth/{marketplace}/authorize` | `OAuthController` | Return marketplace authorization URL | Browser auth bootstrap. |
| GET | `/api/v2/oauth/{marketplace}/redirect` | `OAuthController` | Redirect to the marketplace authorization page | Browser redirect helper. |
| GET | `/api/v2/oauth/{marketplace}/callback` | `OAuthController` | Handle marketplace OAuth callback | Returns success or failure views. |
| POST | `/api/v2/oauth/{marketplace}/refresh` | `OAuthController` | Refresh access token for a marketplace connection | Token refresh path. |

## V2 Dev And Job Helpers

| Method | Path | Owner | Purpose | Notes |
| --- | --- | --- | --- | --- |
| GET | `/api/v2/dev/test-connection/{marketplace}` | `DevToolsController` | Test a marketplace connection using debug logic | Should be protected outside local use. |
| GET | `/api/v2/dev/config/{marketplace}` | `DevToolsController` | Return masked marketplace config | Explicitly blocked outside local environment. |
| GET | `/api/v2/dev/token-status/{marketplace}` | `DevToolsController` | Return connection token status | Debug helper. |
| POST | `/api/v2/dev/force-refresh/{marketplace}` | `DevToolsController` | Force token refresh | Debug helper. |
| POST | `/api/v2/dev/refresh-shop/{marketplace}` | `DevToolsController` | Refresh and persist shop identifier data | Currently TikTok-specific. |
| GET | `/api/v2/jobs/{id}/progress` | `JobController` | Return cached progress for a background job | Reads `job_progress_{id}` cache key. |

## V2 Attachments

| Method | Path | Owner | Purpose | Notes |
| --- | --- | --- | --- | --- |
| GET | `/api/v2/attachments/test` | `AttachmentsController` | Simple attachment health check | Returns a plain `Ok`. |
| POST | `/api/v2/attachments` | `AttachmentsController` | Upload an attachment | Generic file upload helper. |
| GET | `/api/v2/attachments/{filename}` | `AttachmentsController` | Read an attachment by filename | File-serving helper. |

## Internal ERP Relay

| Method | Path | Owner | Purpose | Notes |
| --- | --- | --- | --- | --- |
| POST | `/api/marketplaces/webhook` | `InternalWebhookController` -> `ErpWebhookService` | Receive internal webhook payload and forward selected events to ERP | Forwards `product_pulled` and `product.updated`; other events are acknowledged and ignored. |