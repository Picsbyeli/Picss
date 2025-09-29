#!/usr/bin/env tsx

/**
 * Development Setup Script
 * Helps developers set up the project locally after transferring from Replit
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');

function log(message: string, type: 'info' | 'success' | 'error' | 'warn' = 'info') {
  const colors = {
    info: '\x1b[36m',    // cyan
    success: '\x1b[32m', // green
    error: '\x1b[31m',   // red
    warn: '\x1b[33m'     // yellow
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

function runCommand(command: string, description: string): boolean {
  try {
    log(`${description}...`);
    execSync(command, { cwd: rootDir, stdio: 'inherit' });
    log(`${description} completed`, 'success');
    return true;
  } catch (error) {
    log(`${description} failed`, 'error');
    return false;
  }
}

function checkPrerequisites(): boolean {
  log('Checking prerequisites...');
  
  const checks = [
    { cmd: 'node --version', name: 'Node.js' },
    { cmd: 'npm --version', name: 'npm' },
    { cmd: 'psql --version', name: 'PostgreSQL', optional: true }
  ];
  
  let allPassed = true;
  
  for (const check of checks) {
    try {
      const version = execSync(check.cmd, { encoding: 'utf-8' }).trim();
      log(`${check.name}: ${version}`, 'success');
    } catch (error) {
      if (check.optional) {
        log(`${check.name}: Not installed (optional - you can use cloud database)`, 'warn');
      } else {
        log(`${check.name}: Not installed`, 'error');
        allPassed = false;
      }
    }
  }
  
  return allPassed;
}

function checkEnvironment(): void {
  log('Checking environment configuration...');
  
  const envFile = join(rootDir, '.env');
  const envExample = join(rootDir, '.env.example');
  
  if (!existsSync(envFile)) {
    if (existsSync(envExample)) {
      log('.env file missing. Please copy .env.example to .env and configure it', 'warn');
      log('Command: cp .env.example .env', 'info');
    } else {
      log('.env and .env.example files missing', 'error');
    }
    return;
  }
  
  const envContent = readFileSync(envFile, 'utf-8');
  const requiredVars = ['DATABASE_URL', 'SESSION_SECRET'];
  
  for (const varName of requiredVars) {
    if (!envContent.includes(varName) || envContent.includes(`${varName}=""`)) {
      log(`${varName} not configured in .env`, 'warn');
    } else {
      log(`${varName} configured`, 'success');
    }
  }
}

async function main() {
  log('🚀 Starting development environment setup...');
  log('This script will help you set up the project for local development');
  
  // Check prerequisites
  if (!checkPrerequisites()) {
    log('Please install missing prerequisites and try again', 'error');
    process.exit(1);
  }
  
  // Install dependencies
  if (!runCommand('npm install', 'Installing dependencies')) {
    process.exit(1);
  }
  
  // Check environment
  checkEnvironment();
  
  // Check TypeScript
  runCommand('npm run check', 'Running TypeScript type check');
  
  log('Development setup complete! 🎉', 'success');
  log('Next steps:', 'info');
  log('1. Configure your .env file with database credentials', 'info');
  log('2. Set up your PostgreSQL database', 'info');
  log('3. Run: npm run db:push', 'info');
  log('4. Optionally seed data: npx tsx server/seed.ts', 'info');
  log('5. Start development: npm run dev', 'info');
}

main().catch(console.error);