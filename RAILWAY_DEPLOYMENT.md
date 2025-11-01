# Railway Deployment Guide - farm-chat-service

## Quick Deploy Steps

### 1. Create New Railway Project

1. Go to: https://railway.app/
2. Click "Start a New Project"
3. Select "Deploy from GitHub repo"
4. Connect your GitHub account and select this repository
5. Select the `farm-chat-service` directory

### 2. Configure Environment Variables

Add these variables in Railway dashboard (Settings → Variables):

```
PORT=3000
NODE_ENV=production
GROQ_API_KEY=<your_groq_api_key>
WHATSAPP_VERIFY_TOKEN=farm_webhook_verify_2024
WHATSAPP_ACCESS_TOKEN=<get_permanent_token>
WHATSAPP_PHONE_NUMBER_ID=<your_phone_number_id>
WHATSAPP_API_URL=https://graph.facebook.com/v17.0
FARM_API_URL=https://your-farmmanagement-api.up.railway.app
```

**Important**:
- Replace `WHATSAPP_ACCESS_TOKEN` with a permanent token (see below)
- Replace `FARM_API_URL` with your deployed FarmManagement API URL

### 3. Get Permanent WhatsApp Access Token

1. Go to: https://developers.facebook.com/apps
2. Select your app → Settings → Basic
3. Copy your "App Secret"
4. Go to: WhatsApp → API Setup
5. Under "Permanent tokens", click "Generate token"
6. Use this token instead of the temporary one

### 4. Configure Build Settings

Railway should auto-detect the Dockerfile. If not:

- **Root Directory**: `/farm-chat-service`
- **Dockerfile Path**: `Dockerfile`
- **Port**: `3000`

### 5. Deploy

Click "Deploy" and wait for the build to complete (~2-3 minutes).

### 6. Get Your URL & Update WhatsApp Webhook

Once deployed, Railway will give you a public URL like:
```
https://your-app-name.up.railway.app
```

**Update WhatsApp Webhook**:

1. Go to Meta Developer Console
2. WhatsApp → Configuration → Webhook
3. Update the callback URL to:
   ```
   https://your-app-name.up.railway.app/webhook
   ```
4. Verify token: `farm_webhook_verify_2024`
5. Subscribe to: `messages` field

### 7. Test

Send a WhatsApp message to your test number:
```
"muéstrame los animales"
```

## Alternative: CLI Deployment

```bash
cd /Users/pedroabarca/Projects/FARM/farm-chat-service

# Login to Railway
railway login

# Initialize project
railway init

# Add environment variables
railway variables set PORT=3000
railway variables set NODE_ENV=production
railway variables set GROQ_API_KEY=<your_groq_api_key>
railway variables set WHATSAPP_VERIFY_TOKEN=farm_webhook_verify_2024
railway variables set WHATSAPP_ACCESS_TOKEN=<your_permanent_token>
railway variables set WHATSAPP_PHONE_NUMBER_ID=<your_phone_number_id>
railway variables set WHATSAPP_API_URL=https://graph.facebook.com/v17.0
railway variables set FARM_API_URL=<your_farm_api_url>

# Deploy
railway up
```

## Troubleshooting

**Build fails?**
- Check Dockerfile is in the root of farm-chat-service directory
- Verify package.json and bun.lockb exist

**Webhook verification fails?**
- Check WHATSAPP_VERIFY_TOKEN matches Meta console
- View logs: `railway logs`

**Can't connect to FarmManagement API?**
- Verify FARM_API_URL is correct and public
- Test: `curl https://your-farm-api/api/animals`

**WhatsApp messages not received?**
- Check Railway logs for incoming requests
- Verify webhook is subscribed to "messages" field
- Check WHATSAPP_ACCESS_TOKEN is valid (not expired)
