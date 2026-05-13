# TikTok Shop Financials

## Use When

- Implementing financial reconciliation, retrieving settlements, statements, or payouts.
- Analyzing order profitability (commissions, shipping subsidies, taxes).
- Setting up pull-based polling for financial data.

## API References (v202309)

**Base URL:** `https://open-api.tiktokglobalshop.com`

### 1. Get Statements (Settlements)

`GET /finance/202309/statements`

Retrieves a list of statements (settlements). Statements aggregate all settled transactions for a specific period.

**Query Parameters:**
- `sort_field` (Required): Must be `statement_time`.
- `sort_order` (Optional): `ASC` or `DESC`.
- `page_size` (Optional): Results per page (max 100, default 20).
- `page_token` (Optional): Cursor for pagination.
- `statement_time_ge` / `statement_time_lt` (Optional): Unix timestamps to filter by statement time.
- `payment_status` (Optional): Filter by status (`PAID`, `FAILED`, `PROCESSING`).

**Response Example Summary:**
Returns a list of statements containing `id`, `statement_time`, `currency`, and `payment_status`.

### 2. Get Payments

`GET /finance/202309/payments`

Retrieves payment records.

**Query Parameters:**
- `sort_field` (Required): Must be `create_time`.
- `sort_order` (Optional): `ASC` or `DESC`.
- `page_size` (Optional): Results per page (max 100).
- `page_token` (Optional): Cursor for pagination.
- `create_time_ge` / `create_time_lt` (Optional): Unix timestamps.

**Response Example Summary:**
Returns a list of payments containing `id`, `amount`, `currency`, `payment_time`, and `status`.

### 3. Get Withdrawals

`GET /finance/202309/withdrawals`

Retrieves the actual payouts (fund transfers) to the seller's bank account.

**Query Parameters:**
- `types` (Required): Array of transaction types (e.g., `WITHDRAW`, `SETTLE`, `TRANSFER`, `REVERSE`).
- `sort_field` (Required): Must be `create_time`.
- `sort_order` (Optional): `ASC` or `DESC`.
- `page_size` (Optional): Results per page.
- `page_token` (Optional): Cursor for pagination.
- `create_time_ge` / `create_time_lt` (Optional): Unix timestamps.

**Response Example Summary:**
Returns a list of withdrawals containing `id`, `amount`, `currency`, `create_time`, `status`, and `type`.

### 4. Get Transactions by Order

`GET /finance/202501/orders/{order_id}/statement_transactions`

Retrieves a consolidated view of an order's financial data. Useful for order profitability analysis.

**Query Parameters:**
- `page_size` (Optional): Results per page.
- `page_token` (Optional): Cursor for pagination.

**Response Example Summary:**
Returns an object including `revenue_amount`, `fee_and_tax_amount`, `settlement_amount`, and a detailed `sku_transactions` list.

### 5. Get Transactions by Statement

`GET /finance/202501/statements/{statement_id}/statement_transactions`

Retrieves a list of transactions linked to a specific statement.

**Query Parameters:**
- `sort_field` (Required): Must be `order_create_time`.
- `sort_order` (Optional): `ASC` or `DESC`.
- `page_size` (Optional): Results per page.
- `page_token` (Optional): Cursor for pagination.

**Response Example Summary:**
Returns a list of transactions providing `order_id`, `revenue_amount`, `shipping_cost_amount`, and `settlement_amount`.

### 6. Get Unsettled Transactions

`GET /finance/202507/orders/unsettled`

Retrieves a list of transactions that have not yet been settled (e.g., pending completion or warranty periods).

**Query Parameters:**
- `sort_field` (Required): Must be `order_create_time`.
- `sort_order` (Optional): `ASC` or `DESC`.
- `page_size` (Optional): Results per page.
- `page_token` (Optional): Cursor for pagination.
- `search_time_ge` / `search_time_lt` (Optional): Unix timestamps.

**Response Example Summary:**
Returns a list of unsettled transactions including `order_id`, `currency`, and estimated `settlement_amount`.

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