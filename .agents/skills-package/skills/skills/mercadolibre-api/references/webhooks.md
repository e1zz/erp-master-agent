# MercadoLibre Webhooks

## Use When
- Handling callback topics like `items`, `orders_v2`, `questions`, etc.

## API References

### 1. Webhook Payload Examples
MercadoLibre pushes minimal payloads. You must always query the API using the resource ID to get the full object.

**Orders Notification Example:**
```json
{
  "resource": "/orders/200000350",
  "user_id": 123456789,
  "topic": "orders_v2",
  "application_id": 12345678,
  "attempts": 1,
  "sent": "2023-01-01T10:01:00.000Z",
  "received": "2023-01-01T10:01:00.000Z"
}
```

## Local Repo Anchors
- `app/Marketplaces/Services/Webhooks/MercadoLibreWebhookService.php`