# Replit Dependencies Guide

This document explains the Replit-specific dependencies in this project and how to handle them for local development.

## Overview

The project includes two Replit-specific Vite plugins that enhance the development experience:

1. **@replit/vite-plugin-runtime-error-modal**: Provides better error overlays during development
2. **@replit/vite-plugin-cartographer**: Maps file relationships for Replit's workspace

## Current Configuration

In `vite.config.ts`:

```typescript
// Runtime error modal - loaded unconditionally
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

// Cartographer - loaded conditionally
...(process.env.NODE_ENV !== "production" &&
process.env.REPL_ID !== undefined
  ? [
      await import("@replit/vite-plugin-cartographer").then((m) =>
        m.cartographer(),
      ),
    ]
  : [])
```

## Local Development Options

### Option 1: Keep Dependencies (Recommended)

The simplest approach is to keep the Replit dependencies installed. They:
- Work fine in any development environment
- Provide useful development features
- Don't interfere with production builds
- Allow use of the standard `npm run dev` workflow

### Option 2: Remove Dependencies (Advanced - Limitations)

**Important Constraint**: The default `vite.config.ts` imports `@replit/vite-plugin-runtime-error-modal` unconditionally. This means:

- The standard `npm run dev` command requires Replit packages to be installed
- Removing packages breaks the default development workflow
- Users must use alternative configuration and commands

If you still want to remove Replit dependencies:

1. **Use the provided alternative config:**
   ```bash
   # Frontend with alternative config
   npx vite --config vite.config.local.ts
   
   # Backend separately
   NODE_ENV=development npx tsx server/index.ts
   ```

2. **Optionally uninstall packages:**
   ```bash
   npm uninstall @replit/vite-plugin-runtime-error-modal @replit/vite-plugin-cartographer
   ```

**Note**: This approach requires running frontend and backend separately, not using the integrated `npm run dev` command.

## Environment Variables

The plugins use the `REPL_ID` environment variable to detect Replit environment:
- **When `REPL_ID` is set**: Both plugins may be active
- **When `REPL_ID` is not set**: Only the runtime error modal is active

For local development, you typically won't have `REPL_ID` set, so the cartographer plugin won't load.

## Production Builds

Neither plugin affects production builds, as they're development-only tools. The build process automatically excludes development plugins.

## Troubleshooting

### Error: Cannot resolve "@replit/vite-plugin-*"

If you see import errors related to Replit plugins:

1. Ensure the packages are installed: `npm install`
2. Check that your `node_modules` is up to date
3. If you're trying to run without these packages, modify `vite.config.ts` as described above

### Plugin not loading in local development

This is expected behavior for the cartographer plugin, which only loads in Replit environment. The runtime error modal should always load.

## Alternative Error Overlays

If you remove the Replit error modal plugin, you can use other development tools:

- **Vite's built-in error overlay**: Works automatically
- **@vitejs/plugin-react-swc**: Includes enhanced error handling
- **vite-plugin-checker**: TypeScript and ESLint error overlays

## Conclusion

For most users transferring from Replit to local development, keeping the Replit dependencies is the easiest and safest option. They don't cause conflicts and provide useful development features.

Only remove them if you specifically want a Replit-free codebase and are comfortable modifying the Vite configuration.