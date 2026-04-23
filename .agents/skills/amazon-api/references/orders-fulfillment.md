# Amazon Orders and Fulfillment

## Use When
- Pulling orders (Orders V0 API) and shipping items.

## API References

### 1. Get Order Details
`GET /orders/v0/orders/{orderId}`

**Response Fragment:**
```json
{
  "payload": {
    "AmazonOrderId": "111-1234567-1234567",
    "PurchaseDate": "2023-01-01T10:00:00Z",
    "OrderStatus": "Unshipped",
    "FulfillmentChannel": "MFN",
    "OrderTotal": {
      "CurrencyCode": "USD",
      "Amount": "50.00"
    }
  }
}
```

### 2. Submit Fulfillment (Feeds API or Order Tracking API)
*Varies by exact SP-API endpoint in use, typically Feeds API `POST_ORDER_FULFILLMENT_DATA`*

## Local Repo Anchors
- `app/Marketplaces/Services/Orders/AmazonOrderService.php`
- `app/Jobs/ImportAmazonOrderJob.php`