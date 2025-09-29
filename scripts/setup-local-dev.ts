#!/usr/bin/env tsx

/**
 * Setup Local Development
 * Configures the project for local development without Replit dependencies
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
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

function createLocalViteConfig() {
  const originalConfig = join(rootDir, 'vite.config.ts');
  const localConfig = join(rootDir, 'vite.config.local.ts');
  
  if (!existsSync(originalConfig)) {
    log('vite.config.ts not found', 'error');
    return false;
  }
  
  const originalContent = readFileSync(originalConfig, 'utf-8');
  
  // Create a local version that makes Replit dependencies optional
  const localContent = originalContent
    .replace(
      'import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";',
      '// Replit plugin import removed for local development'
    )
    .replace(
      'runtimeErrorOverlay(),',
      `// Optional Replit runtime error overlay
    ...(await (async () => {
      try {
        const plugin = await import("@replit/vite-plugin-runtime-error-modal");
        return [plugin.default()];
      } catch {
        console.info("@replit/vite-plugin-runtime-error-modal not available - using Vite's built-in error overlay");
        return [];
      }
    })()),`
    );
  
  writeFileSync(localConfig, localContent);
  log('Created vite.config.local.ts for local development', 'success');
  return true;
}

function createLocalCommands() {
  // Note: We don't modify package.json as it's a protected file
  // Instead, we provide direct commands users can run
  
  log('Local development commands prepared', 'success');
  return true;
}

function showInstructions() {
  log('\\n=== Local Development Setup Complete ===', 'success');
  log('\\nTo develop without Replit dependencies:', 'info');
  log('1. Optionally remove Replit packages:', 'info');
  log('   npm uninstall @replit/vite-plugin-runtime-error-modal @replit/vite-plugin-cartographer', 'info');
  log('\\n2. Start development with local config:', 'info');
  log('   npx vite --config vite.config.local.ts', 'info');
  log('\\n3. For building with local config:', 'info');
  log('   npx vite build --config vite.config.local.ts', 'info');
  log('\\n4. Start the server normally:', 'info');
  log('   npm run dev', 'info');
  log('\\nNote: The original vite.config.ts is unchanged for Replit compatibility', 'warn');
}

async function main() {
  log('🚀 Setting up local development environment...');
  
  // Create local vite config
  const configCreated = createLocalViteConfig();
  if (!configCreated) {
    log('Failed to create local configuration', 'error');
    process.exit(1);
  }
  
  // Prepare local commands
  createLocalCommands();
  
  showInstructions();
}

main().catch(console.error);