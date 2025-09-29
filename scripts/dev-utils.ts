#!/usr/bin/env tsx

/**
 * Development Utilities
 * Common development tasks for local development
 */

import { execSync } from 'child_process';
import { existsSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');

function log(message: string, type: 'info' | 'success' | 'error' | 'warn' = 'info') {
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    error: '\x1b[31m',
    warn: '\x1b[33m'
  };
  const reset = '\x1b[0m';
  
  const prefix = {
    info: '🔧',
    success: '✅',
    error: '❌',
    warn: '⚠️'
  };
  
  console.log(`${colors[type]}${prefix[type]} ${message}${reset}`);
}

function runCommand(command: string, allowFail = false): boolean {
  try {
    execSync(command, { cwd: rootDir, stdio: 'inherit' });
    return true;
  } catch (error) {
    if (!allowFail) {
      log(`Command failed: ${error}`, 'error');
      throw error;
    }
    return false;
  }
}

function showHelp() {
  console.log(`
🚀 Development Utilities

Usage: npx tsx scripts/dev-utils.ts <command>

Available commands:
  setup       - Run initial project setup
  check       - Check development environment  
  clean       - Clean build artifacts and caches
  reset       - Reset development environment
  db-studio   - Open database studio
  db-reset    - Reset database schema
  db-seed     - Seed database with sample data
  type-check  - Run TypeScript type checking
  lint-fix    - Fix linting issues (if ESLint configured)
  help        - Show this help message

Examples:
  npx tsx scripts/dev-utils.ts setup
  npx tsx scripts/dev-utils.ts check
  npx tsx scripts/dev-utils.ts db-studio
`);
}

async function main() {
  const command = process.argv[2];
  
  if (!command || command === 'help') {
    showHelp();
    return;
  }
  
  switch (command) {
    case 'setup':
      log('Running development setup...');
      runCommand('npx tsx scripts/dev-setup.ts');
      break;
      
    case 'check':
      log('Checking development environment...');
      runCommand('npx tsx scripts/dev-check.ts');
      break;
      
    case 'clean':
      log('Cleaning build artifacts...');
      const distPath = join(rootDir, 'dist');
      const viteCachePath = join(rootDir, 'node_modules', '.vite');
      
      if (existsSync(distPath)) {
        rmSync(distPath, { recursive: true, force: true });
        log('Removed dist directory', 'success');
      }
      if (existsSync(viteCachePath)) {
        rmSync(viteCachePath, { recursive: true, force: true });
        log('Cleared Vite cache', 'success');
      }
      log('Clean completed', 'success');
      break;
      
    case 'reset':
      log('Resetting development environment...');
      const nodeModulesPath = join(rootDir, 'node_modules');
      const distResetPath = join(rootDir, 'dist');
      
      if (existsSync(nodeModulesPath)) {
        rmSync(nodeModulesPath, { recursive: true, force: true });
        log('Removed node_modules', 'success');
      }
      if (existsSync(distResetPath)) {
        rmSync(distResetPath, { recursive: true, force: true });
        log('Removed dist', 'success');
      }
      
      runCommand('npm install');
      log('Environment reset completed', 'success');
      break;
      
    case 'db-studio':
      log('Opening database studio...');
      try {
        runCommand('npx drizzle-kit studio');
      } catch {
        log('drizzle-kit not available. Install with: npm install drizzle-kit', 'error');
      }
      break;
      
    case 'db-reset':
      log('Resetting database schema...');
      runCommand('npm run db:push');
      log('Database schema reset completed', 'success');
      break;
      
    case 'db-seed':
      log('Seeding database...');
      runCommand('npx tsx server/seed.ts');
      break;
      
    case 'type-check':
      log('Running TypeScript type check...');
      runCommand('npm run check');
      break;
      
    case 'lint-fix':
      log('Attempting to fix linting issues...');
      const lintSuccess = runCommand('npx eslint . --fix', true);
      if (!lintSuccess) {
        log('ESLint not configured or failed', 'warn');
      }
      break;
      
    default:
      log(`Unknown command: ${command}`, 'error');
      showHelp();
      process.exit(1);
  }
}

main().catch(console.error);