# Auto-Activation Rules

To ensure that the AI agents automatically invoke the correct skills when users ask questions, follow these auto-activation guidelines across different IDEs and runtimes.

## 1. Description-based Triggers (Claude Code, Antigravity, Gemini)

For AI clients that dynamically load skills based on context, the `description` field in the `SKILL.md` YAML frontmatter is critical.

- **Rule**: Start the description with a clear "Use this to..." or "Use when..." clause.
- **Example**: `description: "Use for Amazon order, fulfillment, and webhook behavior only in this ERP integration."`
- If the trigger keywords are not present in the prompt or context, the skill will not auto-activate.
- The agent reads **only** the `name` and `description` at discovery time (~30 tokens per skill), then loads the full body on activation.

## 2. File-based Auto-Activation (VS Code Copilot)

VS Code Copilot supports scoped instruction files with `applyTo` glob patterns.

- **Rule**: The CLI generates scoped `*.instructions.md` files in `.github/instructions/` with `applyTo` YAML frontmatter (e.g., `applyTo: "**/*amazon*/**,**/*amazon*"`).
- When a user selects or opens a file matching the `applyTo` globs, VS Code Copilot auto-activates that marketplace context.
- The main `copilot-instructions.md` is always-on for every chat request.

## 3. Glob-based Scoped Rules (Cursor)

Cursor supports `.mdc` rule files in `.cursor/rules/` with tiered activation:

- **Always Apply** (`erp-core.mdc`): Core architecture rules loaded on every request. Keep under 200 words.
- **Auto-Attached** (per-marketplace `.mdc`): Triggered only when working in files matching the `globs` frontmatter pattern (e.g., `globs: "**/*amazon*/**,**/*Amazon*/**"`).
- **Rule**: Do not duplicate skill content in rules — point the agent to the skill file instead.

## 4. Activation Modes (Windsurf)

Windsurf supports four activation modes for rules in `.windsurf/rules/`:

- **Always On**: Rule applies to every Cascade action.
- **Manual**: Triggered by typing `@rule-name` in chat.
- **Model Decision**: Cascade decides based on the rule's description.
- **Glob**: Auto-triggers on file path matches.

## 5. Master Agent Delegation

If using a "master agent" pattern, the master prompt must explicitly list the activation conditions for its subagents.

- **Rule**: The master agent's `SKILL.md` should clearly state: "Delegates to [Marketplace] Order Worker if the task involves orders, fulfillment, or webhooks."
- The `erp-marketplace-master` skill already implements this with its `agents` frontmatter field listing all expert agents.