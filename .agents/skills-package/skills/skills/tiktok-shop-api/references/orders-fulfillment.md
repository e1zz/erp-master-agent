# TikTok Shop Orders and Fulfillment

## Use When

- You need order import, fulfillment, tracking, cancellation, or label behavior.

## API References (v202309)

### 1. Get Order Details
`GET /api/orders` (or `POST /api/orders/search` for list filtering)

**Response Example:**
```json
{
  "code": 0,
  "data": {
    "orders": [
      {
        "order_id": "576123456789",
        "order_status": "AWAITING_SHIPMENT",
        "payment": {
          "currency": "GBP",
          "sub_total": "19.99",
          "shipping_fee": "2.00",
          "total_amount": "21.99"
        },
        "buyer_email": "test@buyer.com",
        "shipping_provider": "Royal Mail",
        "line_items": [
          {
            "id": "item123",
            "sku_id": "17293847291",
            "seller_sku": "SKU-SHIRT-M",
            "quantity": 1
          }
        ]
      }
    ]
  }
}
```

### 2. Ship Package
`POST /api/fulfillment/rts`

Marks an order/package as Ready To Ship.

**Request Body Example:**
```json
{
  "order_id": "576123456789",
  "shipping_provider_id": "ROYAL_MAIL_ID",
  "tracking_number": "RM123456789GB"
}
```

## Essentials

- Distinguish buyer cancellation requests from terminal cancellation or refund states.
- Keep stock allocated until the order reaches a terminal state that justifies release.

## Local Repo Anchors

- `app/Application/Orchestrators/OrderOrchestrator.php`
- `app/Jobs/ProcessWebhookJob.php`
- `app/Marketplaces/Services/Orders/TikTokOrderService.php`
- `app/Marketplaces/Mappers/TikTok/TikTokOrderMapper.php`
- `app/Marketplaces/Services/Shipping/Labels/TikTokShippingService.php`

## Notes

- Use the local orchestration flow to decide whether a webhook should refresh, import, ship, or cancel.
- Do not infer final refund from payment status alone.