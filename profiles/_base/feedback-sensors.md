# Feedback Sensors

Feedback sensors observe the agent's output and provide self-correction signals. Use these after making changes to catch issues before they reach human review.

## Computational Sensors (Run After Every Change)

When modifying code in this ERP integration, always run these checks before presenting your work:

1. **Syntax check**: Run the project's linter or syntax checker on each changed file.
2. **Test suite**: Run the narrowest relevant test that covers the changed behavior.
3. **Static analysis**: If available, run the project's static analysis tool to catch type errors.
4. **Route verification**: After modifying routes or controllers, verify the endpoint is registered correctly using the project's routing tools.

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
   - Missing internal event delivery
2. **Pattern consistency**: Compare the new code against the closest existing implementation for the same pattern (e.g., compare a new order worker against an existing one).

## Steering Loop

If a feedback sensor catches the same category of error more than twice across different tasks, update this file with a new sensor rule targeting that specific error pattern. This is how the harness improves over time.
