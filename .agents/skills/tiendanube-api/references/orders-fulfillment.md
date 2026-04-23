# TiendaNube Orders and Fulfillment

## Use When
- Pulling orders, fetching payments, and shipping fulfillment.

## API References

### 1. Get Order Details
`GET /v1/{store_id}/orders/{order_id}`

**Response Fragment (`shipping` and `products`):**
```json
{
  "id": 123456,
  "status": "paid",
  "payment_status": "paid",
  "shipping_status": "unshipped",
  "total": "500.00",
  "products": [
    {
      "id": 987,
      "variant_id": 654,
      "sku": "SKU-TEST",
      "quantity": 1,
      "price": "500.00"
    }
  ]
}
```

### 2. Fullfill Order
`POST /v1/{store_id}/orders/{order_id}/fulfillments`

**Request Body Example:**
```json
{
  "shipping_company": "Andreani",
  "tracking_number": "123456789AR",
  "tracking_url": "https://andreani.com/track/123456789AR"
}
```

## Local Repo Anchors
- `app/Marketplaces/Services/Orders/TiendaNubeOrderService.php`
- `app/Jobs/ImportTiendaNubeOrderJob.php`