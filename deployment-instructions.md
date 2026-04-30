# Manual GitHub Pages Deployment

Since Git is not available in this environment, here's how to manually deploy to GitHub Pages:

## Step 1: Download the Build
1. The web build has been created in the `build` folder
2. Download all files from the `build` folder to your local machine

## Step 2: Set Up GitHub Repository
1. Create a new repository on GitHub (or use existing one)
2. Clone it to your local machine:
   ```bash
   git clone https://github.com/yourusername/your-repo-name.git
   cd your-repo-name
   ```

## Step 3: Add Build Files
1. Copy all files from the downloaded `build` folder to your local repository
2. Commit and push:
   ```bash
   git add .
   git commit -m "Deploy Expo web app"
   git push origin main
   ```

## Step 4: Enable GitHub Pages
1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Select **Source**: "Deploy from a branch"
4. Select **Branch**: "main" (or create a gh-pages branch)
5. Select **Folder**: "/ (root)" or "/docs" if you put files there
6. Click **Save**

## Alternative: Use GitHub's Web Interface
1. Create a new repository on GitHub
2. Use GitHub's web interface to upload files from the `build` folder
3. Enable GitHub Pages as described above

Your app will be available at: `https://yourusername.github.io/repository-name`

## Other Deployment Options

### Netlify (Easiest)
1. Go to [netlify.com](https://netlify.com)
2. Drag and drop the `build` folder
3. Get instant URL

### Vercel
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Set build command to: `npm run build:web:production`
4. Set output directory to: `build`

### Surge.sh
1. Install surge: `npm install -g surge`
2. Run: `surge build/`
3. Follow prompts for custom domain