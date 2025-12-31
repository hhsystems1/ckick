# Rivryn Deployment Checklist

A production-ready deployment checklist for Rivryn.

## Prerequisites

- [ ] Node.js 20+ installed
- [ ] npm or pnpm package manager
- [ ] Supabase account
- [ ] Netlify account
- [ ] Upstash Redis account (for rate limiting)

## Environment Setup

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd rivryn
npm install
```

### 2. Configure Environment Variables

Copy the example environment file and fill in your values:

```bash
cp .env.example .env.local
```

Required environment variables:

```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Upstash Redis (Required for rate limiting)
UPSTASH_REDIS_REST_URL=your-upstash-redis-url
UPSTASH_REDIS_REST_TOKEN=your-upstash-redis-token

# Telemetry (Optional)
POSTHOG_API_KEY=your-posthog-api-key
SENTRY_DSN=your-sentry-dsn

# AI Providers (Configure via UI or these env vars)
GROQ_API_KEY=
CLAUDE_API_KEY=
OPENAI_API_KEY=
MINIMAX_API_KEY=
```

### 3. Database Setup

#### Run Migration in Supabase Dashboard

1. Go to your Supabase project → SQL Editor
2. Copy contents of `supabase-migration.sql`
3. Paste and run the SQL

#### Verify Database Tables

After running the migration, verify these tables exist:

- [ ] `projects`
- [ ] `files`
- [ ] `agent_changes`
- [ ] `user_settings`

### 4. Configure Supabase Settings

1. **Authentication**: Enable email/password auth in Supabase
2. **API Keys**: Ensure anon key has correct permissions
3. **CORS**: Add your Netlify domain to Supabase allowed origins (see CORS section below)

## Netlify Deployment

### 1. Deploy via Netlify Dashboard (Recommended)

1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Click **"Add new site"** → **"Import an existing project"**
3. Connect your GitHub repository
4. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
5. Click **"Deploy site"**

### 2. Deploy via CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Initial deploy (creates preview URL)
netlify deploy

# Deploy to production
netlify deploy --prod
```

### 3. Configure Environment Variables in Netlify

After initial deployment, add environment variables in Netlify Dashboard:

1. Go to **Site Settings** → **Environment variables**
2. Add each variable from `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
   - (Optional) `POSTHOG_API_KEY`, `SENTRY_DSN`
3. Trigger a new deploy from **Deploys** tab

### 4. Configure Redirects for API Routes

The `netlify.toml` file in your repository root handles API route redirects. Ensure it's committed to your repository.

## Build Verification

Before deploying, verify the build works locally:

```bash
npm run build
npm run lint
```

## Post-Deployment Verification

### 1. Smoke Test

1. Open your deployed application
2. Sign up/in with a test account
3. Create a new project
4. Verify files are created
5. Test the AI Agent (if configured)

### 2. Check Logs

- [ ] Netlify function logs show no errors
- [ ] Supabase logs show successful queries
- [ ] No rate limiting errors (check response headers)

## Rate Limiting Configuration

Rate limits are configured per user via Upstash Redis:

| Endpoint | Limit | Window |
|----------|-------|--------|
| Agent requests | 10 | 1 minute |
| Project creation | 5 | 1 minute |
| File operations | 60 | 1 minute |
| Settings updates | 30 | 1 minute |

## Troubleshooting

### Build Fails

```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### API Routes Not Working

1. Verify `netlify.toml` is in repository root
2. Check Netlify function logs in Dashboard
3. Ensure environment variables are set

### Database Connection Issues

1. Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
2. Check Supabase project status
3. Ensure Netlify domain is in Supabase allowed origins

### Rate Limiting Errors

1. Verify Upstash Redis credentials
2. Check Redis is active in Upstash console
3. Ensure environment variables are set in Netlify

### Auth Errors

1. Verify Supabase URL and anon key
2. Check RLS policies are applied in Supabase
3. Clear browser cookies and retry

## Rollback Procedure

If issues occur:

1. **Database**: No migration changes needed for code rollbacks
2. **Code**: Use Netlify to deploy a previous version
   - Go to **Deploys** in Netlify Dashboard
   - Click on a previous successful deploy
   - Click **"Deploy this version"**
3. **Environment**: Restore previous environment variables

## Monitoring

### Recommended Services

- **PostHog**: Track user events and product analytics
- **Sentry**: Monitor and track errors
- **Upstash Console**: Monitor Redis usage and rate limits

### Key Metrics to Watch

- [ ] Error rate < 1%
- [ ] Response time < 500ms
- [ ] Rate limit violations < 5% of requests
- [ ] Database query time < 100ms

## Security Checklist

- [ ] Service role key never exposed to client (only use anon key in client)
- [ ] API keys stored in environment variables
- [ ] RLS policies enabled on all Supabase tables
- [ ] Rate limiting enabled via Upstash Redis
- [ ] Payload limits enforced on API routes
- [ ] Input sanitization implemented
- [ ] Netlify domain added to Supabase allowed origins

## Supabase + Netlify CORS Setup

Add your Netlify domain to Supabase allowed origins:

1. Go to Supabase Dashboard → **Settings** → **API**
2. Find **"CORS"** or **"Allowed Origins"**
3. Add your Netlify URL:
   - `https://your-site-name.netlify.app`
   - For local testing: `http://localhost:3000`
4. Save changes

## Custom Domains (Optional)

To use a custom domain:

1. Go to **Domain Management** in Netlify Dashboard
2. Click **"Add custom domain"**
3. Follow instructions to configure DNS
4. Update Supabase CORS with your custom domain

## Support

For issues:
1. Check Netlify deploy logs in Dashboard
2. Check browser console for errors
3. Review Supabase query logs
4. Check rate limit headers in API responses
