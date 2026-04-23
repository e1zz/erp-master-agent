# MercadoLibre Products and Inventory

## Use When
- Managing catalog sync, mapping `seller_custom_field` to SKUs, or inventory sync.

## API References

### 1. Item Details
`GET /items/{ITEM_ID}`

### 2. Update Inventory (Single Variation)
`PUT /items/{ITEM_ID}`

**Request Body Example (Updating Stock):**
```json
{
  "available_quantity": 25
}
```

If the item has variations, you must hit the variation directly or provide the variation array.
```json
{
  "variations": [
    {
      "id": 123456,
      "available_quantity": 10
    }
  ]
}
```

## Local Repo Anchors
- `app/Marketplaces/Services/Products/MercadoLibreProductService.php`
- `app/Marketplaces/Services/Inventory/MercadoLibreInventoryService.php`