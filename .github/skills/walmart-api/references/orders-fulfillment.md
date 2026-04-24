# Walmart Orders and Fulfillment

## Use When
- You are importing orders, acknowledging items, or submitting tracking.

## API References

### 1. Acknowledge Order
`POST /v3/orders/{purchaseOrderId}/acknowledge`

### 2. Ship Order Line
`POST /v3/orders/{purchaseOrderId}/shipping`
**Request Example:**
```json
{
  "orderShipment": {
    "orderLines": {
      "orderLine": [
        {
          "lineNumber": "1",
          "orderLineStatuses": {
            "orderLineStatus": [
              {
                "status": "Shipped",
                "statusQuantity": {
                  "unitOfMeasurement": "Each",
                  "amount": "1"
                },
                "trackingInfo": {
                  "shipDateTime": 1690000000000,
                  "carrierName": {
                    "carrier": "USPS"
                  },
                  "methodCode": "Standard",
                  "trackingNumber": "9400123456789"
                }
              }
            ]
          }
        }
      ]
    }
  }
}
```

## Local Repo Anchors
- `app/Marketplaces/Services/Orders/WalmartOrderService.php`
- `app/Marketplaces/Services/Shipping/Labels/WalmartShippingService.php`