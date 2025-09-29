# Burble - Brain Teaser Platform

A full-stack brain teaser and word game platform featuring multiple game modes including word puzzles, emoji riddles, and interactive question games. Built with React, TypeScript, Express, and PostgreSQL.

## Features

- **Multiple Game Modes**: Burble Word Game (Wordle-style), Emoji Guess, Valentine's Game
- **User Authentication**: Secure login/register system with session management
- **Progress Tracking**: User statistics, scoring system, and leaderboards
- **AI Integration**: AI-powered content generation and hint system
- **Chrome Extension**: Companion browser extension for offline play
- **Responsive Design**: Mobile, tablet, and desktop optimized

## Prerequisites

Before setting up this project locally, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **npm** or **yarn** - Package manager (comes with Node.js)
- **PostgreSQL** - Database server [Download here](https://postgresql.org/download/)
- **Git** - Version control [Download here](https://git-scm.com/)

## Local Development Setup

### 1. Clone or Download the Project

If transferring from Replit:
- Download the project as a ZIP file from Replit's Version Control tab
- Extract to your desired local directory

If using Git:
```bash
git clone <your-repository-url>
cd burble-brain-teaser-platform
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Setup

**Option A: Local PostgreSQL**
1. Install PostgreSQL locally
2. Create a new database:
   ```sql
   CREATE DATABASE burble_dev;
   ```
3. Note your database connection details

**Option B: Cloud Database (Recommended)**
- Use Neon, Supabase, or another PostgreSQL service
- Copy the connection string

### 4. Environment Configuration

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/burble_dev"

# Session Security
SESSION_SECRET="your-very-long-random-session-secret-here"

# AI Services (Optional - for content generation and hints)
PERPLEXITY_API_KEY="your-perplexity-api-key"

# Email Services (Optional - for user verification)
EMAIL_SERVICE="gmail"
EMAIL_USER="your-email@example.com"
EMAIL_PASSWORD="your-app-password"
FRONTEND_URL="http://localhost:5000"

# Environment
NODE_ENV="development"
```

### 5. Database Schema Setup

Push the database schema:

```bash
npm run db:push
```

Optional: Seed with sample data:
```bash
npx tsx server/seed.ts
```

### 6. Start Development Server

```bash
npm run dev
```

The application will be available at:
- **Application**: http://localhost:5000 (frontend and backend on same port)
- **API Routes**: http://localhost:5000/api/*

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (frontend + backend) |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run check` | Run TypeScript type checking |
| `npm run db:push` | Push database schema changes |
| `npx drizzle-kit studio` | Open Drizzle Studio (database GUI) |

## Replit-Specific Dependencies

This project includes some Replit-specific development tools:

- `@replit/vite-plugin-runtime-error-modal`: Development error overlay (required for default setup)
- `@replit/vite-plugin-cartographer`: File mapping tool (only loads when `REPL_ID` environment variable is present)

### For Local Development

**Recommended Approach**: Keep the Replit dependencies installed. They work fine in local development and provide useful development features:

```bash
npm run dev    # Standard development workflow
```

### Alternative: Replit-Free Development (Advanced Users)

If you prefer to completely remove Replit dependencies, note that the default `vite.config.ts` requires `@replit/vite-plugin-runtime-error-modal`. For a Replit-free setup:

1. **Use the alternative configuration provided:**
   ```bash
   # Start frontend with Replit-optional config
   npx vite --config vite.config.local.ts
   
   # Start backend separately (new terminal)
   NODE_ENV=development npx tsx server/index.ts
   ```

2. **Optionally remove Replit packages:**
   ```bash
   npm uninstall @replit/vite-plugin-runtime-error-modal @replit/vite-plugin-cartographer
   ```

**Important**: The alternative approach requires running frontend and backend separately since the default unified server expects Replit packages to be available.

## VS Code Integration

This project includes VS Code configuration for optimal development:

### Recommended Extensions
The following extensions will be automatically suggested:
- Prettier (code formatting)
- Tailwind CSS IntelliSense
- ESLint (code linting)
- Path Intellisense
- Error Lens
- DotEnv support

### Debug Configuration
Use F5 or the debug panel to:
- Launch the full development server with debugging
- Set breakpoints in TypeScript files
- Debug both frontend and backend code

### Integrated Tasks
Access via `Ctrl+Shift+P` → "Tasks: Run Task":
- Start Development Server
- Build for Production
- Type Check
- Push Database Schema
- Open Database Studio (runs `npx drizzle-kit studio`)

## Project Structure

```
burble-brain-teaser-platform/
├── client/                  # React frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utilities and helpers
│   │   └── assets/         # Static assets
│   └── index.html
├── server/                  # Express backend
│   ├── routes.ts           # API routes
│   ├── storage.ts          # Database layer
│   ├── auth.ts             # Authentication logic
│   └── index.ts            # Server entry point
├── shared/                  # Shared types and schemas
│   └── schema.ts           # Database schema (Drizzle)
├── chrome-extension/        # Browser extension
├── scripts/                # Build and utility scripts
└── .vscode/                # VS Code configuration
```

## Development Workflow

### Making Changes

1. **Frontend**: Edit files in `client/src/`
   - Components auto-reload with Vite
   - TailwindCSS for styling
   - TypeScript for type safety

2. **Backend**: Edit files in `server/`
   - Server auto-restarts with tsx
   - Type-safe API routes
   - PostgreSQL with Drizzle ORM

3. **Database**: Modify `shared/schema.ts`
   - Run `npm run db:push` to apply changes
   - Use `npx drizzle-kit studio` for database GUI management

### Testing Changes

- **Frontend**: Check browser at http://localhost:5000
- **Backend**: Test API endpoints at http://localhost:5000/api
- **Database**: Use Drizzle Studio for data inspection

### Version Control

```bash
git add .
git commit -m "Your commit message"
git push origin main
```

## Troubleshooting

### Common Issues

**Port Already in Use**
```bash
# Kill process on port 5000
npx kill-port 5000
```

**Database Connection Issues**
- Verify PostgreSQL is running
- Check DATABASE_URL in .env
- Ensure database exists

**TypeScript Errors**
```bash
npm run check
```

**Dependency Issues**
```bash
rm -rf node_modules
npm install
```

**Environment Variables Not Loading**
- Ensure .env file exists in root directory
- Restart the development server after .env changes
- Check for typos in variable names

### Database Issues

**Schema Changes Not Applied**
```bash
npm run db:push
```

**View Database Contents**
```bash
npx drizzle-kit studio
```

## Deployment

### Build for Production

```bash
npm run build
```

### Environment Variables for Production

Ensure these are set in your production environment:
- `DATABASE_URL`
- `SESSION_SECRET`
- `NODE_ENV=production`

### Hosting Options

- **Vercel**: Easy deployment with PostgreSQL
- **Railway**: Full-stack hosting with database
- **Heroku**: Traditional hosting platform
- **DigitalOcean**: VPS hosting

## Chrome Extension

The project includes a Chrome extension in the `chrome-extension/` directory:

1. Open Chrome Extensions (chrome://extensions/)
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `chrome-extension/` folder

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## Support

For issues or questions:
1. Check this README
2. Review VS Code debug console
3. Check browser developer tools
4. Verify environment variables
5. Review application logs

## License

This project is licensed under the MIT License - see the LICENSE file for details.