# MercadoLibre Webhooks (Notifications)

## Use When

- Setting up or debugging webhook (notification) handling for MercadoLibre events.
- Understanding the notification payload structure and available topics.
- Implementing webhook signature verification.
- Handling notification retries and acknowledgment requirements.

## Notification Architecture

MercadoLibre uses a **minimal-payload** notification system. When an event occurs, MercadoLibre sends a small JSON notification containing only the `resource` path and `topic`. **You must always query the API using the resource path to get the full, current data.**

This design ensures:
- Notifications are small and fast to deliver.
- You always get the latest state of the resource (not a potentially stale snapshot).
- Multiple rapid changes to the same resource only require one API fetch.

## Available Topics

| Topic | Description | Typical Resource |
|---|---|---|
| `orders_v2` | Order creation and status changes (recommended) | `/orders/{order_id}` |
| `items` | Item listing changes (create, edit, pause, activate) | `/items/{item_id}` |
| `questions` | New questions received on listings | `/questions/{question_id}` |
| `payments` | Payment creation and status changes | `/collections/{payment_id}` |
| `shipments` | Shipment creation and status changes | `/shipments/{shipment_id}` |
| `messages` | New messages received from buyers | `/messages/{message_id}` |
| `claims` | Claim creation and status changes | `/claims/{claim_id}` |
| `orders_feedback` | Buyer/seller feedback on orders | `/orders/{order_id}/feedback` |
| `stock_locations` | Stock location modifications | varies |
| `item_competition` | Catalog competition changes | varies |
| `public_offers` | Public offer changes | varies |

### Topic Recommendations

- **Use `orders_v2`** — the legacy `orders` topic is deprecated.
- **`created_orders`** is an old topic for reserving stock before payment confirmation. If you enable both `created_orders` and `orders_v2`, you may receive duplicate events. For most ERP integrations, `orders_v2` alone is sufficient.
- Not all topics apply to all verticals (e.g., Real Estate, Vehicles, Services have different topic sets).

## Notification Payload Structure

**Standard Payload:**
```json
{
  "resource": "/orders/200000350",
  "user_id": 123456789,
  "topic": "orders_v2",
  "application_id": 12345678,
  "attempts": 1,
  "sent": "2025-01-15T10:01:00.000Z",
  "received": "2025-01-15T10:01:00.000Z"
}
```

**Fields:**

| Field | Type | Description |
|---|---|---|
| `resource` | string | API path to the changed resource — use this to fetch full data |
| `user_id` | integer | The seller/user ID associated with the event |
| `topic` | string | The notification topic (see table above) |
| `application_id` | integer | Your registered application ID |
| `attempts` | integer | Number of delivery attempts |
| `sent` | string | ISO 8601 timestamp when MercadoLibre sent the notification |
| `received` | string | ISO 8601 timestamp when your server acknowledged |

### Payload Examples by Topic

**Items Notification:**
```json
{
  "resource": "/items/MLM123456789",
  "user_id": 123456789,
  "topic": "items",
  "application_id": 12345678,
  "attempts": 1,
  "sent": "2025-01-15T14:30:00.000Z",
  "received": "2025-01-15T14:30:00.100Z"
}
```

**Shipments Notification:**
```json
{
  "resource": "/shipments/44444444444",
  "user_id": 123456789,
  "topic": "shipments",
  "application_id": 12345678,
  "attempts": 1,
  "sent": "2025-01-15T16:00:00.000Z",
  "received": "2025-01-15T16:00:00.050Z"
}
```

**Payments Notification:**
```json
{
  "resource": "/collections/9876543210",
  "user_id": 123456789,
  "topic": "payments",
  "application_id": 12345678,
  "attempts": 1,
  "sent": "2025-01-15T10:00:30.000Z",
  "received": "2025-01-15T10:00:30.100Z"
}
```

## Setup and Configuration

### 1. Register Callback URL

