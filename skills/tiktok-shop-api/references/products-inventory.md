# TikTok Shop Products and Inventory

## Use When

- You need product catalog sync, SKU mapping, category lookup, or inventory updates.
- Creating, updating, or searching products via the TikTok Shop API.
- Working with product variations, attributes, images, or listing statuses.

## API References (v202309)

**Base URL:** `https://open-api.tiktokglobalshop.com`

### 1. Create Product

`POST /product/202309/products`

**Request Body Example:**
```json
{
  "title": "Premium Cotton T-Shirt",
  "description": "High-quality cotton t-shirt available in multiple sizes.",
  "category_id": "601226",
  "brand_id": "7000000123",
  "main_images": [
    { "uri": "tos-maliva-i-xxxx~tplv-xxxx.image" }
  ],
  "skus": [
    {
      "seller_sku": "SKU-TSHIRT-M",
      "sales_attributes": [
        {
          "attribute_id": "100000",
          "value_id": "200001",
          "custom_value": "Medium"
        }
      ],
      "price": {
        "amount": "299",
        "currency": "MXN"
      },
      "inventory": [
        {
          "warehouse_id": "7130000001",
          "quantity": 100
        }
      ]
    },
    {
      "seller_sku": "SKU-TSHIRT-L",
      "sales_attributes": [
        {
          "attribute_id": "100000",
          "value_id": "200002",
          "custom_value": "Large"
        }
      ],
      "price": {
        "amount": "299",
        "currency": "MXN"
      },
      "inventory": [
        {
          "warehouse_id": "7130000001",
          "quantity": 75
        }
      ]
    }
  ],
  "package_dimensions": {
    "length": "30",
    "width": "25",
    "height": "5",
    "unit": "CENTIMETER"
  },
  "package_weight": {
    "value": "200",
    "unit": "GRAM"
  },
  "is_cod_allowed": false
}
```

**Key Fields:**

| Field | Required | Description |
|---|---|---|
| `title` | Yes | Product title |
| `description` | Yes | Product description (HTML supported) |
| `category_id` | Yes | TikTok category ID — use Get Categories endpoint |
| `brand_id` | No | Brand ID — use Search Brands endpoint |
| `main_images` | Yes | Array of image URIs (upload images first via Upload Image endpoint) |
| `skus` | Yes | Array of SKU objects with price, inventory, and sales attributes |
| `skus[].seller_sku` | Yes | **Your SKU identifier** — maps to ERP inventory |
| `skus[].price.amount` | Yes | Price as string (in minor units or per region rules) |
| `skus[].price.currency` | Yes | Currency code (MXN, USD, GBP, etc.) |
| `skus[].inventory` | Yes | Array of warehouse stock entries |
| `package_dimensions` | Yes | Shipping dimensions |
| `package_weight` | Yes | Shipping weight |
| `is_cod_allowed` | No | Cash-on-delivery availability |

**Important:**
- Images must be uploaded first via `POST /product/202309/images/upload` — the response gives a `uri` to use in `main_images`.
- Descriptions cannot contain external links or contact information.
- Required product attributes vary by category — always query Get Attributes first.

### 2. Update Product

`PUT /product/202309/products/{product_id}`

Replaces all properties. All inputs (including blanks) will overwrite existing values. It is highly recommended to first call `GET /product/202309/products/{product_id}` to retrieve current data, update fields, and submit the complete object.

### 2a. Partial Edit Product

`POST /product/202309/products/{product_id}/partial_edit`

Update specific properties without sending the full object.
*   Top-level properties can be updated individually.
*   If updating a nested property, you must provide all values for that object; omitted nested properties are overwritten with blanks.
*   `price` and `inventory` are optional. If omitted, existing values remain unchanged.
*   Edits to price/inventory via their dedicated APIs below do not trigger re-audit.

