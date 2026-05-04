# Amazon SP-API Authentication (Mexico)

## Use When

- You need LWA (Login with Amazon) token exchange logic.
- You are constructing the required headers for SP-API requests.
- You need to handle Restricted Data Tokens (RDT) for PII access.
- You are debugging `401 Unauthorized` or `403 Forbidden` errors.

## Mexico Region Configuration

| Key | Value |
|---|---|
| **Marketplace ID** | `A1AM78C64UM0Y8` |
| **Regional Endpoint** | `https://sellingpartnerapi-na.amazon.com` |
| **Selling Region** | North America (US, CA, MX, BR) |
| **AWS Region** | `us-east-1` |

> [!IMPORTANT]
> You must pass the Mexico `MarketplaceId` (`A1AM78C64UM0Y8`) in the request body or query parameters of most SP-API calls to scope results to the Mexico marketplace.

## 1. Authentication Flow (LWA OAuth 2.0)

Amazon SP-API uses **Login with Amazon (LWA)** exclusively. As of October 2023, **AWS Signature Version 4 (SigV4) and IAM role assumption are no longer required**.

### Step 1: Exchange Refresh Token for Access Token

`POST https://api.amazon.com/auth/o2/token`

**Content-Type:** `application/x-www-form-urlencoded;charset=UTF-8`

**Request Body:**
```
grant_type=refresh_token&refresh_token=Atzr|IwEB...&client_id=amzn1.application-oa2-client.xyz&client_secret=YOUR_SECRET
```

**Response Example:**
```json
{
  "access_token": "Atza|IwEB...",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "Atzr|IwEB..."
}
```

### Step 2: Use Access Token in SP-API Calls

Include the token in the `x-amz-access-token` header for every request.

## 2. Required Headers for All SP-API Calls

| Header | Required | Value | Description |
|---|---|---|---|
| `x-amz-access-token` | Yes | `Atza\|IwEB...` | The LWA access token |
| `Content-Type` | Yes | `application/json` | For POST/PUT/PATCH requests |
| `Accept` | Recommended | `application/json` | Expected response format |
| `User-Agent` | Recommended | `YourApp/1.0 (Language=PHP)` | Helps Amazon debug issues |

> [!WARNING]
> **No AWS SigV4 required.** If you have legacy code that signs requests with AWS credentials, it still works (Amazon ignores the signature), but new implementations should skip it entirely.

## 3. Restricted Data Tokens (RDT)

When accessing Personally Identifiable Information (PII) — such as buyer shipping addresses or names — you must first obtain a **Restricted Data Token (RDT)** and use it *instead of* the standard LWA access token.

`POST https://sellingpartnerapi-na.amazon.com/tokens/2021-03-01/restrictedDataToken`

**Request Body:**
```json
{
  "restrictedResources": [
    {
      "method": "GET",
      "path": "/orders/v0/orders/{orderId}",
      "dataElements": ["buyerInfo", "shippingAddress"]
    }
  ]
}
```

**Response:**
```json
{
  "restrictedDataToken": "Atz.sprdt|...",
  "expiresIn": 3600
}
```

*Use the `restrictedDataToken` value in the `x-amz-access-token` header for that specific call.*

## Token Lifecycle

| Token | Expiration | Notes |
|---|---|---|
| `access_token` (LWA) | **1 hour** (3600s) | Cache and reuse; refresh before expiry |
| `refresh_token` (LWA) | **Does not expire** | Valid until the seller deauthorizes your app |
| `restrictedDataToken` | **1 hour** (3600s) | Scoped to the specific resources requested |

## Local Repo Anchors

- `app/Marketplaces/Drivers/Amazon/AmazonAuthDriver.php`
- `app/Marketplaces/Services/Connection/AmazonConnectionService.php`

## Notes

- **Cache the access_token.** Do not call `/auth/o2/token` on every request; cache it for ~55 minutes.
- The `refresh_token` is permanent but sensitive. Store it encrypted in the database.
- If you receive a `403 Forbidden` on an order call that worked before, you likely need an RDT for the PII fields.