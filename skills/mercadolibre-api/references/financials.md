# MercadoLibre Financials (Mexico)

## Use When

- Reconciling sales proceeds with bank deposits.
- Retrieving payment details for specific orders.
- Downloading settlement/reconciliation reports.
- Understanding fee structures (commissions, shipping costs, refunds).

## Financial Data Architecture

MercadoLibre's financial data comes from two sources:

| Source | Data Location | Best For |
|---|---|---|
| **Order Payments** | Embedded in order objects (`payments[]` array) | Real-time per-order payment status |
| **Mercado Pago Reports** | Generated via Mercado Pago API | Bulk accounting, bank reconciliation |

---

## 1. Order-Level Payment Data (Real-Time)

Every order includes a `payments[]` array with detailed payment information. This data is available when you `GET /orders/{ORDER_ID}`.

**Payment Object Fragment:**
```json
{
  "payments": [
    {
      "id": 12345678901,
      "order_id": 9876543210,
      "payer_id": 111111,
      "status": "approved",
      "status_detail": "accredited",
      "transaction_amount": 299.00,
      "currency_id": "MXN",
      "date_approved": "2026-05-01T12:00:00.000-04:00",
      "payment_method_id": "visa",
      "payment_type": "credit_card",
      "installments": 1,
      "total_paid_amount": 299.00,
      "shipping_cost": 0,
      "marketplace_fee": 44.85
    }
  ]
}
```

### Key Financial Fields in Orders

| Field | Description |
|---|---|
| `transaction_amount` | Amount actually charged to the buyer |
| `total_paid_amount` | Total including installment interest (if any) |
| `marketplace_fee` | MercadoLibre commission deducted from the sale |
| `shipping_cost` | Shipping cost (may be subsidized by MercadoLibre) |
| `sale_fee` (in order items) | Per-item commission breakdown |
| `currency_id` | `MXN` for Mexico |

### Payment Statuses

| Status | Description |
|---|---|
| `approved` | Payment received and accredited |
| `pending` | Awaiting payment (e.g., bank transfer, cash) |
| `in_process` | Payment is being processed (credit card review) |
| `rejected` | Payment was rejected |
| `refunded` | Payment was fully refunded |
| `cancelled` | Payment was cancelled |

---

## 2. Refunding Payments

To issue a full or partial refund for a specific payment, use the Mercado Pago refunds endpoint.

`POST https://api.mercadopago.com/v1/payments/{payment_id}/refunds`

**Headers Required:**
- `Authorization: Bearer {ACCESS_TOKEN}`
- `X-Idempotency-Key: {UUID}` (Required to prevent duplicate refunds)

**Request Body (Partial Refund):**
```json
{
  "amount": 50.00
}
```

**Request Body (Full Refund):**
Leave the body empty `{}` or omit the `amount` field to process a full refund for the remaining balance of the payment.

---

## 3. Mercado Pago Reports (Bulk Reconciliation)

For bank-level reconciliation, MercadoLibre provides downloadable reports through the **Mercado Pago** platform. These reports break down gross sales, fees, refunds, and net payouts.

### Report Types

| Report | Description |
|---|---|
| **Released Money Report** | Primary reconciliation report showing all transactions that affected your available balance (sales, fees, chargebacks, refunds, withdrawals) |
| **Account Money Report** | Historical view of all movements (payments, receipts, chargebacks) with gross/net breakdowns |

### Configuring Reports via API

`POST https://api.mercadopago.com/v1/account/release_report`

Configure and schedule automatic report generation.

### Downloading Reports

`GET https://api.mercadopago.com/v1/account/release_report/list`

Returns a list of available reports. Each report includes a `file_name` and download URL.

**Report Columns Typically Include:**
- `SOURCE_ID` — Order or payment ID
- `EXTERNAL_REFERENCE` — Your external reference (if set)
- `TRANSACTION_TYPE` — `SETTLEMENT`, `REFUND`, `CHARGEBACK`, `WITHDRAWAL`
- `TRANSACTION_AMOUNT` — Gross amount
- `FEE_AMOUNT` — MercadoLibre/Mercado Pago fees
- `SETTLEMENT_NET_AMOUNT` — Net amount after fees
- `DATE` — Transaction date

---

## 3. Fee Breakdown (Mexico)

| Fee Type | Description |
|---|---|
| **Venta** (Commission) | Percentage of sale price (varies by category and seller reputation level) |
| **Envío** (Shipping) | Cost of Mercado Envíos shipping; may be subsidized for free-shipping listings |
| **Cuotas** (Installments) | If the seller absorbs installment costs, this is deducted |
| **Impuestos** (Taxes) | IVA (16%) applied to MercadoLibre fees |
| **Devolución** (Refund) | Full or partial refund amount deducted from balance |
| **Contracargo** (Chargeback) | Disputed payment reversed by the buyer's bank |

---

## Money Release Schedule

MercadoLibre holds funds for a period before releasing them to the seller's Mercado Pago balance:

| Seller Reputation | Release Time |
|---|---|
| **MercadoLíder** | Immediately after delivery |
| **Good reputation** | ~14 days after sale |
| **New seller** | ~21-30 days after sale |

*Funds can be withdrawn from Mercado Pago to a linked bank account once released.*

## Local Repo Anchors

- `app/Marketplaces/Services/Finance/MercadoLibreFinanceService.php`

## Notes

- All amounts for Mexico are in `MXN`.
- The `marketplace_fee` in the payments array is the total commission MercadoLibre charges.
- Use the order-level payments data for real-time per-order accounting and Mercado Pago reports for periodic bulk reconciliation.
- Report generation can be scheduled (daily, weekly, monthly) or triggered on-demand via the API.
- Always use the `SOURCE_ID` field in reports to match transactions back to MercadoLibre order IDs.
