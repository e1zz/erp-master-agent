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

Partial updates are supported — only send the fields you want to change.

**Update Price and Title:**
```json
{
  "title": "Updated Product Title",
  "skus": [
    {
      "id": "17293847291",
      "price": {
        "amount": "349",
        "currency": "MXN"
      }
    }
  ]
}
```

**Partial Edit APIs** are also available for updating specific fields (price, stock, images) without sending the full product object.

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

### 6. Get Categories

`GET /product/202309/categories`

Returns the full category tree. Use this to find the correct `category_id` for product creation.

**Query Parameters:**

| Parameter | Description |
|---|---|
| `locale` | Language locale (e.g., `en-US`, `es-MX`) |

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

### Get Warehouses

`GET /fulfillment/202309/warehouses`

Returns the list of warehouses available to the seller. Each warehouse has a unique `warehouse_id` used in inventory updates.

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

For cross-border sellers managing multiple shops:

| Endpoint | Description |
|---|---|
| `POST /product/202309/global_products` | Create a global product (published to multiple markets) |
| `PUT /product/202309/global_products/{global_product_id}` | Update a global product |
| `POST /product/202309/global_products/{global_product_id}/publish` | Publish to specific target markets |

Global products allow central management with market-specific pricing and inventory.

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