# Tiendanube (Nuvemshop) API Discounts & Coupons

## Use When

- Creating or managing promotional coupons for the storefront.
- Configuring cart-level or line-item-level discount rules.
- Syncing ERP promotional campaigns to TiendaNube.

## API References

**Base URL:** `https://api.tiendanube.com/v1/{store_id}`
**Headers Required:** `Authentication`, `User-Agent`

---

## Part A: Coupons

Coupons are reusable codes that customers enter at checkout. They map to a specific discount type and can be scoped to categories, products, or customers.

### 1. Coupon Properties

| Property | Type | Description |
|---|---|---|
| `id` | integer | Coupon ID |
| `code` | string | Coupon code entered by customer |
| `type` | string | `percentage`, `absolute`, or `shipping` |
| `value` | string | Discount value (e.g. `"15.00"` for 15% or $15) |
| `valid` | boolean | Whether coupon is currently active |
| `used` | integer | Times the coupon has been used |
| `max_uses` | integer/null | Maximum allowed uses (`null` = unlimited) |
| `start_date` | string/null | ISO 8601 start date |
| `end_date` | string/null | ISO 8601 end date |
| `min_price` | string/null | Minimum cart total to apply |
| `categories` | array/null | Array of category IDs (scope) |
| `created_at` | string | ISO 8601 |
| `updated_at` | string | ISO 8601 |

### 2. Coupon Types

| Type | Behavior |
|---|---|
| `percentage` | Percentage off cart/products (e.g. 15% off) |
| `absolute` | Fixed amount off (e.g. $10 off) |
| `shipping` | Free shipping (value ignored) |

### 3. Coupon Endpoints

#### GET /coupons — List All Coupons
`GET /coupons`

**Query Parameters:** `since_id`, `page`, `per_page`, `created_at_min`, `created_at_max`, `updated_at_min`, `updated_at_max`, `fields`.

#### GET /coupons/{id} — Get Single Coupon
`GET /coupons/{id}`

#### POST /coupons — Create Coupon
`POST /coupons` → `201 Created`

**Request Example:**
```json
{
  "code": "SUMMER2025",
  "type": "percentage",
  "value": "15.00",
  "valid": true,
  "max_uses": 100,
  "start_date": "2025-06-01T00:00:00-03:00",
  "end_date": "2025-08-31T23:59:59-03:00",
  "min_price": "50.00",
  "categories": [4567, 5678]
}
```

**422 Errors:** `code can't be blank`, `code has already been taken`, `value can't be blank`.

#### PUT /coupons/{id} — Update Coupon
`PUT /coupons/{id}` → `200 OK`

#### DELETE /coupons/{id} — Delete Coupon
`DELETE /coupons/{id}` → `200 OK` with `{}`

---

## Part B: Discounts

Discounts are automatic promotional rules applied at checkout without a coupon code. They can target specific products, categories, or cart totals.

### 1. Discount Properties

| Property | Type | Description |
|---|---|---|
| `id` | integer | Discount ID |
| `name` | object | Multilingual name |
| `type` | string | Discount type (e.g. `buy_x_get_y`, `percentage_on_total`, `fixed_on_total`) |
| `scope` | string | `cart` or `line_item` |
| `value` | string | Discount value |
| `start_date` | string/null | ISO 8601 |
| `end_date` | string/null | ISO 8601 |
| `active` | boolean | Whether discount is active |
| `conditions` | array | Conditions that trigger the discount |
| `created_at` | string | ISO 8601 |
| `updated_at` | string | ISO 8601 |

### 2. Discount Endpoints

#### GET /discounts — List Discounts
`GET /discounts`

**Query Parameters:** `since_id`, `page`, `per_page`, `created_at_min`, `created_at_max`, `updated_at_min`, `updated_at_max`, `fields`.

#### GET /discounts/{id} — Get Single Discount
`GET /discounts/{id}`

#### POST /discounts — Create Discount
`POST /discounts` → `201 Created`

#### PUT /discounts/{id} — Update Discount
`PUT /discounts/{id}` → `200 OK`

#### DELETE /discounts/{id} — Delete Discount
`DELETE /discounts/{id}` → `200 OK` with `{}`

---

## ERP Integration Notes

- Use Coupons for code-based promotions synced from the ERP.
- Use Discounts for automatic promotional engine rules.
- `valid` on coupons is a manual toggle — it does NOT auto-expire. Use `start_date`/`end_date` for time-based validity.
- Coupon `code` must be unique within the store.

## Local Repo Anchors

- `app/Marketplaces/Services/Promotions/TiendanubePromotionService.php`
