# Quick Start: Deploy to Firebase

## Step 1: Install Google Cloud SDK (Required Once)

```bash
# macOS - Install via Homebrew
brew install google-cloud-sdk

# After installation, initialize gcloud
gcloud init
```

If you don't have Homebrew, download from: https://cloud.google.com/sdk/docs/install

## Step 2: Authenticate

```bash
# Login to Firebase (already installed ✓)
firebase login

# Login to Google Cloud
gcloud auth login
```

## Step 3: Initialize Firebase

```bash
firebase init hosting

# When prompted:
# - Select "Use an existing project" (or create new)
# - Public directory: frontend/dist
# - Single-page app: Yes
```

This will create `.firebaserc` with your project ID.

## Step 4: Deploy!

### Option A: One-Command Deploy (Easiest)

```bash
# Edit deploy.sh first - update PROJECT_ID at line 13
./deploy.sh
```

### Option B: Manual Deploy

See full instructions in `DEPLOYMENT.md`

## What Gets Deployed

- **Frontend** → Firebase Hosting (https://your-project.web.app)
- **Backend** → Google Cloud Run (https://your-backend.run.app)
- **Database** → Cloud SQL PostgreSQL (optional)

## Cost Estimate

- Firebase Hosting: **FREE** (10GB/month)
- Cloud Run: **~$0-5/month** (free tier covers most usage)
- Cloud SQL: **$7-10/month** (smallest instance)

**Total: ~$10/month for low-traffic production deployment**

## Next Steps

1. Install Google Cloud SDK (see above)
2. Run `firebase init hosting`
3. Update `deploy.sh` with your project ID
4. Run `./deploy.sh`
5. Update ESP32 firmware with new WebSocket URL

**Need Help?** See detailed instructions in `DEPLOYMENT.md`
