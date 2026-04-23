# Auto-Activation Rules

To ensure that the AI agents automatically invoke the correct skills when users ask questions, follow these auto-activation guidelines across different IDEs and runtimes:

## 1. Description-based Triggers (Claude, Antigravity)
For AI clients that dynamically load skills based on context, the `description` field in the `SKILL.md` frontmatter is critical.
- **Rule**: Start the description with a clear "Use this to..." or "Use when..." clause.
- **Example**: `description: Use for Amazon order, fulfillment, and webhook behavior only restricted to this ERP integration.`
- If the trigger keywords are not present in the prompt or context, the skill will not auto-activate.

## 2. File-based Auto-Activation (VS Code Copilot)
VS Code Copilot supports target-specific instructions.
- **Rule**: Create scoped `*.instructions.md` files in `.github/instructions/` and use the `applyTo` YAML frontmatter (e.g., `applyTo: "src/amazon/**/*.php"`).
- When a user selects or opens a file matching the `applyTo` globs, VS Code Copilot auto-activates that context.

## 3. Directory-level Rules (Cursor / Windsurf)
Cursor relies heavily on `.cursorrules` or individual `*rules` files.
- **Rule**: If a specific subdirectory requires rigid rules (e.g., specific marketplace API payloads), place a scoped rule file within that folder, or link to the appropriate skill in the root `.cursorrules`.

## 4. Master Agent Delegation
If using a "master agent" pattern, the master prompt must explicitly list the activation conditions for its subagents to enforce automatic routing. 
- **Rule**: The master agent's `SKILL.md` should clearly state: "Delegates to [Marketplace] Order Worker if the task involves orders, fulfillment, or webhooks."