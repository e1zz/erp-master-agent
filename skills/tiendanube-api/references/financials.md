# Tiendanube (Nuvemshop) Financials

## Use When

- Reconciling orders with actual payouts.
- Determining exactly how much was charged to the customer vs how much the store receives.
- Tracking Tiendanube platform fees and payment gateway fees (Mercado Pago, Nuvempago, etc.).

## API References

**Base URL:** `https://api.tiendanube.com/v1/{store_id}`

Tiendanube does not have a dedicated "Financials" or "Settlements" API like Amazon or MercadoLibre. Financial data is inextricably linked to **Orders** and **Transactions**.

---

## 1. Order Totals vs Transactions

When a customer checks out, the Order object records the gross amounts:
- `subtotal`
- `discount`
- `shipping`
- `total`

However, the **Transaction** object records the actual movement of money and the fees applied by the payment gateway.

### Fetching Order Transactions

`GET /orders/{order_id}/transactions`

This returns the payment events for the order.

**Response Fragment:**
```json
[
  {
    "id": "txn_12345",
    "order_id": 987654321,
    "status": "success",
    "payment_provider": "mercadopago",
    "payment_method": "credit_card",
    "amount": "299.99",
    "currency": "MXN",
    "receipt_url": "https://mercadopago.com/receipt/...",
    "created_at": "2026-05-01T12:00:00Z"
  }
]
```

---

## 2. Platform Fees vs Gateway Fees

Tiendanube operates on a monthly subscription model, but on some plans, they charge a per-transaction fee (e.g., 1-2%).

1. **Payment Gateway Fees:** Deducted by Mercado Pago, PayPal, or Nuvempago *before* the money reaches your account.
2. **Tiendanube Transaction Fees:** Billed to the merchant monthly as part of their subscription invoice. They are *not* automatically deducted from the order payout.

**Crucial Exception (Nuvempago):**
If the merchant uses **Nuvempago** (Tiendanube's own payment gateway), the gateway fees and the Tiendanube transaction fees are combined and deducted at the source.

---

## 3. Reconciliation Strategy

Because Tiendanube does not provide a single "Settlement Report" endpoint:

1. **For gross sales:** Pull `GET /orders` and sum the `total` fields.
2. **For net payouts (Third-Party Gateway):** You must query the specific payment gateway's API (e.g., Mercado Pago API) using the transaction reference to get the exact net payout and fee breakdown.
3. **For net payouts (Nuvempago):** Nuvempago is deeply integrated, but as of the current API version, granular fee breakdowns often still require exporting CSV reports from the admin dashboard or relying on the net amount deposited to the bank.

## Local Repo Anchors

- `app/Marketplaces/Services/Finance/TiendanubeFinanceService.php` (If implemented for gross aggregation)
