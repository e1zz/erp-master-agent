# TikTok Shop Webhooks

## Use When

- You need webhook verification, payload parsing, or event routing.

## API References (v202309)

### Webhook Event Flow
TikTok sends webhooks via POST request to your app's callback URL.

### 1. ORDER_STATUS_CHANGED Example
```json
{
  "type": 1, 
  "shop_id": "748392",
  "timestamp": 1690000000,
  "data": {
    "order_id": "576123456789",
    "order_status": "AWAITING_SHIPMENT",
    "update_time": 1690000000
  }
}
```
*(Note: `type` 1 maps to `ORDER_STATUS_CHANGED`)*

### 2. PRODUCT_STATUS_CHANGED Example
```json
{
  "type": 3,
  "shop_id": "748392",
  "timestamp": 1690000000,
  "data": {
    "product_id": "17290000001",
    "status": "LIVE",
    "update_time": 1690000000
  }
}
```

### Signature Verification
You must verify the payload signature by capturing the body and recalculating the HMAC-SHA256 signature using your App Secret, then comparing it against the header or body payload.

## Essentials

- Verify signatures before trusting the payload.
- Route cancellation-request events carefully.
- Keep the webhook handler idempotent where possible.

## Local Repo Anchors

- `app/Application/Orchestrators/WebhookOrchestrator.php`
- `app/Http/Controllers/WebhooksController.php`
- `app/Jobs/ProcessWebhookJob.php`
- `app/Marketplaces/Services/Webhooks/TikTokWebhookService.php`

## Notes

- The webhook path is part marketplace integration and part ERP synchronization.
- Acknowledgement speed matters; avoid heavy processing in the request path.