# Shopify Products and Inventory

## Use When

- You need to sync inventory levels from the ERP to Shopify.
- You need to create, update, or retrieve products/variants on Shopify.
- You need to resolve a Shopify `inventory_item_id` from a SKU.
- You are configuring multi-location inventory sync.

## API References

**Standard version:** `2025-10`

### Major Endpoints:
- `GET /admin/api/2025-10/products.json` (List products)
- `POST /admin/api/2025-10/products.json` (Create product)
- `PUT /admin/api/2025-10/products/{product_id}.json` (Update product)
- `GET /admin/api/2025-10/variants/{variant_id}.json` (Get single variant)
- `PUT /admin/api/2025-10/variants/{variant_id}.json` (Update variant pricing/SKU)
- `POST /admin/api/2025-10/inventory_levels/set.json` (Set inventory levels)
- `POST /admin/api/2025-10/inventory_levels/adjust.json` (Adjust inventory levels)
- `GET /admin/api/2025-10/locations.json` (List merchant inventory locations)

---

## 1. Shopify's Inventory Model (CRITICAL)

Unlike simpler platforms where stock is directly editable on the product, Shopify separates stock from the product model. 

```
Product
 └── ProductVariant (holds SKU, Price, Barcode, inventory_item_id)
      └── InventoryItem (tracked flag, cost-of-goods)
           └── InventoryLevel (Stock quantity for a specific Location)
                └── Location (A physical warehouse or fulfillment node)
```

- **ProductVariant**: Holds the SKU and maps to an `inventory_item_id`.
- **InventoryItem**: Holds configuration like `tracked` (boolean). If `tracked` is false, Shopify does not track inventory.
- **InventoryLevel**: The actual stock record. It links an `inventory_item_id` to a `location_id` and tracks the `available` quantity.

---

## 2. Resolving a Variant/Inventory Item by SKU

Shopify REST Admin API has **no direct endpoint** to find a variant by SKU (e.g., no `/variants/sku/{sku}.json`). You must query it using one of two strategies:

### Option A: GraphQL Client (Recommended & Efficient)
Send a single query using the Shopify GraphQL client. This avoids pagination bloat and searches Shopify's index directly:

```graphql
query {
  productVariants(first: 1, query: "sku:MY-PRODUCT-SKU") {
    edges {
      node {
        id
        sku
        price
        inventoryItem {
          id
          tracked
        }
      }
    }
  }
}
```

### Option B: REST Search Fallback
Query products and filter in PHP. Note that you may need to fetch multiple pages if the SKU is not on the first page:
`GET /admin/api/2025-10/products.json?fields=id,variants&limit=50`

---

## 3. Product & Variant Payload Formats

### Creating a Product (REST)
`POST /admin/api/2025-10/products.json`
```json
{
  "product": {
    "title": "Premium Leather Boot",
    "body_html": "<strong>Comfortable and stylish</strong>",
    "vendor": "ERP Brand",
    "status": "active",
    "variants": [
      {
        "option1": "Black",
        "option2": "10",
        "price": "149.99",
        "sku": "BT-BLK-10",
        "inventory_management": "shopify"
      }
    ],
    "options": [
      { "name": "Color", "values": ["Black"] },
      { "name": "Size", "values": ["10"] }
    ]
  }
}
```
*Note: Setting `"inventory_management": "shopify"` is required for Shopify to track stock. If omitted, the variant won't have stock updates enabled.*

---

## 4. Inventory Synchronization

To update stock, you must know the Shopify `inventory_item_id` and the `location_id`.

### Set Stock Level
`POST /admin/api/2025-10/inventory_levels/set.json`
```json
{
  "location_id": 68845568420,
  "inventory_item_id": 808950810,
  "available": 42
}
```

### Adjust Stock Level (Relatively)
`POST /admin/api/2025-10/inventory_levels/adjust.json`
```json
{
  "location_id": 68845568420,
  "inventory_item_id": 808950810,
  "available_adjustment": -3
}
```

> [!WARNING]
> If a variant is not stocked at a location, `set.json` will fail. You may need to first connect the inventory item to the location using `POST /admin/api/2025-10/inventory_levels/connect.json` with `"relocate_if_necessary": true`.

---

## 5. PHP SDK Code Examples

### Querying Locations
```php
use Shopify\Clients\Rest;

$client = new Rest($shopDomain, $accessToken);
$response = $client->get('locations');
$locations = $response->getDecodedBody()['locations'];
```

### Setting Inventory Level
```php
use Shopify\Clients\Rest;

$client = new Rest($shopDomain, $accessToken);
$response = $client->post(
    path: 'inventory_levels/set',
    body: [
        'location_id' => 68845568420,
        'inventory_item_id' => 808950810,
        'available' => 150
    ]
);
```

## Local Repo Anchors

- `app/Marketplaces/Services/Products/ShopifyProductService.php`
- `app/Marketplaces/Services/Inventory/ShopifyInventoryService.php`
- `app/Marketplaces/Mappers/ShopifyProductMapper.php`
