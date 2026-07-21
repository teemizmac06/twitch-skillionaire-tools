# Skillonaire AI Bot — Telegram Integration

Telegram bot for **Twitch Audit Pro**. Send a Twitch channel URL and receive 9 professional proof images automatically.

---

## How It Works

```
You → Telegram → Webhook → Vercel → Twitch API → Canvas Images → Telegram → You
```

1. You send `https://twitch.tv/username` to the bot
2. Bot receives it via Telegram webhook
3. Twitch API is called to fetch real channel data
4. Scoring engine runs the same analysis as the website
5. 9 HD proof images are generated (1440×900px each)
6. All images are sent back to you in Telegram automatically

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | ✅ | From @BotFather |
| `TELEGRAM_WEBHOOK_SECRET` | ✅ | Random secret string |
| `APP_URL` | ✅ | Your Vercel deployment URL |
| `TWITCH_CLIENT_ID` | ✅ | Twitch app client ID |
| `TWITCH_CLIENT_SECRET` | ✅ | Twitch app client secret |
| `TELEGRAM_ALLOWED_USERS` | ❌ | Comma-separated user IDs (leave empty = public) |
| `LOG_LEVEL` | ❌ | `debug` / `info` / `warn` / `error` |

---

## Setup

### 1. Create the Telegram Bot

1. Open Telegram → search **@BotFather**
2. Send `/newbot`
3. Name it: `Skillonaire AI Bot`
4. Copy the **bot token**

### 2. Get Your Telegram User ID

1. Message **@userinfobot** on Telegram
2. Copy your numeric ID
3. Add it to `TELEGRAM_ALLOWED_USERS` so only you can use it

### 3. Clone & Configure

```bash
git clone https://github.com/yourusername/your-repo.git
cd your-repo

# Copy env template
cp .env.example .env

# Fill in your values
nano .env
```

### 4. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Copy the deployment URL (e.g. https://your-project.vercel.app)
# Add it as APP_URL in your Vercel environment variables
```

**Set environment variables on Vercel:**
```bash
vercel env add TELEGRAM_BOT_TOKEN
vercel env add TELEGRAM_WEBHOOK_SECRET
vercel env add APP_URL
vercel env add TWITCH_CLIENT_ID
vercel env add TWITCH_CLIENT_SECRET
vercel env add TELEGRAM_ALLOWED_USERS
```

Or set them in the Vercel dashboard: **Project Settings → Environment Variables**

### 5. Register the Webhook

After deploying, run this once:

```bash
TELEGRAM_BOT_TOKEN=your_token \
TELEGRAM_WEBHOOK_SECRET=your_secret \
APP_URL=https://your-project.vercel.app \
node scripts/register-webhook.js
```

### 6. Test the Bot

1. Open Telegram
2. Find your bot by username
3. Send `/start`
4. Send any Twitch URL:
   ```
   https://twitch.tv/draconian920
   ```
5. Wait ~30-60 seconds
6. Receive 9 proof images ✅

---

## Commands

| Command | Description |
|---|---|
| `/start` | Welcome message |
| `/help` | Show all commands |
| `/review <username>` | Analyze a channel |
| `/status` | Check bot status |
| `/history` | View recent scans |

**Or just send a URL/username directly — no command needed.**

---

## Generated Images

| # | Image | Content |
|---|---|---|
| 01 | Channel Performance | Health score, followers, avg viewers, peak viewers, chatters |
| 02 | Growth vs Potential | Current trajectory vs optimized potential |
| 03 | Readiness | Partner/Affiliate readiness with progress bars |
| 04 | Creator IQ | Intelligence score, viral potential, content metrics |
| 05 | Growth Lost | Estimated missed followers, viewers, revenue |
| 06 | Performance | 9 performance metric cards |
| 07 | AI Prediction | 90-day growth forecast + revenue |
| 08 | Strengths | Strengths, weaknesses, health scorecard |
| 09 | Full Summary | Complete overview of all scores |

---

## Folder Structure

```
/api
  /telegram
    webhook.js        ← Receives Telegram messages
  /analyze
    index.js          ← Analysis REST API
    screenshots.js    ← Image generation API
  health.js           ← Health check

/services
  analyzer.js         ← Twitch data + scoring engine
  imageGenerator.js   ← Puppeteer canvas screenshots
  telegram.js         ← Message delivery logic

/lib
  telegram.js         ← Telegram Bot API client
  twitch.js           ← Twitch API client

/config
  index.js            ← All environment variables

/utils
  logger.js           ← Structured logging

/scripts
  register-webhook.js ← One-time webhook registration
```

---

## Adding New Platforms

To add Kick, YouTube, or TikTok:

1. Open `config/index.js`
2. Set `enabled: true` for the platform
3. The `extract` function already handles URL parsing
4. Add a new analyzer in `services/` if needed
5. Update `services/telegram.js` `detectPlatform()` if needed

---

## Troubleshooting

**Bot not responding:**
- Check webhook is registered: `curl https://api.telegram.org/botTOKEN/getWebhookInfo`
- Check Vercel function logs: `vercel logs`

**Images not generating:**
- Check `APP_URL` is set correctly
- Verify `@sparticuz/chromium` is installed

**Twitch API errors:**
- Verify `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET` are valid
- Check at: https://dev.twitch.tv/console/apps

**Rate limited:**
- Each user can scan once per minute
- Adjust `COOLDOWN_MS` in `services/telegram.js` if needed

---

## Commands After Deployment

```bash
# 1. Push to GitHub
git add .
git commit -m "Add Skillonaire AI Bot Telegram integration"
git push origin main

# 2. Deploy to Vercel
vercel --prod

# 3. Set env vars (if not already set)
vercel env add TELEGRAM_BOT_TOKEN production
vercel env add TELEGRAM_WEBHOOK_SECRET production
vercel env add APP_URL production
vercel env add TWITCH_CLIENT_ID production
vercel env add TWITCH_CLIENT_SECRET production

# 4. Redeploy with env vars
vercel --prod

# 5. Register webhook (run once)
TELEGRAM_BOT_TOKEN=xxx TELEGRAM_WEBHOOK_SECRET=xxx APP_URL=https://your-project.vercel.app \
node scripts/register-webhook.js

# 6. Test
# Open Telegram, send your bot: https://twitch.tv/username
```
