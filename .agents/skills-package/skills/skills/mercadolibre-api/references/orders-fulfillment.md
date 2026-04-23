# MercadoLibre Orders and Fulfillment

## Use When
- Pulling orders, fetching payments via MercadoPago associations, and shipping fulfillment.

## API References

### 1. Get Order
`GET /orders/{ORDER_ID}`

**Response Fragment (`shipping` and `payments`):**
```json
{
  "id": 200000350,
  "date_created": "2023-01-01T10:00:00.000Z",
  "status": "paid",
  "order_items": [
    {
      "item": {
        "id": "MLA123456",
        "seller_sku": "SKU-TEST"
      },
      "quantity": 1,
      "unit_price": 500
    }
  ],
  "payments": [
    {
      "id": 1234567,
      "order_id": 200000350,
      "status": "approved",
      "transaction_amount": 500
    }
  ]
}
```

## Local Repo Anchors
- `app/Marketplaces/Services/Orders/MercadoLibreOrderService.php`
- `app/Jobs/ImportMercadoLibreOrderJob.php`