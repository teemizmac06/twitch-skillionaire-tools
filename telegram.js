'use strict';

const tg     = require('../lib/telegram');
const log    = require('../utils/logger');
const config = require('../config');

const { allowedUsers } = config.telegram;

// Simple in-memory rate limiter per user
const _cooldown = new Map();
const COOLDOWN_MS = 60000; // 1 minute between requests

function isAllowed(userId) {
  if (!allowedUsers.length) return true; // Open if no allowlist set
  return allowedUsers.includes(String(userId));
}

function isRateLimited(userId) {
  const last = _cooldown.get(String(userId)) || 0;
  return Date.now() - last < COOLDOWN_MS;
}

function markUsed(userId) {
  _cooldown.set(String(userId), Date.now());
}

// Extract Twitch username from a URL or plain text
function extractUsername(text) {
  if (!text) return null;
  const clean = text.trim().toLowerCase().replace(/^@/, '');

  // Full URL
  const urlMatch = clean.match(/twitch\.tv\/([a-z0-9_]{3,25})/);
  if (urlMatch) return urlMatch[1];

  // Plain username (no spaces, alphanumeric + underscore)
  if (/^[a-z0-9_]{3,25}$/.test(clean)) return clean;

  return null;
}

// Detect platform from URL (extensible for Kick/YouTube/TikTok)
function detectPlatform(text) {
  const t = (text||'').toLowerCase();
  for (const [key, plat] of Object.entries(config.platforms)) {
    if (!plat.enabled) continue;
    if (t.includes(key)) return key;
  }
  // Default to twitch if looks like a username
  if (/^[a-z0-9_]{3,25}$/.test(t.trim())) return 'twitch';
  return null;
}

/**
 * Send all generated images to Telegram.
 * Sends in batches of 10 (Telegram media group limit).
 */
async function deliverImages(chatId, images, username) {
  const BATCH = 10;
  let sent = 0;

  for (let i = 0; i < images.length; i += BATCH) {
    const batch = images.slice(i, i + BATCH);

    try {
      if (batch.length === 1) {
        // Single photo
        await tg.sendPhoto(chatId, batch[0].buffer, batch[0].name, batch[0].caption);
        sent++;
      } else {
        // Album
        await tg.sendMediaGroup(chatId, batch);
        sent += batch.length;
      }
      // Small delay between batches
      if (i + BATCH < images.length) await sleep(1500);
    } catch (err) {
      log.error('Batch delivery failed', { chatId, batch: i, error: err.message });
      // Try individual sends as fallback
      for (const img of batch) {
        try {
          await tg.sendPhoto(chatId, img.buffer, img.name, img.caption);
          sent++;
          await sleep(800);
        } catch (e2) {
          log.error('Individual image failed', { name: img.name, error: e2.message });
        }
      }
    }
  }

  return sent;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

module.exports = { isAllowed, isRateLimited, markUsed, extractUsername, detectPlatform, deliverImages };
