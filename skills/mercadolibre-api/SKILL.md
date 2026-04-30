---
name: "mercadolibre-api"
description: "Use when you need MercadoLibre-specific API endpoint details, payloads, authentication, or local ERP implementation references. Provides modular reference files for auth, products/inventory, orders/fulfillment, and webhooks."
version: "1.0.0"
user-invocable: false
---

# MercadoLibre API Sub-Skill

This skill provides MercadoLibre-specific API references, payloads, and local ERP implementations. Modularized to avoid token bloat. Do not read the reference files unless the current task explicitly involves that specific domain.

## References

- [Authentication](./references/auth.md)
- [Products and Inventory](./references/products-inventory.md)
- [Orders and Fulfillment](./references/orders-fulfillment.md)
- [Webhooks](./references/webhooks.md)

Read the smallest reference that matches the task before looking elsewhere.