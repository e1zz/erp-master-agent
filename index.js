#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// IDE target definitions
// ---------------------------------------------------------------------------

const IDE_PRESETS = {
  all: ['agents', 'claude', 'vscode', 'cursor', 'windsurf'],

  // Antigravity / Gemini / generic .agents
  agents:       { skills: '.agents/skills',    rules: '.agents/rules' },
  antigravity:  { skills: '.agents/skills',    rules: '.agents/rules' },
  gemini:       { skills: '.agents/skills',    rules: '.agents/rules' },

  // Claude Code
  claude:       { skills: '.claude/skills',    rules: '.claude/rules' },

  // VS Code / GitHub Copilot
  vscode:       { skills: '.github/skills',    rules: '.github/rules' },
  copilot:      { skills: '.github/skills',    rules: '.github/rules' },
  github:       { skills: '.github/skills',    rules: '.github/rules' },

  // Cursor
  cursor:       { skills: '.cursor/skills',    rules: '.cursor/rules' },

  // Windsurf
  windsurf:     { skills: '.windsurf/skills',  rules: '.windsurf/rules' },
};

// IDE-specific rule file generation targets.
// When these presets are selected we additionally generate a single merged
// rules file in the format the IDE expects.
const IDE_RULE_FILES = {
  cursor:   '.cursorrules',
  windsurf: '.windsurfrules',
};

// ---------------------------------------------------------------------------
// CLI help
// ---------------------------------------------------------------------------

function printHelp() {
  console.log(`ERP Master Agent — skill & rules installer

Usage:
  npx erus-master-agent
  npx erus-master-agent --ide claude
  npx erus-master-agent --ide cursor --ide antigravity
  npx erus-master-agent --target-dir .my-agent/skills
  npx erus-master-agent --repo /path/to/project --dry-run

Options:
  --ide <name>         Install to a preset target. Repeatable.
                       Supported: all, claude, vscode, copilot, github,
                       antigravity, agents, gemini, cursor, windsurf
  --target-dir <path>  Install skills to an additional custom directory. Repeatable.
  --repo <path>        Repository root to install into (default: cwd).
  --dry-run            Show planned copies without writing files.
  --help               Show this message.

Default behavior (no --ide flag) installs into ALL supported targets:
  .agents/skills   + .agents/rules        (Antigravity / Gemini)
  .claude/skills   + .claude/rules        (Claude Code)
  .github/skills   + .github/rules        (VS Code / GitHub Copilot)
  .cursor/skills   + .cursor/rules + .cursorrules   (Cursor)
  .windsurf/skills + .windsurf/rules + .windsurfrules (Windsurf)`);
}

// ---------------------------------------------------------------------------
// Argument parser
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const parsed = {
    ide: [],
    targetDir: [],
    repo: process.cwd(),
    dryRun: false,
    help: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === '--help' || arg === '-h') {
      parsed.help = true;
      continue;
    }

    if (arg === '--dry-run') {
      parsed.dryRun = true;
      continue;
    }

    if (arg === '--ide' || arg === '--target') {
      const value = argv[i + 1];
      if (!value) throw new Error(`${arg} requires a value.`);
      parsed.ide.push(value);
      i += 1;
      continue;
    }

    if (arg === '--target-dir' || arg === '--dir') {
      const value = argv[i + 1];
      if (!value) throw new Error(`${arg} requires a value.`);
      parsed.targetDir.push(value);
      i += 1;
      continue;
    }

    if (arg === '--repo' || arg === '--cwd') {
      const value = argv[i + 1];
      if (!value) throw new Error(`${arg} requires a value.`);
      parsed.repo = path.resolve(value);
      i += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (parsed.ide.length === 0) {
    parsed.ide.push('all');
  }

  return parsed;
}

// ---------------------------------------------------------------------------
// IDE preset resolution
// ---------------------------------------------------------------------------

