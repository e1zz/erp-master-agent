---
name: "tiendanube-api"
description: "Use when you need TiendaNube (Nuvemshop) specific API endpoint details, payloads, authentication, or local ERP implementation references. Provides modular reference files for auth, products/inventory, orders/fulfillment, webhooks, customers, categories, metafields, discounts/coupons, store, custom fields, and shipping carriers."
version: "2.0.0"
user-invocable: false
---

# TiendaNube API Sub-Skill

This skill provides TiendaNube (Nuvemshop) specific API references, payloads, and local ERP implementations. Modularized to avoid token bloat.

## References

### Core
- [Authentication](./references/auth.md)
- [Products and Inventory](./references/products-inventory.md)
- [Orders and Fulfillment](./references/orders-fulfillment.md)
- [Webhooks](./references/webhooks.md)

### Entities
- [Customers](./references/customers.md)
- [Categories](./references/categories.md)
- [Metafields](./references/metafields.md)
- [Custom Fields](./references/custom-fields.md)
- [Store](./references/store.md)

### Commerce
- [Discounts and Coupons](./references/discounts-coupons.md)
- [Shipping Carriers](./references/shipping-carriers.md)

Read the smallest reference that matches the task before looking elsewhere.