# How to Get API Keys 🔑

## Required API Keys

### 1. OpenWeather API (Required for Pro Mode)

**Free Tier**: 1,000 calls/day

1. Go to: https://openweathermap.org/api
2. Click "Sign Up" or "Sign In"
3. Use credentials: `projectc943@gmail.com` / `project@2026`
4. Go to: https://home.openweathermap.org/api_keys
5. Copy your API key
6. Add to `backend/.env`:
   ```
   OPENWEATHER_API_KEY=your_key_here
   ```

### 2. OpenAQ API (Optional - Public Data)

**Note**: OpenAQ v2 API doesn't require an API key for basic usage, but v3 does.

**For v2 (No key needed)**:
- Already configured in the code
- Free, unlimited access

**For v3 (Requires key)**:
1. Go to: https://openaq.org/
2. Sign up for API access
3. Add to `backend/.env`:
   ```
   OPENAQ_API_KEY=your_key_here
   ```

### 3. NASA API (Optional - Satellite Data)

**Free Tier**: 1,000 requests/hour

1. Go to: https://api.nasa.gov/
2. Click "Generate API Key"
3. Use email: `projectc943@gmail.com`
4. Copy your API key
5. Add to `backend/.env`:
   ```
   NASA_API_KEY=your_key_here
   ```

---

## Quick Setup

### Option 1: Manual Setup

1. Copy the example file:
   ```bash
   cd backend
   cp .env.example .env
   ```

2. Edit `.env` and add your API keys:
   ```bash
   nano .env
   # or use any text editor
   ```

3. Restart the backend:
   ```bash
   uvicorn app.main:app --reload
   ```

### Option 2: Using Provided Credentials

If you already have API keys from `projectc943@gmail.com`:

1. Login to each service with those credentials
2. Navigate to API keys section
3. Copy existing keys or generate new ones
4. Add to `backend/.env`

---

## Testing API Keys

### Test OpenWeather:
```bash
curl "https://api.openweathermap.org/data/2.5/weather?q=London&appid=YOUR_KEY"
```

### Test OpenAQ:
```bash
curl "https://api.openaq.org/v2/latest?limit=1&country=IN"
```

### Test NASA:
```bash
curl "https://api.nasa.gov/planetary/apod?api_key=YOUR_KEY"
```

---

## Security Notes

⚠️ **IMPORTANT**:
- `.env` is in `.gitignore` - never commit it!
- Use environment variables in production
- For Firebase deployment, set via `gcloud`:
  ```bash
  gcloud run services update capstone-backend \
    --set-env-vars OPENWEATHER_API_KEY=xxx,NASA_API_KEY=yyy
  ```

---

## Current Status

- ✅ `.env.example` created
- ✅ Backend code configured to read from environment
- ⏳ Need actual API keys added to `.env`

**Next**: Get keys and add them to `backend/.env`
