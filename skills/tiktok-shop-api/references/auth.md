# TikTok Shop Authentication

## Use When

- You need OAuth setup, callback handling, token exchange, or refresh logic.
- You need to generate or validate request signatures (HMAC-SHA256).
- You need to understand the authorization flow for the global TikTok Shop Open Platform.

## API Base URLs

| Market | API Base URL |
|---|---|
| **Global (ROW)** | `https://open-api.tiktokglobalshop.com` |
| **US** | `https://open-api.tiktokshops.us` |

All endpoint paths in this reference use the **global** base URL.

### API Versioning

The current API version is **v202309**. Endpoint paths include the version:
```
https://open-api.tiktokglobalshop.com/product/202309/products
```

Legacy API versions (pre-September 2023) are retired.

## OAuth 2.0 Authorization Flow

### 1. Authorization URL (Redirect Seller)

Redirect the seller to the TikTok Shop authorization page:

**Global (ROW):**
```
https://services.tiktokshop.com/open/authorize?service_id={YOUR_SERVICE_ID}&state={CSRF_TOKEN}
```

**US:**
```
https://services.tiktokshops.us/open/authorize?service_id={YOUR_SERVICE_ID}&state={CSRF_TOKEN}
```

**Parameters:**

| Parameter | Required | Description |
|---|---|---|
| `service_id` | Yes | Your application's service ID from the Partner Center |
| `state` | Recommended | CSRF protection token — validate on callback |

- The `service_id` is generated in the "Authorization" section of your app in the TikTok Shop Partner Center.
- After authorization, the seller is redirected to your `Redirect URL` with `?code={AUTH_CODE}&state={CSRF_TOKEN}`.
- The authorization `code` is valid for **30 minutes** and is **single-use**.

### 2. Exchange Code for Access Token

`GET https://open-api.tiktokglobalshop.com/api/v2/token/get`

**Query Parameters:**

| Parameter | Required | Description |
|---|---|---|
| `app_key` | Yes | Your App Key from Partner Center |
| `app_secret` | Yes | Your App Secret (server-side only) |
| `auth_code` | Yes | Authorization code from the callback URL |
| `grant_type` | Yes | Must be `authorized_code` |

**Response Example:**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "access_token": "act.ROW_xxxxxxxxxxxxxxxxxxxx",
    "access_token_expire_in": 1209600,
    "refresh_token": "rft.ROW_yyyyyyyyyyyyyyyyyyyy",
    "refresh_token_expire_in": 7776000,
    "open_id": "open_id_string",
    "seller_name": "My Global Store",
    "seller_base_region": "MX"
  }
}
```

### 3. Refresh Token

`GET https://open-api.tiktokglobalshop.com/api/v2/token/refresh`

**Query Parameters:**

| Parameter | Required | Description |
|---|---|---|
| `app_key` | Yes | Your App Key |
| `app_secret` | Yes | Your App Secret |
| `refresh_token` | Yes | Current refresh token |
| `grant_type` | Yes | Must be `refresh_token` |

**Response:** Same structure as the token exchange response.

## Token Lifecycle

| Token | Expiration | Notes |
|---|---|---|
| `access_token` | **14 days** (1,209,600 seconds) | Used for all authenticated API requests |
| `refresh_token` | **90 days** (7,776,000 seconds) | Used to obtain new access + refresh tokens |

- After refreshing, **both** tokens rotate. Always persist the new `refresh_token`.
- Pass the access token via header: `x-tts-access-token: {ACCESS_TOKEN}`
- If the access token expires, you'll receive a `code != 0` error response — trigger a refresh.
- If the refresh token expires, the seller must re-authorize from scratch.

## Request Signature (HMAC-SHA256)

**All API requests** (except OAuth token endpoints) require a `sign` query parameter.

### Signature Generation Algorithm

1. **Extract** all query parameters except `sign` and `access_token`.
2. **Sort** the parameters alphabetically by key name.
3. **Concatenate** the sorted key-value pairs: `key1value1key2value2...`
4. **Prepend** the API path: `/product/202309/products` + concatenated params.
5. **Append** the raw HTTP request body (skip this for `multipart/form-data` or GET requests with no body).
6. **Wrap** with App Secret: `{app_secret}` + path + params + body + `{app_secret}`.
7. **Hash** using **HMAC-SHA256** with `app_secret` as the key.
8. **Output** the lowercase hexadecimal digest as the `sign` parameter.

### Signature Example (Pseudocode)

```
path = "/product/202309/products"
params = "app_key=12345&shop_cipher=abc&timestamp=1690000000"
sorted_params = "app_key12345shop_cipherabctimestamp1690000000"
body = '{"title":"Test"}'

sign_string = app_secret + path + sorted_params + body + app_secret
sign = hmac_sha256(app_secret, sign_string).hex().lower()
```

### Required Query Parameters (All Requests)

| Parameter | Description |
|---|---|
| `app_key` | Your App Key |
| `timestamp` | Unix timestamp (10-digit, seconds) — must be within 5 minutes of current time |
| `sign` | HMAC-SHA256 signature |
| `shop_cipher` | Encrypted shop identifier (for multi-shop/cross-border apps) |
| `access_token` | The seller's access token (in header or query) |

## shop_cipher

For global/cross-border sellers operating multiple shops, the `shop_cipher` is required to route API requests to the correct shop context.

- Obtain `shop_cipher` values via the **Get Authorized Shops** endpoint.
- Always pass `shop_cipher` in the query string for shop-specific operations.
- `shop_id` (plain) is used in webhooks; `shop_cipher` (encrypted) is used in API requests.

## Rate Limits

- Rate limits are enforced per app per endpoint using a sliding time window.
- When exceeded: HTTP `429 Too Many Requests`.
- Use **exponential backoff** on 429 responses.
- Request higher quotas through the Partner Center if needed.
- Batch requests where possible and cache responses to minimize calls.

## Common Error Codes

| Code | Label | Description |
|---|---|---|
| `0` | Success | Request completed successfully |
| Non-zero | Error | Check `message` field for details |
| HTTP `401` | `access_token_invalid` | Token expired or invalid — refresh it |
| HTTP `403` | `access_denied` | App lacks required scope/permission |
| HTTP `429` | `rate_limit_exceeded` | Too many requests — back off |
| HTTP `400` | `invalid_params` | Missing or malformed request parameters |
| HTTP `500` | `internal_error` | Server error — retry with backoff |

All error responses include a `log_id` field useful for debugging with TikTok support.

## Local Repo Anchors

- `app/Marketplaces/Services/Connection/TikTokConnectionService.php`
- `app/Marketplaces/Drivers/TikTok/TikTokAuthDriver.php`
- `app/Http/Controllers/OAuthController.php`
- `app/Http/Controllers/ConnectionsController.php`

## Notes

- **Never expose `app_secret` on the client side.** All token and signing operations must happen server-side.
- Do not assume sandbox and production behavior are identical.
- Timestamp in requests must be within **5 minutes** of the current time.
- The TikTok Shop Partner Center provides an **API testing tool** to validate request construction and signatures.
- For this ERP integration, the connection service handles token refresh and signature generation transparently.