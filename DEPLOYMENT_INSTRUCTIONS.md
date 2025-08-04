# ALCHEMIST Satellite Tracker - Deployment Instructions

🛰️ **Complete guide for deploying your satellite tracking application**

## Quick Deploy (Recommended)

### Vercel Deployment

**Prerequisites**: Git repository connected to GitHub, GitLab, or Bitbucket

1. **Go to [Vercel Dashboard](https://vercel.com/dashboard)**
2. **Click "New Project"**
3. **Import your Git repository**
4. **Configure project:**
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
5. **Click "Deploy"**

**✅ Your app will be live in ~2 minutes!**

The Vercel API route (`/api/space-track-proxy`) automatically handles Space-Track.org data fetching with built-in authentication.

---

## Alternative Deployment Options

### Netlify

1. **Connect repository to [Netlify](https://netlify.com)**
2. **Build settings:**
   - Build command: `npm run build`
   - Publish directory: `dist`
3. **Add Netlify Function for API proxy:**
   - Create `netlify/functions/space-track-proxy.js`
   - Copy the Vercel API route code and adapt for Netlify
4. **Deploy**

### GitHub Pages

1. **Enable GitHub Pages in repository settings**
2. **Create `.github/workflows/deploy.yml`:**
   ```yaml
   name: Deploy to GitHub Pages
   on:
     push:
       branches: [ main ]
   jobs:
     build-and-deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v2
         - uses: actions/setup-node@v2
         - run: npm install
         - run: npm run build
         - uses: peaceiris/actions-gh-pages@v3
           with:
             github_token: ${{ secrets.GITHUB_TOKEN }}
             publish_dir: ./dist
   ```

**Note**: For GitHub Pages, you'll need a separate backend service for the API proxy.

---

## Configuration

### Environment Variables (Optional)

The application works out-of-the-box without additional configuration. For custom setups:

```bash
# Optional: Custom API endpoint
VITE_API_ENDPOINT=/api/space-track-proxy

# Optional: Custom app title
VITE_APP_TITLE="ALCHEMIST Satellite Tracker"
```

### Custom Domain

#### Vercel Custom Domain

1. **Go to Project Settings → Domains**
2. **Add your domain**
3. **Configure DNS records as shown**
4. **SSL certificate is automatically generated**

---

## Troubleshooting

### Build Issues

**Problem**: Build fails with dependency errors
```bash
# Solution: Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Problem**: TypeScript errors
```bash
# Solution: Type check
npm run lint
```

### API Issues

**Problem**: Satellite data not loading
1. **Check browser console** for error messages
2. **Verify API route** is deployed correctly
3. **Test API endpoint** directly: `yourapp.vercel.app/api/space-track-proxy`

**Problem**: CORS errors
- **Vercel**: API routes automatically handle CORS
- **Other platforms**: Ensure your API proxy includes proper CORS headers

### Performance Issues

**Problem**: App loads slowly
```bash
# Solution: Optimize build
npm run build
# Check bundle size
npm run preview
```

**Problem**: Too many satellites causing lag
- The app automatically limits to active satellites
- Consider reducing refresh intervals in the code

---

## Custom Modifications

### Change Satellite Data Source

To use a different data source, modify `src/services/spaceTrackAPI.ts`:

1. **Update API endpoints**
2. **Modify data parsing logic**
3. **Update type definitions**

### Add New Features

1. **Component structure**: `src/components/`
2. **State management**: `src/stores/`
3. **Type definitions**: `src/types/`

### Styling Customization

1. **Tailwind config**: `tailwind.config.ts`
2. **Component styles**: `src/components/ui/`
3. **Global styles**: `src/index.css`

---

## Production Checklist

- [ ] **Build succeeds** without errors
- [ ] **API endpoint** works correctly
- [ ] **Satellite data** loads within 30 seconds
- [ ] **3D globe** renders properly
- [ ] **Mobile responsive** design works
- [ ] **Performance** is acceptable (< 3s initial load)
- [ ] **Error handling** displays user-friendly messages

---

## Support

### Common Issues

1. **Satellites not appearing**: Check API connectivity and browser console
2. **3D globe not rendering**: Verify WebGL support in browser
3. **Slow performance**: Check device specifications and reduce satellite count
4. **Mobile issues**: Test on actual devices, not just browser dev tools

### Getting Help

1. **Check browser console** for detailed error messages
2. **Review deployment logs** in your hosting platform
3. **Test API endpoints** directly for data issues
4. **Verify build output** is properly generated

---

**🎯 Expected result**: A fully functional satellite tracking application with real-time 3D visualization, accessible worldwide via your custom domain.

**📊 Performance targets**: 
- Initial load: < 3 seconds
- Satellite data fetch: < 30 seconds  
- Frame rate: 30+ FPS on modern devices