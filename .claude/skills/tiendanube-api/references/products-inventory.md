# TiendaNube Products and Inventory

## Use When
- Managing catalog sync, mapping variants to SKUs, or performing inventory sync directly on variants.

## API References

### 1. Update Variant Inventory
`PUT /v1/{store_id}/variants/{variant_id}`

**Request Body Example (Updating Stock):**
```json
{
  "stock": 25
}
```

## Local Repo Anchors
- `app/Marketplaces/Services/Products/TiendaNubeProductService.php`
- `app/Marketplaces/Services/Inventory/TiendaNubeInventoryService.php`