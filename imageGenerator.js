'use strict';

const chromium  = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');
const path      = require('path');
const fs        = require('fs');
const log       = require('../utils/logger');
const config    = require('../config');

const { width, height, renderTimeout, tempDir } = config.images;

// Ensure temp directory exists
function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// Launch Puppeteer with Sparticuz Chromium (works on Vercel)
async function launchBrowser() {
  return puppeteer.launch({
    args:            chromium.args,
    defaultViewport: { width, height },
    executablePath:  await chromium.executablePath(),
    headless:        chromium.headless,
  });
}

/**
 * Generate all proof images for a channel.
 * Returns an array of { name, buffer, caption } objects.
 */
async function generateImages(data, score, theme = 'light') {
  ensureDir(tempDir);

  const username = data.user.login;
  log.info('Generating images', { username, theme });

  const browser = await launchBrowser();
  const results  = [];

  try {
    const page = await browser.newPage();
    await page.setViewport({ width, height });

    // Inject the proof generator HTML from the audit site
    // It runs all canvas drawing client-side, then we screenshot each canvas
    const proofGeneratorUrl = `${config.app.url}/proof-generator.html`;
    await page.goto(proofGeneratorUrl, { waitUntil: 'networkidle0', timeout: 30000 });

    // Inject channel data and trigger rendering
    await page.evaluate(async (d, s, t) => {
      // Set theme
      window._theme = t;
      window._data  = d;
      window._score = s;
      window._avImg = null; // server-side: no image loading needed

      // Trigger render
      if (typeof renderAll === 'function') await renderAll();
    }, data, score, theme);

    // Wait for canvases to be populated
    await page.waitForTimeout(2000);

    // Screenshot all 4 canvases matching your 4 proof images
    const canvasIds = [
      { id: 'c0', name: `01-${username}-channel-performance`,  caption: '📊 Overall Channel Performance' },
      { id: 'c1', name: `02-${username}-growth-vs-potential`,  caption: '📈 Current Growth vs What It Should Be' },
      { id: 'c2', name: `03-${username}-readiness`,            caption: '🎯 Affiliate / Partner Readiness' },
      { id: 'c3', name: `04-${username}-creator-iq`,           caption: '🧠 Creator Intelligence & Viral Score' },
    ];

    for (const cv of canvasIds) {
      try {
        const buffer = await page.evaluate((canvasId) => {
          const c = document.getElementById(canvasId);
          if (!c) return null;
          return c.toDataURL('image/png').split(',')[1]; // base64
        }, cv.id);

        if (buffer) {
          const imgBuffer = Buffer.from(buffer, 'base64');
          const filepath  = path.join(tempDir, cv.name+'.png');
          fs.writeFileSync(filepath, imgBuffer);
          results.push({ name: cv.name+'.png', buffer: imgBuffer, caption: cv.caption, filepath });
          log.info('Image generated', { name: cv.name });
        }
      } catch (err) {
        log.error('Failed to capture canvas', { canvas: cv.id, error: err.message });
        // Continue with remaining images
      }
    }

    // Also generate the 5 additional HD section images via the Twitch Audit Pro page
    const additionalSections = await generateAuditProImages(page, data, score, username, theme);
    results.push(...additionalSections);

  } finally {
    await browser.close();
  }

  log.info('Image generation complete', { username, count: results.length });
  return results;
}

/**
 * Generate images 5–9 by loading the Twitch Audit Pro page,
 * running the analysis, and triggering the HD canvas download system.
 */
