const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const frontendDir = path.join(rootDir, 'frontend');
const rootNodeModules = path.join(rootDir, 'node_modules');
const frontendNodeModules = path.join(rootDir, 'frontend', 'node_modules');
const preferredNodeModules = fs.existsSync(path.join(rootNodeModules, 'next'))
  ? rootNodeModules
  : frontendNodeModules;
const nextBin = path.join(preferredNodeModules, 'next', 'dist', 'bin', 'next');

const args = process.argv.slice(2);
const child = spawn(process.execPath, [nextBin, ...args], {
  cwd: frontendDir,
  env: {
    ...process.env,
    NODE_PATH: preferredNodeModules,
  },
  stdio: 'inherit',
  shell: false,
});

child.on('exit', (code) => {
  process.exit(code ?? 1);
});
