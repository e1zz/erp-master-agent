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
// Language profile system
// ---------------------------------------------------------------------------

/**
 * Load a language profile from the profiles/ directory.
 * Returns null when no language is specified (language-agnostic mode).
 */
function loadLanguageProfile(langKey) {
  if (!langKey) return null;

  const profileDir = path.join(__dirname, 'profiles', langKey);
  const profileFile = path.join(profileDir, 'profile.json');

  if (!fs.existsSync(profileFile)) {
    const available = listAvailableProfiles();
    throw new Error(
      `Unknown language profile: "${langKey}". ` +
      `Available: ${available.join(', ')}`
    );
  }

  const profile = JSON.parse(fs.readFileSync(profileFile, 'utf8'));
  profile._dir = profileDir;
  return profile;
}

/**
 * List all available language profile names by scanning profiles/ subdirs.
 */
function listAvailableProfiles() {
  const profilesRoot = path.join(__dirname, 'profiles');
  if (!fs.existsSync(profilesRoot)) return [];
  return fs.readdirSync(profilesRoot, { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name !== '_base')
    .filter(d => fs.existsSync(path.join(profilesRoot, d.name, 'profile.json')))
    .map(d => d.name);
}

/**
 * Auto-detect the project language by looking for marker files.
 */
function detectLanguage(repoRoot) {
  const profilesRoot = path.join(__dirname, 'profiles');
  if (!fs.existsSync(profilesRoot)) return null;

  const profiles = fs.readdirSync(profilesRoot, { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name !== '_base');

  for (const dir of profiles) {
    const profileFile = path.join(profilesRoot, dir.name, 'profile.json');
    if (!fs.existsSync(profileFile)) continue;

    const profile = JSON.parse(fs.readFileSync(profileFile, 'utf8'));
    if (!profile.detect || !Array.isArray(profile.detect)) continue;

    for (const marker of profile.detect) {
      if (fs.existsSync(path.join(repoRoot, marker))) {
        return dir.name;
      }
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// CLI help
// ---------------------------------------------------------------------------

function printHelp() {
  const available = listAvailableProfiles();
  console.log(`ERP Master Agent — skill & rules installer

Usage:
  npx erp-master-agent
  npx erp-master-agent --lang php
  npx erp-master-agent --lang python --ide claude
  npx erp-master-agent --detect --ide cursor
  npx erp-master-agent --target-dir .my-agent/skills
  npx erp-master-agent --repo /path/to/project --dry-run

Options:
  --ide <name>         Install to a preset target. Repeatable.
                       Supported: all, claude, vscode, copilot, github,
                       antigravity, agents, gemini, cursor, windsurf
  --lang <name>        Language profile for framework-specific rules.
                       Available: ${available.join(', ')}
                       Omit for language-agnostic rules.
  --detect             Auto-detect language from project marker files
                       (e.g., composer.json → php, pyproject.toml → python).
  --target-dir <path>  Install skills to an additional custom directory. Repeatable.
  --repo <path>        Repository root to install into (default: cwd).
  --dry-run            Show planned copies without writing files.
  --help               Show this message.

Default behavior (no --ide flag) installs into ALL supported targets:
  .agents/skills   + .agents/rules        (Antigravity / Gemini)
  .claude/skills   + .claude/rules        (Claude Code)
  .github/skills   + .github/rules        (VS Code / GitHub Copilot)
  .cursor/skills   + .cursor/rules + .cursorrules   (Cursor)
  .windsurf/skills + .windsurf/rules + .windsurfrules (Windsurf)

Language Profiles:
  When --lang is specified, the installer overlays language-specific
  feedback sensors, architecture fitness rules, and IDE-specific
  verification commands (e.g., php -l, pytest, eslint).
  When omitted, only language-agnostic rules are installed.`);
}

// ---------------------------------------------------------------------------
// Argument parser
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const parsed = {
    ide: [],
    targetDir: [],
    repo: process.cwd(),
    lang: null,
    detect: false,
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

    if (arg === '--detect') {
      parsed.detect = true;
      continue;
    }

    if (arg === '--lang' || arg === '--language') {
      const value = argv[i + 1];
      if (!value) throw new Error(`${arg} requires a value.`);
      parsed.lang = value.toLowerCase();
      i += 1;
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
// Profile-aware rule copying
// ---------------------------------------------------------------------------

// Rules that are always language-agnostic (copied from rules/ as-is).
const AGNOSTIC_RULES = [
  'agent-behavior.md',
  'autoactivation.md',
  'coding-standards.md',
];

// Rules that have profile-specific overrides.
const PROFILED_RULES = [
  'feedback-sensors.md',
  'architecture-fitness.md',
];

/**
 * Copy rules into a target directory, using profile overrides when available.
 *
 * - AGNOSTIC_RULES are always copied from `rules/` verbatim.
 * - PROFILED_RULES are sourced from:
 *     1. `profiles/<lang>/` if a language profile is active
 *     2. `profiles/_base/`  otherwise (language-agnostic)
 *   Falls back to the original `rules/` copy if neither profile directory
 *   contains the file (backward compatibility).
 */
function copyRulesWithProfile(rulesDir, destDir, profile, dryRun) {
  ensureDir(destDir, dryRun);

  // Copy language-agnostic rules verbatim
  for (const fileName of AGNOSTIC_RULES) {
    const src = path.join(rulesDir, fileName);
    if (!fs.existsSync(src)) continue;
    if (!dryRun) {
      fs.copyFileSync(src, path.join(destDir, fileName));
    }
  }

  // Copy profiled rules from the best source
  for (const fileName of PROFILED_RULES) {
    const src = resolveProfiledFile(fileName, profile);
    if (!src) {
      // Ultimate fallback: original rules/ copy
      const fallback = path.join(rulesDir, fileName);
      if (fs.existsSync(fallback) && !dryRun) {
        fs.copyFileSync(fallback, path.join(destDir, fileName));
      }
      continue;
    }
    if (!dryRun) {
      fs.copyFileSync(src, path.join(destDir, fileName));
    }
  }
}

/**
 * Resolve the best source for a profiled rule file.
 * Returns the absolute path, or null if nothing is found.
 */
function resolveProfiledFile(fileName, profile) {
  // 1. Language-specific override
  if (profile && profile._dir) {
    const langFile = path.join(profile._dir, fileName);
    if (fs.existsSync(langFile)) return langFile;
  }

  // 2. Base (language-agnostic) version
  const baseFile = path.join(__dirname, 'profiles', '_base', fileName);
  if (fs.existsSync(baseFile)) return baseFile;

  return null;
}

// ---------------------------------------------------------------------------
// IDE-specific rule file generation
// ---------------------------------------------------------------------------

function buildMergedRulesContent(rulesDir, profile) {
  // Determine which files to merge and from where
  const sections = [];

  // Agnostic rules from the target rules dir
  for (const fileName of AGNOSTIC_RULES) {
    const filePath = path.join(rulesDir, fileName);
    if (fs.existsSync(filePath)) {
      sections.push(fs.readFileSync(filePath, 'utf8').trim());
    }
  }

  // Profiled rules from best source
  for (const fileName of PROFILED_RULES) {
    const src = resolveProfiledFile(fileName, profile);
    if (src) {
      sections.push(fs.readFileSync(src, 'utf8').trim());
    } else {
      // Fallback to what's in the target dir already
      const filePath = path.join(rulesDir, fileName);
      if (fs.existsSync(filePath)) {
        sections.push(fs.readFileSync(filePath, 'utf8').trim());
      }
    }
  }

  return sections.join('\n\n---\n\n') + '\n';
}

function generateIdeRuleFile(repoRoot, fileName, rulesDir, profile, dryRun) {
  const filePath = path.join(repoRoot, fileName);
  if (dryRun) {
    console.log(`  Would generate ${fileName}`);
    return;
  }
  const content = buildMergedRulesContent(rulesDir, profile);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`  Generated ${fileName}`);
}

// ---------------------------------------------------------------------------
// CLAUDE.md generator (for Claude Code)
// ---------------------------------------------------------------------------

function generateClaudeMd(repoRoot, rulesDir, skillsDir, profile, dryRun) {
  const filePath = path.join(repoRoot, 'CLAUDE.md');
  if (dryRun) {
    console.log('  Would generate CLAUDE.md');
    return;
  }

  // Build skill index from frontmatter
  const skillIndex = buildSkillIndex(skillsDir);

  const langLabel = profile ? profile.display : 'ERP marketplace integration';
  const lintCmd   = profile ? profile.lintCommand : 'the project linter';
  const testCmd   = profile ? profile.testCommand : 'the project test runner';

  const lines = [
    '# ERP Marketplace Integration — Agent Instructions',
    '',
    `This project is an ${langLabel} API connecting to multiple marketplaces.`,
    '',
    '## Available Skills',
    '',
    'Skills are installed in `.claude/skills/`. Read the relevant SKILL.md before working on marketplace-specific code.',
    '',
  ];

  for (const skill of skillIndex) {
    lines.push(`- **${skill.name}**: ${skill.shortDesc}`);
  }

  lines.push('');
  lines.push('## Key Rules');
  lines.push('');
  lines.push('Detailed rules are in `.claude/rules/`. The critical ones:');
  lines.push('');
  lines.push(`- Run \`${lintCmd}\` after every code change`);
  lines.push(`- Run the narrowest relevant test before presenting work`);
  lines.push('- NEVER bypass `DISABLE_MARKETPLACE_PUSH` or `skipMarketplaceFanout`');
  lines.push('- Follow Controller → Orchestrator → Factory → Service layering');
  lines.push('- All database queries MUST be tenant-scoped');
  lines.push('- Read the matching SKILL.md before modifying marketplace-specific code');
  lines.push('');
  lines.push('## Trace Order');
  lines.push('');
  lines.push('Route → Controller → Orchestrator → Factory → Service → Mapper');
  lines.push('');

  fs.writeFileSync(filePath, lines.join('\n') + '\n', 'utf8');
  console.log('  Generated CLAUDE.md');
}

// ---------------------------------------------------------------------------
// Copilot instructions generator (for VS Code / GitHub Copilot)
// ---------------------------------------------------------------------------

function generateCopilotInstructions(repoRoot, rulesDir, skillsDir, profile, dryRun) {
  const instructionsDir = path.join(repoRoot, '.github', 'instructions');
  const mainFile = path.join(repoRoot, '.github', 'copilot-instructions.md');

  if (dryRun) {
    console.log('  Would generate .github/copilot-instructions.md');
    console.log('  Would generate .github/instructions/ (scoped rules)');
    return;
  }

  ensureDir(instructionsDir, false);

  const langLabel = profile ? profile.display : 'ERP marketplace integration';
  const lintCmd   = profile ? profile.lintCommand : 'the project linter';
  const globPat   = profile ? profile.globPattern : '**/*';

  // Main copilot-instructions.md (always-on)
  const mainLines = [
    '# ERP Marketplace Integration',
    '',
    `This project is an ${langLabel} API.`,
    '',
    '## Architecture',
    '',
    '- Follow Controller → Orchestrator → Factory → Service → Mapper layering',
    '- NEVER put business logic in controllers',
    '- NEVER hardcode marketplace selection — use factories',
    '- All database queries MUST be tenant-scoped',
    '',
    '## Verification',
    '',
    `- Run \`${lintCmd}\` after every code change`,
    '- Run the narrowest relevant test before presenting work',
    '',
    '## Kill Switches (NEVER bypass)',
    '',
    '- `DISABLE_MARKETPLACE_PUSH` — global outbound kill switch',
    '- `skipMarketplaceFanout` — prevents echo loops on marketplace-originated writes',
    '',
    '## Skills Reference',
    '',
    'Marketplace-specific skills are in `.github/skills/`. Read the relevant SKILL.md before working on marketplace code.',
    '',
  ];
  fs.writeFileSync(mainFile, mainLines.join('\n') + '\n', 'utf8');

  // Scoped instruction files per marketplace
  const marketplaces = ['amazon', 'walmart', 'mercadolibre', 'tiktok', 'tiendanube', 'shopify'];
  for (const mp of marketplaces) {
    const scopedFile = path.join(instructionsDir, `${mp}.instructions.md`);
    const scopedContent = [
      '---',
      `applyTo: "**/*${mp}*/**,**/*${mp}*"`,
      '---',
      '',
      `When working on ${mp} integration code, read these skills first:`,
      '',
      `- .github/skills/${mp}-expert/SKILL.md`,
      `- .github/skills/${mp}-api/SKILL.md if it exists`,
      '',
      `Follow the constraints defined in the skill files. Do not assume parity with other marketplaces.`,
      '',
    ].join('\n');
    fs.writeFileSync(scopedFile, scopedContent, 'utf8');
  }

  console.log('  Generated .github/copilot-instructions.md');
  console.log(`  Generated .github/instructions/ (${marketplaces.length} scoped rules)`);
}

// ---------------------------------------------------------------------------
// Cursor scoped rules generator (.cursor/rules/*.mdc)
// ---------------------------------------------------------------------------

function generateCursorScopedRules(repoRoot, rulesDir, skillsDir, profile, dryRun) {
  const cursorRulesDir = path.join(repoRoot, '.cursor', 'rules');

  if (dryRun) {
    console.log('  Would generate .cursor/rules/ (scoped .mdc files)');
    return;
  }

  ensureDir(cursorRulesDir, false);

  const lintCmd  = profile ? profile.lintCommand : 'the project linter';
  const globPat  = profile ? profile.globPattern : '**/*';

  // Global always-on rule (concise)
  const globalRule = [
    '---',
    'description: "ERP marketplace integration core rules"',
    `globs: "${globPat}"`,
    'alwaysApply: true',
    '---',
    '',
    '# ERP Integration Rules',
    '',
    '- Follow Controller → Orchestrator → Factory → Service → Mapper layering',
    '- All database queries MUST be tenant-scoped',
    '- NEVER bypass `DISABLE_MARKETPLACE_PUSH` or `skipMarketplaceFanout`',
    `- Run \`${lintCmd}\` after every code change`,
    '- Run the narrowest relevant test before presenting work',
    '- Read the matching SKILL.md in `.cursor/skills/` before modifying marketplace code',
    '',
  ].join('\n');
  fs.writeFileSync(path.join(cursorRulesDir, 'erp-core.mdc'), globalRule, 'utf8');

  // Per-marketplace auto-attached rules
  const marketplaces = [
    { name: 'amazon', glob: '**/*amazon*/**,**/*Amazon*/**' },
    { name: 'walmart', glob: '**/*walmart*/**,**/*Walmart*/**' },
    { name: 'mercadolibre', glob: '**/*mercadolibre*/**,**/*MercadoLibre*/**' },
    { name: 'tiktok', glob: '**/*tiktok*/**,**/*TikTok*/**' },
    { name: 'tiendanube', glob: '**/*tiendanube*/**,**/*TiendaNube*/**,**/*nuvemshop*/**' },
    { name: 'shopify', glob: '**/*shopify*/**,**/*Shopify*/**' },
  ];

  for (const mp of marketplaces) {
    const content = [
      '---',
      `description: "Rules for ${mp.name} marketplace integration"`,
      `globs: "${mp.glob}"`,
      'alwaysApply: false',
      '---',
      '',
      `# ${mp.name.charAt(0).toUpperCase() + mp.name.slice(1)} Integration`,
      '',
      `When working on ${mp.name} code, read these skill files first:`,
      '',
      `- .cursor/skills/${mp.name}-expert/SKILL.md`,
      `- .cursor/skills/${mp.name}-api/SKILL.md (if it exists)`,
      '',
      `Do not assume parity with other marketplace integrations.`,
      `Verify the implemented flow against the skill reference before making changes.`,
      '',
    ].join('\n');
    fs.writeFileSync(path.join(cursorRulesDir, `${mp.name}.mdc`), content, 'utf8');
  }

  console.log(`  Generated .cursor/rules/ (${marketplaces.length + 1} scoped .mdc files)`);
}

// ---------------------------------------------------------------------------
// Windsurf scoped rules generator (.windsurf/rules/*.md)
// ---------------------------------------------------------------------------

function generateWindsurfScopedRules(repoRoot, rulesDir, skillsDir, profile, dryRun) {
  const wsRulesDir = path.join(repoRoot, '.windsurf', 'rules');

  if (dryRun) {
    console.log('  Would generate .windsurf/rules/ (scoped .md files)');
    return;
  }

  ensureDir(wsRulesDir, false);

  const lintCmd = profile ? profile.lintCommand : 'the project linter';

  // Global core rule (always-on)
  const globalRule = [
    '---',
    'trigger: always_on',
    'description: "ERP marketplace integration core rules"',
    '---',
    '',
    '# ERP Integration Rules',
    '',
    '- Follow Controller → Orchestrator → Factory → Service → Mapper layering',
    '- All database queries MUST be tenant-scoped',
    '- NEVER bypass `DISABLE_MARKETPLACE_PUSH` or `skipMarketplaceFanout`',
    `- Run \`${lintCmd}\` after every code change`,
    '- Run the narrowest relevant test before presenting work',
    '- Read the matching SKILL.md in `.windsurf/skills/` before modifying marketplace code',
    '',
  ].join('\n');
  fs.writeFileSync(path.join(wsRulesDir, 'erp-core.md'), globalRule, 'utf8');

  // Per-marketplace rules (model-decision activation)
  const marketplaces = ['amazon', 'walmart', 'mercadolibre', 'tiktok', 'tiendanube', 'shopify'];

  for (const mp of marketplaces) {
    const content = [
      '---',
      'trigger: model_decision',
      `description: "Activate when working on ${mp} marketplace integration code"`,
      '---',
      '',
      `# ${mp.charAt(0).toUpperCase() + mp.slice(1)} Integration`,
      '',
      `When working on ${mp} code, read these skill files first:`,
      '',
      `- .windsurf/skills/${mp}-expert/SKILL.md`,
      `- .windsurf/skills/${mp}-api/SKILL.md (if it exists)`,
      '',
      `Do not assume parity with other marketplace integrations.`,
      `Verify the implemented flow against the skill reference before making changes.`,
      '',
    ].join('\n');
    fs.writeFileSync(path.join(wsRulesDir, `${mp}.md`), content, 'utf8');
  }

  console.log(`  Generated .windsurf/rules/ (${marketplaces.length + 1} scoped .md files)`);
}

// ---------------------------------------------------------------------------
// Skill index builder (reads YAML frontmatter)
// ---------------------------------------------------------------------------

function buildSkillIndex(skillsDir) {
  const skills = [];
  for (const entry of fs.readdirSync(skillsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const skillFile = path.join(skillsDir, entry.name, 'SKILL.md');
    if (!fs.existsSync(skillFile)) continue;

    const content = fs.readFileSync(skillFile, 'utf8');
    const nameMatch = content.match(/^name:\s*["']?([^"'\n]+)["']?/m);
    const descMatch = content.match(/^description:\s*["']?([^"'\n]{1,120})/m);

    skills.push({
      name: nameMatch ? nameMatch[1].trim() : entry.name,
      shortDesc: descMatch ? descMatch[1].trim().replace(/["']$/, '') : '',
    });
  }
  return skills.sort((a, b) => a.name.localeCompare(b.name));
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

  // Resolve language profile
  let langKey = args.lang;
  if (!langKey && args.detect) {
    langKey = detectLanguage(args.repo);
    if (langKey) {
      console.log(`Detected language profile: ${langKey}`);
    } else {
      console.log('No language detected — using language-agnostic rules.');
    }
  }

  let profile = null;
  try {
    profile = loadLanguageProfile(langKey);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
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

  const profileLabel = profile ? ` (${profile.display} profile)` : ' (language-agnostic)';
  console.log(`\nInstalling ERP Master Agent into ${args.repo}${profileLabel}\n`);

  // Copy skills
  console.log('Skills targets:');
  for (const rel of resolved.skills) {
    const abs = path.resolve(args.repo, rel);
    console.log(`  ${rel}`);
    copyDir(skillsDir, abs, args.dryRun);
  }

  // Copy rules (profile-aware)
  if (rulesDir) {
    console.log('\nRules targets:');
    for (const rel of resolved.rules) {
      const abs = path.resolve(args.repo, rel);
      console.log(`  ${rel}`);
      copyRulesWithProfile(rulesDir, abs, profile, args.dryRun);
    }

    // Generate IDE-specific merged rule files (.cursorrules, .windsurfrules)
    if (Object.keys(resolved.ruleFiles).length > 0) {
      console.log('\nIDE rule files:');
      for (const [, fileName] of Object.entries(resolved.ruleFiles)) {
        generateIdeRuleFile(args.repo, fileName, rulesDir, profile, args.dryRun);
      }
    }
  }

  // Generate IDE-specific instruction and scoped rule files
  const activeIdes = new Set();
  for (const raw of args.ide) {
    const key = raw.toLowerCase();
    if (key === 'all') {
      ['agents', 'claude', 'vscode', 'cursor', 'windsurf'].forEach(k => activeIdes.add(k));
    } else {
      activeIdes.add(key);
    }
  }

  const hasIdeSpecific = activeIdes.has('claude') || activeIdes.has('vscode') ||
                         activeIdes.has('copilot') || activeIdes.has('github') ||
                         activeIdes.has('cursor') || activeIdes.has('windsurf');

  if (hasIdeSpecific && rulesDir) {
    console.log('\nIDE-specific harness files:');

    if (activeIdes.has('claude')) {
      generateClaudeMd(args.repo, rulesDir, skillsDir, profile, args.dryRun);
    }

    if (activeIdes.has('vscode') || activeIdes.has('copilot') || activeIdes.has('github')) {
      generateCopilotInstructions(args.repo, rulesDir, skillsDir, profile, args.dryRun);
    }

    if (activeIdes.has('cursor')) {
      generateCursorScopedRules(args.repo, rulesDir, skillsDir, profile, args.dryRun);
    }

    if (activeIdes.has('windsurf')) {
      generateWindsurfScopedRules(args.repo, rulesDir, skillsDir, profile, args.dryRun);
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