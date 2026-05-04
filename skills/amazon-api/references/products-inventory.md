# Amazon SP-API Products and Inventory (Mexico)

## Use When

- Listing or updating product details in the Amazon Mexico catalog.
- Pushing inventory level changes for Seller-Fulfilled (MFN) items.
- Querying FBA inventory levels (Amazon-fulfilled stock).
- Understanding the difference between Listings Items, Catalog Items, and Inventory APIs.

## API References (SP-API)

**Regional Endpoint:** `https://sellingpartnerapi-na.amazon.com`
**Mexico Marketplace ID:** `A1AM78C64UM0Y8`

## API Landscape

Amazon splits product/inventory management across several specialized APIs:

| API | Purpose | Use Case |
|---|---|---|
| **Listings Items** | Create/update your seller listings (SKU-level) | Product setup, pricing, condition |
| **Catalog Items** | Read-only Amazon catalog data (ASIN-level) | Product search, attribute lookup |
| **FBA Inventory** | Query Amazon-fulfilled (FBA) stock levels | Read-only; Amazon manages FBA stock |
| **Seller Inventory** | Update Merchant-Fulfilled (MFN) stock | Push your warehouse quantities |
| **Feeds** | Bulk async operations | Large catalog updates |

---

## 1. Listings Items API (Create / Update Your Listings)

### Create or Update a Listing

`PUT /listings/2021-08-01/items/{sellerId}/{sku}`

This is the primary way to create or update a product listing. You specify a `productType` and provide `attributes` matching the Amazon product type definition.

**Query Parameters:**
| Parameter | Required | Value |
|---|---|---|
| `marketplaceIds` | Yes | `A1AM78C64UM0Y8` |

**Request Body:**
```json
{
  "productType": "SHIRT",
  "requirements": "LISTING",
  "attributes": {
    "item_name": [
      {
        "value": "Camiseta Algodón Premium",
        "language_tag": "es_MX",
        "marketplace_id": "A1AM78C64UM0Y8"
      }
    ],
    "brand": [
      {
        "value": "MiMarca"
      }
    ],
    "externally_assigned_product_identifier": [
      {
        "type": "ean",
        "value": "1234567890123"
      }
    ],
    "purchasable_offer": [
      {
        "currency": "MXN",
        "our_price": [
          {
            "schedule": [
              {
                "value_with_tax": 299.00
              }
            ]
          }
        ]
      }
    ],
    "fulfillment_availability": [
      {
        "fulfillment_channel_code": "DEFAULT",
        "quantity": 50
      }
    ]
  }
}
```

### Delete a Listing

`DELETE /listings/2021-08-01/items/{sellerId}/{sku}?marketplaceIds=A1AM78C64UM0Y8`

### Get a Listing

`GET /listings/2021-08-01/items/{sellerId}/{sku}?marketplaceIds=A1AM78C64UM0Y8&includedData=attributes,issues,offers`

---

## 2. Catalog Items API (Read-Only Catalog Lookup)

### Search the Amazon Catalog

`GET /catalog/2022-04-01/items`

**Query Parameters:**
| Parameter | Description |
|---|---|
| `marketplaceIds` | `A1AM78C64UM0Y8` |
| `identifiers` | ASIN, EAN, UPC, or ISBN |
| `identifiersType` | `ASIN`, `EAN`, `UPC`, `ISBN` |
| `includedData` | `summaries`, `attributes`, `dimensions`, `identifiers`, `images`, `salesRanks` |

### Get a Specific Item

`GET /catalog/2022-04-01/items/{asin}?marketplaceIds=A1AM78C64UM0Y8&includedData=summaries,images`

---

## 3. Inventory Updates (Seller-Fulfilled / MFN)

For Merchant-Fulfilled Network (MFN) items, you push inventory via the Listings Items API by including `fulfillment_availability` in the attributes, or via the Feeds API for bulk updates.

### Single SKU Update (via Listings Items)

Use `PATCH /listings/2021-08-01/items/{sellerId}/{sku}` with:

```json
{
  "productType": "SHIRT",
  "patches": [
    {
      "op": "replace",
      "path": "/attributes/fulfillment_availability",
      "value": [
        {
          "fulfillment_channel_code": "DEFAULT",
          "quantity": 25
        }
      ]
    }
  ]
}
```

### Bulk Inventory Update (via Feeds API)

`POST /feeds/2021-06-30/feeds`

Create a feed of type `JSON_LISTINGS_FEED` with inventory patches for many SKUs at once. Poll `GET /feeds/2021-06-30/feeds/{feedId}` for processing status.

---

## 4. FBA Inventory API (Amazon-Fulfilled Stock — Read Only)

`GET /fba/inventory/v1/summaries`

**Query Parameters:**
| Parameter | Description |
|---|---|
| `marketplaceIds` | `A1AM78C64UM0Y8` |
| `granularityType` | `Marketplace` |
| `granularityId` | `A1AM78C64UM0Y8` |

> [!IMPORTANT]
> You **cannot** directly push inventory updates for FBA items. Amazon manages FBA stock based on inbound shipments to their fulfillment centers.

---

## Fulfillment Paradigms

| Fulfillment Type | Inventory Management | API for Stock |
|---|---|---|
| **MFN (Merchant Fulfilled)** | You push quantities via Listings or Feeds | `PUT/PATCH /listings/...` or Feeds API |
| **FBA (Fulfilled by Amazon)** | Amazon manages stock; you ship inbound | `GET /fba/inventory/v1/summaries` (read-only) |

## Local Repo Anchors

- `app/Marketplaces/Services/Products/AmazonProductService.php`
- `app/Marketplaces/Services/Inventory/AmazonInventoryService.php`
- `app/Marketplaces/Mappers/Amazon/AmazonInventoryMapper.php`

## Notes

- Use the Listings Items API for real-time single-SKU updates and the Feeds API for bulk operations (>50 SKUs).
- Prices for Mexico must use `MXN` currency.
- Product attributes are language-tagged; use `es_MX` for Spanish (Mexico).
- `fulfillment_channel_code`: `DEFAULT` = MFN, `AMAZON_NA` = FBA.