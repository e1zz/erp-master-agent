# Tiendanube (Nuvemshop) API Custom Fields

## Use When

- Adding custom data fields to orders, products, variants, customers, or categories.
- Displaying custom fields at checkout (order custom fields).
- Extending product/variant listings with merchant-specific attributes.

## API References

**Base URL:** `https://api.tiendanube.com/v1/{store_id}`
**Headers Required:** `Authentication`, `User-Agent`

## 1. Overview

Custom Fields allow apps to define structured fields on entities. Unlike Metafields (KV store), Custom Fields are **visible to merchants** in the admin panel and can be displayed at checkout.

### Supported Resources

| Resource | Base Path | Webhooks |
|---|---|---|
| Order | `/orders/custom-fields` | `order_custom_field/created\|updated\|deleted` |
| Product | `/products/custom-fields` | — |
| Product Variant | `/products/variants/custom-fields` | `product_variant_custom_field/created\|updated\|deleted` |
| Customer | `/customers/custom-fields` | — |
| Category | `/categories/custom-fields` | — |

## 2. Custom Field Properties

| Property | Type | Description |
|---|---|---|
| `id` | integer | Custom field ID |
| `name` | string | Field name (displayed to merchant) |
| `description` | string/null | Description/help text |
| `value_type` | string | `text`, `date`, `number`, `list`, `boolean` |
| `values` | array/null | Predefined values for `list` type |
| `required` | boolean | Whether field is required |
| `read_only` | boolean | Whether field is editable by merchant |
| `owner_resource` | string | Entity type this field belongs to |
| `created_at` | string | ISO 8601 |
| `updated_at` | string | ISO 8601 |

## 3. Endpoints (Common Pattern)

All custom field resources follow the same CRUD pattern:

### GET /{resource}/custom-fields — List All
### GET /{resource}/custom-fields/{id} — Get Single
### POST /{resource}/custom-fields — Create
### PUT /{resource}/custom-fields/{id} — Update
### DELETE /{resource}/custom-fields/{id} — Delete

**Order Custom Field Example:**
```json
POST /orders/custom-fields
{
  "name": "Delivery Instructions",
  "description": "Special delivery notes",
  "value_type": "text",
  "required": false,
  "read_only": false
}
```

## 4. Reading Custom Field Values on Orders

Use the `aggregates=custom_fields` query parameter:
```
GET /orders?aggregates=custom_fields
```

Each order will include a `custom_fields` array with the field definitions and their values for that order.

## 5. ERP Integration Notes

- Order custom fields are useful for ERP-specific metadata (e.g. "ERP Order Number", "Delivery Date").
- Product variant custom fields trigger webhooks on update.
- Use `order/custom_fields_updated` webhook to detect value changes on existing orders.
- Custom fields with `read_only: true` can only be modified via API, not by the merchant.

## Local Repo Anchors

- `app/Marketplaces/Services/CustomFields/TiendanubeCustomFieldService.php`
