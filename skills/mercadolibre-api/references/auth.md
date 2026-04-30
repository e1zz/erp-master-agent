# MercadoLibre Authentication

## Use When

- You need OAuth authorization code exchange, token refresh, or identifying seller ID.
- You need to understand the server-side authentication flow for this ERP integration.
- You need to handle token expiration and automatic refresh logic.

## OAuth 2.0 Server-Side Flow

MercadoLibre uses the standard OAuth 2.0 Authorization Code Grant flow. The `client_secret` must never be exposed in frontend code.

### 1. Authorization URL (Redirect User)

Redirect the user's browser to the MercadoLibre authorization page:

```
https://auth.mercadolibre.com.mx/authorization?response_type=code&client_id={APP_ID}&redirect_uri={REDIRECT_URI}&state={CSRF_TOKEN}
```

**Parameters:**

| Parameter | Required | Description |
|---|---|---|
| `response_type` | Yes | Always `code` |
| `client_id` | Yes | Your application ID |
| `redirect_uri` | Yes | Must match the URI registered in your app settings |
| `state` | Recommended | CSRF protection token — should be validated on callback |

**Important:** The authorization URL domain varies by country (primarily using Mexico):
- Mexico: `auth.mercadolibre.com.mx`
- Argentina: `auth.mercadolibre.com.ar`
- Brazil: `auth.mercadolivre.com.br`
- Colombia: `auth.mercadolibre.com.co`
- Chile: `auth.mercadolibre.cl`

### 2. Receive Authorization Code

After the user authorizes, they are redirected to your `redirect_uri` with a temporary code:

```
{REDIRECT_URI}?code={AUTHORIZATION_CODE}&state={CSRF_TOKEN}
```

- The `code` is valid for **10 minutes** and is **single-use**.
- Always validate the `state` parameter against the one you sent.

### 3. Exchange Code for Access Token

`POST https://api.mercadolibre.com/oauth/token`

**Request Body (JSON):**
```json
{
  "grant_type": "authorization_code",
  "client_id": "1234567890",
  "client_secret": "YOUR_APP_SECRET",
  "code": "TG-XXXXXXXX-123456789",
  "redirect_uri": "https://your-app.com/callback"
}
```

**Response:**
```json
{
  "access_token": "APP_USR-1234567890-042316-xxxx-123456789",
  "token_type": "Bearer",
  "expires_in": 21600,
  "scope": "offline_access read write",
  "user_id": 123456789,
  "refresh_token": "TG-YYYYYYYY-123456789"
}
```

### 4. Refresh Token

`POST https://api.mercadolibre.com/oauth/token`

**Request Body (JSON):**
```json
{
  "grant_type": "refresh_token",
  "client_id": "1234567890",
  "client_secret": "YOUR_APP_SECRET",
  "refresh_token": "TG-YYYYYYYY-123456789"
}
```

**Response:** Same structure as the token exchange response above.

## Token Lifecycle

| Token | Expiration | Notes |
|---|---|---|
| `access_token` | **6 hours** (21,600 seconds) | Must be refreshed before expiration |
| `refresh_token` | **6 months** | Rotates on every refresh — always store the latest one |

- Access tokens are passed via header: `Authorization: Bearer {ACCESS_TOKEN}`
- If you receive a `401 Unauthorized`, the token has expired — trigger a refresh.
- After refreshing, **both** the `access_token` and `refresh_token` change. Always persist the new `refresh_token`.
- Include `offline_access` in the authorization scope to receive a `refresh_token`.

## User Information

### Get Current User (Me)
`GET https://api.mercadolibre.com/users/me`

**Response Fragment:**
```json
{
  "id": 123456789,
  "nickname": "TEST_SELLER",
  "site_id": "MLM",
  "country_id": "MX",
  "tags": ["normal", "warehouse_management", "multiwarehouse"],
  "seller_reputation": {
    "level_id": "5_green",
    "power_seller_status": "platinum"
  }
}
```

- `site_id` indicates the marketplace country (MLA = Argentina, MLB = Brazil, MLM = Mexico, etc.)
- `tags` array may contain `warehouse_management` and `multiwarehouse` if multi-origin stock is enabled.

## API Base URLs

| Country | API Base URL |
|---|---|
| All countries | `https://api.mercadolibre.com` |

The API base URL is the same for all countries. The `site_id` (MLA, MLB, MLM, etc.) is used in endpoint paths when needed.

## Rate Limits

- Rate limits are enforced per `app_id` + `user_id` combination.
- General guideline: **~10,000 requests per hour** for most endpoints.
- If rate limited, the API returns HTTP `429 Too Many Requests`.
- Use exponential backoff on 429 responses.
- Search endpoints have stricter limits (~1,000/hour).

## Local Repo Anchors

- `app/Marketplaces/Drivers/MercadoLibre/MercadoLibreAuthDriver.php`
- `app/Marketplaces/Services/Connection/MercadoLibreConnectionService.php`
- `app/Http/Controllers/OAuthController.php`
- `app/Http/Controllers/ConnectionsController.php`

## Notes

- Always use server-side flow — never expose `client_secret` in frontend.
- Consider implementing PKCE (Proof Key for Code Exchange) for enhanced security.
- Token refresh should be automatic and transparent to the caller — handled by the connection service.
- The ERP stores credentials per-store (multi-tenant). Always resolve connection via store context.