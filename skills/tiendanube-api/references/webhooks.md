# Tiendanube (Nuvemshop) API Webhooks & Event Notifications

## Use When

- Setting up real-time event listeners for Tiendanube stores.
- Managing webhook subscriptions (CRUD operations).
- Implementing HMAC-SHA256 signature validation.
- Handling order, product, fulfillment, or customer changes.

## API References

**Base URL:** `https://api.tiendanube.com/v1/{store_id}`
**Headers Required:** `Authentication`, `User-Agent`

## 1. Webhook CRUD Endpoints

### GET /webhooks — List All Webhooks
`GET /webhooks`

Returns all webhooks registered for your application.

**Query Parameters:** `since_id`, `created_at_min`, `created_at_max`, `updated_at_min`, `updated_at_max`.

**Response Example:**
```json
[
  {
    "id": 101,
    "event": "app/uninstalled",
    "url": "https://myapp.com/uninstall",
    "created_at": "2013-01-03T09:11:51-03:00",
    "updated_at": "2013-03-11T09:14:11-03:00"
  },
  {
    "id": 5670,
    "event": "order/created",
    "url": "https://myapp.com/order_created_hook",
    "created_at": "2013-04-07T09:11:51-03:00",
    "updated_at": "2013-04-08T11:11:51-03:00"
  }
]
```

### GET /webhooks/{id} — Get Single Webhook
`GET /webhooks/{id}`

### POST /webhooks — Create Webhook
`POST /webhooks` → `201 Created`

**Request Example:**
```json
{
  "event": "product/created",
  "url": "https://myapp.com/product_created_hook"
}
```

> [!WARNING]
> Tiendanube blocks `localhost` and `tiendanube`/`nuvemshop` domain URLs. Use a tunneling service (ngrok, RequestCatcher) for local development.

### PUT /webhooks/{id} — Update Webhook
`PUT /webhooks/{id}` → `200 OK`

### DELETE /webhooks/{id} — Remove Webhook
`DELETE /webhooks/{id}` → `200 OK` with `{}`

## 2. Complete Event List

### App Events
| Event | Payload | Description |
|---|---|---|
| `app/uninstalled` | `id` (app ID) | App uninstalled |
| `app/suspended` | — | API access suspended (store non-payment) |
| `app/resumed` | — | API access restored |

### Order Events
| Event | Payload | Description |
|---|---|---|
| `order/created` | `id` (order ID) | Checkout completed |
| `order/updated` | `id` | Payment/shipping status change |
| `order/paid` | `id` | Order marked as paid |
| `order/packed` | `id` | Order packed |
| `order/fulfilled` | `id` | Order delivered |
| `order/cancelled` | `id` | Order cancelled |
| `order/edited` | `id` | Order products/amounts modified |
| `order/pending` | `id` | Payment pending |
| `order/voided` | `id` | Order voided |
| `order/custom_fields_updated` | `id` | Custom fields changed |

### Product Events
| Event | Payload | Description |
|---|---|---|
| `product/created` | `id` (product ID) | Product created |
| `product/updated` | `id` | Stock, price, or details changed |
| `product/deleted` | `id` | Product removed |

### Category Events
| Event | Payload | Description |
|---|---|---|
| `category/created` | `id` | Category created |
| `category/updated` | `id` | Category updated |
| `category/deleted` | `id` | Category deleted |

### Customer Events
| Event | Payload | Description |
|---|---|---|
| `customer/created` | `id`, `event_launch_ts` | Customer created |
| `customer/updated` | `id`, `event_launch_ts` | Customer updated |
| `customer/deleted` | `id`, `event_launch_ts` | Customer deleted |

### Domain Events
| Event | Payload | Description |
|---|---|---|
| `domain/updated` | *(none)* | Store domain changed. Refer to Store resource. |

### Custom Field Events
| Event | Payload | Description |
|---|---|---|
| `order_custom_field/created` | `id` | Order custom field created |
| `order_custom_field/updated` | `id` | Order custom field updated |
| `order_custom_field/deleted` | `id` | Order custom field deleted |
| `product_variant/custom_fields_updated` | `id` (variant ID) | Variant custom fields changed |
| `product_variant_custom_field/created` | `id` | Variant custom field created |
| `product_variant_custom_field/updated` | `id` | Variant custom field updated |
| `product_variant_custom_field/deleted` | `id` | Variant custom field deleted |

