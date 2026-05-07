# MercadoLibre Products and Inventory

## Use When

- Managing catalog sync, creating or updating item listings, or mapping `seller_custom_field` to SKUs.
- Syncing inventory quantities (single or multi-warehouse).
- Working with product variations, attributes, categories, or catalog integration.
- Debugging product listing errors or validation failures.

## Items API

### 1. Create Item (Listing)

`POST https://api.mercadolibre.com/items`

**Request Body Example (Simple Item):**
```json
{
  "title": "Product Name - Do Not Bid",
  "category_id": "MLM3530",
  "price": 350,
  "currency_id": "MXN",
  "available_quantity": 10,
  "buying_mode": "buy_it_now",
  "condition": "new",
  "listing_type_id": "gold_special",
  "seller_custom_field": "SKU-12345",
  "pictures": [
    { "source": "https://example.com/image1.jpg" }
  ],
  "attributes": [
    { "id": "BRAND", "value_name": "BrandName" },
    { "id": "MODEL", "value_name": "ModelName" }
  ]
}
```

**Request Body Example (Item with Variations):**
```json
{
  "title": "T-Shirt Multiple Colors",
  "category_id": "MLM109042",
  "price": 500,
  "currency_id": "MXN",
  "buying_mode": "buy_it_now",
  "condition": "new",
  "listing_type_id": "gold_special",
  "pictures": [
    { "id": "pic1", "source": "https://example.com/black.jpg" },
    { "id": "pic2", "source": "https://example.com/white.jpg" }
  ],
  "variations": [
    {
      "attribute_combinations": [
        { "id": "COLOR", "value_name": "Negro" },
        { "id": "SIZE", "value_name": "M" }
      ],
      "price": 500,
      "available_quantity": 5,
      "seller_custom_field": "SKU-BLACK-M",
      "picture_ids": ["pic1"]
    },
    {
      "attribute_combinations": [
        { "id": "COLOR", "value_name": "Blanco" },
        { "id": "SIZE", "value_name": "M" }
      ],
      "price": 500,
      "available_quantity": 5,
      "seller_custom_field": "SKU-WHITE-M",
      "picture_ids": ["pic2"]
    }
  ]
}
```

**Key Fields:**

| Field | Required | Description |
|---|---|---|
| `title` | Yes | Listing title (max 60 chars) |
| `category_id` | Yes | MercadoLibre category ID |
| `price` | Yes | Item price |
| `currency_id` | Yes | Currency code (ARS, BRL, MXN, etc.) |
| `available_quantity` | Yes | Stock quantity (ignored if variations exist) |
| `buying_mode` | Yes | `buy_it_now` or `auction` |
| `condition` | Yes | `new`, `used`, or `not_specified` |
| `listing_type_id` | Yes | `gold_special`, `gold_pro`, `gold`, `silver`, `bronze`, `free` |
| `seller_custom_field` | No | **SKU mapping field** — used to link to ERP inventory |
| `pictures` | Yes | Array of image objects with `source` URL |
| `variations` | No | Array of variation objects (color, size, etc.) |
| `attributes` | Depends | Category-specific attributes (BRAND, MODEL, etc.) |

**Important:**
- Descriptions cannot be included in the initial POST. Use a separate endpoint after creation.
- Required `attributes` vary by category — query `/categories/{category_id}/attributes` first.
- If item has variations, `available_quantity` at the item level is ignored — each variation has its own.

### 2. Add/Update Description

`POST https://api.mercadolibre.com/items/{ITEM_ID}/description`

```json
{
  "plain_text": "Detailed product description text here."
}
```

Or update an existing description:

`PUT https://api.mercadolibre.com/items/{ITEM_ID}/description`

### 3. Get Item Details

`GET https://api.mercadolibre.com/items/{ITEM_ID}`

**Response Fragment:**
```json
{
  "id": "MLM123456789",
  "title": "Product Name",
  "seller_id": 123456789,
  "category_id": "MLM3530",
  "price": 350,
  "currency_id": "MXN",
  "available_quantity": 10,
  "sold_quantity": 5,
  "status": "active",
  "seller_custom_field": "SKU-12345",
  "variations": [],
  "pictures": [
    { "id": "123456-MLM1234567890_012025", "url": "https://..." }
  ],
  "shipping": {
    "mode": "me2",
    "free_shipping": true,
    "logistic_type": "cross_docking"
  },
  "catalog_product_id": "MLM12345678",
  "catalog_listing": true
}
```

### 4. Update Item

`PUT https://api.mercadolibre.com/items/{ITEM_ID}`

**Update Price and Stock (Simple Item):**
```json
{
  "price": 400,
  "available_quantity": 25
}
```

**Update Stock for Specific Variation:**
```json
{
  "variations": [
    {
      "id": 123456789,
      "available_quantity": 10,
      "price": 500
    }
  ]
}
```

