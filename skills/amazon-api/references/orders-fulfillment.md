# Amazon SP-API Orders and Fulfillment (Mexico)

## Use When

- Retrieving new or updated orders from the Mexico marketplace.
- Confirming shipment with tracking details.
- Handling buyer-requested cancellations.
- Understanding order status transitions.
- Accessing PII (buyer name, address) via Restricted Data Tokens.

## API References (SP-API)

**Regional Endpoint:** `https://sellingpartnerapi-na.amazon.com`
**Mexico Marketplace ID:** `A1AM78C64UM0Y8`

## The Order Lifecycle (Seller-Fulfilled / MFN)

1. **Unshipped:** A customer places an order. It enters the `Unshipped` state. This is the primary state you poll for.
2. **Shipped:** You confirm shipment with tracking info. The order transitions to `Shipped`.
3. **Canceled:** The order was canceled (by buyer, seller, or Amazon).
4. **Delivered:** Carrier confirms delivery (tracked by Amazon).

*Note: FBA orders are handled entirely by Amazon. You receive them in `Shipped` state already.*

---

## 1. Retrieve Orders

`GET /orders/v0/orders`

**Key Query Parameters:**
| Parameter | Required | Description |
|---|---|---|
| `MarketplaceIds` | Yes | `A1AM78C64UM0Y8` |
| `CreatedAfter` | Yes* | ISO 8601 datetime (e.g., `2026-01-01T00:00:00Z`) |
| `OrderStatuses` | No | Comma-separated: `Unshipped`, `PartiallyShipped`, `Shipped`, `Canceled` |
| `FulfillmentChannels` | No | `MFN` (seller-fulfilled) or `AFN` (Amazon-fulfilled) |
| `MaxResultsPerPage` | No | Default 100, max 100 |

*Use `CreatedAfter` OR `LastUpdatedAfter` — one is required.*

**Response Fragment:**
```json
{
  "Orders": [
    {
      "AmazonOrderId": "111-1234567-1234567",
      "PurchaseDate": "2026-04-30T12:00:00Z",
      "OrderStatus": "Unshipped",
      "FulfillmentChannel": "MFN",
      "OrderTotal": {
        "CurrencyCode": "MXN",
        "Amount": "599.00"
      },
      "NumberOfItemsUnshipped": 1,
      "MarketplaceId": "A1AM78C64UM0Y8"
    }
  ],
  "NextToken": "..."
}
```

> [!WARNING]
> **PII is redacted by default.** To access `ShippingAddress` and `BuyerInfo`, you must use a **Restricted Data Token (RDT)** in the `x-amz-access-token` header. See `auth.md` for details.

---

## 2. Get Order Items

`GET /orders/v0/orders/{orderId}/orderItems`

Returns the line items for a specific order, including ASIN, SKU, quantity, and price.

**Response Fragment:**
```json
{
  "OrderItems": [
    {
      "ASIN": "B0EXAMPLE1",
      "SellerSKU": "MY-SKU-001",
      "OrderItemId": "12345678901234",
      "QuantityOrdered": 1,
      "ItemPrice": {
        "CurrencyCode": "MXN",
        "Amount": "299.00"
      },
      "ItemTax": {
        "CurrencyCode": "MXN",
        "Amount": "47.84"
      }
    }
  ]
}
```

---

## 3. Confirm Shipment (CRITICAL)

`POST /orders/v0/orders/{orderId}/shipment/confirm` *(newer endpoint)*

OR via the **Feeds API** with feed type `POST_ORDER_FULFILLMENT_DATA`.

### Direct API Confirmation

**Request Body:**
```json
{
  "marketplaceId": "A1AM78C64UM0Y8",
  "packageDetail": {
    "packageReferenceId": "pkg-001",
    "carrierCode": "FedEx",
    "trackingNumber": "123456789012",
    "shipDate": "2026-05-01T10:00:00Z",
    "orderItems": [
      {
        "orderItemId": "12345678901234",
        "quantity": 1
      }
    ]
  }
}
```

### Via Feeds API (Bulk Shipment Confirmation)

`POST /feeds/2021-06-30/feeds`

Submit a `POST_ORDER_FULFILLMENT_DATA` feed for confirming shipments on multiple orders at once. This is recommended for high-volume sellers.

---

## 4. Cancellations

### Seller-Initiated Cancellation

Sellers can cancel `Unshipped` orders. Use the Feeds API with `POST_ORDER_ACKNOWLEDGEMENT_DATA` feed to acknowledge and cancel.

### Buyer-Requested Cancellation

Buyer cancellation requests arrive as `ORDER_CHANGE` notifications (see `webhooks.md`). You should check the `OrderStatus` field — if it is `PendingAvailability` or `Pending`, the buyer may have requested cancellation.

---

## 5. Returns

Amazon handles MFN returns via Seller Central or the Returns API:

`GET /mfn/v0/returnsOrders?marketplaceId=A1AM78C64UM0Y8`

FBA returns are handled entirely by Amazon.

## Local Repo Anchors

- `app/Marketplaces/Services/Orders/AmazonOrderService.php`
- `app/Marketplaces/Mappers/Amazon/AmazonOrderMapper.php`

## Notes

- **Always filter by `MarketplaceIds=A1AM78C64UM0Y8`** to scope queries to Mexico.
- Use `LastUpdatedAfter` instead of `CreatedAfter` for ongoing polling to catch status changes on existing orders.
- Pagination uses `NextToken` — keep calling until `NextToken` is null.
- Order amounts for Mexico are in `MXN`.