# Firebase Deployment Quick Reference

## Prerequisites

1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

2. **Install Google Cloud SDK**
   ```bash
   # macOS
   brew install google-cloud-sdk
   
   # Or download from: https://cloud.google.com/sdk/docs/install
   ```

3. **Login to Firebase & Google Cloud**
   ```bash
   firebase login
   gcloud auth login
   ```

## One-Time Setup

### 1. Initialize Firebase Project

```bash
# In project root
firebase init hosting

# Select:
# - Use existing project (or create new one)
# - Public directory: frontend/dist
# - Single-page app: Yes
# - Set up automatic builds: No
# - Overwrite index.html: No
```

### 2. Set Google Cloud Project

```bash
# Replace with your Firebase project ID
export PROJECT_ID="your-firebase-project-id"

gcloud config set project $PROJECT_ID
```

### 3. Enable Required APIs

```bash
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable sqladmin.googleapis.com  # If using Cloud SQL
```

## Quick Deploy

### Option 1: Use Automated Script (Recommended)

```bash
# Make script executable
chmod +x deploy.sh

# Edit deploy.sh and update PROJECT_ID at the top
# Then run:
./deploy.sh
```

### Option 2: Manual Step-by-Step

#### Step 1: Build Frontend
```bash
cd frontend
npm install
npm run build
cd ..
```

#### Step 2: Deploy Backend to Cloud Run
```bash
gcloud run deploy capstone-backend \
  --source ./backend \
  --region asia-south1 \
  --allow-unauthenticated \
  --set-env-vars ENVIRONMENT=production
```

Copy the backend URL from the output (e.g., `https://capstone-backend-xyz.run.app`)

#### Step 3: Update Frontend Environment
```bash
# Create production environment file
echo "VITE_API_BASE_URL=https://your-backend-url.run.app" > frontend/.env.production
echo "VITE_WS_BASE_URL=wss://your-backend-url.run.app" >> frontend/.env.production

# Rebuild frontend
cd frontend
npm run build
cd ..
```

#### Step 4: Deploy Frontend to Firebase
```bash
firebase deploy --only hosting
```

## Update ESP32 Firmware

After deployment, update your ESP32 code:

```cpp
// In hardware/src/main.cpp
// Change WebSocket URL to your Cloud Run backend:

const char* wsHost = "your-backend-xyz.run.app";
const int wsPort = 443;  // Use SSL
const char* wsPath = "/ws/data";

// Update WiFiClientSecure for SSL connection
WiFiClientSecure client;
client.setInsecure();  // For testing; use certificates in production
ws.beginSSL(wsHost, wsPort, wsPath);
```

## Environment Variables

### Backend (.env)
```
ENVIRONMENT=production
DATABASE_URL=postgresql://user:pass@/db?host=/cloudsql/project:region:instance
JWT_SECRET=your-secret-key
OPENWEATHER_API_KEY=your-key
```

### Frontend (.env.production)
```
VITE_API_BASE_URL=https://your-backend.run.app
VITE_WS_BASE_URL=wss://your-backend.run.app
```

## Database Migration (SQLite → PostgreSQL)

### Create Cloud SQL Instance
```bash
gcloud sql instances create capstone-db \
  --database-version=POSTGRES_14 \
  --tier=db-f1-micro \
  --region=asia-south1
```

### Set Root Password
```bash
gcloud sql users set-password postgres \
  --instance=capstone-db \
  --password=YOUR_PASSWORD
```

### Update Backend Connection
In backend/.env:
```
DATABASE_URL=postgresql://postgres:PASSWORD@/capstone?host=/cloudsql/PROJECT_ID:asia-south1:capstone-db
```

### Connect Backend to Cloud SQL
```bash
gcloud run services update capstone-backend \
  --add-cloudsql-instances PROJECT_ID:asia-south1:capstone-db \
  --region asia-south1
```

## Updating Existing Deployment

### Update Backend Only
```bash
gcloud run deploy capstone-backend \
  --source ./backend \
  --region asia-south1
```

### Update Frontend Only
```bash
cd frontend
npm run build
cd ..
firebase deploy --only hosting
```

## Monitoring & Logs

### View Backend Logs
```bash
gcloud run logs read capstone-backend --region asia-south1
```

### View Real-time Logs
```bash
gcloud run logs tail capstone-backend --region asia-south1
```

### Firebase Hosting Logs
View in Firebase Console → Hosting → Usage

## Troubleshooting

### CORS Errors
- Ensure backend CORS includes your Firebase Hosting URL
- Check `backend/app/main.py` allowed_origins list

### WebSocket Connection Fails
- Verify ESP32 uses `wss://` (SSL) not `ws://`
- Check Cloud Run allows WebSocket upgrades (should be automatic)
- Ensure ESP32 SSL library supports TLS 1.2+

### Build Errors
- Clear node_modules and reinstall: `rm -rf frontend/node_modules && cd frontend && npm install`
- Clear Docker build cache: `docker system prune -a`

## Cost Optimization

- **Free Tier Usage**: Cloud Run offers 2 million requests/month free
- **Auto-scaling**: Set `--max-instances 3` to prevent runaway costs
- **Database**: Use smallest instance (`db-f1-micro`) or consider Firestore for lower costs

## Production Checklist

- [ ] Update `PROJECT_ID` in deploy.sh
- [ ] Set strong JWT_SECRET in backend .env
- [ ] Add API keys (OpenWeather, etc.) to Cloud Run env vars
- [ ] Update CORS origins with actual Firebase domain
- [ ] Test ESP32 → Cloud Run WebSocket connection
- [ ] Enable Cloud SQL backups
- [ ] Set up monitoring alerts in Google Cloud Console
- [ ] Update ESP32 firmware with production URLs
- [ ] Test end-to-end user flow on deployed site
