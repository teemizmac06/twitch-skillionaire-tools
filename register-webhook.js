#!/usr/bin/env node
'use strict';

/**
 * Run this once after deployment:
 *   node scripts/register-webhook.js
 *
 * Requires env vars: TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET, APP_URL
 */

const token   = process.env.TELEGRAM_BOT_TOKEN;
const secret  = process.env.TELEGRAM_WEBHOOK_SECRET;
const appUrl  = process.env.APP_URL;

if (!token || !secret || !appUrl) {
  console.error('❌ Missing env vars. Set TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET, APP_URL');
  process.exit(1);
}

const webhookUrl = `${appUrl}/api/telegram/webhook`;

async function run() {
  const fetch = (...a) => import('node-fetch').then(m => m.default(...a));

  console.log(`\n🔗 Registering webhook: ${webhookUrl}\n`);

  const res = await (await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      url:          webhookUrl,
      secret_token: secret,
      allowed_updates: ['message', 'edited_message'],
      max_connections: 40,
      drop_pending_updates: true,
    }),
  })).json();

  if (res.ok) {
    console.log('✅ Webhook registered successfully!');
    console.log(`   URL: ${webhookUrl}`);
  } else {
    console.error('❌ Failed:', res.description);
    process.exit(1);
  }

  // Verify
  const info = await (await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`)).json();
  console.log('\n📡 Webhook Info:');
  console.log(`   URL:            ${info.result?.url}`);
  console.log(`   Pending updates:${info.result?.pending_update_count}`);
  console.log(`   Last error:     ${info.result?.last_error_message || 'none'}`);
  console.log('\n✅ Done! Your bot is ready.\n');
}

run().catch(err => { console.error(err); process.exit(1); });
