# Meta OAuth Integration - Complete Setup Guide

## Current Status

✅ **OAuth callback handler** - `/api/meta/connect` (stores long-lived token)
✅ **Meta API client** - `lib/meta/client.ts` (fetch ads, creatives, insights)
✅ **Import API** - `/api/meta/import-ads` (bulk import your ads)
✅ **Database schema** - Added meta_access_token, meta_token_expires_at, meta_ad_account_id

## What You Need to Do

### Step 1: Create Meta/Facebook Developer App (30 minutes)

1. **Go to**: https://developers.facebook.com/apps/create/

2. **Create App**:
   - Type: "Business"
   - Name: "Ad Intelligence" (or your preference)
   - Contact email: Your email

3. **Add Products**:
   - Click "Add Product" → **Marketing API**
   - Click "Add Product" → **Facebook Login**

4. **Configure OAuth Settings**:
   - Go to Facebook Login → Settings
   - Add OAuth Redirect URI: `https://ad-intelligence-mvp.vercel.app/api/meta/connect`
   - For local testing: `http://localhost:3000/api/meta/connect`

5. **Get Your Credentials**:
   - Go to Settings → Basic
   - Copy **App ID** and **App Secret**
   - Add to Vercel environment variables:
     ```
     META_APP_ID=your_app_id_here
     META_APP_SECRET=your_app_secret_here
     ```

6. **Request Permissions** (App Review):
   - Go to App Review → Permissions and Features
   - Request these permissions:
     - `ads_read` - Read ad account data
     - `ads_management` - Access ad insights
   - This requires Business Verification (see below)

### Step 2: Business Verification (1-2 weeks)

Meta requires business verification before your app can go Live:

1. **Go to**: Settings → Business Verification
2. **Submit**:
   - Business documents (LLC, Tax ID, etc.)
   - Business address
   - Business phone number
   - Website (use your Vercel URL)
3. **Wait**: Meta typically responds in 3-5 business days

**Alternative for Testing**: Use Development Mode with your own account

### Step 3: Database Migration

Run this SQL in your Supabase SQL Editor:

```sql
-- Add Meta OAuth columns to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS meta_access_token text,
ADD COLUMN IF NOT EXISTS meta_token_expires_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS meta_ad_account_id text;
```

### Step 4: Update Dashboard UI

The "Import Your Ads" button needs to initiate OAuth flow:

**File**: `app/dashboard/import/page.tsx`

Add this function:
```typescript
async function connectMeta() {
  const { data: { user } } = await supabase.auth.getUser();

  const oauthUrl =
    `https://www.facebook.com/v18.0/dialog/oauth?` +
    `client_id=${process.env.NEXT_PUBLIC_META_APP_ID}` +
    `&redirect_uri=${encodeURIComponent(window.location.origin + '/api/meta/connect')}` +
    `&scope=ads_read,ads_management` +
    `&state=${user?.id}`;

  window.location.href = oauthUrl;
}
```

Add a "Connect Meta Account" button that calls this function.

### Step 5: Test the Flow (Development Mode)

**Before business verification**, you can test with your own account:

1. Go to Settings → Roles → Test Users
2. Add yourself as a test user
3. Click "Connect Meta Account" button
4. Authorize the app
5. You'll be redirected back with token stored
6. Click "Import Ads" to fetch your ads

## How It Works

### OAuth Flow:
```
User clicks "Connect"
  → Redirect to Facebook OAuth
  → User approves permissions
  → Facebook redirects to /api/meta/connect?code=xxx
  → Exchange code for access token
  → Exchange short-lived token for long-lived token (60 days)
  → Store token + ad account ID in database
  → Redirect to dashboard with success
```

### Import Flow:
```
User clicks "Import Ads"
  → POST /api/meta/import-ads
  → Fetch token from database
  → Call Meta Marketing API
  → Get ads with creatives + insights
  → Insert into creatives table
  → Return count of imported ads
```

## API Endpoints

### `/api/meta/connect` (GET)
- Handles OAuth callback
- Exchanges code for long-lived token
- Stores in database
- **URL**: Your OAuth redirect URI

### `/api/meta/import-ads` (POST)
- Fetches ads from user's Meta account
- Imports into creatives table
- Returns imported count

**Request:**
```bash
curl -X POST https://your-app.vercel.app/api/meta/import-ads \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "imported": 15,
  "total": 15,
  "ads": [...]
}
```

## Troubleshooting

### "App Not Setup" Error
- Your app is in Development mode
- Need to complete Business Verification
- OR add your Facebook account as a Test User

### "Invalid OAuth Redirect URI"
- Check the URI exactly matches in Meta Console
- Include protocol (https://)
- No trailing slash

### "Permission Denied"
- Request `ads_read` and `ads_management` permissions in App Review
- OR use Test Users in Development mode

### "Token Expired"
- Long-lived tokens last 60 days
- Need to implement token refresh flow
- Show "Reconnect Meta Account" UI when expired

## Token Refresh (Future Enhancement)

Long-lived tokens expire after 60 days. Add this to maintain connection:

```typescript
async function refreshMetaToken(oldToken: string) {
  const response = await fetch(
    `https://graph.facebook.com/v18.0/oauth/access_token?` +
    `grant_type=fb_exchange_token` +
    `&client_id=${META_APP_ID}` +
    `&client_secret=${META_APP_SECRET}` +
    `&fb_exchange_token=${oldToken}`
  );

  const { access_token } = await response.json();
  // Update database with new token
}
```

## Privacy Policy & Terms (Required for App Review)

You need these for Business Verification:

1. **Privacy Policy**: Explain what data you collect and how you use it
2. **Terms of Service**: User agreement
3. **Data Deletion**: How users can delete their data

Add these to your app:
- `/privacy` page
- `/terms` page
- `/data-deletion` page

Then link them in Meta App Settings → Basic → Privacy Policy URL

## Testing Checklist

- [ ] Meta App created
- [ ] OAuth redirect URI configured
- [ ] App ID and Secret in Vercel env vars
- [ ] Database migration run
- [ ] "Connect Meta" button added to UI
- [ ] Test OAuth flow (Development Mode)
- [ ] Test importing ads
- [ ] Verify ads appear in dashboard
- [ ] Test token expiration handling

## Production Checklist

- [ ] Business Verification completed
- [ ] App Review approved (ads_read, ads_management permissions)
- [ ] App switched to Live mode
- [ ] Privacy Policy published
- [ ] Terms of Service published
- [ ] Token refresh implemented
- [ ] Error handling for all Meta API calls
- [ ] Rate limiting for API calls

## Costs

- Meta API: **Free** (no charges for reading your own ad data)
- Meta App: **Free**
- Business Verification: **Free** (but requires business documentation)

## Support

- **Meta Docs**: https://developers.facebook.com/docs/marketing-apis
- **API Reference**: https://developers.facebook.com/docs/graph-api/reference/ad-account/ads
- **OAuth Guide**: https://developers.facebook.com/docs/facebook-login/guides/advanced/manual-flow

---

**Estimated Time to Complete**:
- Development Mode Testing: 1-2 hours
- Full Production Setup: 1-2 weeks (waiting for verification)
