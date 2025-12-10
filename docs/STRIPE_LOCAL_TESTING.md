# Stripe Local Testing Guide

## Problem
When you subscribe locally, your account doesn't update because Stripe webhooks can't reach localhost:3000.

## Solution: Use Stripe CLI

### Step 1: Start Your Dev Server
```bash
npm run dev
```

### Step 2: Open a New Terminal and Run Stripe Listen
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

This will output a **webhook signing secret** like:
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx
```

### Step 3: Update Your .env.local
Copy the webhook secret from Step 2 and update your `.env.local`:
```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx  # Use the secret from stripe listen
```

### Step 4: Restart Your Dev Server
Stop and restart `npm run dev` to pick up the new webhook secret.

### Step 5: Test the Payment Flow
1. Go to http://localhost:3000/dashboard
2. Click "Upgrade to Pro"
3. Use Stripe test card: `4242 4242 4242 4242`
4. Any future date, any CVC, any ZIP

### Step 6: Watch the Webhooks
In the terminal running `stripe listen`, you'll see:
```
2025-11-21 11:15:23   --> checkout.session.completed [evt_xxxxx]
2025-11-21 11:15:23  <--  [200] POST http://localhost:3000/api/stripe/webhook [evt_xxxxx]
```

Your account should now update to `paid` status!

---

## For Production Deployment

When you deploy to production (Vercel), you need to:

1. **Configure webhook endpoint in Stripe Dashboard**
   - Go to https://dashboard.stripe.com/webhooks
   - Click "Add endpoint"
   - URL: `https://your-domain.com/api/stripe/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.deleted`, `invoice.payment_failed`

2. **Get the production webhook secret**
   - Copy the signing secret from Stripe Dashboard
   - Add it to Vercel environment variables as `STRIPE_WEBHOOK_SECRET`

3. **Add SUPABASE_SERVICE_ROLE_KEY to Vercel**
   - This is needed for webhooks to update the database
   - Get it from your Supabase project settings
   - Add to Vercel as `SUPABASE_SERVICE_ROLE_KEY`

---

## Troubleshooting

### "Webhook signature verification failed"
- Make sure you're using the webhook secret from `stripe listen` locally
- Restart your dev server after changing `.env.local`

### "No user ID in metadata - skipping database update"
- Check that the checkout session was created with metadata containing `supabase_user_id`
- Look at the console logs in the checkout route

### Payment succeeds but status doesn't change
- Check the terminal running `stripe listen` for errors
- Check your dev server logs for webhook processing errors
- Verify `SUPABASE_SERVICE_ROLE_KEY` is correct

### "User update result: null"
- Your user might not exist in the users table
- Check Supabase to ensure the user was created during signup
- The webhook logs will show the exact error

---

## Quick Test Commands

```bash
# Terminal 1: Dev server
npm run dev

# Terminal 2: Stripe webhook forwarding
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Terminal 3: Check logs
stripe logs tail
```
