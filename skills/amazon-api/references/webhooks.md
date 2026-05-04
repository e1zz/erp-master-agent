# Amazon SP-API Notifications (Webhooks)

## Use When

- Setting up real-time event listeners for order changes, listing updates, or inventory changes.
- Choosing between SQS and EventBridge destinations.
- Understanding the notification payload structure.

## Key Difference from Other Marketplaces

> [!IMPORTANT]
> Amazon SP-API does **NOT** support traditional HTTP webhooks (direct POST to your URL). Instead, it pushes events to **AWS services** (SQS or EventBridge), which your application then consumes.

This means your infrastructure must include an AWS account with an SQS queue or EventBridge bus configured.

## Notification Types

| Notification Type | Delivery | Description |
|---|---|---|
| `ORDER_CHANGE` | SQS | Order status changes (shipped, canceled, buyer cancellation request) |
| `LISTINGS_ITEM_STATUS_CHANGE` | EventBridge | Listing buyability or status changed |
| `LISTINGS_ITEM_MFN_QUANTITY_CHANGE` | EventBridge | MFN stock quantity changed |
| `LISTINGS_ITEM_ISSUES_CHANGE` | EventBridge | Listing quality issues updated |
| `FBA_INVENTORY_AVAILABILITY_CHANGES` | SQS | FBA stock level changed |
| `REPORT_PROCESSING_FINISHED` | SQS | An async report is ready to download |
| `FEED_PROCESSING_FINISHED` | SQS | A feed has finished processing |
| `BRANDED_ITEM_CONTENT_CHANGE` | EventBridge | Brand content changed |

---

## Setup Flow

### Step 1: Create a Destination

`POST /notifications/v1/destinations`

This is a **grantless operation** (uses your own app credentials, not a seller's token).

**For SQS:**
```json
{
  "name": "ERPOrderQueue",
  "resourceSpecification": {
    "sqs": {
      "arn": "arn:aws:sqs:us-east-1:123456789012:sp-api-orders"
    }
  }
}
```

> [!WARNING]
> You must add an IAM policy to your SQS queue granting Amazon permission to send messages. The principal is `sellingpartnerapi.amazon.com`.

**For EventBridge:**
```json
{
  "name": "ERPListingsEvents",
  "resourceSpecification": {
    "eventBridge": {
      "accountId": "123456789012",
      "region": "us-east-1"
    }
  }
}
```

### Step 2: Subscribe to a Notification Type

`POST /notifications/v1/subscriptions/{notificationType}`

**Request Body:**
```json
{
  "destinationId": "dest-abc123",
  "payloadVersion": "1.0"
}
```

### Step 3: Process Events

- **SQS:** Your worker polls the queue, parses the JSON message, processes it, and deletes the message.
- **EventBridge:** Set up EventBridge Rules to route specific events to Lambda, SQS, or other targets.

---

## Payload Structure (`ORDER_CHANGE` Example)

```json
{
  "NotificationType": "ORDER_CHANGE",
  "EventTime": "2026-05-01T12:00:00.000Z",
  "Payload": {
    "OrderChangeNotification": {
      "SellerId": "A1EXAMPLE",
      "AmazonOrderId": "111-1234567-1234567",
      "OrderChangeType": "OrderStatusChange",
      "OrderChangeTrigger": {
        "TimeOfOrderChange": "2026-05-01T12:00:00.000Z",
        "ChangeReason": "BuyerCancelled"
      },
      "Summary": {
        "MarketplaceId": "A1AM78C64UM0Y8",
        "OrderStatus": "Canceled",
        "FulfillmentType": "MFN"
      }
    }
  }
}
```

---

## SQS vs EventBridge Comparison

| Feature | SQS | EventBridge |
|---|---|---|
| **Best For** | High-volume order processing | Event routing, filtering, fan-out |
| **Processing** | Pull-based (your worker polls) | Push-based (routes to Lambda/SQS) |
| **Setup** | Simpler (IAM policy + queue) | More complex (partner event source) |
| **Notification Types** | `ORDER_CHANGE`, `FBA_INVENTORY`, Reports, Feeds | `LISTINGS_ITEM_*` events |

## Local Repo Anchors

- `app/Marketplaces/Services/Notifications/AmazonNotificationService.php`
- `app/Jobs/Amazon/ProcessAmazonSqsMessage.php`

## Notes

- There is **no HMAC signature verification** like other marketplaces. Security comes from the AWS IAM policy on your SQS queue — only Amazon can write to it.
- Use `REPORT_PROCESSING_FINISHED` and `FEED_PROCESSING_FINISHED` to avoid polling the Reports/Feeds status endpoints.
- For Mexico-specific events, filter on `MarketplaceId = A1AM78C64UM0Y8` inside the payload.