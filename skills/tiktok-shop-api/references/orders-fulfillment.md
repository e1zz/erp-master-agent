# TikTok Shop Orders and Fulfillment

## Use When

- You need order import, search, or detail retrieval.
- Working with fulfillment: shipping, tracking, labels, Ready To Ship (RTS).
- Handling cancellations (buyer-initiated, seller-initiated, platform-initiated).
- Working with returns and refunds.
- Managing logistics: delivery options, warehouses, shipping providers.
- Understanding the order status state machine.

## API References (v202309)

**Base URL:** `https://open-api.tiktokglobalshop.com`

---

## Order API (`/order/202309/`)

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

### 3. Get Order Price Detail

`GET /order/202309/orders/{order_id}/price`

Returns granular pricing and tax breakdown for a specific order. Useful when the payment summary in the order detail response is not detailed enough (e.g., per-item tax, per-item platform fees).

### 4. Add External Order Reference

`POST /order/202309/orders/{order_id}/external_orders`

Links a TikTok order to an external system ID (e.g., ERP order number, SFCC order).

**Request Body:**
```json
{
  "external_order_id": "ERP-ORD-20240101-001",
  "external_order_source": "ERP_SYSTEM"
}
```

### 5. Search Order by External Order Reference

`POST /order/202309/orders/external_orders/search`

Locate TikTok orders by their previously linked external order reference.

**Request Body:**
```json
{
  "external_order_ids": ["ERP-ORD-20240101-001"]
}
```

### 6. Update Blind Box Opening Results

`POST /order/202309/orders/{order_id}/blind_box`

Used for blind-box/mystery-box products to report which item the buyer received after opening. Niche use case — only relevant if selling blind-box products.

---

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

---

## Fulfillment API (`/fulfillment/202309/`)

### 1. Get Shipping Providers

`GET /fulfillment/202309/shipping_providers`

Returns available shipping providers for the seller's region.

### 2. Get Package Detail

`GET /fulfillment/202309/packages/{package_id}`

Returns comprehensive information about a specific package including status, tracking number, shipping provider, handover method, and associated order IDs.

**Response includes:**
- `package_id`, `package_status`
- `tracking_number`, `shipping_provider_id`, `shipping_provider_name`
- `handover_method` (PICKUP / DROP_OFF)
- `order_id` list (orders in this package)
- Pickup/drop-off slot details

### 3. Get Handover Time Slots

`GET /fulfillment/202309/packages/{package_id}/handover_time_slots`

Retrieves available pickup and drop-off time windows for TikTok-shipping packages. Must be called before Ship Package when using platform-arranged logistics.

**Response includes:**
- `can_pickup` (boolean)
- `can_drop_off` (boolean)
- `pickup_slots[]` — each with `start_time` and `end_time` (unix timestamps)

