# 🎯 Google Ads API Setup Guide

**Time Required:** 2-3 hours
**Difficulty:** Moderate
**Result:** Full ad importing functionality

---

## 📋 Prerequisites

Before starting, make sure you have:
- [ ] Google account (Gmail)
- [ ] Google Ads account (we'll create one if you don't have it)
- [ ] Access to your code and .env.local file

---

## 🚀 PART 1: Create Google Cloud Project (30 minutes)

### Step 1.1: Go to Google Cloud Console
1. Open: https://console.cloud.google.com/
2. Sign in with your Google account
3. Accept terms of service if prompted

### Step 1.2: Create New Project
1. Click **"Select a project"** dropdown (top left, near Google Cloud logo)
2. Click **"NEW PROJECT"** button (top right of modal)
3. Fill in:
   - **Project name:** `Ad Intelligence Platform`
   - **Organization:** Leave as "No organization" (default)
   - **Location:** Leave as default
4. Click **"CREATE"**
5. Wait 30-60 seconds for project creation
6. Click **"SELECT PROJECT"** when prompted

**✅ Checkpoint:** You should see "Ad Intelligence Platform" in the project dropdown

---

## 🔌 PART 2: Enable Google Ads API (10 minutes)

### Step 2.1: Navigate to APIs & Services
1. In Google Cloud Console, click **☰ (hamburger menu)** (top left)
2. Hover over **"APIs & Services"**
3. Click **"Library"**

### Step 2.2: Enable Google Ads API
1. In the search bar, type: `Google Ads API`
2. Click on **"Google Ads API"** (by Google LLC)
3. Click **"ENABLE"** button
4. Wait for it to enable (takes 10-20 seconds)

**✅ Checkpoint:** You should see "API enabled" with a green checkmark

---

## 🔑 PART 3: Create OAuth 2.0 Credentials (45 minutes)

### Step 3.1: Configure OAuth Consent Screen
1. Click **☰ menu** → **APIs & Services** → **OAuth consent screen**
2. Select **"External"** (unless you have a Google Workspace account)
3. Click **"CREATE"**

