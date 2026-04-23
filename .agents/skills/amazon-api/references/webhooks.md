# Amazon Webhooks

## Use When
- Handling Amazon Notification API events (SQS or EventBridge logic).

## API References

### 1. Notification Event (ANY_OFFER_CHANGED or ORDER_STATUS_CHANGE)
Amazon pushes to SQS/EventBridge rather than traditional HTTP webhooks for most SP-API notifications.

**Sample SQS Message Body Fragment:**
```json
{
  "NotificationVersion": "1.0",
  "NotificationType": "ORDER_STATUS_CHANGE",
  "Payload": {
    "OrderChangeNotification": {
      "AmazonOrderId": "111-1234567-1234567",
      "OrderStatus": "Unshipped",
      "SellerId": "A1B2C3D4E5F6G"
    }
  }
}
```

## Local Repo Anchors
- `app/Marketplaces/Services/Webhooks/AmazonWebhookService.php`