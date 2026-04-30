# ERP Marketplace Integration — Agent Instructions

This project is a Laravel ERP integration API connecting to multiple marketplaces.

## Available Skills

Skills are installed in `.claude/skills/`. Read the relevant SKILL.md before working on marketplace-specific code.

- **amazon-api**: Use when you need Amazon SP-API specific endpoint details, payloads, authentication, or local ERP implementation referen
- **amazon-expert**: Use for Amazon marketplace coordination inside this ERP integration when a task needs Amazon auth or header requirements
- **amazon-order-worker**: Use for Amazon order, fulfillment, notification, and webhook-equivalent behavior only in this ERP integration, including
- **amazon-stock-worker**: Use for Amazon inventory and catalog endpoint details only in this ERP integration, including Listings Items availabilit
- **erp-marketplace-api**: Understand and work on this Laravel ERP-facing marketplace integration API. Use when tracing endpoints, controllers, orc
- **erp-marketplace-master**: Use as the master agent for this Laravel ERP marketplace integration API when a task needs ERP rules, multi-tenant appli
- **mercadolibre-api**: Use when you need MercadoLibre-specific API endpoint details, payloads, authentication, or local ERP implementation refe
- **mercadolibre-expert**: Use for MercadoLibre marketplace coordination inside this ERP integration when a task needs seller_custom_field SKU rule
- **mercadolibre-order-worker**: Use for MercadoLibre order, payment-adjacent, and webhook behavior only in this ERP integration, including order payload
- **mercadolibre-stock-worker**: Use for MercadoLibre inventory and catalog endpoint details only in this ERP integration, including item and variation s
- **skill-auditor**: Standalone utility agent to audit, verify, and update marketplace API skill reference files (the installed skills direct
- **tiendanube-api**: Use when you need TiendaNube (Nuvemshop) specific API endpoint details, payloads, authentication, or local ERP implement
- **tiendanube-expert**: Use for TiendaNube or Nuvemshop marketplace coordination inside this ERP integration when a task needs OAuth or store-re
- **tiendanube-order-worker**: Use for TiendaNube or Nuvemshop order, fulfillment, and webhook behavior only in this ERP integration, including order p
- **tiendanube-stock-worker**: Use for TiendaNube or Nuvemshop inventory and catalog endpoint details only in this ERP integration, including variant s
- **tiktok-expert**: Use for TikTok Shop marketplace coordination inside this ERP integration when a task needs OAuth or signature context, o
- **tiktok-finance-worker**: Use for TikTok Shop financial, payout, statement, and settlement behavior only in this ERP integration. Handles how mone
- **tiktok-order-worker**: Use for TikTok Shop order, fulfillment, cancellation-request, and webhook behavior only in this ERP integration, includi
- **tiktok-shop-api**: Documentation and structural reference for the TikTok Shop Open Platform API (TTS API) v202309. Use when integrating wit
- **tiktok-stock-worker**: Use for TikTok Shop inventory and catalog endpoint details only in this ERP integration, including product search pagina
- **walmart-api**: Use when you need Walmart Marketplace API specific endpoint details, payloads, authentication, or local ERP implementati
- **walmart-expert**: Use for Walmart API behavior in this ERP integration when a task needs auth and header coordination, webhook administrat
- **walmart-order-worker**: Use for Walmart order, fulfillment, shipping, and webhook administration behavior only in this ERP integration, includin
- **walmart-stock-worker**: Use for Walmart inventory and catalog endpoint details only in this ERP integration, including inventory updates, item/p

## Key Rules

Detailed rules are in `.claude/rules/`. The critical ones:

- Run `php -l <file>` after every PHP change
- Run the narrowest relevant test before presenting work
- NEVER bypass `DISABLE_MARKETPLACE_PUSH` or `skipMarketplaceFanout`
- Follow Controller → Orchestrator → Factory → Service layering
- All database queries MUST be tenant-scoped
- Read the matching SKILL.md before modifying marketplace-specific code

## Trace Order

Route → Controller → Orchestrator → Factory → Service → Mapper

