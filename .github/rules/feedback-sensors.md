# Feedback Sensors

Feedback sensors observe the agent's output and provide self-correction signals. Use these after making changes to catch issues before they reach human review.

## Computational Sensors (Run After Every Change)

When modifying PHP/Laravel code in this ERP integration, always run these checks before presenting your work:

1. **Syntax check**: `php -l <modified-file>` on each changed file.
2. **Test suite**: `php artisan test --filter=<relevant-test>` for the narrowest test that covers the changed behavior.
3. **Static analysis**: If available, run `./vendor/bin/phpstan analyse <modified-file>` to catch type errors.
4. **Route verification**: After modifying routes or controllers, run `php artisan route:list --path=<endpoint-prefix>` to confirm the endpoint is registered correctly.

## Self-Correction Protocol

When a sensor reports an error:

1. **DO NOT** present the error to the user and ask what to do. Fix it yourself first.
2. Read the full error message — it contains the correction hint.
3. Apply the fix, then re-run the sensor to confirm the fix worked.
4. Only escalate to the user if the error persists after two self-correction attempts.

## Inferential Sensors (Run on Significant Changes)

For larger changes (new endpoints, new marketplace integrations, structural refactors):

1. **Diff review**: Before committing, review the full diff and check for:
   - Unintended side effects on other marketplace flows
   - Missing `skipMarketplaceFanout` on marketplace-originated writes
   - Broken `DISABLE_MARKETPLACE_PUSH` kill-switch paths
   - Missing internal event delivery (`InternalEvent`)
2. **Pattern consistency**: Compare the new code against the closest existing implementation for the same pattern (e.g., compare a new order worker against an existing one).

## Validation Commands Quick Reference

| Domain | Command |
|---|---|
| Syntax | `php -l app/path/to/File.php` |
| Tests (scoped) | `php artisan test --filter=OrderOrchestratorTest` |
| Tests (full) | `php artisan test` |
| Static analysis | `./vendor/bin/phpstan analyse app/` |
| Routes | `php artisan route:list --path=api/v2` |
| Queue check | `php artisan queue:work --once` |
| Config cache | `php artisan config:clear` |

## Steering Loop

If a feedback sensor catches the same category of error more than twice across different tasks, update this file with a new sensor rule targeting that specific error pattern. This is how the harness improves over time.
