# MercadoLibre Orders and Fulfillment

## Use When

- Pulling or searching seller orders.
- Understanding order statuses, transitions, and payment states.
- Working with shipments, shipping labels, and tracking.
- Handling packs (multi-item cart orders).
- Integrating order data with the local ERP.

## Orders API

### 1. Search Seller Orders

`GET https://api.mercadolibre.com/orders/search?seller={SELLER_ID}&sort=date_desc`

**Common Query Parameters:**

| Parameter | Description |
|---|---|
| `seller` | Seller user ID (required) |
| `sort` | `date_desc` or `date_asc` |
| `offset` | Pagination offset (default 0) |
| `limit` | Results per page (max 50) |
| `order.status` | Filter by status: `paid`, `confirmed`, `cancelled` |
| `order.date_created.from` | ISO 8601 datetime filter |
| `order.date_created.to` | ISO 8601 datetime filter |

**Response:**
```json
{
  "results": [ /* array of order objects */ ],
  "paging": {
    "total": 250,
    "offset": 0,
    "limit": 50
  },
  "sort": { "id": "date_desc", "name": "Date descending" }
}
```

### 2. Get Single Order

`GET https://api.mercadolibre.com/orders/{ORDER_ID}`

**Full Response Example:**
```json
{
  "id": 200000350,
  "date_created": "2025-01-15T10:00:00.000-04:00",
  "date_closed": "2025-01-15T10:01:00.000-04:00",
  "last_updated": "2025-01-15T12:00:00.000-04:00",
  "status": "paid",
  "status_detail": null,
  "total_amount": 1500.00,
  "currency_id": "MXN",
  "buyer": {
    "id": 987654321,
    "nickname": "BUYER_NICK",
    "first_name": "Juan",
    "last_name": "Pérez",
    "email": "buyer@example.com"
  },
  "seller": {
    "id": 123456789
  },
  "order_items": [
    {
      "item": {
        "id": "MLA123456789",
        "title": "Product Name",
        "seller_sku": "SKU-12345",
        "seller_custom_field": "SKU-12345",
        "variation_id": 123456,
        "variation_attributes": [
          { "id": "COLOR", "name": "Color", "value_name": "Negro" }
        ],
        "category_id": "MLA3530"
      },
      "quantity": 2,
      "unit_price": 500.00,
      "full_unit_price": 500.00,
      "sale_fee": 75.00,
      "currency_id": "ARS"
    }
  ],
  "payments": [
    {
      "id": 9876543210,
      "order_id": 200000350,
      "payer_id": 987654321,
      "status": "approved",
      "status_detail": "accredited",
      "transaction_amount": 1500.00,
      "currency_id": "ARS",
      "payment_type": "credit_card",
      "payment_method_id": "visa",
      "installments": 1,
      "date_approved": "2025-01-15T10:01:00.000-04:00",
      "date_created": "2025-01-15T10:00:30.000-04:00"
    }
  ],
  "shipping": {
    "id": 44444444444
  },
  "pack_id": 300000500,
  "tags": ["paid", "not_delivered"],
  "mediations": [],
  "manufacturing_ending_date": null
}
```

### 3. Get Recent Orders (Shortcut)

`GET https://api.mercadolibre.com/orders/search/recent?seller={SELLER_ID}`

Returns the most recent orders. Useful for quick polling.

## Order Statuses

| Status | Description |
|---|---|
| `confirmed` | Order created, payment pending or processing |
| `paid` | Payment approved — **this is the primary actionable status** |
| `cancelled` | Order cancelled (by buyer, seller, or system) |

**Status Detail Values (when `status` is `cancelled`):**

| Status Detail | Description |
|---|---|
| `buyer_cancel` | Buyer cancelled |
| `seller_cancel` | Seller cancelled |
| `bpp_refunded` | Buyer Protection Program refund |
| `fraud` | Cancelled due to fraud detection |

## Payment Statuses

| Payment Status | Description |
|---|---|
| `approved` | Payment confirmed |
| `pending` | Awaiting payment confirmation |
| `in_process` | Payment being processed |
| `rejected` | Payment rejected |
| `refunded` | Payment refunded |
| `cancelled` | Payment cancelled |
| `in_mediation` | Under dispute/mediation |

## Packs (Multi-Item Cart Orders)

When a buyer purchases multiple items in a single cart, MercadoLibre creates a **pack**. The pack groups multiple orders under a single shipment.

### Get Pack Details

`GET https://api.mercadolibre.com/packs/{PACK_ID}`

**Key Pack Behavior:**
- A pack has its own `pack_id`.
- Each individual order within the pack has its own `order_id`.
- The `pack_id` field in the order response indicates this order belongs to a pack.
- **All orders in a pack share a single shipment.**
- When `pack_id` is present, use the pack's shipment ID (not individual order shipment IDs).

### Get Pack Orders

`GET https://api.mercadolibre.com/packs/{PACK_ID}/orders`

Returns all orders belonging to the pack.

