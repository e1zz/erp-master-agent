# Walmart Global Marketplace Orders and Fulfillment

## Use When

- Retrieving new orders.
- Acknowledging orders (Critical mandatory step).
- Updating order shipping status and tracking information.
- Canceling or refunding orders.

## API References (Global Marketplace)

**Base URL:** `https://marketplace.walmartapis.com`
**Required Header:** `WM_MARKET: mx`

## The Order Lifecycle (Seller-Fulfilled)

Walmart enforces a strict state machine for orders.

1.  **Created:** A customer places an order. It enters the `Created` state.
2.  **Acknowledged:** **You MUST explicitly acknowledge the order via API.** If you skip this, Walmart may auto-cancel the order.
3.  **Shipped:** You ship the order and provide tracking details.
4.  **Delivered:** The carrier confirms delivery (often tracked by Walmart).
5.  **Canceled:** The order was canceled by the buyer, the seller, or by Walmart (e.g., due to fraud or failure to acknowledge).

---

### 1. Retrieve Orders

`GET /v3/orders`

Retrieve a list of purchase orders.

**Key Query Parameters:**
| Parameter | Description |
|---|---|
| `status` | Filter by status (e.g., `Created`, `Acknowledged`, `Shipped`) |
| `createdStartDate` | ISO 8601 date |
| `createdEndDate` | ISO 8601 date |

*Note: Pagination uses a `nextCursor` value returned in the response.*

---

### 2. Acknowledge an Order (CRITICAL)

`POST /v3/orders/{purchaseOrderId}/acknowledge`

Before you can ship or process an order, you must move it from `Created` to `Acknowledged`. **Failure to do this within the SLA (typically 4-24 hours depending on account settings) will result in auto-cancellation.**

**Request Body:**
*No body is required for acknowledgment, but the endpoint requires an empty object `{}` or a completely empty body depending on the HTTP client.*

---

### 3. Ship an Order

`POST /v3/orders/{purchaseOrderId}/shipping`

Transitions the order to `Shipped`. You must provide tracking details.

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
                  "unitOfMeasurement": "EACH",
                  "amount": "1"
                },
                "trackingInfo": {
                  "shipDateTime": 1699999999000,
                  "carrierName": {
                    "carrier": "FedEx"
                  },
                  "methodCode": "Standard",
                  "trackingNumber": "123456789012",
                  "trackingURL": "https://www.fedex.com/tracking?tracknumbers=123456789012"
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

*Note: `shipDateTime` must be an epoch timestamp in milliseconds.*

---

### 4. Cancel an Order

`POST /v3/orders/{purchaseOrderId}/cancel`

Used to cancel an order line *before* it has been shipped.

**Request Example:**
```json
{
  "orderCancellation": {
    "orderLines": {
      "orderLine": [
        {
          "lineNumber": "1",
          "orderLineStatuses": {
            "orderLineStatus": [
              {
                "status": "Cancelled",
                "cancellationReason": "OUT_OF_STOCK",
                "statusQuantity": {
                  "unitOfMeasurement": "EACH",
                  "amount": "1"
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

**Common Cancellation Reasons:**
- `OUT_OF_STOCK`
- `PRICING_ERROR`
- `CUSTOMER_REQUESTED`

---

### 5. Refund an Order

`POST /v3/orders/{purchaseOrderId}/refund`

Used to issue a refund *after* an order has been shipped. You must specify the reason for the refund.

## WFS vs Seller-Fulfilled Orders

- **Seller-Fulfilled:** You manage the entire `Acknowledge -> Ship -> Tracking` lifecycle.
- **WFS (Walmart Fulfillment Services):** Walmart handles shipping. You do NOT acknowledge or ship WFS orders via the API. You can only `GET` them for your accounting and record-keeping.

## Local Repo Anchors

- `app/Marketplaces/Services/Orders/WalmartOrderService.php`
- `app/Marketplaces/Mappers/Walmart/WalmartOrderMapper.php`

## Notes

- **Acknowledge quickly:** Build a worker specifically to poll `Created` orders and acknowledge them immediately.
- Line numbers (`lineNumber`) are strings and must match exactly what was provided in the order payload.
- Always include `WM_MARKET: mx` in your headers.