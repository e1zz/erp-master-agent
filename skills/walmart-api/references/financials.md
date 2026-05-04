# Walmart Global Marketplace Financials (Mexico)

## Use When

- Reconciling net payouts deposited into your bank account.
- Retrieving settlement reports for accounting.
- Breaking down fees, commissions, and adjustments per order.
- Understanding the pricing and promotion update APIs.

## API References (Global Marketplace)

**Base URL:** `https://marketplace.walmartapis.com`
**Required Header:** `WM_MARKET: mx`

## Settlement & Reconciliation

Walmart pays sellers in **net payouts** (gross sales minus fees, refunds, and adjustments). To reconcile, you must break the settlement down into its components:

| Component | Description |
|---|---|
| **Gross Sales** | Total product revenue |
| **Shipping Credits** | Shipping income passed to seller |
| **Commissions** | Walmart referral fee (percentage of sale) |
| **WFS Fees** | Pick, pack, ship, and storage fees (if using WFS) |
| **Refunds** | Amounts returned to customers |
| **Adjustments** | Chargebacks, promotional rebates, corrections |
| **Marketplace-Collected Tax** | Sales tax collected by Walmart (NOT your revenue) |
| **Net Payout** | Final deposit to your bank account |

### 1. Reconciliation Report (Programmatic)

`GET /v3/report/reconreport/reconFile`

Downloads a reconciliation report file for a specific settlement period.

**Query Parameters:**
| Parameter | Description |
|---|---|
| `reportDate` | The date of the settlement report (YYYY-MM-DD) |

The response is a downloadable CSV/TSV file containing per-order breakdowns of sales, fees, taxes, and adjustments.

### 2. Available Report Dates

`GET /v3/report/reconreport/availableReconFiles`

Returns a list of available reconciliation report dates that you can download.

---

## Pricing API

### Update a Single Item's Price

`PUT /v3/price`

**Request Example:**
```json
{
  "pricing": [
    {
      "sku": "SAMPLE-SKU-123",
      "pricing": {
        "currentPrice": {
          "currency": "MXN",
          "amount": 299.00
        }
      }
    }
  ]
}
```

### Bulk Price Updates (via Feeds)

`POST /v3/feeds?feedType=PRICE_AND_PROMOTION`

Submit a JSON or XML payload containing price and promotion updates for multiple SKUs. Processed asynchronously. Poll `GET /v3/feeds/{feedId}` for status.

### Promotional Pricing

Promotional prices (strikethrough pricing) can be set alongside the current price:

```json
{
  "sku": "SAMPLE-SKU-123",
  "pricing": {
    "currentPrice": {
      "currency": "MXN",
      "amount": 249.00
    },
    "comparisonPrice": {
      "currency": "MXN",
      "amount": 399.00
    }
  }
}
```

*The `comparisonPrice` is the "was" price shown with a strikethrough.*

### Repricer API

Walmart offers a Repricer that allows automated price adjustments based on Buy Box strategies:

- **Create Strategy**: Define rules (e.g., match lowest price, maintain margin).
- **Assign Items**: Attach SKUs to a strategy.
- **Monitor**: Retrieve current repricing status.

*Note: Repricer availability and features may vary by marketplace region.*

---

## Fee Types Reference (Mexico)

| Fee Type | Description |
|---|---|
| **Referral Fee** | Commission percentage on each sale (varies by category) |
| **WFS Pick & Pack** | Per-unit fulfillment fee for WFS items |
| **WFS Storage** | Monthly storage fee based on cubic feet |
| **Return Shipping** | Cost of return shipping label (if seller-funded) |
| **Chargeback** | Deduction for compliance issues (late shipment, wrong item, etc.) |

## Local Repo Anchors

- `app/Marketplaces/Services/Finance/WalmartFinanceService.php`
- `app/Marketplaces/Services/Pricing/WalmartPricingService.php`

## Notes

- Reconcile **per settlement cycle**, not monthly, to match Walmart's payout schedule.
- All amounts for Mexico are in `MXN`.
- Always include `WM_MARKET: mx` in your headers.
- Use `PUT /v3/price` for real-time single-item updates and the Feeds API for bulk (>50 SKUs).
