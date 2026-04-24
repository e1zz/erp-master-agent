# MercadoLibre Authentication

## Use When
- You need OAuth authorization code exchange, token refresh, or identifying seller ID.

## API References

### 1. Exchange Code / Refresh Token
`POST https://api.mercadolibre.com/oauth/token`

**Request Body Example (Refresh):**
```json
{
  "grant_type": "refresh_token",
  "client_id": "1234567890",
  "client_secret": "YOUR_SECRET_KEY",
  "refresh_token": "TG-XXXXXXXX-241"
}
```

**Response Example:**
```json
{
  "access_token": "APP_USR-1234567-xxxx",
  "token_type": "bearer",
  "expires_in": 21600,
  "scope": "offline_access read write",
  "user_id": 123456789,
  "refresh_token": "TG-XXXXXXXX-241"
}
```

## Local Repo Anchors
- `app/Marketplaces/Drivers/MercadoLibre/MercadoLibreAuthDriver.php`
- `app/Marketplaces/Services/Connection/MercadoLibreConnectionService.php`