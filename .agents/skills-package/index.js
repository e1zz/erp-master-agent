#!/usr/bin/env node
const path = require('path');
const fs = require('fs-extra');
const argv = require('minimist')(process.argv.slice(2));

async function main() {
  const cwd = process.cwd();
  const target = path.join(cwd, '.agents', 'skills');
  const packagedSkills = path.join(__dirname, 'skills');

  console.log('Installing skills into', target);

  if (!fs.existsSync(packagedSkills)) {
    console.error('No bundled skills found in the package. Populate the package "skills/" folder before publishing.');
    process.exit(1);
  }

  try {
    await fs.ensureDir(target);
    await fs.copy(packagedSkills, target, { overwrite: true, errorOnExist: false });
    console.log('Skills copied to', target);
  } catch (err) {
    console.error('Failed to install skills:', err.message || err);
    process.exit(2);
  }
}

main();
