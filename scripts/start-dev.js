// scripts/start-dev.js
import { spawn } from 'child_process';
import killPort from 'kill-port';

const portsToClean = [3100, 5173];
const processes = [];

async function start() {
  // 1. Clean up ports
  console.log('Cleaning up development ports...');
  for (const port of portsToClean) {
    try {
      await killPort(port);
      console.log(`Port ${port} has been cleared.`);
    } catch (error) {
      console.log(`Port ${port} was already free.`);
    }
  }
  console.log('Ports are ready.');

  // 2. Start Backend
  console.log('Starting backend server...');
  const backend = spawn('npm', ['start'], {
    cwd: './backend',
    shell: true,
    stdio: 'pipe' // Use pipe to capture stdio
  });
  processes.push(backend);

  backend.stdout.on('data', (data) => {
    console.log(`[BACKEND] ${data.toString().trim()}`);
  });
  backend.stderr.on('data', (data) => {
    console.error(`[BACKEND ERROR] ${data.toString().trim()}`);
  });

  // Wait a few seconds for the backend to initialize
  await new Promise(resolve => setTimeout(resolve, 4000));

  // 3. Start Frontend
  console.log('Starting frontend server...');
  const frontend = spawn('npm', ['run', 'dev-vite'], { // Using a new script to avoid recursion
    shell: true,
    stdio: 'pipe'
  });
  processes.push(frontend);

  frontend.stdout.on('data', (data) => {
    console.log(`[FRONTEND] ${data.toString().trim()}`);
  });
  frontend.stderr.on('data', (data) => {
    console.error(`[FRONTEND ERROR] ${data.toString().trim()}`);
  });
}

// Graceful shutdown
function shutdown() {
  console.log('\nShutting down all processes...');
  processes.forEach(p => p.kill());
  process.exit();
}

process.on('SIGINT', shutdown); // Catches Ctrl+C
process.on('SIGTERM', shutdown);

// Before starting, I need to add a "dev-vite" script to package.json
// to avoid an infinite loop where "npm run dev" calls itself.
// I will do that in the next step.

start();