# TiendaNube Webhooks

## Use When
- Handling callback topics like `product/created`, `order/paid`, etc.

## API References

### 1. Webhook Payload Examples
TiendaNube pushes simple payloads that refer to the store and event.

**Headers:**
- `X-Linked-Store-Id`: `123456`
- `X-Linked-Event`: `order/created`

**Body Example:**
```json
{
  "store_id": 123456,
  "event": "order/created",
  "id": 789012
}
```

## Local Repo Anchors
- `app/Marketplaces/Services/Webhooks/TiendaNubeWebhookService.php`