### Step 3.2: Fill OAuth Consent Screen (Page 1 - App Information)
1. **App name:** `Ad Intelligence Platform`
2. **User support email:** Your email address
3. **App logo:** Skip for now (optional)
4. **App domain:**
   - **Application home page:** `http://localhost:3000`
   - **Application privacy policy:** `http://localhost:3000/privacy` (we'll create this later)
   - **Application terms of service:** `http://localhost:3000/terms` (we'll create this later)
5. **Authorized domains:** Leave empty for now
6. **Developer contact information:** Your email address
7. Click **"SAVE AND CONTINUE"**

### Step 3.3: Scopes (Page 2)
1. Click **"ADD OR REMOVE SCOPES"**
2. In the filter box, type: `https://www.googleapis.com/auth/adwords`
3. Check the box for: `https://www.googleapis.com/auth/adwords`
4. Scroll down and click **"UPDATE"**
5. Click **"SAVE AND CONTINUE"**

### Step 3.4: Test Users (Page 3)
1. Click **"+ ADD USERS"**
2. Enter your Gmail address
3. Click **"ADD"**
4. Click **"SAVE AND CONTINUE"**

### Step 3.5: Summary (Page 4)
1. Review everything
2. Click **"BACK TO DASHBOARD"**

**✅ Checkpoint:** OAuth consent screen configured

---

### Step 3.6: Create OAuth 2.0 Client ID
1. Click **☰ menu** → **APIs & Services** → **Credentials**
2. Click **"+ CREATE CREDENTIALS"** (top)
3. Select **"OAuth client ID"**
4. **Application type:** Select **"Web application"**
5. **Name:** `Ad Intelligence Web App`
6. **Authorized JavaScript origins:**
   - Click **"+ ADD URI"**
   - Enter: `http://localhost:3000`
   - Click **"+ ADD URI"** again
   - Enter: `https://your-app-name.vercel.app` (we'll update this later)
7. **Authorized redirect URIs:**
   - Click **"+ ADD URI"**
   - Enter: `http://localhost:3000/api/google/connect`
   - Click **"+ ADD URI"** again
   - Enter: `https://your-app-name.vercel.app/api/google/connect` (we'll update this later)
8. Click **"CREATE"**

### Step 3.7: Save Your Credentials
A modal will appear with your credentials:
- **Client ID:** `123456789-abcdefgh.apps.googleusercontent.com`
- **Client Secret:** `GOCSPX-abcd1234efgh5678`

**🚨 IMPORTANT:**
- Copy BOTH values immediately
- Keep this window open or download the JSON
- You won't see the secret again!

**✅ Checkpoint:** You have Client ID and Client Secret saved

---

## 🎫 PART 4: Get Google Ads Developer Token (60+ minutes - LONGEST PART)

**⚠️ WARNING:** This is the most complex part and can take 1-2 business days for approval.

### Step 4.1: Go to Google Ads
1. Open: https://ads.google.com/
2. Sign in with your Google account

### Step 4.2: Create Google Ads Account (if you don't have one)
1. Click **"Start now"**
2. Fill in your business information
3. **Billing:** You can skip or add later (we're just using the API)
4. Complete setup

### Step 4.3: Switch to Manager Account Mode
**Option A - If you have a Manager Account:**
1. Go to: https://ads.google.com/aw/manager
2. Note your **Customer ID** (format: 123-456-7890)

**Option B - If you DON'T have a Manager Account:**
1. Create one at: https://ads.google.com/home/tools/manager-accounts/
2. Follow the prompts
3. This becomes your "parent" account for API access

### Step 4.4: Request Developer Token
1. Go to: https://ads.google.com/aw/apicenter
2. Click on **"API Center"** in the left sidebar
3. Look for **"Developer token"** section
4. Click **"Request token"** or **"Create token"**
5. Fill in the form:
   - **Purpose:** Development and testing
   - **Application description:** "Ad intelligence platform for analyzing advertising campaigns"
6. Click **"Submit"**

**🕐 WAIT TIME:** This can take:
- **Test mode (immediate):** You get a token right away, but limited functionality
- **Basic access (1-2 days):** Full functionality for your own accounts
- **Standard access (weeks):** For production apps serving multiple clients

### Step 4.5: Get Your Developer Token
Once approved (or in test mode), you'll see:
- **Developer Token:** A long string like `ABcdEFgh1234567890`

**✅ Checkpoint:** You have a Developer Token (even if in "test" mode)

---

## 🔐 PART 5: Update Your .env.local (5 minutes)

Now let's add all your credentials to the project.

You should have:
1. ✅ Google OAuth Client ID
2. ✅ Google OAuth Client Secret
3. ✅ Google Ads Developer Token

**Tell me when you have all three and I'll update your .env.local file!**

---

## 🧪 PART 6: Test the Integration (30 minutes)

Once all credentials are added, we'll:
1. Start the dev server
2. Test the OAuth connection flow
3. Import test ads
4. Verify data in Supabase

---

## 🚨 Common Issues & Solutions

### Issue 1: "Access Not Configured"
**Solution:** Make sure Google Ads API is enabled in Cloud Console

### Issue 2: "Redirect URI mismatch"
**Solution:**
- Check that `http://localhost:3000/api/google/connect` is in authorized redirect URIs
- No trailing slash!
- Exact match required

### Issue 3: "Invalid client"
**Solution:**
- Verify Client ID and Secret are correct
- No extra spaces when copying

### Issue 4: "Developer token not approved"
**Solution:**
- Use in "test mode" for now
- Apply for basic access (takes 1-2 days)
- You can still develop with test mode

### Issue 5: "No Google Ads account found"
**Solution:**
- Make sure you have at least one Google Ads account linked
- Use a Manager Account ID if possible

---

## 📊 Progress Tracking

Use this checklist as you go:

**Part 1: Google Cloud Project**
- [ ] Created Google Cloud Project
- [ ] Project selected and active

**Part 2: Enable API**
- [ ] Google Ads API enabled

**Part 3: OAuth Setup**
- [ ] OAuth consent screen configured
- [ ] Test user added
- [ ] OAuth Client ID created
- [ ] Client ID saved
- [ ] Client Secret saved

**Part 4: Developer Token**
- [ ] Google Ads account exists
- [ ] Manager account created (if needed)
- [ ] Developer token requested
- [ ] Developer token received (even if test mode)

**Part 5: Configuration**
- [ ] All credentials in .env.local
- [ ] No syntax errors in .env.local

**Part 6: Testing**
- [ ] OAuth flow works
- [ ] Can connect Google Ads account
- [ ] Can import ads
- [ ] Data appears in database

---

## 💡 Tips for Success

1. **Take your time** - This is complex, rushing leads to mistakes
2. **Keep all windows open** - Don't close credential screens until saved
3. **Copy-paste carefully** - One wrong character breaks everything
4. **Use test mode** - Don't wait for full approval to start developing
5. **Document as you go** - Take screenshots of important screens

---

## 🆘 Need Help?

If you get stuck at any point:
1. **Take a screenshot** of where you're stuck
2. **Show me** and I'll guide you through
3. **Don't guess** - Better to ask than redo everything

---

Ready to start? Let's begin with **Part 1: Create Google Cloud Project**!

Tell me when you're ready and I'll walk you through each step! 🚀
