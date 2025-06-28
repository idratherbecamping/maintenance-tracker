# Deployment Guide - Maintenance Tracker

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Your code should be pushed to GitHub
3. **Supabase Project**: Your database should be set up and configured

## Step 1: Prepare for Deployment

### 1.1 Environment Variables
You'll need to set these environment variables in Vercel:

**Required:**
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
- `SUPABASE_URL` - Same as above (for server-side)
- `SUPABASE_CONNECTION_STRING` - Your PostgreSQL connection string

**Optional (for demo mode):**
- `NEXT_PUBLIC_DEMO_MODE=true`
- `NEXT_PUBLIC_DEMO_EMAIL=demo@example.com`
- `NEXT_PUBLIC_DEMO_PASSWORD=demo123`

**Optional (for additional features):**
- `TWILIO_ACCOUNT_SID` - For SMS notifications
- `TWILIO_AUTH_TOKEN` - For SMS notifications
- `TWILIO_NUMBER` - Your Twilio phone number
- `OPENAI_API_KEY` - For AI features

### 1.2 Database Setup
Make sure you've run these SQL files in your Supabase SQL Editor:
1. `supabase/schema.sql` - Main database schema
2. `supabase/optimize-database.sql` - Performance indexes
3. `supabase/storage-setup.sql` - Storage buckets and policies
4. Any demo data files if needed

## Step 2: Deploy to Vercel

### Method 1: Vercel Dashboard (Recommended)

1. **Connect GitHub Repository**
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository

2. **Configure Build Settings**
   - Framework Preset: **Next.js**
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

3. **Add Environment Variables**
   - In the "Environment Variables" section, add all required variables
   - Copy values from your `.env.local` file
   - Make sure to set the correct environment (Production/Preview/Development)

4. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete (usually 2-3 minutes)

### Method 2: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from your project directory
vercel

# Follow the prompts:
# - Set up and deploy? [Y/n] y
# - Which scope? (select your account)
# - Link to existing project? [y/N] n
# - What's your project's name? maintenance-tracker
# - In which directory is your code located? ./
```

## Step 3: Configure Domain & Settings

### 3.1 Custom Domain (Optional)
1. Go to your project dashboard in Vercel
2. Click "Settings" → "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions

### 3.2 Environment Variables Management
1. Go to "Settings" → "Environment Variables"
2. Ensure all required variables are set for "Production"
3. Set preview/development variables if needed

### 3.3 Build & Development Settings
1. Go to "Settings" → "General"
2. Verify build settings:
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

## Step 4: Verify Deployment

### 4.1 Check Core Functionality
- [ ] Authentication (login/signup)
- [ ] Dashboard loads with correct data
- [ ] Vehicle management (CRUD operations)
- [ ] Maintenance logging works
- [ ] Image uploads work
- [ ] Analytics page loads

### 4.2 Check Demo Mode (if enabled)
- [ ] Auto-login works with demo credentials
- [ ] Demo banner appears
- [ ] All demo data is visible

### 4.3 Performance Checks
- [ ] Pages load quickly (<3 seconds)
- [ ] Images load properly
- [ ] No console errors
- [ ] Mobile responsiveness

## Step 5: Monitoring & Maintenance

### 5.1 Vercel Analytics
1. Go to your project dashboard
2. Enable "Analytics" in the sidebar
3. Monitor Core Web Vitals and performance

### 5.2 Error Monitoring
1. Check Vercel "Functions" tab for any runtime errors
2. Monitor Supabase logs for database issues
3. Set up alerts in Vercel dashboard

### 5.3 Automatic Deployments
- Every push to `main` branch will trigger a new deployment
- Preview deployments are created for pull requests
- Roll back instantly if issues arise

## Troubleshooting

### Common Issues

**Build Failures:**
- Check Node.js version (should be 18+)
- Verify all dependencies are in package.json
- Check for TypeScript errors

**Environment Variables:**
- Ensure all required variables are set in Vercel
- Check variable names match exactly
- Verify Supabase URLs and keys are correct

**Database Connection:**
- Test Supabase connection from Vercel dashboard
- Check RLS policies are properly configured
- Verify connection string format

**Performance Issues:**
- Run `supabase/optimize-database.sql`
- Check image sizes and compression
- Monitor Vercel analytics

### Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Supabase Production Checklist](https://supabase.com/docs/guides/platform/going-into-prod)

## Production Checklist

- [ ] All environment variables configured
- [ ] Database schema and policies applied
- [ ] Storage buckets and policies configured
- [ ] Performance indexes created
- [ ] Demo data populated (if using demo mode)
- [ ] Custom domain configured (optional)
- [ ] Analytics enabled
- [ ] Error monitoring set up
- [ ] Performance tested on mobile and desktop

Your Maintenance Tracker is now ready for production use! 🚀