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
// CLAUDE.md generator (for Claude Code)
// ---------------------------------------------------------------------------

function generateClaudeMd(repoRoot, rulesDir, skillsDir, dryRun) {
  const filePath = path.join(repoRoot, 'CLAUDE.md');
  if (dryRun) {
    console.log('  Would generate CLAUDE.md');
    return;
  }

  // Build skill index from frontmatter
  const skillIndex = buildSkillIndex(skillsDir);

  const lines = [
    '# ERP Marketplace Integration — Agent Instructions',
    '',
    'This project is a Laravel ERP integration API connecting to multiple marketplaces.',
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
  lines.push('- Run `php -l <file>` after every PHP change');
  lines.push('- Run the narrowest relevant test before presenting work');
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

function generateCopilotInstructions(repoRoot, rulesDir, skillsDir, dryRun) {
  const instructionsDir = path.join(repoRoot, '.github', 'instructions');
  const mainFile = path.join(repoRoot, '.github', 'copilot-instructions.md');

  if (dryRun) {
    console.log('  Would generate .github/copilot-instructions.md');
    console.log('  Would generate .github/instructions/ (scoped rules)');
    return;
  }

  ensureDir(instructionsDir, false);

  // Main copilot-instructions.md (always-on)
  const skillIndex = buildSkillIndex(skillsDir);
  const mainLines = [
    '# ERP Marketplace Integration',
    '',
    'This project is a Laravel ERP integration API.',
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
    '- Run `php -l <file>` after every PHP change',
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
  const marketplaces = ['amazon', 'walmart', 'mercadolibre', 'tiktok', 'tiendanube'];
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
  console.log('  Generated .github/instructions/ (5 scoped rules)');
}

// ---------------------------------------------------------------------------
// Cursor scoped rules generator (.cursor/rules/*.mdc)
// ---------------------------------------------------------------------------

function generateCursorScopedRules(repoRoot, rulesDir, skillsDir, dryRun) {
  const cursorRulesDir = path.join(repoRoot, '.cursor', 'rules');

  if (dryRun) {
    console.log('  Would generate .cursor/rules/ (scoped .mdc files)');
    return;
  }

  ensureDir(cursorRulesDir, false);

  // Global always-on rule (concise)
  const globalRule = [
    '---',
    'description: "ERP marketplace integration core rules"',
    'globs: "**/*.php"',
    'alwaysApply: true',
    '---',
    '',
    '# ERP Integration Rules',
    '',
    '- Follow Controller → Orchestrator → Factory → Service → Mapper layering',
    '- All database queries MUST be tenant-scoped',
    '- NEVER bypass `DISABLE_MARKETPLACE_PUSH` or `skipMarketplaceFanout`',
    '- Run `php -l <file>` after every PHP change',
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

  console.log('  Generated .cursor/rules/ (6 scoped .mdc files)');
}

// ---------------------------------------------------------------------------
// Windsurf scoped rules generator (.windsurf/rules/*.md)
// ---------------------------------------------------------------------------

function generateWindsurfScopedRules(repoRoot, rulesDir, skillsDir, dryRun) {
  const wsRulesDir = path.join(repoRoot, '.windsurf', 'rules');

  if (dryRun) {
    console.log('  Would generate .windsurf/rules/ (scoped .md files)');
    return;
  }

  ensureDir(wsRulesDir, false);

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
    '- Run `php -l <file>` after every PHP change',
    '- Run the narrowest relevant test before presenting work',
    '- Read the matching SKILL.md in `.windsurf/skills/` before modifying marketplace code',
    '',
  ].join('\n');
  fs.writeFileSync(path.join(wsRulesDir, 'erp-core.md'), globalRule, 'utf8');

  // Per-marketplace rules (model-decision activation)
  const marketplaces = ['amazon', 'walmart', 'mercadolibre', 'tiktok', 'tiendanube'];

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

  console.log('  Generated .windsurf/rules/ (6 scoped .md files)');
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

    // Generate IDE-specific merged rule files (.cursorrules, .windsurfrules)
    if (Object.keys(resolved.ruleFiles).length > 0) {
      console.log('\nIDE rule files:');
      for (const [, fileName] of Object.entries(resolved.ruleFiles)) {
        generateIdeRuleFile(args.repo, fileName, rulesDir, args.dryRun);
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
      generateClaudeMd(args.repo, rulesDir, skillsDir, args.dryRun);
    }

    if (activeIdes.has('vscode') || activeIdes.has('copilot') || activeIdes.has('github')) {
      generateCopilotInstructions(args.repo, rulesDir, skillsDir, args.dryRun);
    }

    if (activeIdes.has('cursor')) {
      generateCursorScopedRules(args.repo, rulesDir, skillsDir, args.dryRun);
    }

    if (activeIdes.has('windsurf')) {
      generateWindsurfScopedRules(args.repo, rulesDir, skillsDir, args.dryRun);
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