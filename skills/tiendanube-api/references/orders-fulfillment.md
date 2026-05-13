# Tiendanube (Nuvemshop) API Orders and Fulfillment

## Use When

- Retrieving new orders for ERP ingestion.
- Creating orders via API (B2B / phone sales).
- Updating order notes and status.
- Updating order shipping status and adding tracking numbers.
- Closing, reopening, or canceling orders.
- Querying order value/edition history for reconciliation.

## API References

**Base URL:** `https://api.tiendanube.com/v1/{store_id}`
**Headers Required:** `Authentication`, `User-Agent`

## The Order Lifecycle

An order in Tiendanube has multiple independent status fields:
- `status`: overall status → `open`, `closed`, `cancelled`
- `payment_status`: → `pending`, `authorized`, `paid`, `voided`, `refunded`, `abandoned`
- `shipping_status`: → `unpacked`, `shipped`, `delivered`

### Key Billing Properties (returned on GET /orders/{id})

| Property | Description |
|---|---|
| `billing_customer_type` | `company` or `individual` |
| `billing_business_name` | Legal business name |
| `billing_trade_name` | Trade/brand name |
| `billing_state_registration` | State registration number |
| `billing_fiscal_regime` | Fiscal regime code (Mexico only) |
| `billing_invoice_use` | Invoice use code (Mexico only) |
| `billing_document_type` | Document type (e.g., `cnpj`) |

### Payment Details

| Property | Description |
|---|---|
| `payment_details.method` | `credit_card`, `custom`, etc. |
| `payment_details.credit_card_company` | Card brand if applicable |
| `payment_details.installments` | Number of installments |

### Product Line Items (Kit Support)

Order `products[]` may include kit-related fields:
- `has_promotional_price` — whether item has a promotional price
- `promotions.percentage_off` — discount percentage
- `catalog_kit_id`, `order_kit_id` — kit identifiers
- `kit` — nested kit object with `id`, `variant_id`, `name`, `image`, `price`

> [!IMPORTANT]
> `products.id` uses `int64`-scale values. Ensure your backend supports large integers.

## 1. Retrieve Orders

### GET /orders — List All Orders

`GET /orders`

**Key Query Parameters:**

| Parameter | Description |
|---|---|
| `status` | `open`, `closed`, `cancelled` |
| `payment_status` | Filter by payment state |
| `shipping_status` | Filter by fulfillment state |
| `since_id` | Crucial for chronological ERP polling |
| `created_at_min` / `created_at_max` | ISO 8601 date range |
| `updated_at_min` / `updated_at_max` | ISO 8601 date range |
| `fields` | Partial response (e.g., `id,number,price_usd`) |
| `aggregates` | `fulfillment_orders` and/or `custom_fields` |

> [!WARNING]
> Query results are capped at **10,000 items**. Use date-range filters to reduce result sets.

### GET /orders?aggregates=fulfillment_orders

Returns full `fulfillment_orders` nested objects inline, including `assigned_location`, `line_items`, `recipient`, `shipping`, `destination`, `status`, `tracking_info`.

### GET /orders?aggregates=custom_fields

Returns `custom_fields` array inline with each order.

### GET /orders/{id} — Get Single Order

`GET /orders/{id}`

Returns a single order with full details including `fulfillments` array (legacy format).

## 2. Create an Order

`POST /orders/` → `201 Created`

Used for creating orders via API (e.g., phone sales, B2B, ERP-originated).

**Key Request Fields:**

| Field | Required | Description |
|---|---|---|
| `currency` | No | ISO 4217 currency code |
| `language` | No | ISO 639-1 language code |
| `gateway` | No | Payment gateway (default: `not-provided`) |
| `payment_status` | No | Default: `pending` |
| `status` | No | Default: `open` |
| `shipping_status` | No | Default: `unpacked` |
| `products` | **Yes** | Array of product line items |
| `inventory_behaviour` | No | Controls stock deduction |
| `customer` | No | Customer object |
| `billing_address` | No | Billing address |
| `shipping_address` | No | Shipping address |
| `shipping_pickup_type` | No | `ship` or `pickup` |
| `shipping_cost_customer` | No | Shipping cost charged to customer |
| `shipping_cost_owner` | No | Shipping cost for merchant |
| `send_customer_email` | No | Email notification flag |

**Request Example:**
```json
{
  "currency": "USD",
  "language": "es",
  "products": [
    { "variant_id": 194113141, "quantity": 2 }
  ],
  "customer": {
    "name": "John Doe",
    "email": "john.doe@example.com",
    "phone": "+55 11 99999-9999"
  },
  "billing_address": {
    "first_name": "John",
    "last_name": "Doe",
    "phone": "51230413",
    "address": "Evergreen Terrace",
    "number": "742",
    "floor": "Apartment 8",
    "locality": "Bronx",
    "city": "New York",
    "province": "New York",
    "zipcode": "10451",
    "country": "US"
  }
}
```

## 3. Update an Order

`PUT /orders/{id}` → `200 OK`

Change an order's `owner_note` and/or `status`.

**Request Example:**
```json
{
  "owner_note": "Need to gift wrap this order",
  "status": "closed"
}
```

## 4. Order Value History

`GET /orders/{id}/history/values`

Returns all total value alterations (edits, refunds). Useful for financial reconciliation.

**Response Fragment:**
```json
[
  {
    "status": "CANCELLED",
    "total_delta": 3750,
    "total_paid_diff": 0,
    "gateway_method": null,
    "happened_at": "2025-04-08T18:19:15+00:00"
  },
  {
    "status": "PAID",
    "total_delta": 3750,
    "total_paid_diff": 7500,
    "gateway_method": "cash",
    "happened_at": "2025-04-08T18:19:40+00:00"
  }
]
```

