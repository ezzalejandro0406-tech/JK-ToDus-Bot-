import { PlanInfo, PlanKey, SystemConfig } from '../types';

export const MIB = 1024 * 1024;
export const GIB = 1024 * 1024 * 1024;

export const DEFAULT_CONFIG: SystemConfig = {
  todus_base_url: 'https://s3.todus.cu/stream',
  owner_telegram_id: 7935796405,
  plan_admin_username: 'jakudoshy',
  required_channel: '@gg_no_root',
  required_group: '@videogameplay0406',
  channel_join_url: 'https://t.me/gg_no_root',
  group_join_url: 'https://t.me/videogameplay0406',
  max_part_size_mib: 1900,
  max_concurrent_uploads: 8,
  max_transfer_hours: 24,
  bot_name: 'JK DOWN BOTꫂꤪꤨᴼᶠᶜ',
  bot_creator: '@jakudoshy',
  bot_footer: 'MOD BY JAKUDOSHYꫂꤪꤨᴼᶠᶜ',
  referral_start_balance: 5,
  referral_reward: 10,
};

export const PLANS: Record<PlanKey, PlanInfo> = {
  free: {
    key: 'free',
    name: 'ɢʀᴀᴛɪꜱ',
    display: 'Plan Gratis',
    daily_bytes: 2 * GIB,
    daily_label: '2.00 GB',
    badge: '🆓',
    rank: 0,
    price: '0$',
    price_value: 0,
    storage_hours: 12,
    storage_label: '12 horas',
    quota_period_days: 2,
    queue_limit: 2,
  },
  vip_basic: {
    key: 'vip_basic',
    name: 'ᴠɪᴘ ʙáꜱɪᴄᴏ',
    display: 'VIP Básico',
    daily_bytes: 10 * GIB,
    daily_label: '10.00 GB',
    badge: '⭐',
    rank: 1,
    price: '250$',
    price_value: 250,
    storage_hours: 24,
    storage_label: '24 horas',
    quota_period_days: 1,
    queue_limit: 4,
  },
  vip_medium: {
    key: 'vip_medium',
    name: 'ᴠɪᴘ ᴍᴇᴅɪᴏ',
    display: 'VIP Medio',
    daily_bytes: 15 * GIB,
    daily_label: '15.00 GB',
    badge: '💎',
    rank: 2,
    price: '500$',
    price_value: 500,
    storage_hours: 48,
    storage_label: '48 horas',
    quota_period_days: 1,
    queue_limit: 8,
  },
  premium: {
    key: 'premium',
    name: 'ᴘʀᴇᴍɪᴜᴍ',
    display: 'Premium',
    daily_bytes: Infinity,
    daily_label: 'Ilimitado (∞ GB)',
    badge: '👑',
    rank: 3,
    price: '1000$',
    price_value: 1000,
    storage_hours: 72,
    storage_label: '72 horas',
    quota_period_days: 1,
    queue_limit: 12,
  },
  owner: {
    key: 'owner',
    name: 'ᴄʀᴇᴀᴅᴏʀ',
    display: 'Plan Creador',
    daily_bytes: Infinity,
    daily_label: '∞ GB',
    badge: '🜲',
    rank: 999,
    price: '∞',
    price_value: 0,
    storage_hours: 72,
    storage_label: '72 horas',
    quota_period_days: 1,
    queue_limit: 1000000,
  },
};

const SMALL_CAPS_MAP: Record<string, string> = {
  a: 'ᴀ', b: 'ʙ', c: 'ᴄ', d: 'ᴅ', e: 'ᴇ', f: 'ꜰ',
  g: 'ɢ', h: 'ʜ', i: 'ɪ', j: 'ᴊ', k: 'ᴋ', l: 'ʟ',
  m: 'ᴍ', n: 'ɴ', o: 'ᴏ', p: 'ᴘ', q: 'ꞯ', r: 'ʀ',
  s: 'ꜱ', t: 'ᴛ', u: 'ᴜ', v: 'ᴠ', w: 'ᴡ', x: 'ˣ',
  y: 'ʏ', z: 'ᴢ',
  á: 'ᴀ́', é: 'ᴇ́', í: 'ɪ́', ó: 'ᴏ́', ú: 'ᴜ́',
  ñ: 'ɴ̃', ü: 'ᴜ̈',
};

const PRESERVED_TOKEN_REGEX = /(https?:\/\/[^\s<>]+|@[a-zA-Z0-9_]+|\b[A-Z][A-Z0-9]*_[A-Z0-9_]+\b|\/[a-zA-Z0-9_]+|\b\d+\b)/g;

export function sc(text: string): string {
  if (!text) return '';
  return text.split(PRESERVED_TOKEN_REGEX).map((chunk, idx) => {
    if (idx % 2 === 1) return chunk;
    return chunk
      .split('')
      .map(ch => {
        const lower = ch.toLowerCase();
        return SMALL_CAPS_MAP[lower] || ch;
      })
      .join('');
  }).join('');
}

/**
 * Modern ultra-sleek 2026 card layout without ugly ASCII brackets (┎ ┠ ┖).
 * Uses clean cyber glass aesthetic, emojis, and modern separators.
 */
export function card(title: string, lines: string[]): string {
  const header = `⚡ <b>${title}</b>`;
  const content = lines.join('\n');
  const footer = `<i>✨ ${DEFAULT_CONFIG.bot_name} · ${DEFAULT_CONFIG.bot_creator}</i>`;
  return [header, '', content, '', footer].join('\n');
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 B';
  if (!isFinite(bytes)) return 'Ilimitado';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatSpeed(bps: number): string {
  return `${formatBytes(bps)}/s`;
}

export function formatSeconds(seconds: number): string {
  if (seconds < 0 || !isFinite(seconds)) return '--:--';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) {
    return `${hrs}h ${mins}m ${secs}s`;
  }
  return `${mins}m ${secs}s`;
}
