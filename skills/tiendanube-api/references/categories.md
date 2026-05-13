# Tiendanube (Nuvemshop) API Categories

## Use When

- Syncing product category trees between ERP and TiendaNube.
- Creating, updating, or deleting categories.
- Managing parent-child (hierarchical) category relationships.
- Controlling category visibility in the storefront.

## API References

**Base URL:** `https://api.tiendanube.com/v1/{store_id}`
**Headers Required:** `Authentication`, `User-Agent`

## 1. Category Properties

| Property | Type | Description |
|---|---|---|
| `id` | integer | Category ID |
| `name` | object | Multilingual (`{"en":"...","es":"...","pt":"..."}`) |
| `description` | object | Multilingual HTML description |
| `handle` | object | Multilingual URL slug |
| `parent` | integer/null | Parent category ID (`null` = root) |
| `subcategories` | array | **Read-only.** List of child category IDs |
| `visibility` | string | `visible`, `hidden`, or `soft-hidden` |
| `visibility_updated_at` | string | ISO 8601 timestamp of last visibility change |
| `google_shopping_category` | string/null | Google Product Type taxonomy string |
| `created_at` | string | ISO 8601 |
| `updated_at` | string | ISO 8601 |

### Store Limits
- Max **1,000 categories** per store
- Max description length: **65,535 characters**

## 2. Visibility Rules

| Rule | Behavior |
|---|---|
| `hidden` | Explicitly hidden; not visible in store |
| `visible` | Explicitly visible in store |
| `soft-hidden` | Inherited hidden state from a parent/ancestor marked `hidden` |

> [!IMPORTANT]
> - A hidden category **cannot** contain visible subcategories.
> - A visible category **can** contain hidden subcategories.
> - `soft-hidden` applies only to subcategories that inherit the `hidden` state — they are not explicitly hidden themselves.

## 3. Endpoints

### GET /categories — List All Categories
`GET /categories`

**Query Parameters:** `since_id`, `page`, `per_page` (max 200), `created_at_min`, `created_at_max`, `updated_at_min`, `updated_at_max`, `fields`.

**Response Example:**
```json
[
  {
    "id": 4567,
    "name": { "en": "Poké Balls", "es": "Poké Balls", "pt": "Poké Balls" },
    "description": { "en": "", "es": "", "pt": "" },
    "handle": { "en": "poke-balls", "es": "poke-balls", "pt": "poke-balls" },
    "parent": null,
    "subcategories": [],
    "visibility": "visible",
    "google_shopping_category": null
  }
]
```

### GET /categories/{id} — Get Single Category
`GET /categories/{id}`

### POST /categories — Create Category
`POST /categories` → `201 Created`

**Request Example (with parent and Google Shopping):**
```json
{
  "name": { "en": "Gen I", "es": "Gen I", "pt": "Gen I" },
  "parent": 4567,
  "google_shopping_category": "Clothing & Accessories > Jewelry"
}
```

**Create Hidden Category:**
```json
{
  "name": { "en": "Gen I", "es": "Gen I", "pt": "Gen I" },
  "visibility": "hidden"
}
```

**422 Errors:** `name can't be blank`, `Store has reached maximum limit of 1000 allowed categories`.

### PUT /categories/{id} — Update Category
`PUT /categories/{id}` → `200 OK`

**Update parent (detach from parent):**
```json
{ "parent": null }
```

**Update visibility:**
```json
{ "visibility": "visible" }
```

### DELETE /categories/{id} — Delete Category
`DELETE /categories/{id}` → `200 OK` with `{}`

## 4. Hierarchical Category Management

### Assigning Children
Set the `parent` property on the **child** category to the parent's ID. This works on both `POST` (creation) and `PUT` (update).

```json
POST /categories
{ "name": { "es": "Shoes" }, "parent": 16366393 }
```

> [!WARNING]
> The `subcategories` property is **read-only**. You cannot modify it to assign or remove children. Always set the `parent` property on the child category instead.

### Assigning Categories to Products
Use the Product resource:
```json
PUT /products/5123
{ "categories": [1234, 4567] }
```

## 5. ERP Integration Notes

- Category webhooks: `category/created`, `category/updated`, `category/deleted`.
- Use `fields=id,name,subcategories` for lightweight tree traversal.
- Google Shopping Category uses the [Google Product Type Taxonomy](https://www.google.com/basepages/producttype/taxonomy.es-ES.txt).

## Local Repo Anchors

- `app/Marketplaces/Services/Categories/TiendanubeCategoryService.php`
- `app/Marketplaces/Mappers/Tiendanube/TiendanubeCategoryMapper.php`
