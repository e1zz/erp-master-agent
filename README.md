# ERP Master Agent

An `npx`-installable **agent harness** for marketplace automation with AI coding agents. It bundles domain-specific skills (Amazon, MercadoLibre, Walmart, TikTok, TiendaNube), agent behavior rules, feedback sensors, and architecture fitness guides — and installs them into whichever IDE or agent runtime you use with a single command.

Built following [harness engineering best practices](https://martinfowler.com/articles/harness-engineering.html): feedforward guides that steer agents before they act, and feedback sensors that enable self-correction after changes.

---

## What Gets Installed

| Content | Description |
|---|---|
| **Skills** (28 skill folders) | Markdown-based domain knowledge for each marketplace: API contracts, auth flows, order/inventory/webhook behavior, and a master orchestrator. Each includes YAML frontmatter for auto-discovery. |
| **Rules** (5 rule files) | Agent behavior guidelines, auto-activation triggers, coding standards, feedback sensors, and architecture fitness constraints |
| **IDE-specific files** | Generated per IDE: `CLAUDE.md`, `copilot-instructions.md`, scoped `.mdc` rules, `.cursorrules`, `.windsurfrules` |

---

## Harness Engineering Model

This project implements a structured agent harness based on the [feedforward + feedback](https://martinfowler.com/articles/harness-engineering.html#FeedforwardAndFeedback) model:

### Guides (Feedforward) — Steer Before Acting

| Guide | File |
|---|---|
| Domain knowledge per marketplace | `skills/<marketplace>-*/SKILL.md` |
| Agent behavior constraints | `rules/agent-behavior.md` |
| Auto-activation triggers | `rules/autoactivation.md` |
| Architecture boundaries | `rules/architecture-fitness.md` |
| Coding standards | `rules/coding-standards.md` |

### Sensors (Feedback) — Self-Correct After Acting

| Sensor | PHP | Node.js | Python |
|---|---|---|---|
| Syntax/Lint | `php -l` | `eslint` | `ruff` / `py_compile` |
| Scoped test execution | `php artisan test` | `jest` / `vitest` | `pytest` |
| Static analysis | `phpstan` | `tsc --noEmit` | `mypy` |
| Route verification | `php artisan route:list` | *(framework-specific)* | *(framework-specific)* |

### The Steering Loop

When a sensor catches the same issue more than twice, update the harness:

1. Add a new rule in `rules/` to prevent the issue (feedforward)
2. Add a new check in `rules/feedback-sensors.md` to catch it (feedback)
3. Run `npx erp-master-agent` to propagate the fix to all IDE targets

This is how the harness improves over time — every recurring mistake becomes a permanent guard.

---

## Quick Start

Run this from the root of your target project:

```bash
npx erp-master-agent --detect
```

This auto-detects your project's language (PHP, Python, or Node.js) and installs skills, rules, and IDE-specific harness files into **all** supported targets at once.

---

## Language Profiles

The harness supports multiple programming languages through profiles. The marketplace API knowledge is language-agnostic, but the feedback sensors and architecture constraints adapt to your stack.

| Flag | Behavior |
|---|---|
| (no flag) | Installs **language-agnostic** rules only. No framework-specific lint or test commands are generated. |
| `--detect` | Auto-detects the language based on files like `composer.json`, `package.json`, or `pyproject.toml`. |
| `--lang php` | Installs PHP/Laravel-specific architecture rules and feedback sensors. |
| `--lang python` | Installs Python-specific architecture rules and feedback sensors (`pytest`, `mypy`). |
| `--lang node` | Installs Node.js/TypeScript-specific architecture rules and feedback sensors (`jest`, `eslint`, `tsc`). |

---

## Per-IDE Setup Instructions

### Antigravity / Gemini

**Preset**: `antigravity`, `gemini`, or `agents`

```bash
npx erp-master-agent --ide antigravity
```

**What gets created:**

```
your-project/
├── .agents/
│   ├── skills/          ← 28 skill folders with SKILL.md files
│   └── rules/           ← 5 rule files (guides + sensors)
```

**How it works:** Antigravity and Gemini automatically discover skills in `.agents/skills/`. Each skill folder contains a `SKILL.md` with YAML frontmatter (`name`, `description`, `version`) that the runtime uses for progressive disclosure:

1. **Discovery** — Agent reads only `name` + `description` from frontmatter (~30 tokens per skill)
2. **Activation** — When a task matches, agent loads the full SKILL.md body
3. **Execution** — Reference sub-files (e.g., `references/auth.md`) are loaded on demand

**Verify:** Ask the agent _"What skills do you have available?"_ — it should list the ERP marketplace skills.

---

### Claude Code

**Preset**: `claude`

```bash
npx erp-master-agent --ide claude
```

**What gets created:**

```
your-project/
├── CLAUDE.md              ← Concise project instructions (<100 lines)
├── .claude/
│   ├── skills/            ← 28 skill folders with SKILL.md files
│   └── rules/             ← 5 rule files (guides + sensors)
```

**How it works:** Claude Code loads `CLAUDE.md` into every session as the highest-leverage persistent context. It's kept concise (under 100 lines) to avoid token bloat. Detailed rules are in `.claude/rules/` and loaded only when relevant. Skills in `.claude/skills/` are discovered via frontmatter descriptions.

**Best practices applied:**

- `CLAUDE.md` is auto-generated with a skill index and critical rules only
- Negative constraints ("NEVER bypass...") are used over positive preferences
- Rules are modular in `.claude/rules/` for scoped loading

**Verify:** Open Claude Code and ask _"Read the erp-marketplace-master skill"_ — it should find and display the skill content.

---

### VS Code Copilot / GitHub Copilot

**Preset**: `vscode`, `copilot`, or `github`

```bash
npx erp-master-agent --ide vscode
```

**What gets created:**

```
your-project/
├── .github/
│   ├── copilot-instructions.md           ← Always-on project instructions
│   ├── instructions/
│   │   ├── amazon.instructions.md        ← Auto-activates on Amazon files
│   │   ├── walmart.instructions.md       ← Auto-activates on Walmart files
│   │   ├── mercadolibre.instructions.md  ← Auto-activates on MercadoLibre files
│   │   ├── tiktok.instructions.md        ← Auto-activates on TikTok files
│   │   └── tiendanube.instructions.md    ← Auto-activates on TiendaNube files
│   ├── skills/                           ← 28 skill folders
│   └── rules/                            ← 5 rule files
```

**How it works:** VS Code Copilot supports two types of custom instructions:

1. **Always-on** (`copilot-instructions.md`) — loaded for every chat request in the workspace
2. **Scoped** (`instructions/*.instructions.md`) — activated only when working on files matching `applyTo` glob patterns

The installer generates both: a concise always-on file with architecture rules, plus per-marketplace scoped files that auto-activate when you open or select marketplace-specific files.

**Verify:** Open a file in Copilot Chat and check the "References" section to confirm instruction files were loaded.

---

### Cursor

**Preset**: `cursor`

```bash
npx erp-master-agent --ide cursor
```

**What gets created:**

```
your-project/
├── .cursorrules                 ← Merged rules file (all rules combined)
├── .cursor/
│   ├── rules/
│   │   ├── erp-core.mdc        ← Always-on: architecture + verification rules
│   │   ├── amazon.mdc          ← Auto-attached: triggers on Amazon files
│   │   ├── walmart.mdc         ← Auto-attached: triggers on Walmart files
│   │   ├── mercadolibre.mdc    ← Auto-attached: triggers on MercadoLibre files
│   │   ├── tiktok.mdc          ← Auto-attached: triggers on TikTok files
│   │   └── tiendanube.mdc      ← Auto-attached: triggers on TiendaNube files
│   ├── skills/                  ← 28 skill folders
│   └── rules/                   ← 5 rule files
```

**How it works:** Cursor uses a tiered rule system:

1. **Always Apply** (`erp-core.mdc`) — Loaded on every request. Kept under 200 words: architecture rules, kill switches, verification commands.
2. **Auto-Attached** (per-marketplace `.mdc`) — Triggered only when working in files matching the marketplace glob pattern. Points the agent to the relevant skill files.
3. **`.cursorrules`** — Legacy merged file. All rules combined for backward compatibility.

**Best practices applied:**

- Scoped `.mdc` files with `globs` and `alwaysApply` frontmatter
- Rules are concise — reference skill files instead of duplicating content
- Negative constraints ("NEVER bypass...") used for critical invariants

**Verify:** Open Cursor in your project — the `erp-core.mdc` rules should auto-load. Open an Amazon file and the `amazon.mdc` should activate.

---

### Windsurf

**Preset**: `windsurf`

```bash
npx erp-master-agent --ide windsurf
```

**What gets created:**

```
your-project/
├── .windsurfrules               ← Merged rules file (all rules combined)
├── .windsurf/
│   ├── rules/
│   │   ├── erp-core.md          ← Always-on: architecture + verification rules
│   │   ├── amazon.md            ← Model-decision: activates for Amazon tasks
│   │   ├── walmart.md           ← Model-decision: activates for Walmart tasks
│   │   ├── mercadolibre.md      ← Model-decision: activates for MercadoLibre tasks
│   │   ├── tiktok.md            ← Model-decision: activates for TikTok tasks
│   │   └── tiendanube.md        ← Model-decision: activates for TiendaNube tasks
│   ├── skills/                  ← 28 skill folders
│   └── rules/                   ← 5 rule files (raw copies)
```

**How it works:** Windsurf (Cascade) reads project rules from `.windsurfrules` at the project root. The installer also generates scoped rule files in `.windsurf/rules/` with activation mode frontmatter:

1. **Always On** (`erp-core.md`) — Core architecture rules, loaded on every Cascade action.
2. **Model Decision** (per-marketplace `.md`) — Cascade decides to activate based on the rule's description when the task involves that marketplace.
3. **`.windsurfrules`** — All rules merged into a single file for backward compatibility.

**Limits:** Individual rule files: max 6,000 characters. Total (global + workspace): max 12,000 characters.

**Verify:** Open Windsurf and ask about the active rules to confirm they loaded.

---

### Custom / Other IDEs

```bash
npx erp-master-agent --target-dir .my-agent/skills
```

> **Note:** `--target-dir` only installs skills (not rules or IDE-specific files). Copy `rules/` manually if needed.

---

### Multiple IDEs at Once

```bash
npx erp-master-agent --ide claude --ide cursor
npx erp-master-agent --ide all
```

---

## Preview Before Installing

```bash
npx erp-master-agent --dry-run
npx erp-master-agent --ide cursor --dry-run
```

---

## Install Into Another Project

```bash
npx erp-master-agent --repo /path/to/other-project --ide claude
```

---

## Command Reference

```bash
npx erp-master-agent                              # Language-agnostic, all IDE targets
npx erp-master-agent --detect                     # Auto-detect language, all IDE targets
npx erp-master-agent --lang php                   # Force PHP profile
npx erp-master-agent --lang python                # Force Python profile
npx erp-master-agent --lang node                  # Force Node.js profile
npx erp-master-agent --ide claude                 # Claude Code only
npx erp-master-agent --ide vscode                 # VS Code Copilot only
npx erp-master-agent --ide cursor                 # Cursor only
npx erp-master-agent --ide windsurf               # Windsurf only
npx erp-master-agent --ide antigravity            # Antigravity / Gemini only
npx erp-master-agent --ide cursor --ide claude    # Multiple IDEs
npx erp-master-agent --target-dir .custom/skills  # Custom directory
npx erp-master-agent --repo /path/to/project      # Different project root
npx erp-master-agent --dry-run                    # Preview only
npx erp-master-agent --help                       # Show help
```

---

## Repository Layout

```
erp-master-agent/
├── skills/                    ← Canonical skill definitions (28 folders)
│   ├── amazon-api/            ← API references + SKILL.md with frontmatter
│   ├── amazon-expert/         ← Marketplace coordinator agent
│   ├── amazon-order-worker/   ← Order/webhook specialist
│   ├── amazon-stock-worker/   ← Inventory/catalog specialist
│   ├── erp-marketplace-api/   ← Core ERP integration knowledge
│   ├── erp-marketplace-master/← Master orchestrator agent
│   ├── skill-auditor/         ← Skill documentation auditor
│   └── ... (17 more)
├── rules/                     ← Agent harness rules
│   ├── agent-behavior.md      ← How agents should use skills
│   ├── architecture-fitness.md← Structural boundaries & constraints
│   ├── autoactivation.md      ← How skills auto-activate per IDE
│   ├── coding-standards.md    ← Coding conventions for this project
│   └── feedback-sensors.md    ← Self-correction checks & validation
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
| **Shopify** | `shopify-api`, `shopify-expert`, `shopify-order-worker`, `shopify-stock-worker` |
| **TikTok Shop** | `tiktok-shop-api`, `tiktok-expert`, `tiktok-finance-worker`, `tiktok-order-worker`, `tiktok-stock-worker` |
| **TiendaNube** | `tiendanube-api`, `tiendanube-expert`, `tiendanube-order-worker`, `tiendanube-stock-worker` |
| **Walmart** | `walmart-api`, `walmart-expert`, `walmart-order-worker`, `walmart-stock-worker` |

### Skill Hierarchy

```
erp-marketplace-master (orchestrator)
├── amazon-expert → amazon-order-worker, amazon-stock-worker
├── mercadolibre-expert → mercadolibre-order-worker, mercadolibre-stock-worker
├── shopify-expert → shopify-order-worker, shopify-stock-worker
├── tiktok-expert → tiktok-order-worker, tiktok-stock-worker, tiktok-finance-worker
├── tiendanube-expert → tiendanube-order-worker, tiendanube-stock-worker
└── walmart-expert → walmart-order-worker, walmart-stock-worker
```

Each expert delegates to specialized workers. API skills (`*-api`) provide reference data that workers consume.

---

## Publishing

```bash
npm publish
```

No build step required — `skills/` and `rules/` are committed source.

---

## Maintaining the Harness

### Adding a new rule

1. Create a new `.md` file in `rules/`
2. Run `npx erp-master-agent` to propagate to all IDE targets
3. The CLI auto-includes it in generated `.cursorrules`, `.windsurfrules`, and `CLAUDE.md`

### Adding a new skill

1. Create a new folder in `skills/<skill-name>/`
2. Add a `SKILL.md` with proper YAML frontmatter:
   ```yaml
   ---
   name: "my-new-skill"
   description: "Use when..."
   version: "1.0.0"
   user-invocable: true
   ---
   ```
3. Use relative sibling paths to reference other skills: `../erp-marketplace-api/SKILL.md`
4. Run `npx erp-master-agent` to install

### The Steering Loop

When agents make recurring mistakes:

1. **Diagnose** — identify the pattern (wrong architecture, missing validation, etc.)
2. **Add feedforward** — create/update a rule to prevent it
3. **Add feedback** — add a sensor in `feedback-sensors.md` to catch it
4. **Propagate** — re-run the installer to update all IDE targets
5. **Verify** — test with a dry-run and confirm the agent's behavior improves

---

## Troubleshooting

### "No bundled skills found"

The `skills/` directory is missing. Ensure it exists at the repo root.

### Target folder was not created

Check you ran the command in the correct project root, or pass `--repo`.

### Wrong IDE folder was used

Pass `--ide <name>` for a specific IDE, or use `--target-dir` for a custom path.

### Skills not auto-activating

| IDE | Fix |
|---|---|
| Antigravity/Gemini/Claude | Ensure SKILL.md `description` starts with "Use for..." or "Use when..." |
| VS Code Copilot | Check `.github/instructions/*.instructions.md` have correct `applyTo` globs |
| Cursor | Check `.cursor/rules/*.mdc` have correct `globs` patterns |
| Windsurf | Verify `.windsurfrules` is under 6,000 characters |

### Paths in skills are broken

Skills use relative sibling paths (`../other-skill/SKILL.md`). If you see `../../../.agents/skills/...` paths, those are legacy — run `npx erp-master-agent` to get the fixed versions.