### 4. Ship Package (Ready To Ship / RTS)

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
  "handover_method": "PICKUP",
  "pick_up_slot": {
    "start_time": 1690000000,
    "end_time": 1690086400
  }
}
```

**Notes:**
- Operations are at the **package level**, not the order level.
- One order can have multiple packages (split shipments).
- For TikTok-arranged shipping, call Get Handover Time Slots first, then select a slot.

### 5. Mark Package as Shipped

`POST /fulfillment/202309/orders/{order_id}/packages`

Alternative fulfillment endpoint used primarily in **US and EMEA markets**. Creates a package and uploads tracking in a single call. Use this when the order doesn't have pre-created packages.

**Request Body:**
```json
{
  "tracking_number": "TRACK123456",
  "shipping_provider_id": "PROVIDER_ID",
  "line_item_ids": ["item_line_123"]
}
```

### 6. Get Shipping Labels / Documents

`GET /fulfillment/202309/packages/{package_id}/shipping_document`

**Query Parameters:**

| Parameter | Description |
|---|---|
| `document_type` | `SHIPPING_LABEL`, `PICK_LIST`, `SL_PL` (combined) |
| `document_size` | `A5`, `A6` |

Returns a PDF document URL for downloading/printing. Must call Ship Package first for TikTok-shipping to generate the label.

### 7. Update Tracking Number

`POST /fulfillment/202309/packages/{package_id}/shipping_info/update`

```json
{
  "tracking_number": "JT123456789MX",
  "shipping_provider_id": "PROVIDER_ID"
}
```

Tracking can generally be revised **once within 72 hours** of the initial upload.

### 8. Search Combinable Packages

`POST /fulfillment/202309/packages/search`

Finds packages eligible for consolidation into a single shipment. Used to optimize shipping when multiple orders can go to the same buyer or address.

### 9. Combine Packages

`POST /fulfillment/202309/packages/combine`

Merges multiple eligible packages into a single fulfillment package.

**Request Body:**
```json
{
  "package_ids": ["pkg_111", "pkg_222", "pkg_333"]
}
```

### 10. Uncombine Package

`POST /fulfillment/202309/packages/{package_id}/uncombine`

Splits a previously combined package back into individual packages.

**Request Body:**
```json
{
  "order_ids": ["576123456789012345"]
}
```

### Package Statuses

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

---

## Return & Refund API (`/return_refund/202309/`)

### Cancellations

#### 1. Cancel Order (Seller-Initiated)

`POST /return_refund/202309/cancellations`

Creates a cancellation on behalf of the seller (e.g., stock unavailable). Supports **item-level cancellation** in the US market.

**Request Body:**
```json
{
  "order_id": "577087614418520388",
  "cancel_reason": "OUT_OF_STOCK",
  "skus": [
    {
      "sku_id": "1729386416015578024",
      "quantity": 1
    }
  ]
}
```

#### 2. Search Cancellations

`POST /return_refund/202309/cancellations/search`

Retrieve one or more cancellation records filtered by order or cancellation ID.

**Request Body:**
```json
{
  "order_id": "577087614418520388",
  "page_size": 20,
  "page_token": ""
}
```

#### 3. Approve Buyer Cancellation

`POST /return_refund/202309/cancellations/approve`

Approve a buyer's cancellation request. Seller must act within the SLA window (24-48 hours) or the platform may auto-approve.

**Request Body:**
```json
{
  "order_id": "577087614418520388"
}
```

#### 4. Reject Buyer Cancellation

`POST /return_refund/202309/cancellations/reject`

Reject a buyer's cancellation request. Requires a reject reason key.

**Request Body:**
```json
{
  "order_id": "577087614418520388",
  "reject_reason_key": "ITEM_ALREADY_SHIPPED"
}
```

### Returns

#### 5. Search Returns

`POST /return_refund/202309/returns/search`

Retrieve one or more return records.

**Request Body:**
```json
{
  "order_id": "577087614418520388",
  "page_size": 20,
  "page_token": ""
}
```

#### 6. Create Return

`POST /return_refund/202309/returns/create`

Initiate a return request on behalf of the buyer (seller-side).

**Request Body:**
```json
{
  "order_id": "577087614418520388",
  "skus": [
    {
      "sku_id": "1729386416015578024",
      "quantity": 1
    }
  ],
  "return_reason": "WRONG_PRODUCT",
  "comments": "Buyer received wrong color"
}
```

#### 7. Approve Return

`POST /return_refund/202309/returns/approve`

Approve a buyer's return request.

**Request Body:**
```json
{
  "return_id": "RET123456789"
}
```

#### 8. Reject Return

`POST /return_refund/202309/returns/reject`

Reject a buyer's return or refund request. Requires a reject reason key from the Get Reject Reasons endpoint.

**Request Body:**
```json
{
  "return_id": "RET123456789",
  "reject_reason_key": "ITEM_NOT_ELIGIBLE",
  "comments": "Item was used and not in original condition"
}
```

#### 9. Get Return Records

`GET /return_refund/202309/returns/{return_id}/records`

Query the processing steps and lifecycle events for a specific return. Provides a chronological timeline of actions taken on the return request.

### Refunds

#### 10. Calculate Refund

`POST /return_refund/202309/refunds/calculate`

Check the refundable amount for an order before initiating a refund. Returns the maximum refundable amounts for items and shipping.

**Request Body:**
```json
{
  "order_id": "577087614418520388",
  "skus": [
    {
      "sku_id": "1729386416015578024",
      "quantity": 1
    }
  ]
}
```

### After-Sale Eligibility

#### 11. Get Aftersale Eligibility

`GET /return_refund/202309/aftersale/eligibility`

Check which after-sale solutions (refund, return, cancel) are available for a specific order. Call this **before** attempting any cancellation, return, or refund to confirm the operation is allowed.

**Query Parameters:**

| Parameter | Description |
|---|---|
| `order_id` | The order to check eligibility for |

**Response includes:**
- `eligible_solutions[]` — list of allowed actions: `CANCEL`, `REFUND_ONLY`, `RETURN_AND_REFUND`

#### 12. Get Reject Reasons

`GET /return_refund/202309/aftersale/reject_reasons`

Get the list of valid rejection reason keys for cancellation or return requests. The `reject_reason_key` is **required** when calling reject endpoints.

**Query Parameters:**

| Parameter | Description |
|---|---|
| `order_id` | The order to get reject reasons for |
| `reverse_type` | `CANCEL` or `RETURN` |

### Reverse Orders (Legacy/Alias)

The `reverse_orders` resource may still work as an aggregate view across cancellations and returns. The canonical v202309 paths above (`cancellations/` and `returns/`) should be preferred.

#### Get Reverse Orders List

`GET /return_refund/202309/reverse_orders`

**Query Parameters:**
| Parameter | Description |
|---|---|
| `reverse_order_id` | Specific reverse order |
| `order_id` | Get reverse orders for a specific parent order |
| `reverse_type` | `CANCEL`, `REFUND_ONLY`, `RETURN_AND_REFUND` |

#### Approve a Reverse Order
`POST /return_refund/202309/reverse_orders/{reverse_order_id}/approve`

#### Reject a Reverse Order
`POST /return_refund/202309/reverse_orders/{reverse_order_id}/reject`

Requires `reject_reason_key` and optional `comments`.

### Reverse Order Statuses

| Status | Description |
|---|---|
| `PENDING` | Request created, awaiting seller action |
| `APPROVED` | Request approved |
| `REJECTED` | Seller rejected the request |
| `COMPLETED` | Return/refund fully processed |
| `CANCELLED` | Buyer cancelled their request |

---

## Cancellation Flow

**Buyer-Initiated (During Remorse):**
- Buyer cancels during `ON_HOLD` → order becomes `CANCELLED` automatically.
- No seller action required.

**Buyer-Initiated (After Remorse):**
- Buyer requests cancellation → `is_buyer_request_cancel: true` on the order.
- Seller must approve or reject within **24-48 hours**.
- If seller takes no action → platform may auto-approve the cancellation.
- Seller can reject by successfully shipping the package (in some markets).

**Approve Cancellation:**
`POST /return_refund/202309/cancellations/approve`
_Alternative:_ `POST /order/202309/orders/{order_id}/cancellations/accept`

**Reject Cancellation:**
`POST /return_refund/202309/cancellations/reject`
_Alternative:_ `POST /order/202309/orders/{order_id}/cancellations/reject`

**Seller-Initiated:**
- Seller cancels directly (e.g., stock unavailable).
- Use `POST /return_refund/202309/cancellations` with `cancel_reason`.
- Order transitions to `CANCELLED`.

### Key API Field: `is_buyer_request_cancel`

Check this boolean on order detail to detect pending buyer cancellation requests:
```json
{
  "is_buyer_request_cancel": true,
  "cancel_reason": "Changed mind"
}
```

---

## Logistics API (`/logistics/202309/`)

Logistics endpoints are order-adjacent — needed for determining shipping options and warehouse configuration before fulfillment.

### 1. Get Subscribed Delivery Options

`GET /logistics/202309/delivery_options`

Retrieves delivery options the seller has subscribed to (e.g., Standard Shipping, Express Shipping). Each delivery option has a `delivery_option_id` used in subsequent calls.

### 2. Get Shipping Providers by Delivery Option

`GET /logistics/202309/delivery_options/{delivery_option_id}/shipping_providers`

Returns the list of shipping service providers (carriers) supported for a specific delivery option. Essential for seller-shipping to determine which `shipping_provider_id` to use.

### 3. Get Warehouse List

`GET /logistics/202309/warehouses`

Retrieves all warehouses associated with the seller. Response includes warehouse name, status, address, and type (`SALES_WAREHOUSE`, `DOMESTIC_WAREHOUSE`).

Sellers can manage up to **20 warehouses** in Multi-Warehouse (MWH) markets.

### 4. Get Warehouse Delivery Options

`GET /logistics/202309/warehouses/{warehouse_id}/delivery_options`

Returns the delivery options configured for a specific warehouse. Used in Multi-Warehouse setups to determine which shipping methods are available from each location.

---

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
- Tracking can be revised once within 72 hours of initial upload.
- Call Get Aftersale Eligibility before attempting any return, refund, or cancellation.
- Call Get Reject Reasons to obtain valid `reject_reason_key` values before rejecting requests.