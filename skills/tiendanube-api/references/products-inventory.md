# Tiendanube (Nuvemshop) API Products and Inventory

## Use When

- Creating, updating, or deleting products and their variants.
- Looking up products by ID or SKU for ERP mapping.
- Pushing stock level updates from the ERP to the storefront.
- Handling Multi-Inventory (multiple warehouses).

## API References

**Base URL:** `https://api.tiendanube.com/v1/{store_id}`
**Headers Required:** `Authentication`, `User-Agent`

## 1. Catalog Structure

Tiendanube structures catalogs with a parent-child relationship:
- **Product:** The main listing (Title, Description, Images).
- **Variant:** The specific SKU (Size, Color, Price, Stock). **Every product has at least one variant**, even if there are no options.

> [!IMPORTANT]
> A new Product API with multi-inventory support is being rolled out. For new development, use the new version.

### Key Product Properties

| Property | Type | Description |
|---|---|---|
| `name` | object | Multilingual (`{"en":"...","es":"...","pt":"..."}`) |
| `description` | object | Multilingual HTML |
| `handle` | object | URL slug |
| `brand` | string/null | Brand |
| `video_url` | string/null | HTTPS YouTube URL |
| `seo_title` | string | SEO title |
| `seo_description` | string | SEO description |
| `published` | boolean | Visible in store |
| `free_shipping` | boolean | Free shipping |
| `tags` | string | Comma-separated |
| `attributes` | array | Max 3 per product |
| `categories` | array | Category IDs |
| `images` | array | Max **250** per product; max **9** inline on creation |
| `variants` | array | Max **1000** per product |

### Key Variant Properties

| Property | Type | Description |
|---|---|---|
| `sku` | string/null | SKU identifier |
| `barcode` | string/null | Barcode |
| `price` | string | e.g. `"25.00"` |
| `promotional_price` | string/null | Sale price |
| `cost` | string/null | Cost price |
| `stock` | int/null/string | `null`=infinite, `""`=set unlimited, `0`=out of stock |
| `stock_management` | boolean | Auto-set. Cannot modify via API |
| `weight`,`width`,`height`,`depth` | string | Dimensions |
| `inventory_levels` | array | Multi-inventory stock per location |

### Store Limits
- Max **100,000 products** per store
- Max **1,000 variants** per product
- Max **250 images** per product
- Max **3 attributes** per product
- `products.id` uses **int64**-scale values

## 2. Endpoints

### GET /products — List All Products
`GET /products`

**Query Parameters:** `page`, `per_page` (max 200), `since_id`, `created_at_min`, `created_at_max`, `updated_at_min`, `updated_at_max`, `fields` (e.g. `id,name`).

### GET /products/{id} — Get Single Product
`GET /products/{id}`

Returns a single product with all variants, images, and categories.

### GET /products/sku/{sku} — Lookup by SKU (CRITICAL FOR ERP)
`GET /products/sku/{sku}`

Returns the **first** Product found where one of its variants matches the given SKU.

### POST /products — Create Product
`POST /products` → `201 Created`

**Request Example:**
```json
{
  "name": { "en": "Ultra Ball", "es": "Ultra Ball", "pt": "Ultra Ball" },
  "video_url": "https://www.youtube.com/watch?v=example",
  "images": [{ "src": "https://example.com/image.png" }],
  "variants": [{ "price": "10.00", "stock_management": true, "stock": 12, "weight": "2.00", "cost": "10.99" }],
  "categories": [11654304]
}
```

**422 Errors:** `name can't be blank`, `100000 product limit`, `250 image limit`, `1000 variant limit`, `video url not secure`.

### PUT /products/{id} — Update Product
`PUT /products/{id}` → `200 OK`

> [!WARNING]
> Sending `categories` as empty array **removes** the category. Omit field or include current IDs.

> [!NOTE]
> For products without explicit variants, update price/stock via `PUT /products/{product_id}/variants/{id}` on the "virtual" variant.

**Request Example:**
```json
{ "categories": [4567], "published": false }
```

### DELETE /products/{id} — Remove Product
`DELETE /products/{id}` → `200 OK` with `{}`

## 3. Inventory Updates (Single vs Bulk)

### Updating a Single Variant
`PUT /products/{product_id}/variants/{variant_id}`

### Bulk Stock/Price Updates (RECOMMENDED)
`PATCH /products/stock-price`

Max 50 variants per request. Supports `inventory_levels` for multi-inventory.

**Request Example:**
```json
[
  {
    "id": 53786462,
    "variants": [
      { "id": 147085180, "price": 1000, "inventory_levels": [{ "stock": 300 }] }
    ]
  }
]
```

**Response (200):**
```json
[{ "id": 53786462, "variants": [{ "id": 147085180, "success": true }] }]
```

**422 Errors:** `price must be a number`, `stock must be at least 0`, `Too many variants sent`.

## 4. The Multi-Inventory Transition

| Field | Description | Usage Note |
|---|---|---|
| `stock` | Legacy single-location integer. | Writing updates default/first location. |
| `inventory_levels` | Array of stock per location. | **Preferred** for multi-warehouse stores. |

For multi-warehouse stores, specify `location_id` in each `inventory_levels` element:
```json
{ "inventory_levels": [{ "location_id": "loc_abc123", "stock": 15 }, { "location_id": "loc_xyz987", "stock": 5 }] }
```

### Fetching Locations
`GET /locations` — Retrieve warehouse locations to get `location_id`s.

## 5. Unlimited Stock

Set `stock` to `""` for unlimited stock. `stock_management` is auto-set (`false`=infinite, `true`=tracked).

## Local Repo Anchors

- `app/Marketplaces/Services/Products/TiendanubeProductService.php`
- `app/Marketplaces/Services/Inventory/TiendanubeInventoryService.php`
- `app/Marketplaces/Mappers/Tiendanube/TiendanubeInventoryMapper.php`

## Notes

- `stock: null` = infinite stock. `stock: 0` = out of stock.
- Use `PATCH /products/stock-price` for all routine ERP syncs to save rate-limit quota.
- `GET /products/sku/{sku}` is the fastest way to resolve ERP SKUs to Tiendanube IDs.