## 5. Order Edition History

`GET /orders/{id}/history/editions`

Returns change log of order edits (product changes, shipping cost changes).

**Response Fragment:**
```json
[
  {
    "product_changes": [
      { "type": "ADD", "modified_stock": true, "previous_quantity": 0, "new_quantity": 1, "product_name": "Pantalon de cuero (Beige)" }
    ],
    "shipping_costs": [
      { "fulfillment_number": 1, "previous_merchant_cost": 200, "new_merchant_cost": 500, "previous_consumer_cost": 200, "new_consumer_cost": 500 }
    ],
    "reason": null,
    "happened_at": "2025-04-08T18:19:15+00:00"
  }
]
```

## 6. Order Subscriptions

`GET /orders/{id}/subscriptions`

Returns subscription details for recurring orders, including frequency, discount, and products.

## 7. Fulfillments and Tracking (CRITICAL)

Tracking updates are NOT applied to the main Order object. They are applied to **Fulfillment Orders**. A single order can have multiple fulfillment orders if shipped in separate packages.

### Step 1: Find the Fulfillment Order ID
Pull an order (`GET /orders/{order_id}?aggregates=fulfillment_orders`) and look at the `fulfillment_orders` array.

### Step 2: Post a Tracking Event
`POST /orders/{order_id}/fulfillment-orders/{fulfillment_order_id}/tracking-events`

**Request Body:**
```json
{
  "status": "dispatched",
  "description": "El paquete ha sido entregado al transportista",
  "tracking_number": "TRK987654321",
  "url": "https://carrier.com/track?id=TRK987654321",
  "happened_at": "2026-04-30T10:50:00Z"
}
```

### Supported Tracking Statuses:
- `UNPACKED`
- `PACKED`
- `READY_FOR_PICKUP`
- `DISPATCHED` (Shipped)
- `DELIVERED` (Registers the final delivery date)

## 8. Close / Reopen Orders

### Close an Order
`POST /orders/{id}/close` → `200 OK`

### Reopen an Order
`POST /orders/{id}/open` → `200 OK`

## 9. Canceling Orders

`POST /orders/{order_id}/cancel`

**Request Body:**
```json
{
  "reason": "customer",
  "email": true,
  "restock": true
}
```
*Setting `restock: true` restores inventory to the variants.*

## 10. Pay an Order

There is **no explicit pay action**. Orders are paid when a Transaction with status `success` is sent (sale or capture event). This sets `payment_status: "paid"` and `paid_at` timestamp.

## 11. Invoices (NFe)

Invoices are managed via **Metafields**, not a dedicated Invoice API.

### Create an Invoice
1. Check if NFe metafield exists: `GET /metafields/orders?per_page=1&owner_id=ORDER_ID&namespace=nfe&key=list&fields=id,value`
2. If not exists, create: `POST /metafields/orders` with namespace `nfe`, key `list`
3. If exists, update: `PUT /metafields/orders/{metafield_id}`

Value holds JSON-encoded array of NFes with `key`, `link`, and optional `fulfillment_order_id`.

### Read an Invoice
`GET /metafields/orders?per_page=1&owner_id=ORDER_ID&namespace=nfe&key=list&fields=id,value`

## 12. Transactions (Payments)

`GET /orders/{order_id}/transactions`

Returns payment transactions associated with the order. Useful for determining payment gateway and transaction status.

> [!NOTE]
> The Transaction resource is primarily for **payment provider apps**. See the full Transaction documentation for FSM-based status transitions, refund URL flows, and event types.

### Key Transaction Properties

| Property | Description |
|---|---|
| `id` | Transaction ID |
| `payment_method.type` | `credit_card`, `debit_card`, `boleto`, `pix`, `wallet`, `cash`, `wire_transfer`, `bank_debit`, `ticket`, `other` |
| `status` | `pending`, `authorized`, `paid`, `voided`, `refunded`, `partially_refunded`, `in_dispute`, `in_mediation`, `chargebacked` |
| `captured_amount` | Amount captured |
| `refunded_amount` | Amount refunded |
| `failure_code` | `card_declined`, `insufficient_funds`, `expired_card`, etc. |

### Transaction Events

Events represent FSM transitions: `sale`, `refund`, `void`, `chargeback`, `mediation`, `dispute`.
Each event has a `status`: `success`, `failure`, `pending`.

### Refund URL Flow

If Transaction supports refunds, the app specifies `info.refund_url`. Tiendanube POSTs refund requests. App replies:
- `202 Accepted` → accepts refund
- `422 Unprocessable Entity` → rejects with `error_code`: `insufficient_account_balance`, `refund_already_in_process`, `refund_rejected`, `transaction_date_too_old`

## 13. Draft Orders (B2B / Manual Creation)

`POST /draft_orders`

Allows the ERP to create an order programmatically. Once created, generate a payment link or mark as paid.

**Request Body:**
```json
{
  "customer": { "email": "juan@example.com", "name": "Juan Perez" },
  "line_items": [{ "variant_id": 1111111, "quantity": 2 }],
  "shipping_address": {
    "address": "Av Reforma 123",
    "city": "CDMX",
    "province": "DF",
    "zipcode": "06600"
  }
}
```

## Local Repo Anchors

- `app/Marketplaces/Services/Orders/TiendanubeOrderService.php`
- `app/Marketplaces/Mappers/Tiendanube/TiendanubeOrderMapper.php`

## Notes

- Always poll using `since_id` rather than date ranges to ensure no orders are missed.
- `tracking_number` updates belong to the `fulfillment-order` sub-resource, not the root `order`.
- Query results are capped at 10,000 items.
- Use `aggregates=fulfillment_orders` to inline fulfillment details.