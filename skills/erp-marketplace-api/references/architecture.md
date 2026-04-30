# ERP Marketplace API Architecture

Last reviewed: 2026-04-30

## Registration And Middleware

- `bootstrap/app.php` registers `routes/api.php`, `routes/web.php`, `routes/console.php`, and the `/up` health route.
- API requests run with CORS prepended and `TenantInterceptor` appended through application middleware configuration.
- The route file itself applies very little explicit auth middleware. Do not assume a route is protected just because it looks operationally sensitive.

## Request And Event Flow

```text
ERP or frontend client
    -> routes/api.php
    -> controller
    -> orchestrator
    -> marketplace factory or service
    -> local models and jobs
    -> external marketplace APIs

Inbound marketplace webhook
    -> WebhooksController
    -> WebhookOrchestrator
    -> ProcessWebhookJob or direct orchestration
    -> local models and InternalEvent rows
    -> SendInternalEventsJob
    -> ErpWebhookService
    -> ERP webhook endpoint
```

## Layering Rules

- Controllers should stay marketplace-agnostic and thin. They validate input, choose sync versus async execution, and return HTTP responses.
- Orchestrators own use-case logic such as pull-all, import-one, fan-out, refund processing, label fetch, or connection lifecycle.
- Marketplace-specific behavior should live below the orchestrator boundary in `app/Marketplaces/Factories`, `app/Marketplaces/Services`, `app/Marketplaces/Drivers`, and mappers.
- Jobs own async fan-out, bulk pulls, webhook processing, refund processing, and ERP event delivery.

## Controller To Orchestrator Map

| Domain | Controller | Main orchestrator or owner | Frequent jobs or adjacent owners |
| --- | --- | --- | --- |
| Orders | `OrdersController` | `OrderOrchestrator` | `PullAllOrdersJob`, `FetchShipmentLabelJob`, `TikTokShipAndFetchLabelJob` |
| Products | `ProductsController` | `ProductOrchestrator` | `PullAllProductsJob`, `PushProductBatchJob`, `FanOutProductUpdateJob`, `PullProductJob`, `SyncProductToMarketplaceJob` |
| Inventory reads and pulls | `InventoryController` | `InventoryOrchestrator` | `PullMarketplaceInventoryJob` |
| Inventory pushes | `InventorySyncController` | `InventoryOrchestrator` | `BulkInventorySyncJob`, `BulkInventoryUpdateJob` |
| Refunds | `RefundsController` | `RefundOrchestrator` | `FetchMarketplaceRefunds`, `ProcessMarketplaceRefund` |
| Payments | `PaymentController` | `PaymentOrchestrator` | `RegisterPaymentJob` |
| Webhooks | `WebhooksController` | `WebhookOrchestrator` | `ProcessWebhookJob` |
| Connections | `ConnectionsController` | `ConnectionOrchestrator` | Marketplace connection services, especially Walmart credential flow |
| OAuth | `OAuthController` | Direct connection-service ownership | Marketplace OAuth handlers and token refresh helpers |
| Catalogs | `CatalogsController` | Controller-owned CRUD and service calls | `TikTokProductService` for category helpers |
| Attachments | `AttachmentsController` | Controller-owned file handling | `ProcessFileUpload` is present for adjacent async use |
| Internal event relay | `InternalWebhookController` | `ErpWebhookService` | `SendInternalEventsJob` owns the main queued ERP egress path |
| Legacy webhook compatibility | `MarketplaceWebhookController` | Older `MarketplaceFactory` driver path | Use only when the task explicitly targets compatibility behavior |

## High-Value Jobs

- `ProcessWebhookJob`: normalizes inbound marketplace webhooks and protects local side effects.
- `SendInternalEventsJob`: sends queued `InternalEvent` rows to the ERP webhook endpoint.
- `PullAllOrdersJob`: async multi-marketplace order import path.
- `PullAllProductsJob`: async product import path.
- `BulkInventorySyncJob` and `BulkInventoryUpdateJob`: async stock fan-out paths.
- `FetchMarketplaceRefunds` and `ProcessMarketplaceRefund`: refund polling and local refund application.
- `RegisterPaymentJob`: async payment registration path.

## Where To Step Next

- Route ownership: `routes/api.php`
- Application flow: `app/Http/Controllers` then `app/Application/Orchestrators`
- Marketplace behavior: `app/Marketplaces/Factories`, `app/Marketplaces/Services`, `app/Marketplaces/Drivers`, `app/Marketplaces/Mappers`
- Local persistence and events: `app/Models`, especially inventory, orders, refunds, marketplace connection, marketplace product, and internal event models
- External config and auth: `config/marketplaces.php` and `config/services.php`