function resolvePresets(ideList) {
  const skills = new Set();
  const rules  = new Set();
  const ruleFiles = {};

  for (const raw of ideList) {
    const key = raw.toLowerCase();
    const preset = IDE_PRESETS[key];
    if (!preset) throw new Error(`Unsupported IDE preset: ${raw}`);

    if (Array.isArray(preset)) {
      // "all" — expand recursively
      const expanded = resolvePresets(preset);
      expanded.skills.forEach(s => skills.add(s));
      expanded.rules.forEach(r => rules.add(r));
      Object.assign(ruleFiles, expanded.ruleFiles);
      continue;
    }

    skills.add(preset.skills);
    rules.add(preset.rules);

    if (IDE_RULE_FILES[key]) {
      ruleFiles[key] = IDE_RULE_FILES[key];
    }
  }

  return {
    skills: Array.from(skills),
    rules:  Array.from(rules),
    ruleFiles,
  };
}

// ---------------------------------------------------------------------------
// File-system helpers
// ---------------------------------------------------------------------------

function locateBundled(subdir) {
  const candidate = path.join(__dirname, subdir);
  if (fs.existsSync(candidate)) return candidate;
  return null;
}

function ensureDir(dirPath, dryRun) {
  if (!dryRun) fs.mkdirSync(dirPath, { recursive: true });
}

function copyDir(src, dest, dryRun) {
  ensureDir(dest, dryRun);
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath  = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath, dryRun);
    } else if (!dryRun) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// ---------------------------------------------------------------------------
// IDE-specific rule file generation
// ---------------------------------------------------------------------------

function buildMergedRulesContent(rulesDir) {
  const files = fs.readdirSync(rulesDir)
    .filter(f => f.endsWith('.md'))
    .sort();

  const sections = files.map(f => {
    const content = fs.readFileSync(path.join(rulesDir, f), 'utf8').trim();
    return content;
  });

  return sections.join('\n\n---\n\n') + '\n';
}

function generateIdeRuleFile(repoRoot, fileName, rulesDir, dryRun) {
  const filePath = path.join(repoRoot, fileName);
  if (dryRun) {
    console.log(`  Would generate ${fileName}`);
    return;
  }
  const content = buildMergedRulesContent(rulesDir);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`  Generated ${fileName}`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error(err.message);
    console.error('Run with --help to see valid options.');
    process.exit(1);
  }

  if (args.help) {
    printHelp();
    return;
  }

  // Locate bundled assets
  const skillsDir = locateBundled('skills');
  if (!skillsDir) {
    throw new Error('No bundled skills found. Ensure the package contains a skills/ directory.');
  }

  const rulesDir = locateBundled('rules');

  // Resolve targets
  const resolved = resolvePresets(args.ide);

  // Add custom target dirs (skills-only)
  for (const custom of args.targetDir) {
    resolved.skills.push(custom);
  }

  console.log(`\nInstalling ERP Master Agent into ${args.repo}\n`);

  // Copy skills
  console.log('Skills targets:');
  for (const rel of resolved.skills) {
    const abs = path.resolve(args.repo, rel);
    console.log(`  ${rel}`);
    copyDir(skillsDir, abs, args.dryRun);
  }

  // Copy rules
  if (rulesDir) {
    console.log('\nRules targets:');
    for (const rel of resolved.rules) {
      const abs = path.resolve(args.repo, rel);
      console.log(`  ${rel}`);
      copyDir(rulesDir, abs, args.dryRun);
    }

    // Generate IDE-specific rule files
    if (Object.keys(resolved.ruleFiles).length > 0) {
      console.log('\nIDE rule files:');
      for (const [, fileName] of Object.entries(resolved.ruleFiles)) {
        generateIdeRuleFile(args.repo, fileName, rulesDir, args.dryRun);
      }
    }
  }

  console.log('');
  if (args.dryRun) {
    console.log('Dry run complete. No files were written.');
  } else {
    console.log('Installation complete.');
  }
}

main().catch(err => {
  console.error(err.message || err);
  process.exit(1);
});