#!/usr/bin/env node
/**
 * Bumps lineHeight when it is too tight relative to fontSize (descender clipping).
 * Run: node scripts/fix-text-line-heights.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const LINE_HEIGHT_BY_FONT_SIZE = {
  10: 14,
  11: 15,
  12: 16,
  13: 18,
  14: 19,
  15: 20,
  16: 22,
  17: 23,
  18: 24,
  20: 27,
  22: 30,
  24: 32,
  26: 35,
  28: 38,
  32: 43,
  35: 48,
  42: 52,
};

function recommendedLineHeight(fontSize, currentLineHeight) {
  const target = LINE_HEIGHT_BY_FONT_SIZE[fontSize] ?? Math.round(fontSize * 1.35);
  if (currentLineHeight >= target) return currentLineHeight;
  if (currentLineHeight >= fontSize * 1.2) return currentLineHeight;
  return target;
}

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'build' || entry.name === 'dist') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (/\.(tsx|ts)$/.test(entry.name) && !full.includes('textMetrics.ts')) files.push(full);
  }
  return files;
}

function fixFile(filePath) {
  const original = fs.readFileSync(filePath, 'utf8');
  const lines = original.split('\n');
  let changed = false;
  let lastFontSize = null;

  for (let i = 0; i < lines.length; i++) {
    const fontMatch = lines[i].match(/^(\s*)fontSize:\s*(\d+),?\s*$/);
    if (fontMatch) {
      lastFontSize = Number(fontMatch[2]);
      continue;
    }

    const lhMatch = lines[i].match(/^(\s*)lineHeight:\s*(\d+),?\s*$/);
    if (lhMatch && lastFontSize != null) {
      const current = Number(lhMatch[2]);
      const next = recommendedLineHeight(lastFontSize, current);
      if (next !== current) {
        lines[i] = `${lhMatch[1]}lineHeight: ${next},`;
        changed = true;
      }
      lastFontSize = null;
      continue;
    }

    if (/^\s*\},?\s*$/.test(lines[i]) || /^\s*\w+:\s*\{/.test(lines[i])) {
      lastFontSize = null;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, lines.join('\n'));
    return true;
  }
  return false;
}

const files = walk(ROOT);
let count = 0;
for (const file of files) {
  if (fixFile(file)) {
    count++;
    console.log('fixed:', path.relative(ROOT, file));
  }
}
console.log(`Done. Updated ${count} files.`);
