# Walmart Authentication

## Use When
- You need Walmart API auth, client-credentials token rotation, or header generation.

## API References
Walmart uses Client Credentials auth for the ERP integrations.

### 1. Generate Token
`POST /v3/token`

**Headers:**
- `Authorization`: Basic base64(clientId:clientSecret)
- `WM_SVC.NAME`: `Walmart Marketplace`
- `WM_QOS.CORRELATION_ID`: random UUID
- `Accept`: `application/json`
- `Content-Type`: `application/x-www-form-urlencoded`

**Request Body:**
`grant_type=client_credentials`

**Response Example:**
```json
{
  "access_token": "eyJhbGciOi...",
  "token_type": "Bearer",
  "expires_in": 900
}
```

## Local Repo Anchors
- `app/Marketplaces/Drivers/Walmart/WalmartAuthDriver.php`
- `app/Marketplaces/Services/Connection/WalmartConnectionService.php`