**Request Example:**
```json
{
  "skus": [
    {
      "inventory": [
        {
          "warehouse_id": "7068517275539719942",
          "quantity": 999
        }
      ],
      "external_sku_id": "1729592969712207012",
      "sku_unit_count": "100.00",
      "list_price": {
        "amount": "1",
        "currency": "USD"
      }
    }
  ]
}
```

### 2b. Update Price

`POST /product/202309/products/{product_id}/prices/update`

Dedicated endpoint for updating price, bypassing standard edit audits.

**Request Example:**
```json
{
  "skus": [
    {
      "id": "1729592969712207013",
      "price": {
        "amount": "1.32",
        "currency": "USD",
        "sale_price": "1.32"
      }
    }
  ]
}
```

### 3. Get Product Detail

`GET /product/202309/products/{product_id}`

**Response Example:**
```json
{
  "code": 0,
  "data": {
    "product_id": "17290000001",
    "title": "Premium Cotton T-Shirt",
    "description": "High-quality cotton t-shirt...",
    "status": "LIVE",
    "category_chains": [
      { "id": "601226", "name": "T-Shirts", "is_leaf": true }
    ],
    "skus": [
      {
        "id": "17293847291",
        "seller_sku": "SKU-TSHIRT-M",
        "price": {
          "currency": "MXN",
          "original_price": "349",
          "sale_price": "299"
        },
        "inventory": [
          {
            "warehouse_id": "7130000001",
            "quantity": 100
          }
        ],
        "sales_attributes": [
          {
            "attribute_id": "100000",
            "attribute_name": "Size",
            "value_id": "200001",
            "value_name": "Medium"
          }
        ]
      }
    ],
    "main_images": [
      { "uri": "tos-maliva-i-xxxx~tplv-xxxx.image", "url": "https://..." }
    ],
    "create_time": 1690000000,
    "update_time": 1695000000
  }
}
```

### 4. Search Products

`POST /product/202309/products/search`

**Request Body:**
```json
{
  "page_size": 20,
  "page_token": "",
  "status": "LIVE",
  "create_time_from": 1690000000,
  "create_time_to": 1700000000,
  "update_time_from": 1690000000,
  "update_time_to": 1700000000
}
```

**Filter Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `page_size` | int | Results per page (max 100) |
| `page_token` | string | Cursor for pagination (from `next_page_token` in response) |
| `status` | string | Filter by status: `ALL`, `DRAFT`, `PENDING`, `LIVE`, `DEACTIVATED`, `SUSPENDED`, `FROZEN` |
| `create_time_from/to` | int | Unix timestamp range for creation date |
| `update_time_from/to` | int | Unix timestamp range for last update |

**Response:**
```json
{
  "code": 0,
  "data": {
    "products": [
      {
        "product_id": "17290000001",
        "title": "Premium Cotton T-Shirt",
        "status": "LIVE",
        "skus": [ /* ... */ ],
        "create_time": 1690000000,
        "update_time": 1695000000
      }
    ],
    "next_page_token": "cursor456",
    "total_count": 100
  }
}
```

### 4a. Activate Product

`POST /product/202309/products/activate`

**Request Example:**
```json
{
  "product_ids": [ "1729592969712207008", "1729592969712207021" ],
  "listing_platforms": [ "TIKTOK_SHOP" ]
}
```

### 4b. Deactivate Products

`POST /product/202309/products/deactivate`

Takes products off-shelf (invisible to buyers) while preserving data.

**Request Example:**
```json
{
  "product_ids": [ "1729592969712207008" ],
  "listing_platforms": [ "TIKTOK_SHOP", "TOKOPEDIA" ]
}
```

### 4c. Delete Products

`DELETE /product/202309/products`

Permanently removes products and historical data. Use cautiously.

**Request Example:**
```json
{
  "product_ids": [ "1749456684124612452", "1742456684124612451" ]
}
```

### 4d. Recover Products

`POST /product/202309/products/recover`

Recovers deleted products. Status changes to `SELLER_DEACTIVATED`.

