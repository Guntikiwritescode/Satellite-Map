# ALCHEMIST Satellite Tracker - Deployment Instructions

Your satellite tracking application has been successfully separated from Lovable and is ready for independent deployment. Follow these step-by-step instructions to deploy your application.

## 🚨 URGENT: Fix CORS Issue for Vercel Deployment

**If you're seeing CORS errors in the browser console**, your Supabase edge function needs to be updated to allow your Vercel domain:

### Quick Fix Steps:

1. **Go to [Supabase Dashboard](https://supabase.com/dashboard)**
2. **Navigate to your project:** `dnjhvmwznqsunjpabacg`
3. **Go to Settings → Environment Variables**
4. **Update the `ALLOWED_DOMAIN` variable:**
   - **Current value:** `https://db206876-4992-4720-8f1f-11cdcdfaaedd.lovableproject.com`
   - **New value:** `https://satellite-l0wy4j6yc-abhis-projects-a01fea32.vercel.app`
   - (Or use your actual Vercel URL if different)

5. **Redeploy the edge function:**
   - Go to **Edge Functions → space-track-proxy**
   - Click **Deploy** to restart with new environment variables

6. **Test the fix:**
   - Refresh your Vercel app
   - Check browser console for errors
   - Satellites should now load successfully

### Alternative: Allow Multiple Domains

If you want to support both domains (for development and production), set `ALLOWED_DOMAIN` to:
```
https://satellite-l0wy4j6yc-abhis-projects-a01fea32.vercel.app,https://db206876-4992-4720-8f1f-11cdcdfaaedd.lovableproject.com,http://localhost:5173
```

## 🚀 Quick Deployment to Vercel (Recommended)

### Step 1: Deploy to Vercel

1. **Go to [vercel.com](https://vercel.com)** and sign in with your GitHub account
2. **Click "Add New Project"** or "Import Project"
3. **Import your GitHub repository** that contains this code
4. **Configure the project:**
   - Project Name: `alchemist-satellite-tracker` (or your preferred name)
   - Framework: Vercel should auto-detect "Vite"
   - Root Directory: Leave as `/` (root)
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install --legacy-peer-deps`

5. **Click "Deploy"**

Your application will be deployed and you'll receive a URL like `https://alchemist-satellite-tracker.vercel.app`

### Step 2: Configure Space-Track API Credentials

The satellite data comes from Space-Track.org, so you need to set up the API credentials:

1. **Go to the [Supabase Dashboard](https://supabase.com/dashboard)**
2. **Select your project:** `dnjhvmwznqsunjpabacg` 
3. **Go to Settings → Environment Variables**
4. **Add these environment variables:**
   ```
   SPACE_TRACK_USERNAME=nihanth20@gmail.com
   SPACE_TRACK_PASSWORD=CS2wTBBW.*LjZeY
   ALLOWED_DOMAIN=https://your-vercel-url.vercel.app
   ```
   (Replace `your-vercel-url` with your actual Vercel deployment URL)

5. **Redeploy the Supabase function:**
   - Go to Functions → space-track-proxy
   - Click "Deploy" to restart with new environment variables

### Step 3: Update CORS Configuration

Update the Supabase function to allow your Vercel domain:

1. **In Supabase Dashboard → Edge Functions → space-track-proxy**
2. **The function has already been updated to support your domain automatically**
3. **Or manually edit if needed** - the function checks `ALLOWED_DOMAIN` environment variable

## 🔧 Alternative Deployment Options

### Deploy to Netlify

1. **Go to [netlify.com](https://netlify.com)** and sign in
2. **Drag and drop the `dist` folder** after running `npm run build`
3. **Or connect your GitHub repository** for automatic deployments
4. **Set build command:** `npm run build`
5. **Set publish directory:** `dist`
6. **Set install command:** `npm install --legacy-peer-deps`

### Deploy to GitHub Pages

1. **Install gh-pages:**
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Add to package.json scripts:**
   ```json
   "deploy": "gh-pages -d dist"
   ```

3. **Build and deploy:**
   ```bash
   npm run build
   npm run deploy
   ```

## 📊 Features Included

Your deployed application includes:

✅ **Real-time Satellite Tracking** - Track over 23,000 satellites  
✅ **3D Globe Visualization** - Interactive Earth with satellite positions  
✅ **Multiple View Modes** - Tactical view, data grid, UI guide, education  
✅ **Terminal Aesthetic** - Cyberpunk-inspired design  
✅ **Educational Content** - Learn about satellites and space technology  
✅ **Audio Experience** - Space-themed ambient audio  
✅ **Responsive Design** - Works on desktop and mobile  

## 🔍 Troubleshooting

### If satellites don't load:
1. **Check Supabase environment variables** are set correctly
2. **Verify Space-Track.org credentials** work by logging in manually
3. **Check browser console** for any CORS or API errors
4. **Ensure ALLOWED_DOMAIN** matches your deployment URL exactly

### If build fails:
1. **Try:** `npm install --legacy-peer-deps`
2. **Check Node.js version** (requires Node 18+)
3. **Clear node_modules:** `rm -rf node_modules && npm install --legacy-peer-deps`

### If 3D globe doesn't render:
1. **Check if WebGL is enabled** in your browser
2. **Try a different browser** or device
3. **Check browser console** for Three.js errors

## 🌐 Custom Domain (Optional)

To use a custom domain:

1. **In Vercel Dashboard:**
   - Go to your project Settings → Domains
   - Add your custom domain
   - Follow DNS configuration instructions

2. **Update Supabase:**
   - Update `ALLOWED_DOMAIN` environment variable to your custom domain
   - Redeploy the space-track-proxy function

## 📱 Mobile Optimization

The application is fully responsive and optimized for:
- 📱 Mobile phones (iOS/Android)
- 📱 Tablets (iPad, Android tablets)
- 💻 Desktop browsers (Chrome, Firefox, Safari, Edge)
- 🖥️ Large displays and ultra-wide monitors

## 🔒 Security Features

✅ **CORS Protection** - API endpoints secured against unauthorized domains  
✅ **Rate Limiting** - Respectful API usage to Space-Track.org  
✅ **Input Validation** - All API endpoints validate inputs  
✅ **No User Tracking** - Privacy-respecting application  

## 📞 Support

If you encounter any issues:
1. **Check the browser console** for error messages
2. **Verify all environment variables** are set correctly
3. **Try refreshing the page** or clearing browser cache
4. **Check if Space-Track.org is accessible** from your location

---

🛰️ **Congratulations!** Your ALCHEMIST Satellite Tracking Terminal is now live and independent of Lovable!