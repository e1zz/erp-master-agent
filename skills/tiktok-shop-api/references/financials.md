# TikTok Shop Financials

## Use When

- Implementing financial reconciliation, retrieving settlements, statements, or payouts.
- Analyzing order profitability (commissions, shipping subsidies, taxes).
- Setting up pull-based polling for financial data.

## API References (v202309)

**Base URL:** `https://open-api.tiktokglobalshop.com`

### 1. Search Statements (Daily Settlements)

`POST /finance/202309/statements/search`

Retrieves a list of daily statements (settlements). Statements aggregate all settled transactions for a specific day.

**Request Body Example:**
```json
{
  "page_size": 50,
  "page_token": "",
  "statement_time_from": 1690000000,
  "statement_time_to": 1695000000,
  "sort_by": "STATEMENT_TIME",
  "sort_type": "DESC"
}
```

**Response Example:**
```json
{
  "code": 0,
  "data": {
    "statements": [
      {
        "id": "STMT_123456789",
        "statement_time": 1690000000,
        "settlement_amount": "1500.00",
        "currency": "MXN",
        "status": "SETTLED"
      }
    ],
    "next_page_token": "cursor456",
    "total_count": 50
  }
}
```

### 2. Search Statement Transactions

`POST /finance/202309/statements/{statement_id}/statement_transactions/search`

Retrieves the detailed, order-level or SKU-level transactions that make up a specific statement.

**Request Body Example:**
```json
{
  "page_size": 100,
  "page_token": ""
}
```

**Response Example:**
```json
{
  "code": 0,
  "data": {
    "statement_transactions": [
      {
        "id": "TXN_987654321",
        "order_id": "576123456789",
        "type": "ORDER_SETTLEMENT",
        "amount": "250.00",
        "currency": "MXN",
        "fee_details": [
          {
            "fee_type": "PLATFORM_COMMISSION",
            "fee_amount": "-25.00"
          },
          {
            "fee_type": "PAYMENT_FEE",
            "fee_amount": "-5.00"
          },
          {
            "fee_type": "SHIPPING_FEE_SUBSIDY",
            "fee_amount": "10.00"
          }
        ]
      }
    ],
    "next_page_token": "cursor789",
    "total_count": 100
  }
}
```

### 3. Get Transactions by Order

`GET /finance/202309/orders/{order_id}/statement_transactions`

Retrieves all financial transactions associated with a specific order, regardless of which statement they belong to. Useful for order profitability analysis.

### 4. Search Withdrawals (Payouts)

`POST /finance/202309/withdrawals/search`

Retrieves the actual payouts (fund transfers) to the seller's bank account.

**Response Fragment:**
```json
{
  "withdrawals": [
    {
      "id": "WD_123456",
      "amount": "10000.00",
      "currency": "MXN",
      "status": "COMPLETED",
      "create_time": 1690000000,
      "bank_account_tail": "1234"
    }
  ]
}
```

## Financial Lifecycle & Settlement Logic

1. **Order Delivery:** Order is marked as `DELIVERED`.
2. **Warranty Period:** Order enters the return/warranty period.
3. **Completion:** Order transitions to `COMPLETED` when the return window closes.
4. **Settlement Generation:** The settlement is calculated, deducting platform commissions, affiliate fees, and adding shipping subsidies.
5. **Statement:** The transaction is aggregated into the daily statement (usually generated at 00:00 UTC).
6. **Payout (Withdrawal):** Funds are transferred to the seller's bank account according to their payout schedule (depends on Shop Performance Score and account age).

## Common Fee Types

| Fee Type | Description |
|---|---|
| `PLATFORM_COMMISSION` | TikTok Shop's fee for the sale |
| `PAYMENT_FEE` | Payment processing fee |
| `AFFILIATE_COMMISSION` | Commission paid to creators/affiliates |
| `SHIPPING_FEE` | Cost of shipping (if managed by platform) |
| `SHIPPING_FEE_SUBSIDY` | Shipping discount covered by TikTok |
| `REFUND_AMOUNT` | Amount refunded to the buyer |
| `PLATFORM_DISCOUNT` | Promotional discount covered by TikTok |

## Pull-Based Architecture

TikTok Shop **does not send webhooks for financial settlements**. 

You must implement a **pull-based polling mechanism**:
- Schedule a daily CRON job (e.g., at 02:00 UTC) to pull the previous day's statements.
- Iterate through the statements to fetch the associated transactions.
- Reconcile these transactions against local orders in the ERP.

## Local Repo Anchors

- `app/Application/Orchestrators/PaymentOrchestrator.php`
- `app/Application/Orchestrators/RefundOrchestrator.php`
- `app/Marketplaces/Services/Payments/TikTokPaymentService.php`
- `app/Jobs/SyncTikTokSettlementsJob.php`

## Notes

- Financial amounts are returned as strings to prevent floating-point precision errors.
- A single order can have multiple financial transactions (e.g., initial settlement, later adjustment, partial refund).
- Do not assume an order is settled just because its status is `COMPLETED`. Always rely on the finance APIs for reconciliation.
- Ensure the `currency` matches the shop's regional market (e.g., `MXN` for Mexico, `USD` for the US).