**Pause/Activate Listing:**
```json
{
  "status": "paused"
}
```
```json
{
  "status": "active"
}
```

**Close Listing Permanently:**
```json
{
  "status": "closed"
}
```

### 5. Search Seller Items

`GET https://api.mercadolibre.com/users/{USER_ID}/items/search?status=active&offset=0&limit=50`

**Response:**
```json
{
  "seller_id": "123456789",
  "results": ["MLM123456789", "MLM987654321"],
  "paging": {
    "total": 150,
    "offset": 0,
    "limit": 50
  }
}
```

Then use multiget to fetch item details in bulk:

`GET https://api.mercadolibre.com/items?ids=MLM123456789,MLM987654321&attributes=id,title,price,available_quantity,variations,seller_custom_field`

**Note:** Multiget supports up to **20 IDs** per request.

### 6. Get Category Attributes

`GET https://api.mercadolibre.com/categories/{CATEGORY_ID}/attributes`

Returns the list of required and optional attributes for a given category. Always query this before creating items to avoid validation errors.

### 7. Predict Category

`GET https://api.mercadolibre.com/sites/{SITE_ID}/categories/predict?title={PRODUCT_TITLE}`

Returns suggested categories based on product title. Useful for automated category assignment.

## Catalog Integration

MercadoLibre has a centralized product catalog. Catalog listings group multiple sellers on a single product page.

### Check Catalog Eligibility

`GET https://api.mercadolibre.com/items/{ITEM_ID}/catalog_product_id`

### Search Catalog Products

`GET https://api.mercadolibre.com/products/search?site_id={SITE_ID}&q={SEARCH_TERM}`

### Catalog Listing Constraints

- In catalog listings, MercadoLibre manages the product data (title, description, images).
- The seller only controls: **price**, **stock**, and **shipping method**.
- `catalog_listing: true` in item response indicates this is a catalog item.
- Editing title, description, or images on catalog items is not permitted.

## Inventory Management

### Single-Origin Stock

For simple inventory, update stock directly on the item:

`PUT https://api.mercadolibre.com/items/{ITEM_ID}`
```json
{
  "available_quantity": 50
}
```

For variations:
```json
{
  "variations": [
    { "id": 123456, "available_quantity": 25 }
  ]
}
```

### Multi-Origin Stock (Multi-Warehouse)

**Prerequisite:** The seller must have `warehouse_management` and `multiwarehouse` tags in their user profile.

#### Check Stock by User Product

`GET https://api.mercadolibre.com/user-products/{USER_PRODUCT_ID}/stock`

#### Update Stock by Location

`PUT https://api.mercadolibre.com/user-products/{USER_PRODUCT_ID}/stock`

```json
{
  "stock_locations": [
    {
      "store_id": "123456",
      "network_node_id": "789012",
      "quantity": 50
    }
  ]
}
```

**Key Identifiers:**

| ID | Description |
|---|---|
| `user_product_id` | MercadoLibre's internal product identifier for the seller |
| `store_id` | Seller's warehouse/store identifier |
| `network_node_id` | Specific node in the logistics network |

**Notes:**
- Multi-origin stock is only available for sellers using Mercado Envíos (me2) with cross-docking or fulfillment.
- Warehouse creation is done via the seller dashboard, not the API.
- When multi-origin is active, updating `available_quantity` on the item directly may not work — use the user-products stock endpoint instead.

## Item Statuses

| Status | Description |
|---|---|
| `active` | Visible and purchasable |
| `paused` | Not visible, seller-paused |
| `closed` | Permanently ended |
| `under_review` | Being reviewed by MercadoLibre |
| `inactive` | Deactivated by MercadoLibre (policy violation, etc.) |

## Listing Types

| Type | Description |
|---|---|
| `gold_special` | Premium (Clásica) — best visibility |
| `gold_pro` | Premium with extra features |
| `gold` | Standard visibility |
| `silver` | Reduced visibility |
| `bronze` | Minimal visibility |
| `free` | Free listing |

## Local Repo Anchors

- `app/Marketplaces/Services/Products/MercadoLibreProductService.php`
- `app/Marketplaces/Services/Inventory/MercadoLibreInventoryService.php`
- `app/Marketplaces/Mappers/MercadoLibre/MercadoLibreProductMapper.php`
- `app/Marketplaces/Mappers/MercadoLibre/MercadoLibreInventoryMapper.php`

## Notes

- `seller_custom_field` is the primary SKU mapping field. It exists at both item level and variation level.
- When an item has variations, always use the variation-level `seller_custom_field` for SKU resolution.
- MercadoLibre enforces category-specific required attributes. Always fetch `/categories/{id}/attributes` before creating items.
- Image URLs in `pictures.source` must be publicly accessible HTTPS URLs.
- Item titles have a 60-character limit.
- Use `fields` parameter on GET requests to reduce response size: `?attributes=id,title,price,available_quantity`