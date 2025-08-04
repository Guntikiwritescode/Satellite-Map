# Supabase Edge Function Deployment

This document provides instructions for deploying the `space-track-proxy` edge function to fix the CORS issues with your satellite tracking application.

## Prerequisites

1. Install the Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project (you'll need your project reference from the dashboard):
   ```bash
   supabase link --project-ref dnjhvmwznqsunjpabacg
   ```

## Deploy the Edge Function

### Option 1: Using npm script (recommended)
```bash
npm run supabase:deploy
```

### Option 2: Using Supabase CLI directly
```bash
supabase functions deploy space-track-proxy
```

## Verify Deployment

1. Check the function logs:
   ```bash
   npm run supabase:logs
   # or
   supabase functions logs space-track-proxy
   ```

2. Test the function directly:
   ```bash
   curl -X POST https://dnjhvmwznqsunjpabacg.supabase.co/functions/v1/space-track-proxy \
     -H "Content-Type: application/json" \
     -d '{"action": "fetch", "endpoint": "/basicspacedata/query/class/gp/decay_date/null-val/epoch/>now-30/orderby/NORAD_CAT_ID asc/limit/10/format/json"}'
   ```

## What This Fixes

The updated edge function:

1. **Fixes CORS Issues**: Now allows requests from your Vercel domain (`satellite-map-rust.vercel.app`)
2. **Handles Proper Request Format**: Matches the format your client sends (`{action: "fetch", endpoint: "..."}`)
3. **Better Error Handling**: Provides more detailed error responses
4. **Space-Track.org Compatibility**: Uses proper headers and URL construction for Space-Track.org API

## Edge Function Features

- **Rate Limiting Friendly**: Respects Space-Track.org's rate limits
- **Error Handling**: Proper error responses with CORS headers
- **Logging**: Console logs for debugging
- **JSON Parsing**: Automatically parses JSON responses

## Troubleshooting

### If deployment fails:
1. Make sure you're logged into Supabase: `supabase status`
2. Verify your project is linked: `supabase projects list`
3. Check your project reference ID

### If CORS issues persist:
1. Clear your browser cache
2. Check that the function deployed successfully
3. Verify the function URL in your client code matches your Supabase project

### For debugging:
```bash
# Watch logs in real-time
supabase functions logs space-track-proxy --follow

# Test locally (optional)
supabase functions serve space-track-proxy
```

## Next Steps

After deployment:
1. Your satellite tracking application should work without CORS errors
2. The function will handle requests from both your Vercel domain and the original Lovable domain
3. Monitor the function logs to ensure everything is working correctly

## Security Note

The function currently allows all origins (`Access-Control-Allow-Origin: *`) for simplicity. For production, you may want to restrict this to only your specific domains by updating the `corsHeaders` in `index.ts`.