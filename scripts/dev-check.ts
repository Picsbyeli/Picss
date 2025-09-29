#!/usr/bin/env tsx

/**
 * Development Environment Checker
 * Verifies that the development environment is properly configured
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
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
    info: 'ℹ️',
    success: '✅',
    error: '❌',
    warn: '⚠️'
  };
  
  console.log(`${colors[type]}${prefix[type]} ${message}${reset}`);
}

function checkPackageJson(): boolean {
  log('Checking package.json...');
  
  const packagePath = join(rootDir, 'package.json');
  if (!existsSync(packagePath)) {
    log('package.json not found', 'error');
    return false;
  }
  
  try {
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));
    const requiredScripts = ['dev', 'build', 'start', 'check', 'db:push'];
    
    for (const script of requiredScripts) {
      if (packageJson.scripts?.[script]) {
        log(`Script "${script}" found`, 'success');
      } else {
        log(`Script "${script}" missing`, 'error');
        return false;
      }
    }
    
    return true;
  } catch (error) {
    log(`Error reading package.json: ${error}`, 'error');
    return false;
  }
}

function checkDependencies(): boolean {
  log('Checking node_modules...');
  
  const nodeModulesPath = join(rootDir, 'node_modules');
  if (!existsSync(nodeModulesPath)) {
    log('node_modules not found. Run: npm install', 'error');
    return false;
  }
  
  log('node_modules found', 'success');
  
  // Check key dependencies
  const keyDeps = ['react', 'express', 'typescript', 'vite', 'drizzle-orm'];
  for (const dep of keyDeps) {
    const depPath = join(nodeModulesPath, dep);
    if (existsSync(depPath)) {
      log(`${dep} installed`, 'success');
    } else {
      log(`${dep} missing`, 'warn');
    }
  }
  
  return true;
}

function checkEnvironment(): boolean {
  log('Checking environment configuration...');
  
  const envFile = join(rootDir, '.env');
  if (!existsSync(envFile)) {
    log('.env file not found', 'error');
    log('Create .env file from .env.example', 'info');
    return false;
  }
  
  const envContent = readFileSync(envFile, 'utf-8');
  const requiredVars = ['DATABASE_URL', 'SESSION_SECRET'];
  let allConfigured = true;
  
  for (const varName of requiredVars) {
    const line = envContent.split('\n').find(l => l.trim().startsWith(varName));
    if (!line || line.includes('=""') || line.trim() === `${varName}=`) {
      log(`${varName} not properly configured`, 'warn');
      allConfigured = false;
    } else {
      log(`${varName} configured`, 'success');
    }
  }
  
  return allConfigured;
}

function checkDatabase(): boolean {
  log('Checking database connection...');
  
  try {
    // Try to connect to database using the db module
    const dbPath = join(rootDir, 'server', 'db.ts');
    if (!existsSync(dbPath)) {
      log('Database module not found', 'error');
      return false;
    }
    
    log('Database module exists', 'success');
    log('To test connection, run: npm run db:push', 'info');
    return true;
  } catch (error) {
    log(`Database check failed: ${error}`, 'error');
    return false;
  }
}

function checkTypeScript(): boolean {
  log('Checking TypeScript configuration...');
  
  try {
    execSync('npm run check', { cwd: rootDir, stdio: 'pipe' });
    log('TypeScript check passed', 'success');
    return true;
  } catch (error) {
    log('TypeScript errors found. Run: npm run check', 'warn');
    return false;
  }
}

function checkVSCodeConfig(): boolean {
  log('Checking VS Code configuration...');
  
  const vscodeDir = join(rootDir, '.vscode');
  if (!existsSync(vscodeDir)) {
    log('.vscode directory not found', 'warn');
    return false;
  }
  
  const configFiles = ['settings.json', 'extensions.json', 'launch.json', 'tasks.json'];
  let allPresent = true;
  
  for (const file of configFiles) {
    const filePath = join(vscodeDir, file);
    if (existsSync(filePath)) {
      log(`VS Code ${file} found`, 'success');
    } else {
      log(`VS Code ${file} missing`, 'warn');
      allPresent = false;
    }
  }
  
  return allPresent;
}

async function main() {
  log('🔍 Checking development environment...');
  
  const checks = [
    { name: 'Package.json', fn: checkPackageJson },
    { name: 'Dependencies', fn: checkDependencies },
    { name: 'Environment', fn: checkEnvironment },
    { name: 'Database', fn: checkDatabase },
    { name: 'TypeScript', fn: checkTypeScript },
    { name: 'VS Code Config', fn: checkVSCodeConfig }
  ];
  
  let allPassed = true;
  
  for (const check of checks) {
    log(`\\n--- ${check.name} ---`);
    const passed = check.fn();
    if (!passed) allPassed = false;
  }
  
  log('\\n--- Summary ---');
  if (allPassed) {
    log('All checks passed! Your development environment is ready 🎉', 'success');
    log('Start development with: npm run dev', 'info');
  } else {
    log('Some checks failed. Please review the issues above', 'warn');
    log('Run this script again after fixing the issues', 'info');
  }
}

main().catch(console.error);