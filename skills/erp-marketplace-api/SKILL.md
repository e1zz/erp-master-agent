---
name: erp-marketplace-api
description: 'Understand and work on this Laravel ERP-facing marketplace integration API. Use when tracing endpoints, controllers, orchestrators, queue jobs, webhook processing, inventory/product/order/refund sync, connection and OAuth behavior, internal ERP webhook delivery, or marketplace-specific rules for Walmart, MercadoLibre, TikTok, TiendaNube, Amazon, and related integrations.'
version: "1.1.0"
argument-hint: 'Ask about endpoints, workflows, controllers, jobs, data flow, or marketplace-specific behavior'
user-invocable: true
---

# ERP Marketplace API Skill

Use this skill to map the live Laravel ERP integration surface from route to controller to orchestrator to marketplace service or queued job.

## When To Use

- Trace what an endpoint really does beyond the route definition.
- Find the owning controller, orchestrator, job, model, or marketplace service.
- Understand which `/api/*` surfaces are canonical, legacy, local-only, internal, or debug-only.
- Work safely around stock ownership, webhook processing, refund handling, OAuth, fan-out, and ERP event delivery.

## Read Order

- [Project reference](./references/project-reference.md) for the fast map and route quirks.
- [Endpoints](./references/endpoints.md) for the full route inventory from `routes/api.php`.
- [Architecture](./references/architecture.md) for controller, orchestrator, factory, job, and model ownership.
- [Invariants](./references/invariants.md) for ERP rules that marketplace-specific code must not break.

## Source Of Truth

- Trust `routes/api.php` for the public API contract. It is wired by `bootstrap/app.php`.
- Trust controllers, orchestrators, jobs, factories, services, and models under `app/` for runtime behavior.
- Treat `/api/v2/*` as canonical, `/api/payments/*` as still active, `/api/products/*` as local CRUD only, and `/api/marketplace/*` as compatibility-only.
- If controller comments or old docs disagree with `routes/api.php`, trust the route file and then verify the owning implementation.

Read the smallest reference that matches the task before opening marketplace-specific skills.