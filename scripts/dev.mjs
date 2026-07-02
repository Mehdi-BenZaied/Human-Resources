/**
 * Convenience dev script — starts backend (ts-node-dev) and frontend (ng serve) concurrently.
 *
 * Usage (from repo root):
 *   node scripts/dev.mjs
 *
 * Requirements: both `backend/` and `frontend/` must have their node_modules installed.
 *   cd backend  && npm install
 *   cd frontend && npm install
 */

import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const isWin = process.platform === 'win32';
const npm = isWin ? 'npm.cmd' : 'npm';

const colors = { reset: '\x1b[0m', cyan: '\x1b[36m', yellow: '\x1b[33m' };

function prefix(name, color) {
  return (data) => {
    const lines = data.toString().trimEnd().split('\n');
    lines.forEach((line) => console.log(`${color}[${name}]${colors.reset} ${line}`));
  };
}

const backend = spawn(npm, ['run', 'dev'], {
  cwd: resolve(root, 'backend'),
  shell: false,
});

const frontend = spawn(npm, ['start'], {
  cwd: resolve(root, 'frontend'),
  shell: false,
});

backend.stdout.on('data', prefix('backend', colors.cyan));
backend.stderr.on('data', prefix('backend', colors.cyan));
frontend.stdout.on('data', prefix('frontend', colors.yellow));
frontend.stderr.on('data', prefix('frontend', colors.yellow));

function shutdown(code) {
  if (!backend.killed) backend.kill();
  if (!frontend.killed) frontend.kill();
  process.exit(code ?? 0);
}

backend.on('exit', (code) => shutdown(code ?? 0));
frontend.on('exit', (code) => shutdown(code ?? 0));
process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

console.log('Starting backend (port 4000) and frontend (port 4200)…');
console.log('Press Ctrl+C to stop both.\n');