### Fulfillment Order Events
| Event | Payload | Description |
|---|---|---|
| `fulfillment_order/status_updated` | `order_id`, `fulfillment_id` (ULID), `status` | Fulfillment status changed |
| `fulfillment_order/tracking_event_created` | `order_id`, `fulfillment_id`, `tracking_event_id`, `status` | Tracking event added |
| `fulfillment_order/tracking_event_updated` | `order_id`, `fulfillment_id`, `tracking_event_id`, `status` | Tracking event modified |
| `fulfillment_order/tracking_event_deleted` | `order_id`, `fulfillment_id`, `tracking_event_id`, `status` | Tracking event removed |

### Location Events
| Event | Payload | Description |
|---|---|---|
| `location/created` | `id` | Warehouse location created |
| `location/updated` | `id` | Location updated |
| `location/deleted` | `id` | Location deleted |

### Billing Events
| Event | Payload | Description |
|---|---|---|
| `subscription/updated` | `concept_code`, `service_id`, `event_launch_ts` | Billing subscription changed |

### Webhook Payload Structure
Every webhook sends: `store_id` (received as `user_id` at auth) and `event` name, plus event-specific fields above.

```json
{ "store_id": 123, "event": "product/created", "id": 1948209 }
```

## 3. Webhook Signature Verification (CRITICAL)

### Extract Header
`X-LinkedStore-HMAC-SHA256`
*(In PHP: `$_SERVER['HTTP_X_LINKEDSTORE_HMAC_SHA256']`)*

### Verification Logic

Generate HMAC-SHA256 hash using your `client_secret` against the **exact raw unparsed HTTP body**.

> [!WARNING]
> Do NOT use a parsed JSON object. If the framework formats or strips whitespace before hashing, the signature will fail.

**PHP Example:**
```php
public function verifyTiendanubeWebhook(Request $request, string $clientSecret): bool
{
    $receivedSignature = $request->header('X-LinkedStore-HMAC-SHA256');
    if (!$receivedSignature) { return false; }
    $rawPayload = $request->getContent();
    $expectedSignature = hash_hmac('sha256', $rawPayload, $clientSecret);
    return hash_equals($expectedSignature, $receivedSignature);
}
```

## 4. Delivery, Retries, and Idempotency

### Fast Response
Respond with `2xx` within **3 seconds**. Queue complex logic and return `200 OK` immediately.

### Retry Policy
- First 4 retries: immediately, ~5min, ~10min, ~15min
- Then exponential backoff (×1.4) over 48 hours
- Up to **18 total attempts**

### Message Ordering and Deduplication
Messages are processed via a distributed system — order is **not guaranteed**.

**Deduplication Rules:**
- Identical message bodies → treat as **unique**
- Identical content but different attributes → treat as **unique**
- Different content (e.g., retry counts in body) → treat as **duplicates**

Ensure your worker logic is **idempotent** (e.g., ignore event if order ID already processed).

## 5. Required LGPD/Data Protection Webhooks

These webhooks are **mandatory** for data protection compliance (e.g., Brazil's LGPD).

### store/redact
Sent after merchant uninstalls your app. Delete their data.
```json
{ "store_id": 123 }
```

### customers/redact
Request to erase consumer information. Sent 5 days after uninstall (or 6 months after last order).
```json
{
  "store_id": 123,
  "customer": { "id": 1, "email": "email@email.com", "phone": "+55...", "identification": "..." },
  "orders_to_redact": [213, 3415, 21515]
}
```

### customers/data_request
Request for customer data report. App must send info directly to merchant.
```json
{
  "store_id": 123,
  "customer": { "id": 1, "email": "email@email.com", "phone": "+55...", "identification": "..." },
  "orders_requested": [213, 3415],
  "checkouts_requested": [214, 3416],
  "drafts_orders_requested": [10, 1245],
  "data_request": { "id": 456 }
}
```

## 6. Error Handling
If the store's subscription expires, API access is suspended and webhooks will NOT fire. Listen to `app/resumed` to trigger a full resync.

## Local Repo Anchors

- `routes/webhooks.php`
- `app/Http/Controllers/Webhooks/TiendanubeWebhookController.php`
- `app/Marketplaces/Security/TiendanubeSignatureValidator.php`