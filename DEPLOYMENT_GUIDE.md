# Full-Stack Deployment Guide

## Step 1: Download Project from Replit

### Option A: Download ZIP
1. In Replit, click the 3-dot menu → **Download as ZIP**
2. Extract the ZIP file on your computer

### Option B: Git Clone (if you have Replit Git enabled)
```bash
git clone https://replit.com/@yourusername/your-project-name.git
```

## Step 2: Set Up in Visual Studio Code

1. **Open VS Code**
2. **File** → **Open Folder** → Select your extracted project folder
3. **Install recommended extensions** when prompted:
   - TypeScript and JavaScript Language Features
   - Prettier - Code formatter
   - ESLint
   - Tailwind CSS IntelliSense

4. **Open terminal in VS Code** (Ctrl+` or Terminal → New Terminal)

5. **Install dependencies:**
```bash
npm install
```

## Step 3: Create GitHub Repository

1. **Create new repository on GitHub:**
   - Go to github.com
   - Click "New repository"
   - Name it (e.g., "burble-app")
   - Make it **Public** or **Private**
   - Don't initialize with README (your project already has files)

2. **Connect your local project to GitHub:**
```bash
git init
git add .
git commit -m "Initial commit from Replit"
git branch -M main
git remote add origin https://github.com/yourusername/your-repo-name.git
git push -u origin main
```

## Step 4: Environment Variables Setup

Create a `.env` file in your project root with these variables:

```env
# Database (you'll need to set up a new database)
DATABASE_URL=your_new_database_url

# Replit Object Storage (you'll need alternatives)
DEFAULT_OBJECT_STORAGE_BUCKET_ID=your_bucket_id
PRIVATE_OBJECT_DIR=private
PUBLIC_OBJECT_SEARCH_PATHS=public

# External APIs (copy from your Replit secrets)
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
YOUTUBE_API_KEY=your_youtube_api_key

# Firebase (copy from your Replit secrets)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id

# Session Secret (generate a new random string)
SESSION_SECRET=your_super_secret_session_key_here
```

**Important:** Add `.env` to your `.gitignore` file to keep secrets safe!

## Step 5: Choose Your Deployment Platform

### Option A: Vercel (Recommended for ease)

1. **Go to vercel.com** and sign up with GitHub
2. **Import your GitHub repository**
3. **Configure environment variables** in Vercel dashboard
4. **Deploy** - Vercel will build and deploy automatically

**Database Options for Vercel:**
- **Neon** (PostgreSQL) - Free tier available
- **PlanetScale** (MySQL) - Free tier available
- **Supabase** (PostgreSQL) - Free tier available

### Option B: Railway (Recommended for full features)

1. **Go to railway.app** and sign up with GitHub
2. **New Project** → **Deploy from GitHub repo**
3. **Add PostgreSQL database** (Railway provides this)
4. **Configure environment variables**
5. **Deploy**

### Option C: Render

1. **Go to render.com** and sign up with GitHub
2. **New Web Service** → Connect your GitHub repo
3. **Add PostgreSQL database** 
4. **Configure environment variables**
5. **Deploy**

## Step 6: Database Setup

### If using Neon (for Vercel):
1. Go to neon.tech → Create account
2. Create new database
3. Copy connection string to `DATABASE_URL`
4. Run migrations: `npm run db:push`

### If using Railway:
1. Railway automatically provides PostgreSQL
2. Use the `DATABASE_URL` from Railway dashboard
3. Run migrations: `npm run db:push`

## Step 7: Object Storage Setup

Since Replit's object storage won't work outside Replit, choose:

### Option A: Cloudinary (Recommended)
- Free tier: 25GB storage, 25GB bandwidth
- Easy image uploads and transformations
- Good for profile pictures

### Option B: AWS S3
- Pay-as-you-go pricing
- More complex setup
- Industry standard

### Option C: Remove file upload features temporarily
- Comment out profile picture upload functionality
- Focus on core app features first

## Step 8: Test Your Deployment

1. **Test locally first:**
```bash
npm run dev
```

2. **Build and test production:**
```bash
npm run build
npm run start
```

3. **Deploy and test online**

## Common Issues & Solutions

### Build Errors
- Make sure all environment variables are set
- Check that your database is accessible
- Verify all dependencies are installed

### Database Connection Issues
- Double-check your `DATABASE_URL`
- Ensure your database allows external connections
- Run `npm run db:push` to sync schema

### Missing Features
- Some Replit-specific features may need alternatives
- Object storage will need replacement
- Some APIs might have different rate limits

## Next Steps After Deployment

1. **Set up monitoring** (many platforms provide this)
2. **Configure custom domain** (optional)
3. **Set up backup strategies** for your database
4. **Monitor performance** and costs
5. **Set up CI/CD** for automatic deployments

---

**Need Help?** Most deployment platforms have excellent documentation and community support!