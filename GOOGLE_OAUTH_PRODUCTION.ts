/**
 * GOOGLE OAUTH PRODUCTION MODE MIGRATION GUIDE
 * 
 * Current Status:
 * - OAuth app: In Testing Mode (blocks production signups)
 * - Client ID: 645434037292-4jb46cjvlbuf30djhm2uo4hp0i1btejd.apps.googleusercontent.com
 * - Redirect URI: https://tffwoljimpdckvlogyqu.supabase.co/auth/v1/callback
 * 
 * This guide moves the app from testing to production.
 */

// ============================================================================
// PHASE 1: DOMAIN VERIFICATION (REQUIRED)
// ============================================================================
//
// Google OAuth requires your domain to be verified before production.
// This proves you own ocupaloc.ro
//
// Steps:
// 1. Go to Google Cloud Console:
//    https://console.cloud.google.com/apis/credentials?project=ocupaloc-445715
//
// 2. In left sidebar, go to "APIs & Services" → "Credentials"
//
// 3. Find OAuth 2.0 Client:
//    Name: "ocupaloc-web" (or similar)
//    Type: Web application
//
// 4. Click the OAuth client to view/edit
//
// 5. Verify it has these settings:
//    - Authorized redirect URIs:
//      * https://tffwoljimpdckvlogyqu.supabase.co/auth/v1/callback
//      * https://ocupaloc.ro/auth/callback (if using custom domain)
//      * http://localhost:8788/auth/callback (for local dev)
//
// 6. If missing, add the redirect URIs above
//
// 7. Click "SAVE"

// ============================================================================
// PHASE 2: CONFIGURE OAUTH CONSENT SCREEN
// ============================================================================
//
// The OAuth Consent Screen is what users see when signing in.
// It must be set to "production" status.
//
// Steps:
// 1. Go back to Cloud Console
//
// 2. In left sidebar: "OAuth consent screen"
//
// 3. If the screen shows "DEVELOPMENT" status:
//    - Click "MAKE PUBLIC" button (upper right)
//    - Confirm you want to publish to production
//    - This changes status to "PRODUCTION"
//
// 4. Verify all required fields are filled:
//    ✓ App name: OcupaLoc
//    ✓ User support email: [your email]
//    ✓ Developer contact: [your email]
//    ✓ Privacy policy: https://ocupaloc.ro/privacy (or your policy URL)
//    ✓ Terms of service: https://ocupaloc.ro/terms (or your ToS URL)
//
// 5. Under "Scopes":
//    These are the permissions being requested:
//    - email (Required for OAuth)
//    - profile (Required for OAuth)
//    - openid (Standard OpenID scope)
//    
//    IMPORTANT: Avoid requesting sensitive scopes like:
//    - calendar.events (unnecessary)
//    - gmail.readonly (unnecessary)
//
// 6. Under "Test users" (if still in dev mode):
//    - Remove test user emails if no longer needed
//
// 7. Click "SAVE AND CONTINUE"

// ============================================================================
// PHASE 3: VERIFY DOMAIN OWNERSHIP
// ============================================================================
//
// Google requires proof you own ocupaloc.ro before the app goes public.
//
// Steps:
// 1. Go to Google Search Console:
//    https://search.google.com/search-console/
//
// 2. Click "Add property"
//
// 3. Enter: https://ocupaloc.ro
//
// 4. Choose verification method:
//    Option A: HTML file (upload to /public/google[xxxxx].html)
//    Option B: DNS TXT record (add to your DNS provider)
//    Option C: Google Analytics (if you're using it)
//
// 5. Complete verification
//
// 6. Wait 24-48 hours for verification to propagate

// ============================================================================
// PHASE 4: UPDATE SUPABASE AUTH SETTINGS
// ============================================================================
//
// Once OAuth is in production, update Supabase to point to the production app.
//
// Steps:
// 1. Go to Supabase Dashboard:
//    https://supabase.com/dashboard/project/tffwoljimpdckvlogyqu/auth/providers
//
// 2. Click "Google" provider
//
// 3. Ensure these match your Google Cloud Console:
//    - Client ID: 645434037292-4jb46cjvlbuf30djhm2uo4hp0i1btejd.apps.googleusercontent.com
//    - Client Secret: [your secret from Google Console]
//
// 4. Under "Redirect URL":
//    - Should be: https://tffwoljimpdckvlogyqu.supabase.co/auth/v1/callback
//
// 5. Click "Save"

// ============================================================================
// PHASE 5: TEST OAUTH FLOW (STAGING FIRST!)
// ============================================================================
//
// Before enabling on production, test in staging environment.
//
// Testing steps:
// 1. Go to staging app: https://ocupaloc-staging.vercel.app/signup
//
// 2. Click "Sign up with Google"
//
// 3. Verify:
//    ✓ Redirects to Google login
//    ✓ Shows correct app name (OcupaLoc)
//    ✓ Shows correct permissions (email, profile)
//    ✓ Successfully creates account after consent
//    ✓ Redirects back to app
//    ✓ User is logged in
//
// 4. Test with multiple accounts:
//    - @gmail.com
//    - @company.com
//    - Other email providers
//
// 5. Check logs in Supabase for any errors:
//    Auth → Logs → Filter for "google"

