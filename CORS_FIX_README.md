# 🚨 CORS Issue Fix Required

Your satellite tracker app is experiencing CORS errors because the Supabase edge function doesn't allow your Vercel domain yet.

## The Problem
- **Current allowed domain:** `https://db206876-4992-4720-8f1f-11cdcdfaaedd.lovableproject.com` (Lovable)
- **Your Vercel domain:** `https://satellite-l0wy4j6yc-abhis-projects-a01fea32.vercel.app`
- **Result:** CORS blocking all satellite data requests

## Quick Fix (5 minutes)

### Step 1: Update Supabase Configuration
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select project: `dnjhvmwznqsunjpabacg`
3. Navigate to: **Settings → Environment Variables**
4. Find the `ALLOWED_DOMAIN` variable
5. Change the value from:
   ```
   https://db206876-4992-4720-8f1f-11cdcdfaaedd.lovableproject.com
   ```
   to:
   ```
   https://satellite-l0wy4j6yc-abhis-projects-a01fea32.vercel.app
   ```

### Step 2: Redeploy the Function
1. Go to: **Edge Functions → space-track-proxy**
2. Click **"Deploy"** to restart with new environment variables
3. Wait 1-2 minutes for deployment to complete

### Step 3: Test the Fix
1. Refresh your Vercel app: https://satellite-l0wy4j6yc-abhis-projects-a01fea32.vercel.app
2. Check browser console - CORS errors should be gone
3. Satellites should start loading automatically

## Optional: Support Multiple Domains

If you want to support both production and development, set `ALLOWED_DOMAIN` to:
```
https://satellite-l0wy4j6yc-abhis-projects-a01fea32.vercel.app,https://db206876-4992-4720-8f1f-11cdcdfaaedd.lovableproject.com,http://localhost:5173
```

## Diagnostic Tool

Run this command to check CORS status:
```bash
node fix-cors.js
```

## Still Having Issues?

1. **Clear browser cache** and refresh
2. **Check browser console** for detailed error messages
3. **Verify Space-Track.org credentials** are set in Supabase
4. **See DEPLOYMENT_INSTRUCTIONS.md** for comprehensive troubleshooting

---
**Expected result:** Satellites should load within 30 seconds after fixing CORS.