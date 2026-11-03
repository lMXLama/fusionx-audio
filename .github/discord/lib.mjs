// Kleine Hilfe für die Discord-REST-API (v10). Läuft in GitHub Actions mit Node 22.
export const TOKEN = process.env.DISCORD_BOT_TOKEN || '';
export const GUILD = process.env.DISCORD_GUILD_ID || '';
const API = process.env.DISCORD_API || 'https://discord.com/api/v10';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function api(method, path, body, { reason, quiet } = {}) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const headers = { Authorization: 'Bot ' + TOKEN, 'User-Agent': 'DiscordBot (https://github.com/lMXLama/fusionx-audio, 1.0)' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (reason) headers['X-Audit-Log-Reason'] = encodeURIComponent(reason);
    const res = await fetch(API + path, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
    if (res.status === 429) {
      const j = await res.json().catch(() => ({}));
      await sleep(Math.ceil((j.retry_after || 1) * 1000) + 100);
      continue;
    }
    const text = await res.text();
    const data = text ? (() => { try { return JSON.parse(text); } catch (_) { return text; } })() : null;
    if (!res.ok) {
      const err = new Error(method + ' ' + path + ' → ' + res.status + ' ' + (typeof data === 'string' ? data : JSON.stringify(data)));
      err.status = res.status; err.data = data;
      if (quiet) return null;
      throw err;
    }
    return data;
  }
  throw new Error('Discord-Rate-Limit: ' + method + ' ' + path);
}

// Bits für Berechtigungen (als BigInt, Discord erwartet Strings)
export const P = {
  ADMINISTRATOR: 1n << 3n, KICK: 1n << 1n, BAN: 1n << 2n, MANAGE_CHANNELS: 1n << 4n, ADD_REACTIONS: 1n << 6n,
  VIEW: 1n << 10n, SEND: 1n << 11n, MANAGE_MESSAGES: 1n << 13n, EMBED: 1n << 14n, ATTACH: 1n << 15n, HISTORY: 1n << 16n,
  MENTION_EVERYONE: 1n << 17n, CONNECT: 1n << 20n, SPEAK: 1n << 21n, MANAGE_ROLES: 1n << 28n, MANAGE_WEBHOOKS: 1n << 29n,
  SLASH: 1n << 31n, MANAGE_THREADS: 1n << 34n, CREATE_PUBLIC_THREADS: 1n << 35n, SEND_IN_THREADS: 1n << 38n, MODERATE: 1n << 40n
};
export const bits = (...xs) => xs.reduce((a, b) => a | b, 0n).toString();

import { appendFileSync } from 'node:fs';
export function summary(line) {
  console.log(line);
  if (process.env.GITHUB_STEP_SUMMARY) { try { appendFileSync(process.env.GITHUB_STEP_SUMMARY, line + '\n'); } catch (_) {} }
}
