#!/usr/bin/env node

/**
 * Generate Android adaptive launcher icons (coral circle + white star).
 * Requires: python3 + Pillow in .venv-icons (auto-created on first run).
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.join(__dirname, '..');
const venvPython =
  process.platform === 'win32'
    ? path.join(root, '.venv-icons', 'Scripts', 'python.exe')
    : path.join(root, '.venv-icons', 'bin', 'python3');
const script = path.join(__dirname, 'generate-adaptive-icons.py');

function ensureVenv() {
  if (fs.existsSync(venvPython)) return;
  console.log('Creating .venv-icons and installing Pillow...');
  execSync('python3 -m venv .venv-icons', { cwd: root, stdio: 'inherit' });
  execSync(`${venvPython} -m pip install pillow`, { cwd: root, stdio: 'inherit' });
}

ensureVenv();
execSync(`"${venvPython}" "${script}"`, { cwd: root, stdio: 'inherit' });
execSync('node scripts/generate-splash-screens.js', { cwd: root, stdio: 'inherit' });
