# Walmart Global Marketplace Authentication

## Use When

- You need OAuth setup, token generation, or token rotation for Walmart APIs.
- You are constructing the required headers for API requests.
- You need to debug `401 Unauthorized` errors.

## API References (Global Marketplace)

Walmart uses the **Client Credentials** grant type for its Global Marketplace APIs.

**Base URL:** `https://marketplace.walmartapis.com`

### Mexico Region Configuration

To target the Mexico region using the Global APIs, you must include the `WM_MARKET: mx` header in your requests. Do NOT use legacy paths like `/v3/mx/`.

### 1. Generate Token

`POST /v3/token`

This endpoint generates the `access_token` required for all subsequent API calls.

**Headers:**

| Header | Required | Value |
|---|---|---|
| `Authorization` | Yes | `Basic base64(clientId:clientSecret)` |
| `WM_SVC.NAME` | Yes | `Walmart Marketplace` |
| `WM_QOS.CORRELATION_ID` | Yes | A randomly generated UUID |
| `Content-Type` | Yes | `application/x-www-form-urlencoded` |
| `Accept` | Yes | `application/json` |

*Note: The `WM_MARKET` header is usually not strictly required for the `/v3/token` endpoint itself, as the credentials determine the account scope, but it is required for subsequent resource requests.*

**Request Body:**
```
grant_type=client_credentials
```

**Response Example:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1Ni...",
  "token_type": "Bearer",
  "expires_in": 900
}
```

### 2. Required Headers for All Resource API Calls

Once you have the token, you must include the following headers in **all** subsequent requests to resource endpoints (e.g., `/v3/orders`, `/v3/inventory`):

| Header | Required | Value | Description |
|---|---|---|---|
| `WM_SEC.ACCESS_TOKEN` | Yes | The `access_token` string | The token retrieved from `/v3/token` |
| `WM_MARKET` | Yes | `mx` | **Critical for Mexico integration.** Specifies the target marketplace. |
| `WM_CONSUMER.CHANNEL.TYPE` | Yes | Your Channel ID | Provided by Walmart during onboarding |
| `WM_QOS.CORRELATION_ID` | Yes | e.g. `123e4567-e89b-12d3...` | **Must generate a new random UUID for EVERY request.** Used for debugging. |
| `WM_SVC.NAME` | Yes | `Walmart Marketplace` | Name of the service being accessed |
| `Accept` | Yes | `application/json` | Expected response format |
| `Content-Type` | Yes | `application/json` | Usually required for POST/PUT |

## Token Lifecycle & Error Handling

| Token | Expiration | Notes |
|---|---|---|
| `access_token` | **15 minutes** (900 seconds) | Extremely short-lived. Must be refreshed frequently. |

- **No Refresh Token:** The Client Credentials flow does not use a `refresh_token`. To get a new token, simply call `POST /v3/token` again using your `clientId` and `clientSecret`.
- **401 Unauthorized:** If you receive a 401 error, your token has expired. Your service must catch this error, generate a new token, and retry the failed request.

## Local Repo Anchors

- `app/Marketplaces/Drivers/Walmart/WalmartAuthDriver.php`
- `app/Marketplaces/Services/Connection/WalmartConnectionService.php`

## Notes

- **Never hardcode credentials.** `clientId` and `clientSecret` must be stored securely.
- Ensure the `WM_QOS.CORRELATION_ID` is uniquely generated per HTTP request. Reusing the same ID can cause requests to be dropped or complicate debugging with Walmart support.
- If you omit `WM_MARKET: mx`, the API will likely default to the US marketplace and return `404 Not Found` for Mexico-specific items or orders.