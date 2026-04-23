# Amazon Authentication (SP-API)

## Use When
- You need LWA (Login with Amazon) token exchange or STS role assumption logic.

## API References

### 1. Exchange LWA Token
`POST https://api.amazon.com/auth/o2/token`

**Request Body:**
```json
{
  "grant_type": "refresh_token",
  "refresh_token": "Atzr|IwEB...",
  "client_id": "amzn1.application-oa2-client.xyz",
  "client_secret": "YOUR_SECRET"
}
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

## Local Repo Anchors
- `app/Marketplaces/Drivers/Amazon/AmazonAuthDriver.php`
- `app/Marketplaces/Services/Connection/AmazonConnectionService.php`