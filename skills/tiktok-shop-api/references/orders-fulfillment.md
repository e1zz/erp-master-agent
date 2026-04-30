# TikTok Shop Orders and Fulfillment

## Use When

- You need order import, search, or detail retrieval.
- Working with fulfillment: shipping, tracking, labels, Ready To Ship (RTS).
- Handling cancellations (buyer-initiated, seller-initiated, platform-initiated).
- Working with returns and refunds.
- Understanding the order status state machine.

## API References (v202309)

**Base URL:** `https://open-api.tiktokglobalshop.com`

### 1. Search Orders

`POST /order/202309/orders/search`

**Request Body:**
```json
{
  "page_size": 50,
  "page_token": "",
  "order_status": "AWAITING_SHIPMENT",
  "create_time_from": 1690000000,
  "create_time_to": 1700000000,
  "update_time_from": 1690000000,
  "update_time_to": 1700000000,
  "sort_by": "CREATE_TIME",
  "sort_type": "DESC"
}
```

**Filter Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `page_size` | int | Results per page (max 100) |
| `page_token` | string | Cursor for next page |
| `order_status` | string | Filter by status (see status table below) |
| `create_time_from/to` | int | Unix timestamp range for order creation |
| `update_time_from/to` | int | Unix timestamp range for last update |
| `sort_by` | string | `CREATE_TIME` or `UPDATE_TIME` |
| `sort_type` | string | `ASC` or `DESC` |

### 2. Get Order Detail

`POST /order/202309/orders`

**Request Body:**
```json
{
  "order_ids": ["576123456789012345"]
}
```

Supports batch retrieval of up to **50 order IDs** per request.

**Full Response Example:**
```json
{
  "code": 0,
  "data": {
    "orders": [
      {
        "order_id": "576123456789012345",
        "order_status": "AWAITING_SHIPMENT",
        "create_time": 1690000000,
        "update_time": 1690500000,
        "payment": {
          "currency": "MXN",
          "sub_total": "299.00",
          "shipping_fee": "49.00",
          "shipping_fee_seller_discount": "0.00",
          "shipping_fee_platform_discount": "0.00",
          "total_amount": "348.00",
          "product_original_total_price": "299.00",
          "original_shipping_fee": "49.00",
          "seller_discount": "0.00",
          "platform_discount": "0.00",
          "tax": "0.00"
        },
        "buyer": {
          "email": "buyer@example.com",
          "first_name": "Juan",
          "last_name": "Pérez"
        },
        "recipient_address": {
          "name": "Juan Pérez",
          "phone_number": "+52-55-1234-5678",
          "full_address": "Av. Reforma 222, Col. Juárez, Cuauhtémoc",
          "city": "Ciudad de México",
          "state": "CDMX",
          "zipcode": "06600",
          "country_code": "MX"
        },
        "line_items": [
          {
            "id": "item_line_123",
            "product_id": "17290000001",
            "product_name": "Premium Cotton T-Shirt",
            "sku_id": "17293847291",
            "seller_sku": "SKU-TSHIRT-M",
            "quantity": 1,
            "original_price": "299.00",
            "sale_price": "299.00",
            "platform_discount": "0.00",
            "seller_discount": "0.00"
          }
        ],
        "packages": [
          {
            "package_id": "pkg_12345",
            "package_status": "INITIAL"
          }
        ],
        "shipping_provider": "J&T Express",
        "shipping_type": "TIKTOK",
        "is_buyer_request_cancel": false,
        "cancel_reason": "",
        "warehouse_id": "7130000001"
      }
    ]
  }
}
```

## Order Status State Machine

```
UNPAID → ON_HOLD → AWAITING_SHIPMENT → AWAITING_COLLECTION → IN_TRANSIT → DELIVERED → COMPLETED
                                 ↓                                                        ↓
                             CANCELLED                                          (Return/Refund)
```

### Order Statuses

| Status | Description |
|---|---|
| `UNPAID` | Order placed, payment not yet completed |
| `ON_HOLD` | Paid, in buyer "remorse period" (cooldown allowing free cancellation) |
| `AWAITING_SHIPMENT` | Ready for seller to fulfill — **primary actionable status** |
| `AWAITING_COLLECTION` | Logistics order placed, package waiting for carrier pickup |
| `IN_TRANSIT` | Package picked up by carrier, in transit |
| `DELIVERED` | Package delivered to buyer |
| `COMPLETED` | Delivered + warranty/return period expired — order is finalized |
| `CANCELLED` | Order cancelled (by buyer, seller, or platform) |

**Key Notes:**
- `ON_HOLD` is the remorse period (typically 1 hour). Buyer can cancel freely during this time. Seller cannot fulfill yet.
- Transition to `CANCELLED` requires all items in the order to be cancelled.
- `COMPLETED` means the return window has closed and funds are eligible for settlement.

### Cancellation Flow

**Buyer-Initiated (During Remorse):**
- Buyer cancels during `ON_HOLD` → order becomes `CANCELLED` automatically.
- No seller action required.

