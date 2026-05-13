---
name: tiktok-shop-api
description: 'Documentation and structural reference for the TikTok Shop Open Platform API (TTS API) v202309. Use when integrating with TikTok Shop, handling OAuth, generating HMAC-SHA256 signatures, managing products/inventory, fulfilling orders, or implementing webhooks.'
version: "1.0.0"
argument-hint: 'Specify the endpoint or workflow you need help with.'
user-invocable: true
---

# TikTok Shop Open Platform API (v202309)

## When to Use
- Implementing authentication or HMAC-SHA256 signature generation for TTS API.
- Creating or updating product catalogs and inventory.
- Handling order fulfillment, logistics tracking, or cancellations.
- Implementing webhook listeners for order/product events.
- Reconciling financial statements and withdrawals.

## Local References

Keep the detailed TikTok guidance in one-level-deep reference files so the skill stays small and loads progressively:

- [Authentication](./references/auth.md)
- [Products and Inventory](./references/products-inventory.md)
- [Orders and Fulfillment](./references/orders-fulfillment.md)
- [Webhooks](./references/webhooks.md)
- [Financials](./references/financials.md)

Read the smallest reference that matches the task before looking elsewhere.

## Developer Environment
- **Sandbox**: Test shops and automated test workflows up to 5 environments without affecting production.
- **Migration Deadline**: Pre-Sept 2023 legacy APIs are phased out by December 31, 2024. Always use `v202309`.

## Operational Constraints & Rate Limits
- Rate limits are based on a 1-minute sliding window (exceeding returns HTTP 429).
- **Product Management**: 20 QPS
- **Shop Management**: 3 QPS
- **User Information**: 600 RPM
- **POI Tasks**: 10 QPS

## Architectural Security and Authentication

### OAuth 2.0 Workflow
1. **Authorization Endpoint**: `https://www.tiktok.com/v2/auth/authorize/` (Redirect user)
2. **Token Endpoint**: `https://open-api.tiktok.com/oauth/access_token/` (Exchange code/refresh) POST
   ```json
   {
     "client_key": "YOUR_CLIENT_KEY",
     "client_secret": "YOUR_CLIENT_SECRET",
     "code": "AUTH_CODE_FROM_CALLBACK",
     "grant_type": "authorization_code"
   }
   ```
3. **Userinfo Endpoint**: `https://open-api.tiktok.com/user/info/`

### HMAC-SHA256 Signature Generation
Every API call must be signed using the app secret. Max valid timestamp window is 5 minutes.
1. Extract query parameters (excluding `access_token` and `sign`).
2. Alphabetical reordering of remaining keys.
3. Concatenate without delimiters (`{key}{value}`).
4. Prepend the API path (e.g., `/authorization/202309/shops`).
5. For POST/PUT (non-multipart), append the stringified JSON request body.
6. Wrap with app_secret: `BaseString = AppSecret + Path + SortedQuery + RequestBody + AppSecret`.
7. Hash using HMAC-SHA256 and encode to lowercase hex.

## Core API Workflows

### Catalog & Product Management
Update Product Inventory (`POST /product/202309/products/{product_id}/inventory/update`):
```json
{
  "skus": [{
    "id": "1729592969712207013",
    "inventory": [{ "warehouse_id": "7068517275539719942", "quantity": 999, "backorder_quantity": 888, "handling_time": 5 }]
  }]
}
```

### Order Fulfillment & Logistics
_KPIs: OTDR > 80%, LDR < 4%_

Search Orders (`POST /order/202309/orders/search`):
```json
{ "order_status": "UNPAID", "create_time_from": 1623812664, "sort_by": "CREATE_TIME" }
```

Get Order Detail (`POST /order/202309/orders`) — batch up to 50 IDs
Get Order Price Detail (`GET /order/202309/orders/{order_id}/price`)

**Fulfillment:**
Ship Package (`POST /fulfillment/202309/packages/{package_id}/ship`)
Mark as Shipped (`POST /fulfillment/202309/orders/{order_id}/packages`) — US/EMEA
Get Package Detail (`GET /fulfillment/202309/packages/{package_id}`)
Get Handover Slots (`GET /fulfillment/202309/packages/{package_id}/handover_time_slots`)
Get Shipping Label (`GET /fulfillment/202309/packages/{package_id}/shipping_document`)
Combine Packages (`POST /fulfillment/202309/packages/combine`)

**Cancellations:**
Cancel Order (`POST /return_refund/202309/cancellations`)
Search Cancellations (`POST /return_refund/202309/cancellations/search`)
Approve Cancellation (`POST /return_refund/202309/cancellations/approve`)
Reject Cancellation (`POST /return_refund/202309/cancellations/reject`)

**Returns & Refunds:**
Search Returns (`POST /return_refund/202309/returns/search`)
Approve Return (`POST /return_refund/202309/returns/approve`)
Reject Return (`POST /return_refund/202309/returns/reject`)
Calculate Refund (`POST /return_refund/202309/refunds/calculate`)
Get Aftersale Eligibility (`GET /return_refund/202309/aftersale/eligibility`)

**Logistics:**
Delivery Options (`GET /logistics/202309/delivery_options`)
Shipping Providers (`GET /logistics/202309/delivery_options/{delivery_option_id}/shipping_providers`)
Warehouses (`GET /logistics/202309/warehouses`)

### Webhooks (Event-Driven)
- Delivery: HTTPS POST JSON to registered URL.
- Requirements: Must use HTTPS, Acknowledge with HTTP 200 within 3 seconds, Validate signature in `Authorization` header.
- Key Topics: `ORDER_STATUS_CHANGE`, `PRODUCT_STATUS_CHANGE`, `NEW_MESSAGE`, `CANCELLATION_STATUS_CHANGE`.

### Customer Service Messaging
Send Message (`POST /customer_service/202309/conversations/{conversation_id}/messages`):
- `TEXT`
- `ORDER_CARD`
- `LOGISTICS_CARD`

### Financials
- Generated daily at 0:00 UTC, closed 24 hrs later.
- Statements (`GET /finance/202309/statements`)
- Withdrawals (`GET /finance/202309/withdrawals`)