// ============================================================================
// PHASE 6: ENABLE ON PRODUCTION
// ============================================================================
//
// Once staging is verified and domain is verified, enable on production.
//
// Steps:
// 1. Go to production Supabase:
//    https://supabase.com/dashboard/project/tffwoljimpdckvlogyqu/auth/providers
//
// 2. Ensure Google provider is enabled and configured
//
// 3. Go to app: https://ocupaloc.ro/signup
//
// 4. Click "Sign up with Google"
//
// 5. Verify same flow as staging
//
// 6. Test with real users (limited beta)

// ============================================================================
// PHASE 7: MONITORING & TROUBLESHOOTING
// ============================================================================
//
// Common issues and solutions:
//
// Issue: "Redirect URI mismatch"
// ✓ Verify redirect URI in Google Console matches Supabase exactly:
//   https://tffwoljimpdckvlogyqu.supabase.co/auth/v1/callback
//
// Issue: "OAuth app in testing mode"
// ✓ Confirm you clicked "MAKE PUBLIC" in consent screen
// ✓ Check status shows "PRODUCTION" (not DEVELOPMENT)
//
// Issue: "Client secret invalid"
// ✓ Go to Google Console → Credentials
// ✓ Copy Client Secret exactly (including dashes)
// ✓ Update in Supabase provider settings
//
// Issue: "Invalid scope"
// ✓ Check OAuth consent screen scopes
// ✓ Remove unnecessary scopes (gmail, calendar, etc.)
// ✓ Save changes
//
// Issue: "Domain verification failed"
// ✓ Go to Search Console
// ✓ Ensure domain verification is complete (green checkmark)
// ✓ May take 24-48 hours to propagate

// ============================================================================
// PHASE 8: MONITORING AFTER LAUNCH
// ============================================================================
//
// Keep an eye on OAuth metrics:
//
// 1. Supabase Logs:
//    - Check for "google" auth events
//    - Monitor error rates
//
// 2. Google Cloud Console:
//    - APIs & Services → Quotas
//    - Monitor API usage and quotas
//
// 3. Sentry (if configured):
//    - Watch for auth-related errors
//    - Set up alerts for OAuth failures
//
// 4. User feedback:
//    - Monitor for signup issues
//    - Check support emails for auth problems

// ============================================================================
// CHECKLIST - BEFORE PRODUCTION
// ============================================================================
//
// □ OAuth app created in Google Cloud
// □ Client ID & Secret configured in Supabase
// □ Redirect URI added to Google Console (matches Supabase exactly)
// □ Redirect URI added to Google Console:
//   https://tffwoljimpdckvlogyqu.supabase.co/auth/v1/callback
// □ Privacy policy URL configured (ocupaloc.ro/privacy)
// □ Terms of service URL configured (ocupaloc.ro/terms)
// □ Scopes limited to: email, profile, openid (no extras)
// □ OAuth consent screen status: PRODUCTION (not DEVELOPMENT)
// □ Domain verification in Search Console: VERIFIED
// □ Staging tested successfully
// □ Sentry configured to monitor auth errors
// □ Support team notified of launch date
//
// ============================================================================
// QUICK COMMANDS FOR VERIFICATION
// ============================================================================
//
// Verify domain is in Search Console:
// curl -I https://ocupaloc.ro
//
// Check Supabase OAuth config (from app):
// const { data: { session } } = await supabase.auth.getSession()
// console.log(session?.provider) // should be "google" after OAuth
//
// Test redirect URI from Google Console dashboard:
// curl "https://tffwoljimpdckvlogyqu.supabase.co/auth/v1/callback?code=test"
//
// ============================================================================

export const GOOGLE_OAUTH_PRODUCTION_CHECKLIST = {
  phase1_domain_verification: {
    status: "⏳ Pending",
    steps: [
      "Go to Google Cloud Console",
      "Configure redirect URIs for all environments",
      "Save changes"
    ]
  },
  phase2_consent_screen: {
    status: "⏳ Pending",
    steps: [
      "Access OAuth consent screen",
      "Click MAKE PUBLIC to enable production",
      "Verify app details and permissions"
    ]
  },
  phase3_search_console: {
    status: "⏳ Pending", 
    steps: [
      "Add property to Google Search Console",
      "Verify domain ownership",
      "Wait 24-48 hours for verification"
    ]
  },
  phase4_supabase: {
    status: "✅ Complete",
    details: "Google provider configured with correct client ID/secret"
  },
  phase5_staging_test: {
    status: "⏳ Pending",
    steps: [
      "Test OAuth flow in staging",
      "Verify redirect works",
      "Test with multiple email providers"
    ]
  },
  phase6_production: {
    status: "⏳ Pending",
    steps: [
      "Enable on production",
      "Test with limited beta users",
      "Monitor for issues"
    ]
  },
  estimated_time: "4-5 hours (includes 24-48h domain verification wait)"
};
