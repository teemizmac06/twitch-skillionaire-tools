'use strict';

const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const current = LEVELS[process.env.LOG_LEVEL || 'info'] ?? 1;

function out(level, msg, meta = {}) {
  if (LEVELS[level] < current) return;
  const line = JSON.stringify({ ts: new Date().toISOString(), level, msg, ...meta });
  level === 'error' ? console.error(line) : console.log(line);
}

module.exports = {
  debug: (m, x) => out('debug', m, x),
  info:  (m, x) => out('info',  m, x),
  warn:  (m, x) => out('warn',  m, x),
  error: (m, x) => out('error', m, x),
};