async function generateAuditProImages(page, data, score, username, theme) {
  const results = [];

  try {
    const auditUrl = `${config.app.url}/twitch-audit-pro.html`;
    await page.goto(auditUrl, { waitUntil: 'networkidle0', timeout: 30000 });

    // Inject channel data directly
    await page.evaluate(async (d, s, t) => {
      window._lastD   = d;
      window._lastS   = s;
      window._hdTheme = t;

      // Pre-compute derived data that the HD system expects
      const fl  = s.followers;
      const gapF= (100-s.overall)/100;
      const discF=(100-Math.min(100,s.tagCount*10))/100;
      window._glData = {
        missedF: Math.round(fl*gapF*0.10+discF*140+(!s.hasBanner?42:0)+(!s.hasBio?28:0)),
        missedV: Math.round(fl*gapF*0.10*1.9),
        missedS: Math.round(fl*gapF*0.10*(s.isPartner?.07:s.isAff?.04:.01)),
        revLow:  s.revLow||0,
        revHigh: s.revHigh||0,
      };
      const curMo=Math.max(1,Math.floor(fl*0.005));
      const potMo=Math.max(curMo+2,Math.floor(curMo*1.42));
      window._cvpData={cur30:curMo,pot30:potMo,cur90:curMo*3,pot90:potMo*3,gap:potMo*3-curMo*3,fl};
      window._iq    = s.iq||0;
      window._viral = s.viral||0;
      window._strData = [
        s.hasAvatar && 'Custom profile logo set — strong brand recognition',
        s.hasBanner && 'Offline banner configured — professional first impression',
        s.hasBio    && 'Channel bio is written — helps convert new visitors',
        s.tagCount>=6 && `${s.tagCount}/10 tags active — good discoverability`,
        s.hasSocial && 'Social media panel present — cross-platform reach',
      ].filter(Boolean);
      window._wknData = [
        !s.hasBanner  && 'No offline banner — visitors leave when offline',
        !s.hasBio     && 'No channel bio — new viewers have no context',
        s.tagCount<6  && `Only ${s.tagCount}/10 tags — low search visibility`,
        !s.hasSocial  && 'No social panel — missing cross-platform growth',
        s.streamFreq<3 && `Only ${s.streamFreq} streams/week — inconsistent schedule`,
      ].filter(Boolean);
    }, data, score, theme);

    // Trigger the 9-image generation — capture each canvas as it's generated
    const additionalCanvases = [
      { idx: 5, name: `05-${username}-growth-lost`,        caption: '💸 Estimated Growth Lost' },
      { idx: 6, name: `06-${username}-performance`,        caption: '📊 Performance Metrics' },
      { idx: 7, name: `07-${username}-prediction-revenue`, caption: '🚀 AI Prediction & Revenue' },
      { idx: 8, name: `08-${username}-strengths`,          caption: '✅ Strengths & Scorecard' },
      { idx: 9, name: `09-${username}-full-summary`,       caption: '📋 Full Channel Summary' },
    ];

    // We use downloadHDCard but intercept canvas data instead of downloading
    await page.evaluate((t) => {
      window._capturedCanvases = {};
      // Override the download function to capture instead
      window._origDlCanvas = window.dlCanvas;
      window.dlCanvas = async (cv, name) => {
        window._capturedCanvases[name] = cv.toDataURL('image/png').split(',')[1];
        return new Promise(r => setTimeout(r, 100));
      };
      window.downloadHDCard(t);
    }, theme);

    // Wait for generation
    await page.waitForTimeout(renderTimeout);

    // Collect captured canvases
    const captured = await page.evaluate(() => window._capturedCanvases || {});

    for (const cv of additionalCanvases) {
      const key = Object.keys(captured).find(k => k.includes(`0${cv.idx}`));
      if (key && captured[key]) {
        const buf = Buffer.from(captured[key], 'base64');
        const fp  = path.join(tempDir, cv.name+'.png');
        fs.writeFileSync(fp, buf);
        results.push({ name: cv.name+'.png', buffer: buf, caption: cv.caption, filepath: fp });
        log.info('Additional image captured', { name: cv.name });
      }
    }

  } catch (err) {
    log.error('Additional images failed', { error: err.message });
  }

  return results;
}

// Clean up temp files older than 1 hour
function cleanup(dir = tempDir) {
  try {
    const now = Date.now();
    fs.readdirSync(dir).forEach(f => {
      const fp = path.join(dir, f);
      const st = fs.statSync(fp);
      if (now - st.mtimeMs > 3600000) fs.unlinkSync(fp);
    });
  } catch (e) { /* silent */ }
}

module.exports = { generateImages, cleanup };
