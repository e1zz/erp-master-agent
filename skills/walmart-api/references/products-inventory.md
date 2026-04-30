# Walmart Global Marketplace Products and Inventory

## Use When

- Updating inventory levels for Seller-Fulfilled items.
- Distinguishing between Seller-Fulfilled and WFS (Walmart Fulfillment Services) stock.
- Retrieving catalog items and their publishing statuses.

## API References (Global Marketplace)

**Base URL:** `https://marketplace.walmartapis.com`
**Required Header:** `WM_MARKET: mx`

### 1. Update Single Item Inventory (Seller-Fulfilled)

`PUT /v3/inventory`

Used to update the inventory for a single SKU at a specific ship node (or the default node).

**Query Parameters:**
| Parameter | Required | Description |
|---|---|---|
| `sku` | Yes | Your seller SKU |

**Request Example:**
```json
{
  "sku": "SAMPLE-SKU-123",
  "quantity": {
    "unit": "EACH",
    "amount": 15
  }
}
```

### 2. Update Inventory (Multiple Ship Nodes)

`PUT /v3/inventories/{sku}`

If you operate multiple warehouses (ship nodes), use this endpoint to update inventory across them.

**Request Example:**
```json
{
  "sku": "SAMPLE-SKU-123",
  "inventories": {
    "inventory": [
      {
        "shipNode": "NODE_MTY_1",
        "quantity": {
          "unit": "EACH",
          "amount": 10
        }
      },
      {
        "shipNode": "NODE_CDMX_2",
        "quantity": {
          "unit": "EACH",
          "amount": 5
        }
      }
    ]
  }
}
```

### 3. Get Inventory

`GET /v3/inventory?sku={sku}`

Retrieves the current inventory level for the specified SKU at the default ship node.

### 4. Bulk Inventory Updates (Feeds API)

For large catalogs, do not use the single `PUT` endpoint in a loop. Use the Feeds API.

`POST /v3/feeds?feedType=inventory`

Upload a JSON or XML payload containing bulk inventory updates. Walmart processes these asynchronously. You must poll `GET /v3/feeds/{feedId}` to check the processing status.

### 5. Get Item Catalog

`GET /v3/items`

Retrieves a list of items from your seller catalog.

**Query Parameters:**
| Parameter | Description |
|---|---|
| `sku` | Filter by specific SKU |
| `limit` | Items per page (default 20, max 50) |
| `nextCursor` | Pagination cursor |
| `lifecycleStatus` | Filter by status (`Published`, `Unpublished`, etc.) |

**Response Fragment:**
```json
{
  "ItemResponse": [
    {
      "sku": "SAMPLE-SKU-123",
      "productName": "T-Shirt Algodón Premium",
      "publishedStatus": "PUBLISHED",
      "lifecycleStatus": "ACTIVE",
      "price": {
        "currency": "MXN",
        "amount": 299.00
      }
    }
  ]
}
```

## Inventory Paradigms: Seller-Fulfilled vs WFS

Walmart distinguishes heavily between items you fulfill yourself and items fulfilled by Walmart.

| Fulfillment Type | Inventory Management |
|---|---|
| **Seller-Fulfilled** | You are responsible for keeping stock accurate via the API (`PUT /v3/inventory`). |
| **WFS (Walmart Fulfillment Services)** | **Do not push inventory updates.** Walmart manages stock based on what they receive at their fulfillment centers. You can `GET` WFS inventory levels, but you cannot `PUT` them. |

## Item Statuses

| Status | Description |
|---|---|
| `PUBLISHED` | Item is live and visible on Walmart.com.mx |
| `UNPUBLISHED` | Item is not visible (can be due to out of stock, policy violation, or manual unpublishing) |
| `PROCESSING` | Item setup or update is currently being processed |
| `SYSTEM_PROBLEM` | An internal error occurred during setup |

## Local Repo Anchors

- `app/Marketplaces/Services/Products/WalmartProductService.php`
- `app/Marketplaces/Services/Inventory/WalmartInventoryService.php`
- `app/Marketplaces/Mappers/Walmart/WalmartInventoryMapper.php`

## Notes

- Remember to include `WM_MARKET: mx` in all requests.
- Ensure the `currency` for MX items is `MXN`.
- For bulk updates (>50 items), always use the Feeds API rather than the synchronous PUT endpoints to prevent rate limiting.