**Important for ERP:** When processing a pack:
1. Fetch the pack to get the consolidated shipment info.
2. Fetch each individual order for item-level details.
3. Do NOT create duplicate shipments — one pack = one shipment.

## Shipments API

### 1. Get Shipment Details

`GET https://api.mercadolibre.com/shipments/{SHIPMENT_ID}`

**Response Fragment:**
```json
{
  "id": 44444444444,
  "status": "ready_to_ship",
  "substatus": "printed",
  "logistic_type": "cross_docking",
  "shipping_mode": "me2",
  "tracking_number": "MEL12345678901234",
  "tracking_method": "mercadoenvios",
  "receiver_address": {
    "street_name": "Av. Corrientes",
    "street_number": "1234",
    "city": { "name": "Buenos Aires" },
    "state": { "name": "Capital Federal" },
    "zip_code": "C1043AAZ",
    "country": { "id": "AR" }
  },
  "shipping_items": [
    {
      "id": "MLA123456789",
      "quantity": 2
    }
  ],
  "date_created": "2025-01-15T10:01:30.000-04:00",
  "last_updated": "2025-01-15T14:00:00.000-04:00",
  "cost": 0,
  "lead_time": {
    "estimated_delivery_time": {
      "date": "2025-01-17T00:00:00.000-04:00"
    }
  }
}
```

### 2. Get Shipping Label (PDF)

`GET https://api.mercadolibre.com/shipment_labels?shipment_ids={SHIPMENT_ID}&response_type=pdf`

Returns the PDF shipping label for printing. Only available for Mercado Envíos (me2) shipments.

**Alternative (ZPL format for thermal printers):**

`GET https://api.mercadolibre.com/shipment_labels?shipment_ids={SHIPMENT_ID}&response_type=zpl2`

### 3. Shipment Status Transitions

| Status | Substatus | Description |
|---|---|---|
| `pending` | — | Shipment created, waiting for seller action |
| `handling` | — | Seller is preparing the package |
| `ready_to_ship` | `printed` | Label printed, ready for pickup/drop-off |
| `ready_to_ship` | `ready_to_print` | Label generated but not yet printed |
| `shipped` | `in_transit` | Package picked up, in transit |
| `shipped` | `out_for_delivery` | Out for final delivery |
| `delivered` | — | Package delivered to buyer |
| `not_delivered` | `returning_to_sender` | Delivery failed, returning |
| `cancelled` | — | Shipment cancelled |

## Shipping Modes and Logistic Types

### Shipping Modes

| Mode | Description |
|---|---|
| `me2` | Mercado Envíos — automated logistics by MercadoLibre |
| `custom` | Seller manages their own logistics entirely |
| `not_specified` | No shipping method defined |

### Logistic Types (within `me2`)

| Type | Description |
|---|---|
| `fulfillment` | Inventory stored in MercadoLibre warehouses — they handle everything |
| `cross_docking` | Seller prepares package, MercadoLibre courier picks up from seller |
| `drop_off` | Seller drops package at a collection point |
| `self_service` | Seller uses their own courier but with MercadoLibre tracking |

### Custom Shipping

For orders with `shipping_mode: "custom"`:
- The seller is fully responsible for logistics.
- No automatic labels are generated.
- The seller must update shipment status manually via API.

**Update Custom Shipment:**

`PUT https://api.mercadolibre.com/shipments/{SHIPMENT_ID}`
```json
{
  "tracking_number": "CUSTOM-TRACK-123",
  "status": "shipped"
}
```

## Claims and Mediations

### Get Claims for Order

`GET https://api.mercadolibre.com/v1/claims/search?seller_id={SELLER_ID}&resource_id={ORDER_ID}`

Claims can affect order status and may require seller response within specific timeframes.

## Buyer Messages

### Get Order Messages

`GET https://api.mercadolibre.com/messages/packs/{PACK_ID}/sellers/{SELLER_ID}`

Or for non-pack orders:

`GET https://api.mercadolibre.com/messages/orders/{ORDER_ID}/sellers/{SELLER_ID}`

## Local Repo Anchors

- `app/Marketplaces/Services/Orders/MercadoLibreOrderService.php`
- `app/Marketplaces/Mappers/MercadoLibre/MercadoLibreOrderMapper.php`
- `app/Jobs/ImportMercadoLibreOrderJob.php`
- `app/Marketplaces/Services/Shipping/MercadoLibreShippingService.php`

## Notes

- Always use `orders_v2` webhook topic (not legacy `orders`) for order notifications.
- The `seller_sku` and `seller_custom_field` in order items map to the ERP SKU.
- `pack_id` presence means this order is part of a multi-item cart — check pack for consolidated shipment.
- Order `total_amount` may differ from sum of `unit_price * quantity` due to discounts, coupons, or shipping costs.
- Payment `transaction_amount` is the amount actually charged to the buyer.
- `sale_fee` in order items represents MercadoLibre's commission per item.
- Shipment statuses are pushed via the `shipments` webhook topic.
- Shipping label endpoints only work for `me2` shipments — not `custom`.