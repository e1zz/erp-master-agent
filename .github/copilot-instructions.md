# ERP Marketplace Integration

This project is a Laravel ERP integration API.

## Architecture

- Follow Controller → Orchestrator → Factory → Service → Mapper layering
- NEVER put business logic in controllers
- NEVER hardcode marketplace selection — use factories
- All database queries MUST be tenant-scoped

## Verification

- Run `php -l <file>` after every PHP change
- Run the narrowest relevant test before presenting work

## Kill Switches (NEVER bypass)

- `DISABLE_MARKETPLACE_PUSH` — global outbound kill switch
- `skipMarketplaceFanout` — prevents echo loops on marketplace-originated writes

## Skills Reference

Marketplace-specific skills are in `.github/skills/`. Read the relevant SKILL.md before working on marketplace code.

