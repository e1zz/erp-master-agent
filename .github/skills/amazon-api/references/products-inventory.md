# Amazon Products and Inventory

## Use When
- Updating stock via Listings Items API V2021-08-01, checking catalogs, or feed API usages.

## API References

### 1. Update Inventory (Listings Items API)
`PATCH /listings/2021-08-01/items/{sellerId}/{sku}?marketplaceIds={marketplaceId}`

**Request Body Example (Updating Stock):**
```json
{
  "productType": "PRODUCT",
  "patches": [
    {
      "op": "replace",
      "path": "/attributes/fulfillment_availability",
      "value": [
        {
          "fulfillment_channel_code": "DEFAULT",
          "quantity": 25
        }
      ]
    }
  ]
}
```

## Local Repo Anchors
- `app/Marketplaces/Services/Products/AmazonProductService.php`
- `app/Marketplaces/Services/Inventory/AmazonInventoryService.php`