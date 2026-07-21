'use strict';

const fetch  = (...a) => import('node-fetch').then(m => m.default(...a));
const FormData = require('form-data');
const log    = require('../utils/logger');
const config = require('../config');

const BASE = `${config.telegram.apiBase}/bot${config.telegram.token}`;

async function call(method, body = {}) {
  const url = `${BASE}/${method}`;
  const res = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.ok) {
    log.warn('Telegram API error', { method, desc: data.description });
    throw new Error(`Telegram ${method}: ${data.description}`);
  }
  return data.result;
}

// Send a plain text message
async function sendMessage(chatId, text, extra = {}) {
  return call('sendMessage', { chat_id: chatId, text, parse_mode: 'HTML', ...extra });
}

// Edit an existing message (for status updates)
async function editMessage(chatId, messageId, text) {
  return call('editMessageText', { chat_id: chatId, message_id: messageId, text, parse_mode: 'HTML' });
}

// Send a photo from a buffer
async function sendPhoto(chatId, imageBuffer, filename, caption = '') {
  const form = new FormData();
  form.append('chat_id', String(chatId));
  form.append('caption', caption, { contentType: 'text/plain' });
  form.append('photo', imageBuffer, { filename, contentType: 'image/png' });

  const url = `${BASE}/sendPhoto`;
  const res = await fetch(url, { method: 'POST', body: form });
  const data = await res.json();
  if (!data.ok) throw new Error(`sendPhoto: ${data.description}`);
  return data.result;
}

// Send a media group (album) of up to 10 photos
async function sendMediaGroup(chatId, images) {
  // images: [{ buffer, filename, caption }]
  const form = new FormData();
  form.append('chat_id', String(chatId));

  const media = images.map((img, i) => {
    const key = `photo_${i}`;
    form.append(key, img.buffer, { filename: img.filename, contentType: 'image/png' });
    return { type: 'photo', media: `attach://${key}`, caption: img.caption || '' };
  });

  form.append('media', JSON.stringify(media));

  const url = `${BASE}/sendMediaGroup`;
  const res = await fetch(url, { method: 'POST', body: form });
  const data = await res.json();
  if (!data.ok) throw new Error(`sendMediaGroup: ${data.description}`);
  return data.result;
}

// Set webhook
async function setWebhook(webhookUrl, secret) {
  return call('setWebhook', {
    url:          webhookUrl,
    secret_token: secret,
    allowed_updates: ['message', 'callback_query'],
    max_connections: 40,
  });
}

// Delete webhook
async function deleteWebhook() {
  return call('deleteWebhook');
}

// Get webhook info
async function getWebhookInfo() {
  return call('getWebhookInfo');
}

module.exports = { sendMessage, editMessage, sendPhoto, sendMediaGroup, setWebhook, deleteWebhook, getWebhookInfo };
