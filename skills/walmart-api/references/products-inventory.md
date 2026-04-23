# Walmart Products and Inventory

## Use When
- You need to update stock limits, process WFS (Walmart Fulfillment Services) stock, or manage catalog.

## API References

### 1. Update Inventory
`PUT /v3/inventory`

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

## Local Repo Anchors
- `app/Marketplaces/Services/Products/WalmartProductService.php`
- `app/Marketplaces/Services/Inventory/WalmartInventoryService.php`