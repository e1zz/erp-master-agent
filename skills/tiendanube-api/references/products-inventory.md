# Tiendanube (Nuvemshop) API Products and Inventory

## Use When

- Creating or updating products and their variants.
- Pushing stock level updates from the ERP to the storefront.
- Handling Multi-Inventory (multiple warehouses).

## API References

**Base URL:** `https://api.tiendanube.com/v1/{store_id}`
**Headers Required:** `Authentication`, `User-Agent`

## 1. Catalog Structure

Tiendanube structures catalogs with a parent-child relationship:
- **Product:** The main listing (Title, Description, Images).
- **Variant:** The specific SKU (Size, Color, Price, Stock). **Every product has at least one variant**, even if there are no options.

### Fetching the Catalog
`GET /products`
Retrieve a paginated list of products and all their nested variants.

## 2. Inventory Updates (Single vs Bulk)

### Updating a Single Variant
`PUT /products/{product_id}/variants/{variant_id}`

Used when updating details about a single variant (e.g., price, weight, stock).

### Bulk Stock/Price Updates (RECOMMENDED)
`PATCH /products/stock-price`

This is the optimal endpoint for syncing inventory from an ERP. It allows updating the stock and price of multiple products and variants in a single, fast request (Max 50 variants per request).

**Request Example:**
```json
[
  {
    "id": 1111111,
    "variants": [
      {
        "id": 2222222,
        "stock": 10,
        "price": "299.99"
      },
      {
        "id": 3333333,
        "stock": 0
      }
    ]
  }
]
```

## 3. The Multi-Inventory Transition

Historically, Tiendanube used a single integer field `stock` on the variant. They are currently transitioning to a multi-location model using `inventory_levels`.

| Field | Description | Usage Note |
|---|---|---|
| `stock` | Legacy single-location integer. | Kept for backwards compatibility. Writing to this updates the default/first location. |
| `inventory_levels` | Array of stock counts per location. | **Preferred.** Use this if the merchant has multiple warehouses configured. |

**Example of Multi-Inventory Payload (`inventory_levels`):**
```json
{
  "inventory_levels": [
    {
      "location_id": "loc_abc123",
      "stock": 15
    },
    {
      "location_id": "loc_xyz987",
      "stock": 5
    }
  ]
}
```
*Note: If you are using `PATCH /products/stock-price` with multi-inventory, ensure your app permissions and scopes are updated to handle the new inventory endpoints.*

## Local Repo Anchors

- `app/Marketplaces/Services/Products/TiendanubeProductService.php`
- `app/Marketplaces/Services/Inventory/TiendanubeInventoryService.php`
- `app/Marketplaces/Mappers/Tiendanube/TiendanubeInventoryMapper.php`

## Notes

- `stock` can be `null`. A `null` stock value in Tiendanube means the item has "infinite stock" (it is not tracked). To mark an item as out of stock, explicitly set `stock: 0`.
- Use the `PATCH` endpoint for all routine ERP syncs to save API rate-limit quota.