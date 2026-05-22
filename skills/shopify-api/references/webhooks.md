# Shopify Webhooks

## Use When

- You are validating the authenticity of incoming Shopify webhooks.
- You are registering webhook subscriptions on Shopify via API.
- You are writing controllers to route incoming Shopify webhook payloads.
- You are configuring mandatory GDPR/privacy compliance endpoints.

## API References

**Standard version:** `2025-10`

### Major Endpoints:
- `GET /admin/api/2025-10/webhooks.json` (List subscriptions)
- `POST /admin/api/2025-10/webhooks.json` (Create subscription)
- `DELETE /admin/api/2025-10/webhooks/{id}.json` (Delete subscription)

---

## 1. HMAC Signature Verification (CRITICAL)

Shopify signs every webhook request. You MUST verify the signature before processing the data to prevent security breaches.

### Headers Sent by Shopify:
- `X-Shopify-Hmac-Sha256`: Base64 encoded HMAC-SHA256 signature.
- `X-Shopify-Topic`: The event name (e.g. `orders/create`).
- `X-Shopify-Shop-Domain`: The shop's domain (e.g. `my-store.myshopify.com`).

### PHP HMAC Verification Code:
Use `hash_equals` to prevent timing attacks.

```php
function verifyShopifyWebhook(string $rawBody, string $headerHmac, string $clientSecret): bool
{
    $calculatedHmac = base64_encode(
        hash_hmac('sha256', $rawBody, $clientSecret, true)
    );
    
    return hash_equals($calculatedHmac, $headerHmac);
}
```
*Note: Make sure to read the raw request input: `$rawBody = request()->getContent();`.*

---

## 2. Registering Webhooks via API

Webhooks can be registered programmatically during or after the OAuth sequence.

`POST /admin/api/2025-10/webhooks.json`
```json
{
  "webhook": {
    "topic": "orders/create",
    "address": "https://your-erp-domain.com/api/webhooks/shopify",
    "format": "json"
  }
}
```

### Standard Webhook Topics:
- **`orders/create`**, **`orders/updated`**, **`orders/cancelled`**: Capture orders.
- **`inventory_levels/update`**: Sync inventory changes made on Shopify back to the ERP.
- **`products/update`**, **`products/delete`**: Capture catalog modifications.
- **`app/uninstalled`**: Trigger cleanup when the merchant removes your app.

---

## 3. Mandatory GDPR / Compliance Webhooks

Shopify requires all public apps to register compliance webhooks in the Partner Dashboard. These are POST requests sent directly to configured endpoints, and they also use `X-Shopify-Hmac-Sha256` signature verification.

### 1. Customer Data Request (`customers/data_request`)
Sent when a customer requests their data from the store owner.
- **Goal:** ERP must return any stored personal data for the customer.

### 2. Customer Redaction (`customers/redact`)
Sent when a customer requests to be deleted.
- **Goal:** ERP must anonymize/remove customer records.

### 3. Shop Redaction (`shop/redact`)
Sent 48 hours after a store uninstalls your app.
- **Goal:** Erase all stored shop data.

---

## 4. PHP SDK Webhook Handling

You can register handlers and process them dynamically using the Shopify PHP SDK:

```php
use Shopify\Webhooks\Registry;
use Shopify\Webhooks\DeliveryMethod;

// Register handler
Registry::addHandler(
    topic: 'orders/create',
    handler: new \App\Marketplaces\Webhooks\ShopifyOrderCreateHandler()
);

// In your webhook controller, process it:
$response = Registry::process(
    headers: request()->headers->all(),
    rawBody: request()->getContent()
);
```

## Local Repo Anchors

- `app/Http/Controllers/Webhooks/ShopifyWebhookController.php`
- `app/Marketplaces/Services/Webhooks/ShopifyWebhookService.php`
