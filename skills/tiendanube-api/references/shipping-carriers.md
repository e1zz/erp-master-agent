# Tiendanube (Nuvemshop) API Shipping Carriers

## Use When

- Registering a custom shipping carrier for the storefront.
- Providing real-time shipping rate calculations via callback.
- Managing shipping option types and fulfillment modes.

## API References

**Base URL:** `https://api.tiendanube.com/v1/{store_id}`
**Headers Required:** `Authentication`, `User-Agent`

## 1. Overview

Shipping Carriers allow apps to register as a shipping rate provider. When a customer checks out, TiendaNube calls your `callback_url` to get rates. The carrier configuration defines available shipping options and fulfillment types.

> [!WARNING]
> Your callback endpoint must respond within **4 seconds** or the rate request will time out and no shipping options from your carrier will be shown.

## 2. Shipping Carrier Properties

| Property | Type | Description |
|---|---|---|
| `id` | integer | Carrier ID |
| `name` | string | Display name |
| `callback_url` | string | URL that receives rate requests |
| `types` | string | `ship`, `pickup`, or both |
| `active` | boolean | Whether carrier is active |
| `created_at` | string | ISO 8601 |
| `updated_at` | string | ISO 8601 |

## 3. Endpoints

### GET /shipping_carriers — List Carriers
`GET /shipping_carriers`

### GET /shipping_carriers/{id} — Get Single Carrier
`GET /shipping_carriers/{id}`

### POST /shipping_carriers — Create Carrier
`POST /shipping_carriers` → `201 Created`

**Request Example:**
```json
{
  "name": "My Shipping Service",
  "callback_url": "https://myapp.com/tiendanube/shipping-rates",
  "types": "ship"
}
```

### PUT /shipping_carriers/{id} — Update Carrier
`PUT /shipping_carriers/{id}` → `200 OK`

### DELETE /shipping_carriers/{id} — Delete Carrier
`DELETE /shipping_carriers/{id}` → `200 OK` with `{}`

## 4. Callback Rate Request

TiendaNube POSTs to your `callback_url` with the cart details:

**Callback Payload:**
```json
{
  "store_id": 123456,
  "currency": "ARS",
  "language": "es",
  "origin": {
    "zipcode": "1414",
    "city": "Buenos Aires",
    "province": "Buenos Aires",
    "country": "AR"
  },
  "destination": {
    "zipcode": "5000",
    "city": "Córdoba",
    "province": "Córdoba",
    "country": "AR"
  },
  "items": [
    {
      "variant_id": 12345,
      "name": "Product Name",
      "price": "100.00",
      "quantity": 2,
      "weight": "1.50",
      "width": "10.00",
      "height": "5.00",
      "depth": "15.00",
      "sku": "SKU-001",
      "free_shipping": false
    }
  ]
}
```

**Expected Response (JSON array):**
```json
{
  "rates": [
    {
      "name": "Standard Shipping",
      "code": "standard",
      "price": 250.00,
      "currency": "ARS",
      "type": "ship",
      "min_delivery_date": "2025-06-05",
      "max_delivery_date": "2025-06-10"
    }
  ]
}
```

> [!IMPORTANT]
> TiendaNube caches rate responses briefly. Do not rely on the callback being called for every single checkout attempt.

## 5. ERP Integration Notes

- Shipping carriers are primarily for apps that provide shipping calculation services.
- For ERP integration, this is relevant when the ERP manages its own logistics/carrier network.
- The 4-second timeout means your rate endpoint must be fast — consider pre-calculating rates.

## Local Repo Anchors

- `app/Marketplaces/Services/Shipping/TiendanubeShippingService.php`
