# Manual Expo Web Deployment Guide

## Method 1: Netlify (Recommended - Free & Easy)

### Step 1: Build for Web
```bash
npm run build:web
# or
expo export --platform web
```

### Step 2: Deploy to Netlify
1. Go to [netlify.com](https://netlify.com) and sign up/login
2. Drag and drop the `dist` folder to Netlify's deploy area
3. Get your live URL instantly!

**Alternative: Netlify CLI**
```bash
npm install -g netlify-cli
netlify deploy --dir=dist --prod
```

---

## Method 2: Vercel (Also Free)

### Step 1: Build for Web
```bash
npm run build:web
```

### Step 2: Deploy to Vercel
1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Install Vercel CLI: `npm install -g vercel`
3. Run: `vercel --prod`
4. Point to the `dist` folder when prompted

---

## Method 3: GitHub Pages (Free)

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Add web build"
git push origin main
```

### Step 2: Build and Deploy
```bash
npm run build:web
# Push the dist folder to gh-pages branch
npx gh-pages -d dist
```

### Step 3: Enable GitHub Pages
1. Go to your GitHub repo → Settings → Pages
2. Select "gh-pages" branch as source
3. Your app will be live at: `https://yourusername.github.io/your-repo-name`

---

## Method 4: Surge.sh (Simple & Fast)

### Step 1: Install Surge
```bash
npm install -g surge
```

### Step 2: Build and Deploy
```bash
npm run build:web
cd dist
surge
```
Follow the prompts to get your live URL!

---

## Method 5: Firebase Hosting

### Step 1: Install Firebase CLI
```bash
npm install -g firebase-tools
firebase login
```

### Step 2: Initialize and Deploy
```bash
firebase init hosting
# Select dist as your public directory
npm run build:web
firebase deploy
```

---

## Quick Start (Recommended)

**Fastest option - Netlify Drop:**
1. Run: `npm run build:web`
2. Go to [netlify.com](https://netlify.com)
3. Drag the `dist` folder to the deploy area
4. Share the URL you get!

## Important Notes

- The web version will have mobile-like UI (this is normal for React Native Web)
- Some mobile features won't work (camera, haptics, etc.)
- The app is responsive but optimized for mobile viewports
- Users can install it as a PWA on mobile devices

## Troubleshooting

If you get build errors:
1. Make sure all dependencies support web
2. Check that no native-only APIs are used without platform checks
3. Ensure all images use web-compatible URLs

Your app will be accessible to anyone with the URL once deployed!