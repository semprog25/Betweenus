# Push Updates to Existing GitHub Repository

Quick guide to push your updated files to the existing Between Us GitHub repository.

## 📋 Steps to Push Updates

### Step 1: Find Your GitHub Repository URL

Since Cursor is connected, the repo should exist. Common repository URLs:
- `https://github.com/YOUR_USERNAME/Betweenus-main.git`
- `https://github.com/YOUR_USERNAME/betweenus.git`
- `https://github.com/YOUR_USERNAME/between-us.git`

**To find it:**
1. Go to GitHub.com
2. Look for your repository in the list
3. Click on it
4. Click the green "Code" button
5. Copy the HTTPS or SSH URL

### Step 2: Add Remote (if not already added)

```bash
cd /Users/sharanestone/Cap/Betweenus-main

# Option A: HTTPS (easier for first time)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Option B: SSH (if you have SSH keys set up)
git remote add origin git@github.com:YOUR_USERNAME/YOUR_REPO_NAME.git

# Check if remote was added
git remote -v
```

**If you get "remote origin already exists":**
```bash
# Update existing remote URL
git remote set-url origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
```

### Step 3: Add New Files and Commit Changes

```bash
# Add all new/updated files
git add .

# Commit with descriptive message
git commit -m "Add RevenueCat integration, paywall system, and mobile features

- Integrate RevenueCat SDK for subscriptions
- Add paywall hooks and PaywallGate component
- Update SubscriptionModal with native paywall UI
- Fix logo visibility issues
- Add comprehensive documentation
- Mobile app readiness improvements"
```

### Step 4: Pull Remote Changes First (Important!)

**If the remote repo has changes you don't have locally:**

```bash
# Fetch remote changes
git fetch origin

# Check what branch you're on and what remote has
git branch -a

# Pull and merge remote changes (if any)
git pull origin main --no-rebase
```

**If you get conflicts:**
- Resolve conflicts in your editor
- Then: `git add .` → `git commit` → `git push`

### Step 5: Push to GitHub

```bash
# Push to main branch
git push -u origin main

# Or if main is your default branch
git push origin main
```

**If you get "rejected" error:**
```bash
# Force push (only if you're sure you want to overwrite remote)
git push origin main --force

# OR better: pull with rebase first
git pull origin main --rebase
git push origin main
```

---

## 🔄 Complete Workflow (Copy & Paste)

```bash
cd /Users/sharanestone/Cap/Betweenus-main

# 1. Check status
git status

# 2. Add remote (if needed - replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
# OR if remote exists, update it:
# git remote set-url origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# 3. Verify remote
git remote -v

# 4. Fetch remote changes
git fetch origin

# 5. Check what's on remote
git log origin/main --oneline -5

# 6. Pull remote changes (if any exist)
git pull origin main --no-rebase

# 7. Add all changes
git add .

# 8. Commit
git commit -m "Update: RevenueCat integration and paywall system"

# 9. Push
git push -u origin main
```

---

## 🔍 Troubleshooting

### "Remote origin already exists"

```bash
# Check current remote
git remote -v

# Update remote URL if wrong
git remote set-url origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
```

### "Updates were rejected because remote contains work"

The remote has commits you don't have. Options:

**Option 1: Pull and merge (recommended)**
```bash
git pull origin main --no-rebase
# Resolve any conflicts
git push origin main
```

**Option 2: Pull with rebase**
```bash
git pull origin main --rebase
git push origin main
```

**Option 3: Force push (only if you're sure)**
```bash
git push origin main --force
# ⚠️ Warning: This overwrites remote changes!
```

### "Permission denied" or "Authentication failed"

**Use Personal Access Token:**
1. GitHub → Settings → Developer settings → Personal access tokens
2. Generate new token (classic)
3. Select `repo` scope
4. Copy token
5. Use token as password when pushing

**Or use SSH:**
```bash
# Change remote to SSH
git remote set-url origin git@github.com:USERNAME/REPO.git
git push origin main
```

### "Branch 'main' has no upstream branch"

```bash
# Set upstream
git push -u origin main
```

---

## 📝 Quick Commands Reference

```bash
# Check what changed
git status

# See commit history
git log --oneline -10

# Add specific file
git add path/to/file.tsx

# Add all changes
git add .

# Commit
git commit -m "Your message"

# Push
git push origin main

# Pull latest
git pull origin main
```

---

## ✅ Verification Checklist

After pushing:

- [ ] Check GitHub repository page
- [ ] Verify all new files appear
- [ ] Check commit message is correct
- [ ] Verify files aren't missing
- [ ] Test that repo can be cloned

---

**Ready to push!** Start with Step 2 to add/update the remote, then follow the steps above. 🚀
