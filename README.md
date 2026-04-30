# ERP Master Agent

An `npx`-installable skill pack for marketplace automation work with AI coding agents. It bundles domain-specific skills (Amazon, MercadoLibre, Walmart, TikTok, TiendaNube) and agent behavior rules, and installs them into whichever IDE or agent runtime you use — with a single command.

---

## What Gets Installed

| Content | Description |
|---|---|
| **Skills** (24 skill folders) | Markdown-based domain knowledge for each marketplace: API contracts, auth flows, order/inventory/webhook behavior, and a master orchestrator |
| **Rules** (3 rule files) | Agent behavior guidelines, auto-activation triggers, and coding standards |

---

## Quick Start

Run this from the root of your target project:

```bash
npx erus-master-agent
```

This installs skills and rules into **all** supported IDE targets at once. To install for a specific IDE only, see below.

---

## Per-IDE Setup Instructions

### Antigravity / Gemini

**Preset**: `antigravity`, `gemini`, or `agents`

```bash
npx erus-master-agent --ide antigravity
```

**What gets created:**

```
your-project/
├── .agents/
│   ├── skills/          ← 24 skill folders with SKILL.md files
│   └── rules/           ← agent-behavior.md, autoactivation.md, coding-standards.md
```

**How it works:** Antigravity and Gemini automatically discover skills in `.agents/skills/`. Each skill folder contains a `SKILL.md` with YAML frontmatter (`name`, `description`) that the runtime uses for auto-activation. Open your project, and the agent will see the skills listed in its available tools.

**Verify:** Ask the agent _"What skills do you have available?"_ — it should list the ERP marketplace skills.

---

### Claude Code

**Preset**: `claude`

```bash
npx erus-master-agent --ide claude
```

**What gets created:**

```
your-project/
├── .claude/
│   ├── skills/          ← 24 skill folders with SKILL.md files
│   └── rules/           ← agent-behavior.md, autoactivation.md, coding-standards.md
```

**How it works:** Claude Code reads skill definitions from `.claude/skills/`. Each `SKILL.md` starts with a description that tells Claude when to activate the skill. Claude will automatically invoke the relevant skill when you ask about marketplace integrations.

**Verify:** Open Claude Code in your project and ask _"Read the erp-marketplace-master skill"_ — it should find and display the skill content.

---

### VS Code Copilot / GitHub Copilot

**Preset**: `vscode`, `copilot`, or `github`

```bash
npx erus-master-agent --ide vscode
```

**What gets created:**

```
your-project/
├── .github/
│   ├── skills/          ← 24 skill folders with SKILL.md files
│   └── rules/           ← agent-behavior.md, autoactivation.md, coding-standards.md
```

**How it works:** VS Code Copilot supports workspace-level custom instructions. The skills are placed in `.github/skills/` where Copilot can reference them. For auto-activation based on file paths, you can also create scoped instruction files in `.github/instructions/` with `applyTo` glob patterns (e.g., `applyTo: "src/amazon/**/*.php"`).

**Optional — file-based auto-activation:**

Create `.github/instructions/amazon.instructions.md`:

```yaml
---
applyTo: "src/amazon/**/*.php"
---
```

```markdown
When working in Amazon integration files, read and follow the amazon-expert skill in .github/skills/amazon-expert/SKILL.md
```

**Verify:** Open a file in Copilot Chat and ask about a marketplace topic — reference the skill by name if needed.

---

### Cursor

**Preset**: `cursor`

```bash
npx erus-master-agent --ide cursor
```

**What gets created:**

```
your-project/
├── .cursor/
│   ├── skills/          ← 24 skill folders with SKILL.md files
│   └── rules/           ← agent-behavior.md, autoactivation.md, coding-standards.md
├── .cursorrules         ← merged rules file (auto-generated)
```

**How it works:** Cursor reads project-level rules from `.cursorrules` at the project root. The installer generates this file by merging all rule markdown files into a single document. Skills in `.cursor/skills/` can be referenced by instructing Cursor to read them.

**Tip:** Add a line to your `.cursorrules` to point Cursor at the skills:

```markdown
When working on marketplace integrations, read the relevant SKILL.md file from .cursor/skills/ before making changes.
For example, for Amazon orders: read .cursor/skills/amazon-order-worker/SKILL.md
```

**Verify:** Open Cursor in your project — the rules should auto-load. Ask _"What rules are active?"_ to confirm.

---

### Windsurf

**Preset**: `windsurf`

```bash
npx erus-master-agent --ide windsurf
```

**What gets created:**

```
your-project/
├── .windsurf/
│   ├── skills/          ← 24 skill folders with SKILL.md files
│   └── rules/           ← agent-behavior.md, autoactivation.md, coding-standards.md
├── .windsurfrules       ← merged rules file (auto-generated)
```

**How it works:** Windsurf reads project rules from `.windsurfrules` at the project root. The installer generates this file from the bundled rule definitions. Skills can be referenced in prompts or rules.

**Tip:** Add to `.windsurfrules`:

```markdown
When the user asks about marketplace API integration, read the matching skill from .windsurf/skills/<marketplace>-expert/SKILL.md before responding.
```

