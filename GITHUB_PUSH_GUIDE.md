# GitHub Push Guide - Between Us App

Complete guide for pushing your code to GitHub.

## 📋 Step-by-Step Instructions

### Step 1: Create GitHub Repository

1. Go to [GitHub.com](https://github.com) and sign in
2. Click the **"+" icon** in the top right → **"New repository"**
3. Repository name: `betweenus-app` (or your preferred name)
4. Description: "Between Us - Mental Wellness Support App"
5. Choose **Public** or **Private**
6. **DO NOT** initialize with README, .gitignore, or license (we already have files)
7. Click **"Create repository"**

### Step 2: Push to GitHub

Run these commands in your terminal (already done for you!):

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Between Us app with RevenueCat integration"

# Add GitHub remote (replace YOUR_USERNAME and REPO_NAME)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Rename default branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

---

## 🚀 Quick Commands

### If you already created the GitHub repo:

```bash
cd /Users/sharanestone/Cap/Betweenus-main

# Add remote (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Push
git branch -M main
git push -u origin main
```

### If using SSH (recommended for frequent pushes):

```bash
# Add remote with SSH
git remote add origin git@github.com:YOUR_USERNAME/YOUR_REPO_NAME.git

# Push
git push -u origin main
```

---

## 📝 Commit Messages Guide

### Good Commit Messages:

```bash
# Feature addition
git commit -m "Add RevenueCat paywall integration"

# Bug fix
git commit -m "Fix logo visibility in dark mode"

# Update/refactor
git commit -m "Update SubscriptionModal with RevenueCat UI"

# Documentation
git commit -m "Add paywall implementation guide"
```

### Multiple Files:

```bash
# Stage specific files
git add src/components/SubscriptionModal.tsx
git add src/utils/revenuecat.tsx
git commit -m "Integrate RevenueCat subscription system"

# Or stage all changes
git add .
git commit -m "Update: RevenueCat integration complete"
```

---

## 🔄 Daily Workflow

### After Making Changes:

```bash
# 1. Check what changed
git status

# 2. Add files
git add .                    # All files
# OR
git add path/to/file.tsx    # Specific file

# 3. Commit with message
git commit -m "Description of changes"

# 4. Push to GitHub
git push
```

---

## 🔐 Authentication

### Option 1: Personal Access Token (Recommended)

1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token
3. Select scopes: `repo` (full control)
4. Copy token
5. Use token as password when pushing

### Option 2: SSH Keys (Best for frequent use)

```bash
# Generate SSH key (if you don't have one)
ssh-keygen -t ed25519 -C "your_email@example.com"

# Add to SSH agent
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519

# Copy public key
cat ~/.ssh/id_ed25519.pub

# Add to GitHub: Settings → SSH and GPG keys → New SSH key
# Paste the key and save

# Use SSH URL for remote
git remote set-url origin git@github.com:USERNAME/REPO.git
```

---

## 🌿 Branching Strategy

### Create Feature Branch:

```bash
# Create and switch to new branch
git checkout -b feature/revenuecat-integration

# Make changes, commit
git add .
git commit -m "Add RevenueCat paywall"

# Push branch
git push -u origin feature/revenuecat-integration

# Merge to main (on GitHub via Pull Request, or locally)
git checkout main
git merge feature/revenuecat-integration
git push
```

---

## 📦 What Gets Pushed

### ✅ Included:
- All source code (`src/`)
- Configuration files (`package.json`, `vite.config.ts`, etc.)
- Documentation (`.md` files)
- Assets (`src/assets/`)

### ❌ Excluded (via .gitignore):
- `node_modules/` (dependencies)
- `dist/` and `build/` (build outputs)
- `.env` files (environment variables)
- `ios/` and `android/` (Capacitor native projects - add these separately if needed)

---

## ⚠️ Important Notes

### 1. Never Commit Secrets

The `.gitignore` excludes:
- `.env` files
- API keys in code (you should use environment variables)
- Build artifacts

**Current RevenueCat API Key:**
The test API key is currently in `src/utils/revenuecat.tsx`. For production:
- Use environment variables
- Or use a secrets management service
- Never commit production keys

### 2. Large Files

GitHub has limits:
- 100MB file size limit
- 1GB repository limit (soft)
- 5GB repository limit (hard)

Your assets (PNG logos) are fine (< 200KB each).

---

## 🔍 Troubleshooting

### "Repository not found"

```bash
# Check remote URL
git remote -v

# Update if wrong
git remote set-url origin https://github.com/USERNAME/REPO.git
```

### "Permission denied"

- Check authentication (token or SSH key)
- Verify you have push access to the repository
- Try using Personal Access Token instead of password

### "Updates were rejected"

```bash
# If remote has changes you don't have locally
git pull origin main --rebase
git push
```

### "Large files"

```bash
# If you accidentally committed large files
git rm --cached large-file.ext
git commit -m "Remove large file"
git push
```

---

## 📚 Next Steps After Pushing

1. **Set up GitHub Actions** (optional)
   - CI/CD workflows
   - Automated testing
   - Automated builds

2. **Add README.md**
   - Project description
   - Setup instructions
   - Usage guide

3. **Add LICENSE**
   - Choose appropriate license
   - MIT, Apache, etc.

4. **Collaborate**
   - Invite team members
   - Set up branch protection rules
   - Use Pull Requests for reviews

---

## ✅ Quick Checklist

- [ ] GitHub repository created
- [ ] Git initialized locally
- [ ] .gitignore created and working
- [ ] All files staged (git add .)
- [ ] Initial commit made
- [ ] Remote added (git remote add origin)
- [ ] Code pushed to GitHub (git push)
- [ ] Verified on GitHub.com
- [ ] README.md added (optional)
- [ ] Secrets excluded from repository

---

**Ready to push!** Follow the commands above based on your setup. 🚀
