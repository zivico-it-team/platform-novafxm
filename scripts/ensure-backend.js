const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const serverDir = path.join(rootDir, 'server');
const outLog = path.join(serverDir, 'backend.out.log');
const errLog = path.join(serverDir, 'backend.err.log');
const healthUrl = 'http://localhost:3001/api/health';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isBackendReady = async () => {
  try {
    const response = await fetch(healthUrl);
    return response.ok;
  } catch (error) {
    return false;
  }
};

const waitForBackend = async (attempts = 30) => {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (await isBackendReady()) return true;
    await wait(500);
  }

  return false;
};

const startBackend = () => {
  const stdout = fs.openSync(outLog, 'a');
  const stderr = fs.openSync(errLog, 'a');

  const child = spawn(process.execPath, ['server.js'], {
    cwd: serverDir,
    detached: true,
    stdio: ['ignore', stdout, stderr],
    windowsHide: true,
  });

  child.unref();
};

const main = async () => {
  if (await isBackendReady()) {
    console.log('Backend already running on http://localhost:3001');
    return;
  }

  console.log('Starting backend on http://localhost:3001');
  startBackend();

  if (!(await waitForBackend())) {
    console.error(`Backend did not become ready at ${healthUrl}`);
    console.error(`Check ${path.relative(rootDir, errLog)} for startup errors.`);
    process.exit(1);
  }

  console.log('Backend ready on http://localhost:3001');
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