**Verify:** Open Windsurf and confirm the rules are loaded by asking about them.

---

### Custom / Other IDEs

If your IDE or agent runtime uses a different directory:

```bash
npx erus-master-agent --target-dir .my-agent/skills
```

You can repeat `--target-dir` as many times as needed:

```bash
npx erus-master-agent --target-dir .my-agent/skills --target-dir .another/skills
```

> **Note:** `--target-dir` only installs skills (not rules or IDE rule files). Copy the `rules/` folder manually if needed.

---

### Multiple IDEs at Once

Install for multiple IDEs in a single command:

```bash
npx erus-master-agent --ide claude --ide cursor
```

Or install everywhere:

```bash
npx erus-master-agent --ide all
```

---

## Preview Before Installing

Use dry-run mode to see what will be written without touching the filesystem:

```bash
npx erus-master-agent --dry-run
npx erus-master-agent --ide cursor --dry-run
```

---

## Install Into Another Project

Point the installer at a different repo root:

```bash
npx erus-master-agent --repo /path/to/other-project --ide claude
```

---

## Command Reference

```bash
npx erus-master-agent                              # Install to all IDE targets
npx erus-master-agent --ide claude                  # Claude Code only
npx erus-master-agent --ide vscode                  # VS Code Copilot only
npx erus-master-agent --ide cursor                  # Cursor only
npx erus-master-agent --ide windsurf                # Windsurf only
npx erus-master-agent --ide antigravity             # Antigravity / Gemini only
npx erus-master-agent --ide cursor --ide claude     # Multiple IDEs
npx erus-master-agent --target-dir .custom/skills   # Custom directory
npx erus-master-agent --repo /path/to/project       # Different project root
npx erus-master-agent --dry-run                     # Preview only
npx erus-master-agent --help                        # Show help
```

---

## Repository Layout

```
erp-master-agent/
├── skills/                    ← Canonical skill definitions (24 folders)
│   ├── amazon-api/
│   ├── amazon-expert/
│   ├── amazon-order-worker/
│   ├── amazon-stock-worker/
│   ├── erp-marketplace-api/
│   ├── erp-marketplace-master/
│   ├── mercadolibre-api/
│   ├── mercadolibre-expert/
│   ├── mercadolibre-order-worker/
│   ├── mercadolibre-stock-worker/
│   ├── skill-auditor/
│   ├── tiendanube-api/
│   ├── tiendanube-expert/
│   ├── tiendanube-order-worker/
│   ├── tiendanube-stock-worker/
│   ├── tiktok-expert/
│   ├── tiktok-finance-worker/
│   ├── tiktok-order-worker/
│   ├── tiktok-shop-api/
│   ├── tiktok-stock-worker/
│   ├── walmart-api/
│   ├── walmart-expert/
│   ├── walmart-order-worker/
│   └── walmart-stock-worker/
├── rules/                     ← Agent behavior rules
│   ├── agent-behavior.md
│   ├── autoactivation.md
│   └── coding-standards.md
├── index.js                   ← CLI entrypoint (npx bin)
├── package.json               ← npm package config
├── .gitignore
└── README.md
```

---

## Bundled Skills

| Marketplace | Skills |
|---|---|
| **ERP Core** | `erp-marketplace-api`, `erp-marketplace-master`, `skill-auditor` |
| **Amazon** | `amazon-api`, `amazon-expert`, `amazon-order-worker`, `amazon-stock-worker` |
| **MercadoLibre** | `mercadolibre-api`, `mercadolibre-expert`, `mercadolibre-order-worker`, `mercadolibre-stock-worker` |
| **TikTok Shop** | `tiktok-shop-api`, `tiktok-expert`, `tiktok-finance-worker`, `tiktok-order-worker`, `tiktok-stock-worker` |
| **TiendaNube** | `tiendanube-api`, `tiendanube-expert`, `tiendanube-order-worker`, `tiendanube-stock-worker` |
| **Walmart** | `walmart-api`, `walmart-expert`, `walmart-order-worker`, `walmart-stock-worker` |

---

## Publishing

```bash
npm publish
```

The package ships `index.js`, `skills/**`, and `rules/**` directly — no build step required.

---

## Troubleshooting

### "No bundled skills found"

The `skills/` directory is missing from the package. If you cloned the repo, ensure the `skills/` folder exists at the root.

### Target folder was not created

Check that you ran the command in the correct project root, or pass `--repo` to specify the right path.

### Wrong IDE folder was used

Pass `--ide <name>` for a specific IDE, or use `--target-dir` for an exact custom path.

### `.cursorrules` or `.windsurfrules` not generated

These are only generated when you use `--ide cursor` or `--ide windsurf` (or `--ide all`). They are not generated for `--target-dir` custom paths.

### Skills not auto-activating

- **Antigravity/Gemini/Claude**: Check that the `SKILL.md` frontmatter `description` starts with "Use for..." or "Use when..." keywords.
- **VS Code Copilot**: Create `.github/instructions/*.instructions.md` files with `applyTo` globs for file-based activation.
- **Cursor/Windsurf**: Add explicit instructions in `.cursorrules`/`.windsurfrules` to read skill files for relevant tasks.