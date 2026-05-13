# Tiendanube (Nuvemshop) API Customers

## Use When

- Syncing customer records between ERP and TiendaNube.
- Creating customers for B2B or phone-sale orders.
- Looking up customers for order mapping.
- Managing customer addresses.

## API References

**Base URL:** `https://api.tiendanube.com/v1/{store_id}`
**Headers Required:** `Authentication`, `User-Agent`

## 1. Customer Properties

| Property | Type | Description |
|---|---|---|
| `id` | integer | Customer ID |
| `name` | string | Full name |
| `email` | string | Email address |
| `phone` | string/null | Phone number |
| `identification` | string/null | Tax ID (CPF/CNPJ/DNI) |
| `note` | string/null | Internal note |
| `total_spent` | string | Lifetime spend (e.g. `"89.00"`) |
| `total_spent_currency` | string | ISO 4217 currency code |
| `last_order_id` | integer/null | Most recent order ID |
| `extra` | object/null | Custom key-value pairs (e.g. `{"gender":"male"}`) |
| `billing_address` | string/null | Billing street address |
| `billing_city` | string/null | Billing city |
| `billing_province` | string/null | Billing state/province |
| `billing_zipcode` | string/null | Billing postal code |
| `billing_country` | string/null | ISO country code |
| `billing_phone` | string/null | Billing phone |
| `billing_number` | string/null | Billing street number |
| `billing_floor` | string/null | Billing floor/apartment |
| `billing_locality` | string/null | Billing neighborhood |
| `default_address` | object/null | Default shipping address |
| `addresses` | array | All saved addresses |
| `created_at` | string | ISO 8601 |
| `updated_at` | string | ISO 8601 |

### Address Object Properties

| Property | Type | Description |
|---|---|---|
| `id` | integer | Address ID |
| `address` | string | Street name |
| `number` | string | Street number |
| `floor` | string/null | Floor/apartment |
| `locality` | string/null | Neighborhood |
| `city` | string | City |
| `province` | string | State/province |
| `zipcode` | string | Postal code |
| `country` | string | ISO country code |
| `phone` | string | Phone |
| `default` | boolean | Is default address |
| `created_at` | string | ISO 8601 |
| `updated_at` | string | ISO 8601 |

## 2. Endpoints

### GET /customers — List All Customers
`GET /customers`

**Query Parameters:** `since_id`, `page`, `per_page` (max 200), `created_at_min`, `created_at_max`, `updated_at_min`, `updated_at_max`, `fields`.

**Response Example:**
```json
[
  {
    "id": 101,
    "name": "John Doe",
    "email": "john.doe@example.com",
    "identification": "28776255670",
    "phone": null,
    "total_spent": "89.00",
    "total_spent_currency": "USD",
    "last_order_id": 9001,
    "default_address": {
      "id": 1234,
      "address": "Evergreen Terrace",
      "number": "742",
      "city": "Springfield",
      "province": "Oregon",
      "zipcode": "97475",
      "country": "US",
      "default": true
    },
    "addresses": [ ... ]
  }
]
```

### GET /customers/{id} — Get Single Customer
`GET /customers/{id}`

### POST /customers — Create Customer
`POST /customers` → `201 Created`

**Request Example:**
```json
{
  "name": "First Last",
  "email": "first.last@example.com",
  "phone": "+55 11 9 1234-5678",
  "addresses": [
    {
      "address": "My Street",
      "city": "My City",
      "country": "BR",
      "locality": "Morumbi",
      "number": "123",
      "phone": "+55 11 9 1234-5678",
      "province": "São Paulo",
      "zipcode": "05653-071"
    }
  ],
  "send_email_invite": true,
  "password": "mysupersecretpassword"
}
```

> [!NOTE]
> `send_email_invite` and `password` are optional. If `send_email_invite` is true, the customer receives an account activation email.

### PUT /customers/{id} — Update Customer
`PUT /customers/{id}` → `200 OK`

**Request Example:**
```json
{
  "email": "john.doe+modified@example.com",
  "phone": "911"
}
```

### DELETE /customers/{id} — Delete Customer
`DELETE /customers/{id}` → `200 OK` with `{}`

> [!WARNING]
> You **cannot delete** a customer with associated orders. The API returns `422 Unprocessable Entity` with `"Cannot delete a customer with orders"`.

## 3. ERP Integration Notes

- Use `since_id` for incremental polling.
- `identification` maps to the customer's tax ID (CPF/CNPJ in Brazil, DNI in Argentina).
- `total_spent` and `last_order_id` are read-only, computed by the platform.
- Customer webhooks: `customer/created`, `customer/updated`, `customer/deleted`.

## Local Repo Anchors

- `app/Marketplaces/Services/Customers/TiendanubeCustomerService.php`
- `app/Marketplaces/Mappers/Tiendanube/TiendanubeCustomerMapper.php`
