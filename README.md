# ERP Master Agent

ERP Master Agent is an `npx`-installable skill pack for marketplace automation work. It bundles the repo’s skill definitions and copies them into the skill directory expected by the target IDE or agent runtime.

The package is designed to work from the repository root, so a user can install it into another project with a single command instead of manually copying folders.

## What Gets Installed

The bundled skills live in `.agents/skills` in this repository. When you install them into another project, the CLI copies that bundle into one or more of these workspace-local destinations:

- `.agents/skills` for Antigravity-style or other `.agents`-aware runtimes
- `.claude/skills` for Claude Code
- `.github/skills` for VS Code Copilot-style workspace customizations

You can also add a custom destination with `--target-dir` if your IDE uses a different local folder.

## Quick Start

### 1. Install into the current project

Run this from the root of the project that should receive the skills:

```bash
npx erus-master-agent
```

This installs the bundled skills into the default workspace targets.

### 2. Install for a specific IDE

Pick one or more presets when you only want a subset of the supported targets:

```bash
npx erus-master-agent --ide claude
npx erus-master-agent --ide vscode
npx erus-master-agent --ide antigravity
```

### 3. Preview before writing files

Use dry-run mode to confirm what will be written:

```bash
npx erus-master-agent --dry-run
```

### 4. Install into another repository

Point the installer at a different repo root:

```bash
npx erus-master-agent --repo /path/to/project
```

## Installation Paths

The CLI understands both presets and direct paths.

### Presets

- `all` installs to every default workspace target
- `claude` installs to `.claude/skills`
- `vscode` installs to `.github/skills`
- `copilot` installs to `.github/skills`
- `github` installs to `.github/skills`
- `antigravity` installs to `.agents/skills`
- `agents` installs to `.agents/skills`
- `gemini` installs to `.agents/skills`

### Custom target folders

If your tool uses a different workspace folder, add it explicitly:

```bash
npx erus-master-agent --target-dir .cursor/skills
```

You can repeat `--target-dir` as many times as needed.

## Full End-to-End Workflow

### For users

1. Open the project where you want the skills installed.
2. Run `npx erus-master-agent`.
3. Confirm the generated folder exists in the target workspace.
4. Restart or reload the IDE if it caches skill directories.
5. Ask the agent to use one of the installed skills by name.

### For maintainers

1. Update the source skills under `.agents/skills`.
2. Run `npm run build` to generate the distributable `skills/` folder.
3. Test the installer with `npx .` or a local tarball.
4. Publish with `npm publish` when the bundle is ready.

## Repository Layout

- `index.js` is the CLI entrypoint
- `build.js` creates the publishable `skills/` bundle from `.agents/skills`
- `package.json` defines the npm package and `npx` bin
- `README.md` documents installation and maintenance steps

## Command Reference

```bash
npx erus-master-agent
npx erus-master-agent --ide claude
npx erus-master-agent --ide vscode --ide antigravity
npx erus-master-agent --target-dir .cursor/skills
npx erus-master-agent --repo /path/to/project
npx erus-master-agent --dry-run
npx erus-master-agent --help
```

## Publishing Guide

If you want to publish this repository as an npm package, run:

```bash
npm run build
npm publish
```

The package is configured to include the root installer files and the generated `skills/` directory.

## Troubleshooting

### The installer says no bundled skills were found

That means the package could not find the generated bundle. Run `npm run build` from the repository root before packaging or publishing.

### The target folder was not created

Check that you ran the command in the correct repository root, or pass `--repo` to point at the right project.

### The wrong IDE folder was used

Pass a specific `--ide` value or use `--target-dir` to install into an exact path.

## Notes For IDEs

This package intentionally keeps the installation format simple: a folder of markdown skill definitions that the target agent runtime can discover in its expected workspace location. If an IDE uses a different folder naming convention, use `--target-dir` to adapt without changing the package itself.