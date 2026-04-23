# TikTok Shop Products and Inventory

## Use When

- You need product catalog sync, SKU mapping, category lookup, or inventory updates.

## API References (v202309)

### 1. Search Products
`POST /api/products/search`
Retrieves products from the store.

**Request Body Example:**
```json
{
  "page_size": 20,
  "page_token": "cursor123",
  "status": "ALL",
  "create_time_from": 1690000000,
  "create_time_to": 1695000000
}
```

**Response Example:**
```json
{
  "code": 0,
  "data": {
    "products": [
      {
        "product_id": "17290000001",
        "product_name": "Test Shirt",
        "status": "LIVE",
        "skus": [
          {
            "id": "17293847291",
            "seller_sku": "SKU-SHIRT-M",
            "price": {
              "currency": "GBP",
              "sale_price": "19.99"
            },
            "inventory": [
              {
                "warehouse_id": "7130xxx",
                "quantity": 150
              }
            ]
          }
        ]
      }
    ],
    "next_page_token": "cursor456",
    "total_count": 100
  }
}
```

### 2. Update Inventory
`POST /products/{product_id}/inventory/update`

**Request Body Example:**
```json
{
  "skus": [
    {
      "id": "17293847291",
      "inventory": [
        {
          "warehouse_id": "7130xxx",
          "quantity": 50
        }
      ]
    }
  ]
}
```

## Essentials

- Product pulls may need extra detail lookup when category metadata is incomplete.
- Inventory updates should preserve ERP canonical stock rules.
- Paginated product search is token-based in the external API even when the local code hides that behind page-oriented helpers.

## Local Repo Anchors

- `app/Application/Orchestrators/ProductOrchestrator.php`
- `app/Application/Orchestrators/InventoryOrchestrator.php`
- `app/Marketplaces/Services/Products/TikTokProductService.php`
- `app/Marketplaces/Services/Inventory/TikTokInventoryService.php`
- `app/Marketplaces/Mappers/TikTok/TikTokProductMapper.php`
- `app/Marketplaces/Mappers/TikTok/TikTokInventoryMapper.php`

## Notes

- Keep `skipMarketplaceFanout` in mind when importing or mutating marketplace-originated products.
- Respect the SKU-based inventory model in the ERP when interpreting TikTok stock.