**Buyer-Initiated (After Remorse):**
- Buyer requests cancellation → `is_buyer_request_cancel: true` on the order.
- Seller must approve or reject within **24-48 hours**.
- If seller takes no action → platform may auto-approve the cancellation.
- Seller can reject by successfully shipping the package (in some markets).

**Seller-Initiated:**
- Seller cancels directly (e.g., stock unavailable).
- Order transitions to `CANCELLED`.

### Key API Field: `is_buyer_request_cancel`

Check this boolean on order detail to detect pending buyer cancellation requests:
```json
{
  "is_buyer_request_cancel": true,
  "cancel_reason": "Changed mind"
}
```

## Fulfillment (Shipping)

### 1. Get Shipping Providers

`GET /fulfillment/202309/shipping_providers`

Returns available shipping providers for the seller's region.

### 2. Ship Package (Ready To Ship / RTS)

`POST /fulfillment/202309/packages/{package_id}/ship`

**Request Body (Seller-arranged shipping):**
```json
{
  "tracking_number": "JT123456789MX",
  "shipping_provider_id": "SELLER_SHIPPING_PROVIDER_ID"
}
```

**Request Body (TikTok-arranged shipping):**
```json
{
  "pick_up_type": "PICKUP",
  "pick_up_slot": {
    "start_time": 1690000000,
    "end_time": 1690086400
  }
}
```

**Notes:**
- Operations are at the **package level**, not the order level.
- One order can have multiple packages (split shipments).
- For TikTok-arranged shipping, select a pickup slot instead of providing a tracking number.

### 3. Get Shipping Labels

`GET /fulfillment/202309/packages/{package_id}/shipping_document`

**Query Parameters:**

| Parameter | Description |
|---|---|
| `document_type` | `SHIPPING_LABEL`, `PICK_LIST`, `SL_PL` (combined) |
| `document_size` | `A5`, `A6` |

Returns a PDF document URL for downloading/printing.

### 4. Update Tracking Number

`POST /fulfillment/202309/packages/{package_id}/shipping_info/update`

```json
{
  "tracking_number": "JT123456789MX",
  "shipping_provider_id": "PROVIDER_ID"
}
```

### 5. Package Statuses

| Status | Description |
|---|---|
| `INITIAL` | Package created, not yet shipped |
| `SHIPPING_LABEL_GENERATED` | Label generated, ready for pickup |
| `PICKED_UP` | Carrier picked up the package |
| `IN_TRANSIT` | In transit |
| `DELIVERED` | Delivered to buyer |
| `CANCELLED` | Package cancelled |

### Shipping Types

| Type | Description |
|---|---|
| `TIKTOK` | TikTok-arranged logistics — platform manages carrier and labels |
| `SELLER` | Seller-arranged shipping — seller provides tracking number |
| `PLATFORM_DIRECT` | Platform direct fulfillment (FBT/Fulfilled by TikTok) |

## Returns and Refunds

### Get Return/Refund List

`POST /return_refund/202309/returns/search`

### Get Return Detail

`GET /return_refund/202309/returns/{return_id}`

### Seller Actions on Returns

`POST /return_refund/202309/returns/{return_id}/approve`

Available seller decisions:

| Decision | Description |
|---|---|
| `APPROVE_RETURN` | Approve the return — buyer ships item back |
| `APPROVE_REFUND` | Approve refund without return (refund-only) |
| `DIRECT_REFUND` | Returnless refund — buyer keeps item |
| `OFFER_PARTIAL_REFUND` | Offer partial refund — buyer keeps item |

`POST /return_refund/202309/returns/{return_id}/reject`

Requires `reject_reason` and optional evidence images.

### Return Statuses

| Status | Description |
|---|---|
| `RETURN_OR_REFUND_REQUEST_PENDING` | Buyer submitted request, awaiting seller action |
| `RETURN_OR_REFUND_REQUEST_SUCCESS` | Request approved |
| `RETURN_OR_REFUND_REQUEST_COMPLETE` | Return/refund fully processed |
| `REFUND_OR_RETURN_REQUEST_REJECT` | Seller rejected the request |

**SLA:** Sellers must respond within **24-48 hours**. If no action is taken, the platform auto-approves.

## Local Repo Anchors

- `app/Application/Orchestrators/OrderOrchestrator.php`
- `app/Jobs/ProcessWebhookJob.php`
- `app/Marketplaces/Services/Orders/TikTokOrderService.php`
- `app/Marketplaces/Mappers/TikTok/TikTokOrderMapper.php`
- `app/Marketplaces/Services/Shipping/Labels/TikTokShippingService.php`

## Notes

- Use the local orchestration flow to decide whether a webhook should refresh, import, ship, or cancel.
- Do not infer final refund from payment status alone — use return status.
- `seller_sku` in `line_items` is the primary SKU mapping key to the ERP.
- Operations are at the **package level** — one order can have multiple packages.
- Stock should remain allocated until the order reaches a terminal state (`COMPLETED` or `CANCELLED`).
- The `order_id` in webhooks maps to the `external_order_id` in the local database — ensure correct mapping.