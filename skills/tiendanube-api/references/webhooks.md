# Tiendanube (Nuvemshop) API Webhooks & Event Notifications

## Use When

- Setting up real-time event listeners for Tiendanube stores.
- Implementing HMAC-SHA256 signature validation.
- Handling order creations, updates, or product changes.

## Subscribing to Webhooks

Webhooks are configured via the API:
`POST /v1/{store_id}/webhooks`

You must provide your endpoint URL and the `event` name.
*Note: Tiendanube explicitly blocks `localhost` URLs. Use a tunneling service like ngrok or PostCatcher for local development.*

## Core Events

| Event Type | Description |
|---|---|
| `order/created` | Fired when a checkout is completed. |
| `order/updated` | Fired when payment/shipping status changes. |
| `product/created` | Fired when a merchant creates a product. |
| `product/updated` | Fired when stock, price, or details change. |
| `app/suspended` | App is disabled (usually due to store non-payment). |
| `app/resumed` | App access restored. |

## Webhook Signature Verification (CRITICAL)

To prevent spoofing, Tiendanube signs webhook payloads. You must verify the signature before processing.

### 1. Extract Header

The signature is sent in the header:
`X-LinkedStore-HMAC-SHA256` 
*(In PHP, this is usually found in `$_SERVER['HTTP_X_LINKEDSTORE_HMAC_SHA256']`)*

### 2. Verification Logic

You must generate an HMAC-SHA256 hash using your application's `client_secret` against the **exact raw unparsed HTTP body**.

> [!WARNING]
> Do NOT use a parsed JSON object to generate the signature. If the framework automatically formats or strips whitespace from the body before you hash it, the signature will fail validation.

**PHP Example:**

```php
public function verifyTiendanubeWebhook(Request $request, string $clientSecret): bool
{
    // 1. Get the signature from the header
    $receivedSignature = $request->header('X-LinkedStore-HMAC-SHA256');

    if (!$receivedSignature) {
        return false;
    }

    // 2. Get the EXACT RAW body payload. 
    // In standard PHP: $payload = file_get_contents('php://input');
    // In Laravel: $payload = $request->getContent();
    $rawPayload = $request->getContent();

    // 3. Calculate the HMAC using your Client Secret
    $expectedSignature = hash_hmac('sha256', $rawPayload, $clientSecret);

    // 4. Use a timing-safe string comparison
    return hash_equals($expectedSignature, $receivedSignature);
}
```

## Idempotency and Delivery Guarantee

1. **Fast Response:** You must respond with a `2xx` status code within **3 seconds**. If you take longer, Tiendanube will assume a timeout and retry the delivery later.
2. **Queueing:** Because of the 3-second limit, do NOT process complex ERP logic synchronously. Save the raw payload to a queue (Redis/RabbitMQ/DB) and return `200 OK` immediately.
3. **Retries:** Tiendanube has an aggressive retry policy for failed deliveries. Ensure your worker logic is idempotent (e.g., ignore the event if the order ID is already processed).

## Error Handling
If the store's monthly subscription expires, API access is suspended. During this time, webhooks will NOT be fired. Listen to the `app/resumed` event to trigger a full resync of orders/products that were missed during the downtime.

## Local Repo Anchors

- `routes/webhooks.php`
- `app/Http/Controllers/Webhooks/TiendanubeWebhookController.php`
- `app/Marketplaces/Security/TiendanubeSignatureValidator.php`