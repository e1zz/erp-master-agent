# Shopify API Authentication

## Use When

- You need to authenticate requests against the Shopify Admin REST/GraphQL API.
- You are constructing the required headers for Shopify API requests.
- You are handling Shopify API pagination or rate limits.
- You are initializing the Shopify PHP SDK.

## API References

**Base URL:** 
`https://{shop}.myshopify.com/admin/api/{version}/` (e.g. `https://my-store.myshopify.com/admin/api/2025-10/`)

*Note: The API version is mandatory in all URL paths. The default supported version is `2025-10`.*

## 1. Authentication Flow (OAuth 2.0)

Shopify uses standard OAuth 2.0 to authenticate requests.

1. **Authorize:** Direct the merchant to the authorize URL to grant permissions:
   `GET https://{shop}.myshopify.com/admin/oauth/authorize?client_id={api_key}&scope={scopes}&redirect_uri={redirect_uri}&state={nonce}`
2. **Exchange:** After authorization, Shopify redirects to your `redirect_uri` with a `code` and `hmac`. Exchange the authorization `code` for a permanent access token:
   `POST https://{shop}.myshopify.com/admin/oauth/access_token`
   **Payload:**
   ```json
   {
     "client_id": "YOUR_API_KEY",
     "client_secret": "YOUR_API_SECRET",
     "code": "AUTHORIZATION_CODE"
   }
   ```
3. **Persist:** The returned `access_token` does NOT expire (unless it is a transient/online token). Save this token and the shop's domain.

## 2. Required Headers (CRITICAL)

Every HTTP request to a Shopify resource endpoint requires specific headers:

| Header | Required | Example | Description |
|---|---|---|---|
| `X-Shopify-Access-Token` | Yes | `shpua_xxxxxxxxxxxxxxxx` | The access token retrieved during OAuth. |
| `Content-Type` | Yes* | `application/json` | Required for all `POST` and `PUT` requests. |
| `User-Agent` | Yes | `Shopify App PHP SDK` | Identifies your application. Enforced by SDK. |

**Example cURL:**
```bash
curl -H 'X-Shopify-Access-Token: shpua_xxxxxxxxxxxxxxxx' \
     -H 'Content-Type: application/json' \
     https://my-store.myshopify.com/admin/api/2025-10/products.json
```

## 3. Rate Limiting

Shopify Admin REST API utilizes a **Leaky Bucket** algorithm:
- **Standard Accounts:** 40 requests bucket capacity, leaks 2 requests/second.
- **Shopify Plus Accounts:** 400 requests bucket capacity, leaks 20/second.
- **Headers:** Check `X-Shopify-Shop-Api-Call-Limit` in responses (e.g. `12/40`).
- **Over limit:** Returns `429 Too Many Requests`. Read the `Retry-After` header to determine how long to back off (seconds).

## 4. Pagination

All REST Admin API endpoints use **Cursor-Based Pagination**:
- **Do not** use `page` or `offset` parameters.
- **Parameters:** `limit` (max 250, default 50) and `page_info` (a cursor string returned in the Link header).
- **Headers:** Look at the `Link` header in the HTTP response.
  ```http
  Link: <https://{shop}.myshopify.com/admin/api/2025-10/products.json?limit=50&page_info=eyJkaXJlY3Rpb24iOiJuZXh0Ii...>; rel="next"
  ```
- Parse the URL from the `Link` header with `rel="next"` to fetch the next page.

## 5. Shopify PHP SDK Usage

Initialize the SDK global context once (e.g., in a Laravel service provider):

```php
use Shopify\Context;
use Shopify\Auth\FileSessionStorage;

Context::initialize(
    apiKey: config('services.shopify.client_id'),
    apiSecret: config('services.shopify.client_secret'),
    scopes: config('services.shopify.scopes'),
    hostName: config('services.shopify.host_name'),
    sessionStorage: new FileSessionStorage('/tmp/shopify_sessions'),
    apiVersion: '2025-10',
    isEmbeddedApp: false
);
```

To perform REST calls using the SDK:

```php
use Shopify\Clients\Rest;

$client = new Rest($shopDomain, $accessToken);
$response = $client->get(path: 'products', query: ['limit' => 50]);
$products = $response->getDecodedBody()['products'];
```

## Local Repo Anchors

- `app/Marketplaces/Drivers/Shopify/ShopifyAuthDriver.php`
- `app/Marketplaces/Services/Connection/ShopifyConnectionService.php`