In the MercadoLibre Developer Portal → My Applications → Your App:

1. Set the **Callback URL** (must be publicly accessible HTTPS endpoint).
2. Select the **topics** you want to receive notifications for.
3. Save the configuration.

### 2. Your Endpoint Requirements

Your callback endpoint must:

| Requirement | Detail |
|---|---|
| **Protocol** | HTTPS only |
| **Method** | Accept POST requests |
| **Response** | Return HTTP `200 OK` within the timeout window |
| **Timeout** | Respond within **500ms to 20 seconds** (varies by documentation version) |
| **Idempotency** | Handle duplicate notifications gracefully |

### 3. Retry Behavior

If your endpoint does not return `200 OK`:

- MercadoLibre will retry the notification with exponential backoff.
- The `attempts` field in the payload increments with each retry.
- After multiple failed attempts, the notification is dropped.
- You should implement a **missed notification polling** mechanism to catch any dropped notifications.

## Signature Verification (HMAC-SHA256)

MercadoLibre includes a signature in the request headers for webhook authenticity verification.

### Verification Steps

1. **Obtain your Secret Key** from the Developer Portal → My Applications → Webhooks configuration.
2. **Extract the signature** from the request header (`x-signature` or equivalent).
3. **Construct the manifest string** using request parameters (`id`, `request-id`, `ts`).
4. **Calculate HMAC-SHA256** using your Secret Key.
5. **Compare** the calculated hash with the signature in the header.

**Important:** Use a constant-time string comparison to prevent timing attacks.

### Verification Example (PHP)

```php
$secret = 'your-webhook-secret-key';
$ts = $request->header('x-request-ts');
$requestId = $request->header('x-request-id');

// Construct manifest
$manifest = "ts={$ts}&request-id={$requestId}";

// Calculate HMAC
$calculated = hash_hmac('sha256', $manifest, $secret);

// Compare
if (!hash_equals($calculated, $request->header('x-signature'))) {
    return response('Invalid signature', 403);
}
```

## Processing Workflow

The recommended workflow for handling notifications in this ERP:

```
Notification received
  → Validate signature
  → Return HTTP 200 immediately (before processing)
  → Queue the notification for async processing
  → Worker fetches full resource data via API
  → Map to local domain model
  → Update local database
  → Fire internal events if needed
```

**Critical Rules:**

1. **Return 200 immediately** — do NOT process the notification synchronously before responding.
2. **Always fetch fresh data** — the notification payload contains no business data, only the resource path.
3. **Handle duplicates** — the same notification may arrive multiple times. Use the resource ID for deduplication.
4. **Handle out-of-order** — notifications may arrive out of order. Always check the current state via API rather than assuming sequence.

## Missed Notification Polling

To catch notifications that were dropped or missed, implement periodic polling:

```
Every 5-10 minutes:
  → GET /orders/search?seller={SELLER_ID}&sort=date_desc&limit=50
  → Compare with local database
  → Process any orders not yet synced
```

This acts as a safety net alongside webhooks.

## Local Repo Anchors

- `app/Marketplaces/Services/Webhooks/MercadoLibreWebhookService.php`
- `app/Http/Controllers/WebhooksController.php`
- `app/Application/Orchestrators/WebhookOrchestrator.php`
- `app/Jobs/ProcessWebhookJob.php`

## Notes

- MercadoLibre webhooks deliver **minimal payloads** — always fetch the full resource via API.
- The `resource` field contains the API path, not the full URL. Prepend `https://api.mercadolibre.com` to make the GET request.
- `orders_v2` is the recommended topic. Avoid using the deprecated `orders` topic.
- Set `skipMarketplaceFanout` when processing marketplace-originated order/item changes to avoid echo loops.
- Webhook processing should be fully asynchronous — queue the notification and process in a job.
- If multiple notifications arrive for the same resource in quick succession, deduplicate and process only the latest state.