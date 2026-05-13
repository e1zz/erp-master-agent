# Tiendanube (Nuvemshop) API Store

## Use When

- Retrieving store configuration (currency, language, timezone).
- Checking store plan and feature availability.
- Resolving the store domain after a `domain/updated` webhook.

## API References

**Base URL:** `https://api.tiendanube.com/v1/{store_id}`
**Headers Required:** `Authentication`, `User-Agent`

## 1. Store Properties

| Property | Type | Description |
|---|---|---|
| `id` | integer | Store ID |
| `name` | object | Multilingual store name |
| `email` | string | Store contact email |
| `main_language` | string | Primary language (e.g. `es`, `pt`) |
| `main_currency` | string | Primary currency (ISO 4217) |
| `country` | string | ISO country code |
| `plan_name` | string | Current plan |
| `url_with_protocol` | string | Full store URL |
| `original_domain` | string | Default `.mitiendanube.com` domain |
| `domains` | array | Custom domains |
| `customer_accounts` | string | `required`, `optional`, or `disabled` |

## 2. Endpoints

### GET /store — Get Store Info (Read-Only)
`GET /store`

Returns the full store configuration. Store settings are managed through the admin panel, not the API.

## 3. ERP Integration Notes

- Use during initial connection to resolve currency, language, and country.
- Listen to `domain/updated` webhook and re-fetch to update stored domain references.
- `plan_name` determines feature availability (e.g. multi-inventory).

## Local Repo Anchors

- `app/Marketplaces/Services/Connection/TiendanubeConnectionService.php`
