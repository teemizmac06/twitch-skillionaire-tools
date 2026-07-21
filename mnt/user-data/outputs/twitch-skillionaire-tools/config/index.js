'use strict';

function req(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}
function opt(name, fallback = '') { return process.env[name] || fallback; }

module.exports = {
  telegram: {
    token:         req('TELEGRAM_BOT_TOKEN'),
    webhookSecret: req('TELEGRAM_WEBHOOK_SECRET'),
    allowedUsers:  opt('TELEGRAM_ALLOWED_USERS').split(',').map(s=>s.trim()).filter(Boolean),
    apiBase:       'https://api.telegram.org',
  },
  twitch: {
    clientId:     req('TWITCH_CLIENT_ID'),
    clientSecret: req('TWITCH_CLIENT_SECRET'),
  },
  app: {
    url: req('APP_URL'),   // e.g. https://your-project.vercel.app
  },
  images: {
    count:         9,
    width:         1440,
    height:        900,
    renderTimeout: 14000,
    tempDir:       '/tmp/audit-images',
  },
  rateLimit: {
    maxConcurrent: 2,
    minTime:       4000,
  },
  retry: {
    retries:    3,
    factor:     2,
    minTimeout: 1000,
    maxTimeout: 8000,
  },
  platforms: {
    twitch: {
      name:    'Twitch',
      enabled: true,
      extract: (url) => { const m = url.match(/twitch\.tv\/([a-zA-Z0-9_]{3,25})/); return m ? m[1].toLowerCase() : null; },
    },
    kick: {
      name:    'Kick',
      enabled: false,
      extract: (url) => { const m = url.match(/kick\.com\/([a-zA-Z0-9_]+)/); return m ? m[1].toLowerCase() : null; },
    },
    youtube: {
      name:    'YouTube',
      enabled: false,
      extract: (url) => { const m = url.match(/youtube\.com\/@([a-zA-Z0-9_]+)/); return m ? m[1].toLowerCase() : null; },
    },
    tiktok: {
      name:    'TikTok',
      enabled: false,
      extract: (url) => { const m = url.match(/tiktok\.com\/@([a-zA-Z0-9_.]+)/); return m ? m[1].toLowerCase() : null; },
    },
  },
  log: { level: opt('LOG_LEVEL', 'info') },
};
