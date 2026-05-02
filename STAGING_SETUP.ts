/**
 * STAGING ENVIRONMENT SETUP GUIDE
 * 
 * This document outlines steps to create a separate staging environment
 * for testing before production deployment.
 * 
 * Staging mirrors production but with isolated databases and deployments.
 */

// ============================================================================
// PART 1: SUPABASE STAGING PROJECT
// ============================================================================
// 
// Steps to create:
// 1. Go to https://supabase.com/dashboard
// 2. Create new project named "ocupaloc-staging"
// 3. Select same region as production (eu-central-1)
// 4. Generate strong password
// 5. Wait for project to initialize (5-10 minutes)
// 6. Note the Staging Project ID: (will be shown in dashboard)
// 
// Post-creation:
// 7. Go to Project Settings → API → Copy these:
//    - SUPABASE_STAGING_URL (e.g., https://xxxxx-staging.supabase.co)
//    - SUPABASE_STAGING_ANON_KEY
//    - SUPABASE_STAGING_SERVICE_ROLE_KEY
// 
// 8. Database setup:
//    a. In Supabase Dashboard → SQL Editor
//    b. Run the same schema.sql from production
//       (Copy from your local schema.sql file)
//    c. Enable Row-Level Security on all tables
//    d. Copy RLS policies from production

// ============================================================================
// PART 2: VERCEL STAGING DEPLOYMENT  
// ============================================================================
//
// Steps to create:
// 1. Go to https://vercel.com/dashboard
// 2. Click "Add New..." → Project
// 3. Import from GitHub → Select "ocupaloc" repository
// 4. Configure:
//    - Project name: "ocupaloc-staging"
//    - Framework: Next.js
//    - Root directory: ./ (default)
// 5. Environment Variables:
//    (Copy from production .env files, but update to staging URLs)

// ============================================================================
// PART 3: ENVIRONMENT VARIABLES FOR STAGING
// ============================================================================

const stagingEnvExample = {
  // Supabase Staging
  NEXT_PUBLIC_SUPABASE_URL: "https://[STAGING-PROJECT-ID].supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "[STAGING_ANON_KEY]",
  SUPABASE_SERVICE_ROLE_KEY: "[STAGING_SERVICE_ROLE_KEY]",
  SUPABASE_DB_URL: "postgresql://postgres.[PROJECT_ID]:PASSWORD@aws-0-eu-central-1.pooler.supabase.com:6543/postgres",

  // Same as production (or create staging equivalents)
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "[from production]",
  STRIPE_SECRET_KEY: "[staging-specific or production]",
  STRIPE_WEBHOOK_SECRET: "[staging-specific or production]",
  STRIPE_PRICE_ID: "[from production]",

  RESEND_API_KEY: "[from production or staging Resend account]",

  // Cron secrets (same as production)
  RELEASE_GUARD_SECRET: "[from production]",
  REMINDERS_CRON_SECRET: "[from production]",
  SLO_READ_SECRET: "[from production]",
  SYNTHETIC_MONITOR_SECRET: "[from production]",

  // Auth
  PLAYWRIGHT_LOGIN_EMAIL: "[staging test account]",
  PLAYWRIGHT_LOGIN_PASSWORD: "[staging test account password]",

  // Vercel-specific
  NODE_ENV: "production"
};

// ============================================================================
// PART 4: GITHUB ACTIONS WORKFLOW FOR STAGING DEPLOYMENT
// ============================================================================
// 
// Create .github/workflows/deploy-staging.yml with:

const stagingWorkflowYaml = `
name: Deploy to Staging

on:
  push:
    branches:
      - staging
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm run test:ci
        
      - name: Build
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: \${{ secrets.STAGING_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: \${{ secrets.STAGING_SUPABASE_ANON_KEY }}
          SUPABASE_SERVICE_ROLE_KEY: \${{ secrets.STAGING_SUPABASE_SERVICE_ROLE_KEY }}
      
      - name: Deploy to Vercel Staging
        run: |
          npx vercel deploy \\
            --project-id=\${{ secrets.VERCEL_STAGING_PROJECT_ID }} \\
            --token=\${{ secrets.VERCEL_TOKEN }}
`;

// ============================================================================
// PART 5: DATABASE SCHEMA MIGRATION TO STAGING
// ============================================================================
//
// Option A: Manual via Supabase Dashboard
// 1. Go to staging Supabase project
// 2. SQL Editor → Create Query
// 3. Paste contents of schema.sql
// 4. Execute
//
// Option B: Using Supabase CLI (automated)
// npx supabase db push --project-ref [STAGING_PROJECT_ID] --password [PASSWORD]

// ============================================================================
// PART 6: TESTING STAGING ENVIRONMENT
// ============================================================================
//
// Checklist before using staging:
// ✓ Database schema migrated
// ✓ Environment variables set in Vercel
// ✓ GitHub secrets added for staging
// ✓ Application builds successfully
// ✓ Auth flow works (Supabase Auth)
// ✓ Cron jobs can send requests (test webhook)
// ✓ Stripe webhooks point to staging URL
// ✓ E2E tests pass on staging
//
// Run tests:
// PLAYWRIGHT_BASE_URL=https://ocupaloc-staging.vercel.app npm run test:e2e

// ============================================================================
// PART 7: SECRETS TO ADD IN GITHUB & VERCEL
// ============================================================================
//
// GitHub Repository Secrets (Settings → Secrets → Actions):
// - STAGING_SUPABASE_URL
// - STAGING_SUPABASE_ANON_KEY
// - STAGING_SUPABASE_SERVICE_ROLE_KEY
// - VERCEL_STAGING_PROJECT_ID
// - VERCEL_TOKEN (reuse production token)
//
// Vercel Project Environment Variables:
// - NEXT_PUBLIC_SUPABASE_URL (staging)
// - NEXT_PUBLIC_SUPABASE_ANON_KEY (staging)
// - SUPABASE_SERVICE_ROLE_KEY (staging)
// - Plus all other required secrets

// ============================================================================
// PART 8: GIT WORKFLOW FOR STAGING
// ============================================================================
//
// Create separate "staging" branch:
// git checkout -b staging
// git push origin staging
//
// Workflow:
// 1. Feature branch from "staging" (not main)
// 2. PR to staging → review & test
// 3. Merge to staging → auto-deploys
// 4. After validation → PR to main
// 5. Main merges → auto-deploys to production

// ============================================================================
// PART 9: MONITORING STAGING
// ============================================================================
//
// Access staging app at: https://ocupaloc-staging.vercel.app
// View logs: Vercel Dashboard → ocupaloc-staging → Functions/Deployments
// Staging Database: Supabase Dashboard → ocupaloc-staging project
//
// Common issues:
// - Env vars not set: Check Vercel project settings
// - DB connection fails: Verify SUPABASE_DB_URL in GitHub secrets
// - Cron jobs fail: Check STAGING_SUPABASE_* secrets

export { stagingEnvExample, stagingWorkflowYaml };
