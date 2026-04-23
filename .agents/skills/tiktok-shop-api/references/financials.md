# TikTok Shop Financials

## Use When

- You need statement, withdrawal, payment, or settlement behavior.

## API References (v202309)

### 1. Get Settlements
`POST /api/finance/settlements/search`
Retrieves a list of settled financial transactions.

**Request Body Example:**
```json
{
  "page_size": 50,
  "page_token": "cursor123",
  "sort_type": 1,
  "settle_time_from": 1690000000,
  "settle_time_to": 1695000000
}
```

**Response Example:**
```json
{
  "code": 0,
  "data": {
    "settlements": [
      {
        "settlement_id": "SET123456",
        "order_id": "576123456789",
        "settlement_status": "SETTLED",
        "settlement_amount": "17.99",
        "currency": "GBP",
        "fee_details": [
          {
            "fee_type": "PLATFORM_COMMISSION",
            "fee_amount": "2.00"
          }
        ]
      }
    ],
    "next_page_token": "cursor456",
    "total_count": 50
  }
}
```

## Essentials

- Financial events should be normalized into local payment or refund flows when relevant.
- Keep settlement logic separate from order state logic.

## Local Repo Anchors

- `app/Application/Orchestrators/PaymentOrchestrator.php`
- `app/Application/Orchestrators/RefundOrchestrator.php`
- `app/Marketplaces/Services/Payments/TikTokPaymentService.php` if present in the current codebase

## Notes

- Use this reference only when the task is actually financial; it should not be the default for all TikTok work.