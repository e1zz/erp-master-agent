# TikTok Shop Webhooks

## Use When

- Setting up webhook (notification) handling for TikTok Shop events.
- Implementing webhook signature verification.
- Routing webhook payloads based on event type.
- Debugging missed or failed notifications.

## Webhook Architecture

TikTok Shop sends real-time, event-driven HTTP POST requests to a registered callback URL.

**Key Characteristics:**
- **Push Model:** TikTok pushes JSON payloads.
- **Event-Driven:** Triggered by specific status changes (orders, products, returns).
- **At-Least-Once Delivery:** Retries are attempted if your server does not respond with HTTP `200 OK`.
- **Signed:** Every payload includes an HMAC-SHA256 signature in the headers for verification.

## Setup and Configuration

1. Log into the **TikTok Shop Partner Center**.
2. Go to **App & Service** > **Manage Apps** > select your app.
3. In the **Event Subscription** (or Webhooks) section, set your **Callback URL** (must be HTTPS).
4. Select the event topics you want to subscribe to.
5. Save the configuration to activate.

## Webhook Payload Structure

All webhooks share a standard base structure:

```json
{
  "type": 1,
  "shop_id": "74839212345",
  "timestamp": 1690000000,
  "data": {
    /* Event-specific data payload */
  }
}
```

| Field | Type | Description |
|---|---|---|
| `type` | integer | The numeric event type code |
| `shop_id` | string | The plain shop ID (note: this is NOT the encrypted `shop_cipher` used in API requests) |
| `timestamp` | integer | Unix timestamp (seconds) when the event was generated |
| `data` | object | The event-specific payload |

## Complete Event Type List

| Type Code | Event Name | Trigger |
|---|---|---|
| `1` | `ORDER_STATUS_CHANGE` | Order status changes (e.g., unpaid → awaiting shipment → shipped) |
| `2` | `REVERSE_ORDER_STATUS_CHANGE` | Return/refund status changes |
| `3` | `PRODUCT_STATUS_CHANGE` | Product audit results or listing status changes |
| `4` | `RECIPIENT_ADDRESS_UPDATE` | Buyer updates shipping address |
| `5` | `PACKAGE_UPDATE` | Package status changes (combined, split, shipped) |
| `6` | `CANCELLATION_STATUS_CHANGE` | Order cancellation requested or completed |
| `7` | `SELLER_DEAUTHORIZATION` | Seller revokes authorization for your app |
| `8` | `SHOP_STATUS_CHANGE` | Shop status changes (e.g., active → suspended) |

### Event Type 1: ORDER_STATUS_CHANGE

**Data Payload:**
```json
"data": {
  "order_id": "576123456789",
  "order_status": "AWAITING_SHIPMENT",
  "update_time": 1690000000
}
```

### Event Type 3: PRODUCT_STATUS_CHANGE

**Data Payload:**
```json
"data": {
  "product_id": "17290000001",
  "status": "LIVE",
  "update_time": 1690000000
}
```

## Signature Verification (HMAC-SHA256)

TikTok Shop includes the signature in the HTTP headers. You must verify it to ensure the request is authentic.

**Verification Steps:**

1. **Extract** the signature from the `Authorization` or `x-tts-signature` header (varies by platform version).
2. **Extract** the timestamp from the payload body (`timestamp` field).
3. **Validate** the timestamp is within 5 minutes of your server's current time (prevent replay attacks).
4. **Construct** the verification string by concatenating the exact raw request body.
5. **Hash** the string using **HMAC-SHA256** with your **App Secret** as the key.
6. **Compare** your calculated hash with the signature provided in the header.

**PHP Verification Example:**

```php
$appSecret = 'your-app-secret';
$rawBody = $request->getContent();
$payload = json_decode($rawBody, true);

// 1. Validate timestamp
$timestamp = $payload['timestamp'] ?? 0;
if (abs(time() - $timestamp) > 300) {
    return response('Timestamp expired', 403);
}

// 2. Calculate HMAC
$calculatedSign = hash_hmac('sha256', $rawBody, $appSecret);

// 3. Extract header signature
$headerSign = $request->header('Authorization') ?? $request->header('x-tts-signature');

// 4. Compare (use constant-time comparison)
if (!hash_equals($calculatedSign, $headerSign)) {
    return response('Invalid signature', 403);
}
```

## Processing Workflow

**Best Practices:**

1. **Respond Immediately:** Your endpoint must return HTTP `200 OK` within a few seconds. Do not process business logic synchronously.
2. **Queue Events:** Push the raw payload into a message queue (e.g., Redis, SQS, RabbitMQ) for asynchronous processing.
3. **Idempotency:** Implement deduplication. TikTok may send the same event multiple times if it misses the `200 OK` acknowledgment or due to network retries.
4. **Data Freshness:** The webhook payload is minimal. Use it as a trigger to perform a `GET` request to the API to fetch the full, current state of the order/product, rather than relying solely on the webhook data.

**Example Flow:**
```
Webhook received
  → Verify signature
  → Return HTTP 200
  → Dispatch Job
      → Job fetches full order details from API using `order_id`
      → Job updates local ERP database
```

## Local Repo Anchors

- `app/Application/Orchestrators/WebhookOrchestrator.php`
- `app/Http/Controllers/WebhooksController.php`
- `app/Jobs/ProcessWebhookJob.php`
- `app/Marketplaces/Services/Webhooks/TikTokWebhookService.php`

## Notes

- The `shop_id` in the webhook payload is the plain ID, but most API requests require the encrypted `shop_cipher`. Maintain a local mapping of `shop_id` to `shop_cipher` and `access_token` for the seller.
- The `order_id` provided in the webhook payload maps to the `external_order_id` in the local ERP database.
- Acknowledgment speed matters; avoid heavy processing or database queries in the request path before returning the 200 response.
- If you change your App Secret in the Partner Center, signature verification will fail until you update the secret in your environment configuration.