# Tiendanube (Nuvemshop) API Metafields

## Use When

- Storing custom data on products, variants, categories, orders, customers, or pages.
- Managing NFe invoices on orders (namespace `nfe`, key `list`).
- Building app-specific key-value storage scoped to entities.

## API References

**Base URL:** `https://api.tiendanube.com/v1/{store_id}`
**Headers Required:** `Authentication`, `User-Agent`

## 1. Overview

Metafields are a **namespaced key-value store** scoped to specific entities. Each metafield is owned by an app and isolated — apps can only see their own metafields.

### Supported Owner Resources

| `owner_resource` | URL path segment |
|---|---|
| `Product` | `/metafields/products` |
| `Product_Variant` | `/metafields/product_variants` |
| `Category` | `/metafields/categories` |
| `Page` | `/metafields/pages` |
| `Order` | `/metafields/orders` |
| `Customer` | `/metafields/customers` |

## 2. Metafield Properties

| Property | Type | Description |
|---|---|---|
| `id` | integer | Metafield ID |
| `namespace` | string | Namespace for grouping (e.g. `nfe`, `app_data`) |
| `key` | string | Key within the namespace |
| `value` | string | Stored value (can be JSON-encoded string) |
| `description` | string/null | Human-readable description |
| `owner_id` | integer | ID of the owning entity |
| `owner_resource` | string | Resource type (e.g. `Product`, `Order`) |
| `created_at` | string | ISO 8601 |
| `updated_at` | string | ISO 8601 |
| `deleted_at` | string/null | Soft-delete timestamp |

## 3. Endpoints

### GET /metafields/{owner_resource} — List Metafields
`GET /metafields/products`

**Query Parameters:** `owner_id`, `namespace`, `key`, `per_page`, `page`, `since_id`, `created_at_min`, `created_at_max`, `updated_at_min`, `updated_at_max`, `fields`.

**Response Example:**
```json
[
  {
    "id": 10691,
    "key": "key3",
    "value": "3",
    "namespace": "namespace3",
    "description": "description3",
    "owner_id": 2856879,
    "owner_resource": "Product",
    "created_at": "2015-01-02T19:48:44+0000",
    "updated_at": "2015-01-02T19:48:44+0000"
  }
]
```

### GET /metafields/{id} — Get Single Metafield
`GET /metafields/{id}`

### POST /metafields — Create Metafield
`POST /metafields` → `201 Created`

**Request Example:**
```json
{
  "key": "author",
  "value": "J.R.R. Tolkien",
  "namespace": "bookstore",
  "description": "Book author",
  "owner_id": "2857023",
  "owner_resource": "Product"
}
```

### PUT /metafields/{id} — Update Metafield
`PUT /metafields/{id}` → `200 OK`

Only `value` and `description` can be updated:
```json
{
  "value": "modified",
  "description": "description modified"
}
```

### DELETE /metafields/{id} — Delete Metafield
`DELETE /metafields/{id}` → `200 OK` with `{}`

## 4. NFe Invoice Pattern (CRITICAL FOR BRAZIL)

Invoices are managed via metafields, not a dedicated API. See [orders-fulfillment.md](./orders-fulfillment.md) Section 11 for the full workflow.

**Quick Reference:**
1. **Check** if NFe metafield exists: `GET /metafields/orders?per_page=1&owner_id=ORDER_ID&namespace=nfe&key=list&fields=id,value`
2. **Create** if not exists: `POST /metafields` with `owner_resource: "Order"`, `namespace: "nfe"`, `key: "list"`
3. **Update** if exists: `PUT /metafields/{metafield_id}`

**Value Format (JSON-encoded array):**
```json
[
  {
    "key": "35210...0001012550...",
    "link": "https://nfe-provider.com/danfe/...",
    "fulfillment_order_id": "01JRESYDXFQ..."
  }
]
```

## 5. ERP Integration Notes

- Metafields are **app-scoped**: each app can only read/write its own metafields.
- Use `namespace` to logically group data (e.g. `erp_sync`, `nfe`, `shipping_info`).
- For bulk lookups, filter by `owner_id` and `namespace` to minimize payload size.

## Local Repo Anchors

- `app/Marketplaces/Services/Metafields/TiendanubeMetafieldService.php`
