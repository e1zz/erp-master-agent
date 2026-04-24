# Walmart Webhooks

## Use When
- Webhook subscription administration or payload parsing.

## API References

### 1. Event Sample (PO_CREATED)
Walmart Webhooks format events in arrays of JSON objects.
```json
{
  "source": "https://api.walmart.com",
  "eventType": "PO_CREATED",
  "resourceId": "111222333444",
  "eventTime": "2023-01-01T12:00:00.000Z",
  "payload": {
    "purchaseOrderId": "111222333444",
    "customerOrderId": "999888777",
    "orderDate": "2023-01-01T11:00:00.000Z"
  }
}
```

## Local Repo Anchors
- `app/Marketplaces/Services/Webhooks/WalmartWebhookService.php`