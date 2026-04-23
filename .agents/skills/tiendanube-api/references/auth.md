# TiendaNube Authentication

## Use When
- You need OAuth authorization code exchange, token refresh, or identifying the store ID.

## API References

### 1. Exchange Code
`POST https://www.tiendanube.com/apps/authorize/token`

**Request Body:**
```json
{
  "client_id": "123",
  "client_secret": "YOUR_SECRET",
  "grant_type": "authorization_code",
  "code": "CODE_FROM_CALLBACK"
}
```

**Response Example:**
```json
{
  "access_token": "a1b2c3d4...",
  "token_type": "bearer",
  "scope": "write_products,read_orders",
  "user_id": 987654
}
```

## Local Repo Anchors
- `app/Marketplaces/Drivers/TiendaNube/TiendaNubeAuthDriver.php`
- `app/Marketplaces/Services/Connection/TiendaNubeConnectionService.php`