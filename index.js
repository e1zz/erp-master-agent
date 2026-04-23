#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const IDE_TARGETS = {
  all: ['agents', 'claude', 'vscode'],
  agents: '.agents/skills',
  antigravity: '.agents/skills',
  gemini: '.agents/skills',
  claude: '.claude/skills',
  vscode: '.github/skills',
  copilot: '.github/skills',
  github: '.github/skills'
};

function printHelp() {
  console.log(`ERP Master Agent skill installer

Usage:
  npx erp-master-agent
  npx erp-master-agent --ide claude
  npx erp-master-agent --ide vscode --ide antigravity
  npx erp-master-agent --target-dir .cursor/skills
  npx erp-master-agent --repo /path/to/project --dry-run

Options:
  --ide <name>         Install to a preset target. Repeatable.
                       Supported: all, claude, vscode, copilot, antigravity, agents, gemini, github
  --target-dir <path>  Install to an additional custom directory. Repeatable.
  --repo <path>        Repository root to install into. Defaults to the current working directory.
  --dry-run            Show planned copies without writing files.
  --help               Show this message.

Default behavior installs into all supported repo-local folders:
  .agents/skills
  .claude/skills
  .github/skills`);
}

function parseArgs(argv) {
  const parsed = {
    ide: [],
    targetDir: [],
    repo: process.cwd(),
    dryRun: false,
    help: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--help' || arg === '-h') {
      parsed.help = true;
      continue;
    }

    if (arg === '--dry-run') {
      parsed.dryRun = true;
      continue;
    }

    if (arg === '--ide' || arg === '--target') {
      const value = argv[index + 1];
      if (!value) {
        throw new Error(`${arg} requires a value.`);
      }
      parsed.ide.push(value);
      index += 1;
      continue;
    }

    if (arg === '--target-dir' || arg === '--dir') {
      const value = argv[index + 1];
      if (!value) {
        throw new Error(`${arg} requires a value.`);
      }
      parsed.targetDir.push(value);
      index += 1;
      continue;
    }

    if (arg === '--repo' || arg === '--cwd') {
      const value = argv[index + 1];
      if (!value) {
        throw new Error(`${arg} requires a value.`);
      }
      parsed.repo = path.resolve(value);
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (parsed.ide.length === 0) {
    parsed.ide.push('all');
  }

  return parsed;
}

function flattenPresetTargets(ides) {
  const resolved = new Set();

  for (const ide of ides) {
    const normalized = ide.toLowerCase();
    const target = IDE_TARGETS[normalized];

    if (!target) {
      throw new Error(`Unsupported IDE preset: ${ide}`);
    }

    if (Array.isArray(target)) {
      for (const alias of target) {
        const aliasTarget = IDE_TARGETS[alias];
        resolved.add(aliasTarget);
      }
      continue;
    }

    resolved.add(target);
  }

  return Array.from(resolved);
}

function ensureBundledSkillsDir() {
  const bundledDir = path.join(__dirname, 'skills');
  const sourceDir = path.join(__dirname, '.agents', 'skills');

  if (fs.existsSync(bundledDir)) {
    return bundledDir;
  }

  if (fs.existsSync(sourceDir)) {
    return sourceDir;
  }

  throw new Error('No bundled skills were found. Run `npm run build` before packaging or publishing.');
}

function ensureDirectory(dirPath, dryRun) {
  if (dryRun) {
    return;
  }

  fs.mkdirSync(dirPath, { recursive: true });
}

function copyDirectory(sourceDir, targetDir, dryRun) {
  ensureDirectory(targetDir, dryRun);
  const entries = fs.readdirSync(sourceDir, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(sourcePath, targetPath, dryRun);
      continue;
    }

    if (!dryRun) {
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}

function resolveInstallTargets(repoRoot, idePresets, customTargets) {
  const targets = new Set();

  for (const relativeDir of flattenPresetTargets(idePresets)) {
    targets.add(path.resolve(repoRoot, relativeDir));
  }

  for (const customTarget of customTargets) {
    targets.add(path.resolve(repoRoot, customTarget));
  }

  return Array.from(targets);
}

function formatTargetPaths(repoRoot, targets) {
  return targets.map(target => path.relative(repoRoot, target) || '.');
}

async function main() {
  let args;

  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    console.error('Run with --help to see valid options.');
    process.exit(1);
  }

  if (args.help) {
    printHelp();
    return;
  }

  const bundledSkillsDir = ensureBundledSkillsDir();
  const installTargets = resolveInstallTargets(args.repo, args.ide, args.targetDir);

  console.log(`Installing ERP Master Agent skills into ${args.repo}`);
  for (const relativeTarget of formatTargetPaths(args.repo, installTargets)) {
    console.log(`- ${relativeTarget}`);
  }

  for (const targetDir of installTargets) {
    copyDirectory(bundledSkillsDir, targetDir, args.dryRun);
  }

  if (args.dryRun) {
    console.log('Dry run complete. No files were written.');
    return;
  }

  console.log('Installation complete.');
}

main().catch(error => {
  console.error(error.message || error);
  process.exit(1);
});