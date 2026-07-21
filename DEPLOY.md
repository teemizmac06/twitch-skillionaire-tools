# Complete Step-by-Step Deployment Guide
# twitch-skillionaire-tools → Vercel → Telegram Bot

Follow every step in order. Do not skip any step.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 1 — UNDERSTAND YOUR REPO STRUCTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your GitHub repo (twitch-skillionaire-tools) must look like this:

twitch-skillionaire-tools/
├── public/                        ← All HTML files go here
│   ├── index.html                 ← Landing page (Vercel serves this)
│   ├── twitch-audit-pro.html
│   ├── streamscope-audit.html
│   └── proof-generator.html
│
├── api/                           ← Serverless functions
│   ├── health.js
│   ├── telegram/
│   │   └── webhook.js
│   └── analyze/
│       ├── index.js
│       └── screenshots.js
│
├── services/
│   ├── analyzer.js
│   ├── imageGenerator.js
│   └── telegram.js
│
├── lib/
│   ├── telegram.js
│   └── twitch.js
│
├── config/
│   └── index.js
│
├── utils/
│   └── logger.js
│
├── scripts/
│   └── register-webhook.js
│
├── package.json
├── vercel.json                    ← Tells Vercel what to serve
├── .gitignore
└── .env.example

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 2 — CREATE YOUR TELEGRAM BOT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You said you already have the bot token from BotFather.
If not, do this:

1. Open Telegram on your phone
2. Search for: @BotFather
3. Send: /newbot
4. Name: Skillonaire AI Bot
5. Username: SkillionaireAIBot (must end in "bot")
6. BotFather sends you a token like:
   7123456789:AAFxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
7. SAVE THIS TOKEN — you need it in Step 4

Get your personal Telegram User ID:
1. Search for: @userinfobot on Telegram
2. Send any message
3. It replies with your ID number like: 987654321
4. SAVE THIS NUMBER too

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 3 — UPLOAD FILES TO GITHUB
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Option A — Using GitHub website (easiest):

1. Go to github.com and open your "twitch-skillionaire-tools" repo
2. Delete everything in the repo first (Settings → scroll down → Delete repository,
   then create a fresh one with the same name)
3. Click "uploading an existing file"
4. Upload ALL files maintaining the folder structure:
   - Drag the entire twitch-skillionaire-tools folder
5. Click "Commit changes"

Option B — Using Git on your computer:

Open terminal/command prompt and run:

  cd Desktop
  git clone https://github.com/YOUR-USERNAME/twitch-skillionaire-tools.git
  cd twitch-skillionaire-tools

  # Delete old files
  git rm -rf .

  # Copy all new files into this folder
  # (copy everything from the twitch-skillionaire-tools folder you downloaded)

  git add .
  git commit -m "Complete rebuild with Telegram bot integration"
  git push origin main

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 4 — DEPLOY TO VERCEL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Go to vercel.com
2. Click "Add New Project"
3. Click "Import Git Repository"
4. Select your "twitch-skillionaire-tools" repo
5. On the Configure Project screen:
   - Framework Preset: OTHER (not Next.js, not anything else — just Other)
   - Root Directory: ./ (leave as default)
   - Build Command: LEAVE EMPTY (delete whatever is there)
   - Output Directory: public
   - Install Command: npm install
6. Click "Deploy"
7. Wait for it to finish — takes about 1-2 minutes
8. Vercel gives you a URL like:
   https://twitch-skillionaire-tools.vercel.app

Test it: open that URL in your browser.
You should see the landing page with 3 tool cards.
If you see it — the website is working ✅

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 5 — SET ENVIRONMENT VARIABLES ON VERCEL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This is the most important step. Without these, the bot won't work.

1. Go to vercel.com → Your project → Settings → Environment Variables
2. Add each variable one by one:

   Name: TELEGRAM_BOT_TOKEN
   Value: (paste your bot token from BotFather)
   Environment: Production ✅ Preview ✅ Development ✅

   Name: TELEGRAM_WEBHOOK_SECRET
   Value: (make up any random string, e.g. mySecretKey2024abc)
   Environment: Production ✅ Preview ✅ Development ✅

   Name: TELEGRAM_ALLOWED_USERS
   Value: (your Telegram user ID number, e.g. 987654321)
   Environment: Production ✅ Preview ✅ Development ✅

   Name: APP_URL
   Value: https://twitch-skillionaire-tools.vercel.app
   (use YOUR actual Vercel URL)
   Environment: Production ✅ Preview ✅ Development ✅

   Name: TWITCH_CLIENT_ID
   Value: wck0uw2mywx841acjavyzpcay6yupg
   Environment: Production ✅ Preview ✅ Development ✅

   Name: TWITCH_CLIENT_SECRET
   Value: nodd91qd27x5njgk6fq4kh8w6osqhy
   Environment: Production ✅ Preview ✅ Development ✅

3. After adding all 6 variables, click "Redeploy" at the top of the page
   → This forces Vercel to pick up the new env vars
   → Wait for deployment to finish

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 6 — TEST THE API IS WORKING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Open your browser and visit:

  https://twitch-skillionaire-tools.vercel.app/api/health