**Request Example:**
```json
{
  "product_ids": [ "1729592969712207008" ]
}
```

### 5. Upload Product Image

`POST /product/202309/images/upload`

Content-Type: `multipart/form-data`

Upload an image file — returns a `uri` to use in product creation/update.

**Response:**
```json
{
  "code": 0,
  "data": {
    "uri": "tos-maliva-i-xxxx~tplv-xxxx.image",
    "url": "https://p16-oec-ttp.tiktokcdn-us.com/..."
  }
}
```

### 5b. Upload Product File

`POST /product/202309/files/upload`

Upload non-image files (PDFs, videos) for certifications. Content-Type: `multipart/form-data`.
Returns `{ "id": "...", "url": "...", "name": "...", "format": "PDF" }`.

### 5c. Search Size Charts

`POST /product/202407/products/size_charts/search`

Retrieve size charts configured in the shop.

### 6. Get Categories

`GET /product/202309/categories`

Returns the full category tree. Use this to find the correct `category_id` for product creation.

**Query Parameters:**

| Parameter | Description |
|---|---|
| `locale` | Language locale (e.g., `en-US`, `es-MX`) |

### 6a. Recommend Category

`POST /product/202309/categories/recommend`

Suggests category based on title, description, and images.

**Request Example:**
```json
{
  "product_title": "Men's Fashion Sports Low Cut Cotton Breathable Ankle Short",
  "description": "<p>Please check the measurements before purchase.</p>",
  "images": [ { "uri": "https://example.com/image.jpg" } ],
  "category_version": "v1",
  "listing_platform": "TIKTOK_SHOP"
}
```

### 6b. Get Category Rules

`GET /product/202309/categories/{category_id}/rules`

Retrieves rules (e.g., support for COD, size charts, certifications) for a specific leaf category.

### 6c. Check Product Listing (Prerequisites)

`GET /product/202309/check_listing_prerequisites`

Verify shop is ready to list products (return warehouse, shipping templates, etc.).

### 7. Get Category Attributes

`GET /product/202309/categories/{category_id}/attributes`

Returns required and optional attributes for a given category. Always query this before creating products.

**Response Fragment:**
```json
{
  "code": 0,
  "data": {
    "attributes": [
      {
        "id": "100000",
        "name": "Size",
        "is_required": true,
        "type": "SALES_ATTRIBUTE",
        "values": [
          { "id": "200001", "name": "S" },
          { "id": "200002", "name": "M" },
          { "id": "200003", "name": "L" }
        ]
      }
    ]
  }
}
```

### 8. Search Brands

`GET /product/202309/brands`

Search for brands to use in product creation. Some categories require a brand.

### 9. Create Custom Brands

`POST /product/202309/brands`

Create custom brands for your own use across all markets. You can't use these brands in Global Shop or when you're using an API to publish products.

**Required scope:** `seller.product.basic`

**Body Parameters:**

| Field | Required | Description |
|---|---|---|
| `name` | Yes | The name of the brand you want to create (length 2-30, no Chinese characters). |

**Request Example:**
```json
{
  "name": "Teas"
}
```

**Response Example:**
```json
{
  "code": 0,
  "message": "Success",
  "data": {
    "id": "7082427311584347905"
  }
}
```

**Error Codes:**
- `12052189`: Name < 2 characters
- `12052190`: Name > 30 characters
- `12052191`: Special fonts/emoticons not allowed
- `12052192`: Contains >= 5 consecutive numbers
- `12052205`: Brand name already exists

## Inventory Management

### Update Inventory

`POST /product/202309/products/{product_id}/inventory/update`

**Request Body:**
```json
{
  "skus": [
    {
      "id": "17293847291",
      "inventory": [
        {
          "warehouse_id": "7130000001",
          "quantity": 50
        }
      ]
    }
  ]
}
```

**Key Points:**
- Inventory is managed at the **SKU + warehouse** level.
- Each SKU can have stock in multiple warehouses.
- `quantity` is the absolute value (not a delta) — it replaces the current stock.
- Use `warehouse_id` from the Get Warehouses endpoint.

