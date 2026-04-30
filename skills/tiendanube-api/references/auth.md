# Tiendanube (Nuvemshop) API Authentication

## Use When

- You need to authenticate requests against the Tiendanube / Nuvemshop API.
- You are constructing the required headers for API requests.
- You are handling API pagination and rate limits.

## API References

**Base URL:** 
- `https://api.tiendanube.com/v1/{store_id}` (For LATAM)
- `https://api.nuvemshop.com.br/v1/{store_id}` (For Brazil)

*Note: The API version can also be a date format like `/2025-03/{store_id}`.*

## 1. Authentication Flow (OAuth 2.0)

Tiendanube uses a standard OAuth 2.0 Authorization Code flow.

1. **Authorize:** The merchant installs your app and is redirected to your callback URL with a `code`.
2. **Exchange:** Exchange the `code` for an `access_token` by `POST`ing to `https://www.tiendanube.com/apps/authorize/token` (or `nuvemshop.com.br`).
3. **Persist:** The `access_token` does NOT expire. It is valid until the app is uninstalled.

## 2. Required Headers (CRITICAL)

Every request to a resource endpoint requires specific headers. Failure to provide them will result in `400 Bad Request` or `401 Unauthorized`.

| Header | Required | Example | Description |
|---|---|---|---|
| `Authentication` | Yes | `bearer {ACCESS_TOKEN}` | **Must use "Authentication" (not Authorization) and lowercase "bearer".** |
| `User-Agent` | Yes | `MyApp (your-email@example.com)` | **Strictly enforced.** Identifies your application. |
| `Content-Type` | Yes* | `application/json; charset=utf-8` | Required for `POST` and `PUT` requests. |

**Example cURL:**
```bash
curl -H 'Authentication: bearer eyJhb...' \
     -H 'User-Agent: ERPMasterAgent (dev@company.com)' \
     https://api.tiendanube.com/v1/123456/products
```

## 3. Rate Limiting

Tiendanube uses a Leaky Bucket algorithm (default bucket: 40 requests, leaks 2 requests/sec). 

You must respect the following response headers to avoid `429 Too Many Requests`:
- `x-rate-limit-limit`: Total bucket size.
- `x-rate-limit-remaining`: Remaining slots in the bucket.
- `x-rate-limit-reset`: Milliseconds to completely empty the bucket.

## 4. Pagination

Pagination is handled via URL parameters and headers.

- **Parameters:** `?page=1&per_page=50` (Max `per_page` is 200).
- **Headers:** 
  - `x-total-count`: Total number of records.
  - `Link`: Contains standard `rel="next"`, `rel="last"`, etc. You should use these URLs to fetch the next page instead of manually building them.

## Local Repo Anchors

- `app/Marketplaces/Drivers/Tiendanube/TiendanubeAuthDriver.php`
- `app/Marketplaces/Services/Connection/TiendanubeConnectionService.php`