You should see:
  {"ok":true,"service":"Skillonaire AI Bot","version":"1.0.0",...}

If you see that — the API is running ✅
If you see an error — check Step 5, make sure env vars are saved and redeployed.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 7 — REGISTER THE TELEGRAM WEBHOOK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This tells Telegram: "When someone messages my bot, send it to my Vercel app."

You only run this ONCE.

Option A — Using your browser (easiest, no terminal needed):

Copy this URL and open it in your browser,
replacing YOUR_TOKEN and YOUR_SECRET and YOUR_VERCEL_URL:

https://api.telegram.org/botYOUR_TOKEN/setWebhook?url=YOUR_VERCEL_URL/api/telegram/webhook&secret_token=YOUR_SECRET

Example (with fake values):
https://api.telegram.org/bot7123456789:AAFxxxx/setWebhook?url=https://twitch-skillionaire-tools.vercel.app/api/telegram/webhook&secret_token=mySecretKey2024abc

You should see:
  {"ok":true,"result":true,"description":"Webhook was set"}

Webhook registered ✅

Option B — Using terminal:

  curl "https://api.telegram.org/botYOUR_TOKEN/setWebhook" \
    -d "url=https://twitch-skillionaire-tools.vercel.app/api/telegram/webhook" \
    -d "secret_token=YOUR_WEBHOOK_SECRET" \
    -d "allowed_updates=[\"message\"]"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 8 — VERIFY WEBHOOK IS REGISTERED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Open this in your browser (replace YOUR_TOKEN):

https://api.telegram.org/botYOUR_TOKEN/getWebhookInfo

You should see something like:
{
  "ok": true,
  "result": {
    "url": "https://twitch-skillionaire-tools.vercel.app/api/telegram/webhook",
    "has_custom_certificate": false,
    "pending_update_count": 0,
    "last_error_message": ""    ← This should be empty
  }
}

If "url" shows your webhook URL — you're ready ✅
If "last_error_message" shows an error — see TROUBLESHOOTING below.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 9 — TEST THE BOT ON TELEGRAM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Open Telegram
2. Search for your bot by its username
3. Press START or send: /start
   → Bot should reply with welcome message ✅

4. Send a Twitch URL:
   https://twitch.tv/draconian920

5. Bot immediately replies:
   "✅ Channel received: @draconian920
    ⏳ Generating your Twitch audit report..."

6. Wait 30–60 seconds

7. Bot sends 9 proof images one by one

8. Bot sends final summary:
   "✅ All 9 images delivered!
    Health Score: 56/100
    Followers: 498
    ..."

Everything working ✅ You're done!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TROUBLESHOOTING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PROBLEM: Vercel shows "No Production Deployment Found"
FIX: Your vercel.json was wrong. With the new files, this is fixed.
     Make sure "Output Directory" is set to "public" in Vercel settings.

PROBLEM: Website loads but shows blank page
FIX: Make sure index.html is inside the /public/ folder, not the root.

PROBLEM: Bot doesn't reply at all
FIX: 
  1. Check webhook: browser → api.telegram.org/botTOKEN/getWebhookInfo
  2. Check Vercel logs: vercel.com → Project → Functions → webhook.js → View logs
  3. Make sure TELEGRAM_ALLOWED_USERS has your correct user ID

PROBLEM: Bot replies "Unauthorized"  
FIX: Your Telegram user ID in TELEGRAM_ALLOWED_USERS is wrong.
     Get it again from @userinfobot and update the env var on Vercel, then redeploy.

PROBLEM: Bot replies with error after sending URL
FIX: Check that TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET are set correctly.
     Test: browser → your-vercel-url/api/analyze?username=ninja
     Should return JSON with channel data.

PROBLEM: Images not generated / only text summary sent
FIX: The image generation uses Puppeteer (runs a headless browser on Vercel).
     Check Vercel function logs for errors.
     Make sure @sparticuz/chromium is listed in package.json dependencies.

PROBLEM: Webhook returns 401
FIX: Your TELEGRAM_WEBHOOK_SECRET doesn't match what you registered.
     They must be identical. Re-register the webhook with the correct secret.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUICK REFERENCE — ALL URLS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your website:
  https://twitch-skillionaire-tools.vercel.app

Twitch Audit Pro:
  https://twitch-skillionaire-tools.vercel.app/twitch-audit-pro.html

StreamScope Audit:
  https://twitch-skillionaire-tools.vercel.app/streamscope-audit.html

Proof Generator:
  https://twitch-skillionaire-tools.vercel.app/proof-generator.html

Health check (API working?):
  https://twitch-skillionaire-tools.vercel.app/api/health

Test analysis API:
  https://twitch-skillionaire-tools.vercel.app/api/analyze?username=ninja

Webhook URL (for Telegram):
  https://twitch-skillionaire-tools.vercel.app/api/telegram/webhook

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WHEN YOU MAKE CHANGES LATER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Whenever you update any file:
1. Upload/push the changed file to GitHub
2. Vercel automatically redeploys in ~1 minute
3. No need to re-register the webhook — it stays registered forever

That's it. The bot is fully production-ready.
