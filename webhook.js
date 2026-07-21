'use strict';

const tg       = require('../../lib/telegram');
const svc      = require('../../services/telegram');
const analyzer = require('../../services/analyzer');
const imgGen   = require('../../services/imageGenerator');
const log      = require('../../utils/logger');
const config   = require('../../config');

// In-memory job tracker (resets on cold start — acceptable for serverless)
const jobs = new Map();

module.exports = async function handler(req, res) {
  // Only POST
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Verify Telegram webhook secret
  const secret = req.headers['x-telegram-bot-api-secret-token'];
  if (secret !== config.telegram.webhookSecret) {
    log.warn('Invalid webhook secret');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Always reply 200 immediately — Telegram will retry if we don't
  res.status(200).json({ ok: true });

  // Process asynchronously
  const update = req.body;
  try {
    await handleUpdate(update);
  } catch (err) {
    log.error('Update handler error', { error: err.message, stack: err.stack });
  }
};

async function handleUpdate(update) {
  const msg = update.message || update.edited_message;
  if (!msg) return;

  const chatId = msg.chat.id;
  const userId = msg.from?.id;
  const text   = (msg.text || '').trim();

  log.info('Message received', { chatId, userId, text: text.slice(0,100) });

  // Access control
  if (!svc.isAllowed(userId)) {
    log.warn('Unauthorized user', { userId });
    return tg.sendMessage(chatId, '⛔ This bot is private.\n\nContact the owner for access.');
  }

  // ── COMMANDS ─────────────────────────────────
  if (text.startsWith('/start')) {
    return tg.sendMessage(chatId, `
👋 <b>Welcome to Skillonaire AI Bot!</b>

I generate professional Twitch audit proof reports automatically.

<b>How to use:</b>
Just send me a Twitch channel link or username:

<code>https://twitch.tv/username</code>
or just
<code>username</code>

I'll analyze the channel and send you 9 HD proof images.

Type /help for all commands.
    `.trim());
  }

  if (text.startsWith('/help')) {
    return tg.sendMessage(chatId, `
<b>Skillonaire AI Bot — Commands</b>

/start — Welcome message
/help  — Show this message
/review &lt;username or url&gt; — Analyze a Twitch channel
/status — Check if the bot is running
/history — View recent scans

<b>Quick scan (no command needed):</b>
Just paste a Twitch URL or username and I'll start automatically.

<b>Supported:</b>
• twitch.tv/username
• https://twitch.tv/username
• username (plain text)
    `.trim());
  }

  if (text.startsWith('/status')) {
    return tg.sendMessage(chatId, '✅ Bot is online and ready.\n\nSend a Twitch URL or username to generate a report.');
  }

  if (text.startsWith('/history')) {
    const recent = [...jobs.entries()]
      .filter(([,j]) => j.userId === userId)
      .sort(([,a],[,b]) => b.ts - a.ts)
      .slice(0, 5);

    if (!recent.length) {
      return tg.sendMessage(chatId, 'No scans found yet.\n\nSend a Twitch URL to get started.');
    }

    const lines = recent.map(([id,j]) =>
      `• <code>${j.username}</code> — ${j.status} (${timeAgo(j.ts)})`
    ).join('\n');

    return tg.sendMessage(chatId, `<b>Recent scans:</b>\n\n${lines}`);
  }

  // ── REVIEW COMMAND ───────────────────────────
  let rawInput = text;
  if (text.startsWith('/review')) {
    rawInput = text.replace('/review', '').trim();
  }

  // Extract username
  const username = svc.extractUsername(rawInput);
  if (!username) {
    return tg.sendMessage(chatId, `
❓ <b>I need a Twitch username or URL.</b>

Examples:
• <code>https://twitch.tv/draconian920</code>
• <code>draconian920</code>
• <code>/review draconian920</code>
    `.trim());
  }

  // Rate limit check
  if (svc.isRateLimited(userId)) {
    return tg.sendMessage(chatId, '⏳ Please wait a minute before requesting another scan.');
  }
  svc.markUsed(userId);

  // ── START ANALYSIS ───────────────────────────
  const jobId = `${userId}_${Date.now()}`;
  jobs.set(jobId, { userId, username, status: 'running', ts: Date.now() });

  // Send immediate acknowledgement
  const ackMsg = await tg.sendMessage(chatId, `
✅ <b>Channel received: @${username}</b>

⏳ Generating your Twitch audit report...

This usually takes 30–60 seconds.
  `.trim());

  const t0 = Date.now();

  try {
    // Step 1: Analyze
    await tg.editMessage(chatId, ackMsg.message_id, `
🔍 <b>Analyzing @${username}...</b>

📡 Connecting to Twitch API...
    `.trim());

    const { data, score } = await analyzer.analyze(username);

    await tg.editMessage(chatId, ackMsg.message_id, `
🔍 <b>Analyzing @${username}...</b>

✅ Channel data loaded
🎨 Generating proof images...
    `.trim());

    // Step 2: Generate images
    const images = await imgGen.generateImages(data, score, 'light');

    await tg.editMessage(chatId, ackMsg.message_id, `
✅ <b>Report complete for @${username}</b>

📤 Sending ${images.length} proof images...
    `.trim());

    // Step 3: Deliver
    const sent = await svc.deliverImages(chatId, images, username);

    // Step 4: Final summary
    const elapsed = Math.round((Date.now()-t0)/1000);
    await tg.sendMessage(chatId, `
✅ <b>All ${sent} images delivered!</b>

📊 <b>@${username} Quick Summary:</b>
• Health Score: <b>${score.overall}/100</b>
• Followers: <b>${score.fmtFollowers}</b>
• Avg Viewers: <b>~${score.avgViewers}</b>
• Creator IQ: <b>${score.iq}</b>
• Viral Score: <b>${score.viral}%</b>
• Promo Ready: <b>${score.promoScore>=65?'✅ Yes':'❌ Not yet'}</b>
• Missing followers/mo: <b>~${score.missedF}</b>
• Missed revenue/mo: <b>$${score.revLow}–$${score.revHigh}</b>

⏱ Generated in ${elapsed}s
    `.trim());

    jobs.set(jobId, { userId, username, status: 'done', ts: Date.now(), sent });
    imgGen.cleanup();

  } catch (err) {
    log.error('Analysis failed', { username, error: err.message });
    jobs.set(jobId, { userId, username, status: 'error', ts: Date.now() });

    const errMsg = err.message === 'notfound'
      ? `❌ <b>Channel not found</b>\n\n<code>${username}</code> doesn't exist on Twitch.\n\nCheck the username and try again.`
      : `❌ <b>Analysis failed</b>\n\nError: ${err.message}\n\nPlease try again in a moment.`;

    await tg.sendMessage(chatId, errMsg);
  }
}

function timeAgo(ts) {
  const s = Math.floor((Date.now()-ts)/1000);
  if (s < 60)   return s+'s ago';
  if (s < 3600) return Math.floor(s/60)+'m ago';
  return Math.floor(s/3600)+'h ago';
}