### Inventory Search

`POST /product/202309/inventory/search`

Retrieve inventory information for products/SKUs.

**Request Example:**
```json
{
  "product_ids": [ "1729592969712207008" ],
  "sku_ids": [ "1729388324987897824" ]
}
```

### Get Warehouses

`GET /fulfillment/202309/warehouses`

Returns the list of warehouses available to the seller. Each warehouse has a unique `warehouse_id` used in inventory updates.

## Product Optimization

Advanced features for SEO, diagnostics, and image translation (often EU-specific).

| Endpoint | Method | Description |
|---|---|---|
| `/product/202411/products/diagnoses` | `POST` | Diagnose and Optimize Product |
| `/product/202405/products/{product_id}/diagnoses` | `GET` | Product Information Issue Diagnosis |
| `/product/202405/products/seo_words` | `GET` | Get Products SEO Words |
| `/product/202405/products/recommendations` | `GET` | Get Recommended Product Title And Description |
| `/product/202404/images/optimize` | `POST` | Optimized Images |
| `/product/202505/images/translation_tasks` | `POST` | Create Image Translation Tasks |
| `/product/202506/images/translation_tasks` | `GET` | Get Image Translation Tasks |

## Product Statuses

| Status | Description |
|---|---|
| `DRAFT` | Created but not submitted for review |
| `PENDING` | Submitted, currently under TikTok review |
| `LIVE` | Approved and visible to buyers — purchasable |
| `FAILED` | Review failed — seller can edit and re-submit |
| `DEACTIVATED` | Taken off-shelf by seller or system — can be reactivated |
| `SUSPENDED` | Restricted due to policy issues |
| `FROZEN` | Serious policy violation — seller cannot modify or resubmit |
| `DELETED` | Permanently removed |

**Notes:**
- Only `LIVE` products are visible and purchasable.
- Editing a `LIVE` product triggers a re-review: the old version stays live until the new one is approved.
- `DEACTIVATED` products can be reactivated. `FROZEN` products generally cannot.

## Global Products (Cross-Border)

For cross-border sellers managing multiple shops, global products allow central management with market-specific pricing and inventory.

| Endpoint | Method | Description |
|---|---|---|
| `/product/202309/global_categories` | `GET` | Get Global Categories (cross-border category tree) |
| `/product/202309/global_categories/recommend` | `POST` | Recommend Global Categories |
| `/product/202309/categories/{category_id}/global_rules` | `GET` | Get Global Category Rules |
| `/product/202309/global_products` | `POST` | Create a global product (published to multiple markets) |
| `/product/202309/global_products/{global_product_id}` | `PUT` | Update a global product |
| `/product/202309/global_products/{global_product_id}/publish` | `POST` | Publish to specific target markets |
| `/product/202309/global_products/search` | `POST` | Search Global Products |
| `/product/202309/global_products` | `DELETE` | Delete Global Products |

## Local Repo Anchors

- `app/Application/Orchestrators/ProductOrchestrator.php`
- `app/Application/Orchestrators/InventoryOrchestrator.php`
- `app/Marketplaces/Services/Products/TikTokProductService.php`
- `app/Marketplaces/Services/Inventory/TikTokInventoryService.php`
- `app/Marketplaces/Mappers/TikTok/TikTokProductMapper.php`
- `app/Marketplaces/Mappers/TikTok/TikTokInventoryMapper.php`

## Notes

- Keep `skipMarketplaceFanout` in mind when importing marketplace-originated products to avoid echo loops.
- Respect the SKU-based inventory model: `seller_sku` is the primary mapping key to the ERP.
- Paginated product search is **cursor-based** (`page_token`), not offset-based.
- Image upload must happen before product creation — you cannot pass external URLs directly.
- Category attributes are mandatory — always fetch them before creating products.
- TikTok enforces listing limits per day for new sellers.