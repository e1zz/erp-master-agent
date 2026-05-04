# Tiendanube (Nuvemshop) API Orders and Fulfillment

## Use When

- Retrieving new orders for ERP ingestion.
- Updating order shipping status.
- Adding tracking numbers to orders.

## API References

**Base URL:** `https://api.tiendanube.com/v1/{store_id}`
**Headers Required:** `Authentication`, `User-Agent`

## The Order Lifecycle

An order in Tiendanube has multiple independent status fields:
- `status`: overall status (e.g., `open`, `closed`, `cancelled`).
- `payment_status`: (e.g., `pending`, `paid`, `abandoned`).
- `shipping_status`: (e.g., `unpacked`, `shipped`, `delivered`).

## 1. Retrieve Orders

`GET /orders`

**Key Query Parameters:**
| Parameter | Description |
|---|---|
| `status` | `open`, `closed`, `cancelled` |
| `payment_status` | Filter by payment state |
| `shipping_status` | Filter by fulfillment state |
| `since_id` | Crucial for chronological ERP polling |

## 2. Fulfillments and Tracking (CRITICAL)

In Tiendanube, tracking updates are NOT applied directly to the main Order object. Instead, they are applied to **Fulfillment Orders**. A single order can have multiple fulfillment orders if it is shipped in separate packages.

### Step 1: Find the Fulfillment Order ID
When you pull an order (`GET /orders/{order_id}`), look inside the `fulfillments` array to find the `fulfillment_order_id` (or `id` of the fulfillment object).

### Step 2: Post a Tracking Event
To mark an order as shipped and add a tracking number, you create a Tracking Event tied to that fulfillment order.

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

*Note: Posting a `DELIVERED` event will automatically update the overarching fulfillment order and record the `fulfilled_at` date.*

## 3. Canceling Orders

`POST /orders/{order_id}/cancel`

Used to cancel an order.

**Request Body:**
```json
{
  "reason": "customer",
  "email": true,
  "restock": true
}
```
*Note: Setting `restock: true` will automatically add the inventory back to the variants.*

## 4. Transactions (Payments)

`GET /orders/{order_id}/transactions`

Returns the payment transactions associated with the order. Useful for determining the exact payment gateway (e.g., Mercado Pago, custom gateway) and the transaction status.

**Response Fragment:**
```json
[
  {
    "id": "123456789",
    "order_id": 987654321,
    "status": "success",
    "payment_provider": "mercadopago",
    "payment_method": "credit_card",
    "amount": "299.99",
    "currency": "MXN"
  }
]
```

## 5. Draft Orders (B2B / Manual Creation)

`POST /draft_orders`

Allows the ERP to programmatically create an order (e.g., for phone sales or B2B). Once created, you can generate a payment link or mark it as paid.

**Request Body:**
```json
{
  "customer": {
    "email": "juan@example.com",
    "name": "Juan Perez"
  },
  "line_items": [
    {
      "variant_id": 1111111,
      "quantity": 2
    }
  ],
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

- Always poll using `since_id` rather than date ranges to ensure no orders are missed during pagination.
- Remember that `tracking_number` updates belong to the `fulfillment-order` sub-resource, not the root `order` resource.