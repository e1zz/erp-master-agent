# Shopify Payments and Financials

## Use When

- Retrieving payment/transaction details for orders.
- Processing full or partial refunds from the ERP back to Shopify.
- Reconciling Shopify Payments payouts with bank deposits.
- Querying dispute/chargeback status.
- Understanding Shopify's financial data model for this ERP integration.

## API References

**Standard version:** `2025-10`

> [!IMPORTANT]
> As of October 2024, the REST Admin API is legacy. Starting April 2025, new public apps must use GraphQL. These REST endpoints remain functional for existing integrations.

---

## 1. Order Transactions (Per-Order Payment Data)

Every Shopify order that involves an exchange of money creates one or more **Transaction** records. Transactions are the primary source of per-order payment status.

### Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/admin/api/2025-10/orders/{order_id}/transactions.json` | List all transactions for an order |
| GET | `/admin/api/2025-10/orders/{order_id}/transactions/{transaction_id}.json` | Get a single transaction |
| GET | `/admin/api/2025-10/orders/{order_id}/transactions/count.json` | Count transactions for an order |
| POST | `/admin/api/2025-10/orders/{order_id}/transactions.json` | Create a transaction (e.g., capture an authorized payment) |

### Transaction Properties

| Property | Type | Description |
|---|---|---|
| `id` | integer | Unique transaction identifier |
| `order_id` | integer | Parent order ID |
| `kind` | string | Transaction type (see below) |
| `status` | string | `success`, `pending`, `failure`, `error` |
| `amount` | string | Amount of money involved |
| `currency` | string | ISO 4217 currency code |
| `gateway` | string | Payment gateway used (e.g., `shopify_payments`, `manual`) |
| `parent_id` | integer | ID of the parent transaction (captures reference their authorization) |
| `created_at` | datetime | When the transaction was created |
| `authorization` | string | Authorization code from the payment provider |
| `source_name` | string | Origin of the transaction (e.g., `web`, `pos`, `api`) |
| `payment_details` | object | Card/payment method details (brand, last4, etc.) |
| `error_code` | string | Error code if the transaction failed |

### Transaction `kind` Values

| Kind | Description |
|---|---|
| `authorization` | Funds reserved on the customer's payment method. No money transfers yet. Typically valid 7–30 days. |
| `capture` | Transfer of previously authorized funds. References a parent authorization via `parent_id`. |
| `sale` | Authorization + capture in one step. Most common for standard Shopify Payments checkouts. |
| `void` | Cancellation of a pending authorization or capture before settlement. |
| `refund` | Partial or full return of captured funds. Must be created via the Refund resource, not directly. |

### Transaction `status` Values

| Status | Description |
|---|---|
| `success` | Transaction completed successfully |
| `pending` | Transaction is awaiting completion (e.g., bank transfer) |
| `failure` | Transaction was declined or failed |
| `error` | An unexpected error occurred |

### Example: Capture an Authorization

```json
POST /admin/api/2025-10/orders/{order_id}/transactions.json

{
  "transaction": {
    "kind": "capture",
    "amount": "49.99",
    "parent_id": 1122334455,
    "currency": "USD"
  }
}
```

---

## 2. Refunds

Refunds are tightly coupled with orders and must follow a two-step calculate-then-create workflow.

### Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/admin/api/2025-10/orders/{order_id}/refunds.json` | List refunds for an order |
| GET | `/admin/api/2025-10/orders/{order_id}/refunds/{refund_id}.json` | Get a single refund |
| POST | `/admin/api/2025-10/orders/{order_id}/refunds/calculate.json` | Calculate refund amounts (pre-flight) |
| POST | `/admin/api/2025-10/orders/{order_id}/refunds.json` | Create a refund |

### Refund Workflow

1. **Calculate**: Call `calculate` first to get correct tax, duty, and line-item amounts.
2. **Create**: Submit the calculated result to commit the refund.

### Create Refund Payload

```json
POST /admin/api/2025-10/orders/{order_id}/refunds.json

{
  "refund": {
    "currency": "USD",
    "notify": true,
    "note": "Customer requested return",
    "shipping": {
      "full_refund": true
    },
    "refund_line_items": [
      {
        "line_item_id": 123456789,
        "quantity": 1,
        "restock_type": "return",
        "location_id": 987654321
      }
    ],
    "transactions": [
      {
        "parent_id": 1122334455,
        "amount": 29.99,
        "kind": "refund",
        "gateway": "shopify_payments"
      }
    ]
  }
}
```

### Restock Types

| Value | Description |
|---|---|
| `no_restock` | Do not restock the item |
| `cancel` | Restock as if the order was cancelled (item was never shipped) |
| `return` | Restock as a return (item was shipped and came back) |

### Key Refund Properties

| Property | Type | Description |
|---|---|---|
| `id` | integer | Unique refund identifier |
| `order_id` | integer | Parent order ID |
| `created_at` | datetime | When the refund was created |
| `note` | string | Optional reason note |
| `restock` | boolean | Whether items were restocked |
| `refund_line_items` | array | Line items being refunded with quantities |
| `transactions` | array | Payment transactions created by this refund |
| `order_adjustments` | array | Adjustments for shipping, taxes, tips |

---

## 3. Order Financial Status

The `financial_status` field on an order reflects its overall payment state:

| Status | Description |
|---|---|
| `pending` | Payment has not been captured |
| `authorized` | Payment authorized but not captured |
| `paid` | Payment captured successfully |
| `partially_paid` | Some items paid, others pending |
| `partially_refunded` | Some amount has been refunded |
| `refunded` | Fully refunded |
| `voided` | Authorization was voided |

---

## 4. Shopify Payments (Payouts, Balance, Disputes)

These endpoints are only available to stores using **Shopify Payments** as their payment processor. They require the `shopify_payments_payouts` or equivalent access scopes.

### Balance

| Method | Path | Purpose |
|---|---|---|
| GET | `/admin/api/2025-10/shopify_payments/balance.json` | Current account balance (funds not yet paid out) |

**Response:**
```json
{
  "balance": [
    {
      "currency": "USD",
      "amount": "1234.56"
    }
  ]
}
```

### Payouts

Payouts represent transfers from Shopify Payments balance to the merchant's bank account.

| Method | Path | Purpose |
|---|---|---|
| GET | `/admin/api/2025-10/shopify_payments/payouts.json` | List all payouts |
| GET | `/admin/api/2025-10/shopify_payments/payouts/{payout_id}.json` | Get a single payout |

**Payout Statuses:**

| Status | Description |
|---|---|
| `scheduled` | Payout is queued for transfer |
| `in_transit` | Funds are being transferred |
| `paid` | Funds have arrived in the bank account |
| `failed` | Transfer failed |
| `canceled` | Payout was cancelled |

**Key Properties:** `id`, `status`, `amount`, `currency`, `issued_at` (date)

### Disputes (Chargebacks)

| Method | Path | Purpose |
|---|---|---|
| GET | `/admin/api/2025-10/shopify_payments/disputes.json` | List all disputes |
| GET | `/admin/api/2025-10/shopify_payments/disputes/{dispute_id}.json` | Get a single dispute |
| GET | `/admin/api/2025-10/shopify_payments/disputes/{dispute_id}/dispute_evidences.json` | Get evidence for a dispute |
| PUT | `/admin/api/2025-10/shopify_payments/disputes/{dispute_id}/dispute_evidences.json` | Update dispute evidence |

**Dispute Properties:**

| Property | Type | Description |
|---|---|---|
| `id` | integer | Unique dispute identifier |
| `order_id` | integer | Associated order ID |
| `type` | string | `inquiry` or `chargeback` |
| `amount` | string | Disputed amount |
| `currency` | string | Currency code |
| `reason` | string | Bank reason (`fraudulent`, `product_not_received`, `credit_not_processed`, etc.) |
| `status` | string | `needs_response`, `under_review`, `won`, `lost` |
| `evidence_due_by` | datetime | Deadline to submit evidence |

---

## 5. Required OAuth Scopes

| Scope | Grants Access To |
|---|---|
| `read_orders` | Orders, transactions, refunds |
| `write_orders` | Create transactions, refunds |
| `read_shopify_payments_payouts` | Payouts and balance |
| `read_shopify_payments_disputes` | Disputes and evidence |
| `write_shopify_payments_disputes` | Update dispute evidence |

---

## 6. Payment-Related Webhooks

| Topic | Fires When |
|---|---|
| `orders/paid` | Order payment is captured |
| `orders/partially_fulfilled` | Some items fulfilled |
| `refunds/create` | A refund is created |
| `disputes/create` | A new dispute is opened |
| `disputes/update` | Dispute status changes |
| `shopify_payments/payouts/create` | New payout issued |
| `shopify_payments/payouts/update` | Payout status changes |

---

## Local Repo Anchors

- `app/Marketplaces/Services/Payment/ShopifyPaymentService.php`
- `app/Marketplaces/Services/Refund/ShopifyRefundService.php`
- `app/Marketplaces/Mappers/ShopifyOrderMapper.php` (payment mapping within order pulls)

## Notes

- Shopify transactions are always scoped to an order. There is no standalone "payments" list endpoint.
- Unlike MercadoLibre, Shopify does not embed a `marketplace_fee` in the order payload. Fee data is only available through the Shopify Payments payout/balance reports or the GraphQL `AppSubscription` and `ShopifyPaymentsAccount` objects.
- The `financial_status` on the order object is the quickest way to determine payment state without fetching individual transactions.
- Refund creation automatically generates a `refund`-kind transaction. Do not create refund transactions directly via the Transaction endpoint.
- Shopify Payments endpoints (`/shopify_payments/*`) are only available for stores using Shopify Payments. Third-party gateway stores must rely on order transactions for payment data.
