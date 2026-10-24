import { UserAccount, UserPlanEntry, DailyUsageEntry, HistoryItem, AdminAuditEvent, PlanKey } from '../types';
import { DEFAULT_CONFIG, PLANS, GIB } from './constants';

const USERS_STORAGE_KEY = 'jk_users_data';
const PLANS_STORAGE_KEY = 'jk_plans_data';
const USAGE_STORAGE_KEY = 'jk_usage_data';
const HISTORY_STORAGE_KEY = 'jk_history_data';
const AUDIT_STORAGE_KEY = 'jk_audit_data';
const ACTIVE_USER_ID_KEY = 'jk_active_user_id';

// Initial default seed users
const INITIAL_USERS: Record<string, UserAccount> = {
  '7935796405': {
    user_id: 7935796405,
    first_name: 'Jakudoshy',
    full_name: 'Jakudoshy ⚡ Oficial',
    username: 'jakudoshy',
    balance: 999999,
    welcome_reward: 5,
    first_seen: '2026-01-01T00:00:00.000Z',
    last_seen: new Date().toISOString(),
  },
  '582104921': {
    user_id: 582104921,
    first_name: 'Alejandro',
    full_name: 'Alejandro ToDus VIP',
    username: 'ale_todus',
    balance: 45,
    welcome_reward: 5,
    first_seen: '2026-02-15T10:20:00.000Z',
    last_seen: new Date().toISOString(),
    referred_by: 7935796405,
    referral_rewarded: true,
  },
  '120938472': {
    user_id: 120938472,
    first_name: 'Carlos',
    full_name: 'Carlos Havana',
    username: 'carlos_habana',
    balance: 15,
    welcome_reward: 5,
    first_seen: '2026-03-01T14:15:00.000Z',
    last_seen: new Date().toISOString(),
  },
  '698234112': {
    user_id: 698234112,
    first_name: 'Elena',
    full_name: 'Elena Games',
    username: 'elena_cu',
    balance: 5,
    welcome_reward: 5,
    first_seen: '2026-03-10T09:00:00.000Z',
    last_seen: new Date().toISOString(),
  },
};

const INITIAL_PLANS: Record<string, UserPlanEntry> = {
  '7935796405': {
    plan: 'owner',
    assigned_at: '2026-01-01T00:00:00.000Z',
  },
  '582104921': {
    plan: 'vip_medium',
    assigned_at: '2026-03-01T00:00:00.000Z',
    duration_days: 30,
    expires_at: new Date(Date.now() + 20 * 86400000).toISOString(),
  },
  '120938472': {
    plan: 'vip_basic',
    assigned_at: '2026-03-15T00:00:00.000Z',
    duration_days: 15,
    expires_at: new Date(Date.now() + 5 * 86400000).toISOString(),
  },
  '698234112': {
    plan: 'free',
    assigned_at: '2026-03-10T00:00:00.000Z',
  },
};

const INITIAL_USAGE: Record<string, DailyUsageEntry> = {
  '7935796405': {
    date: new Date().toISOString().slice(0, 10),
    period_start: new Date().toISOString(),
    bytes: 0,
    total_bytes: 148.5 * GIB,
  },
  '582104921': {
    date: new Date().toISOString().slice(0, 10),
    period_start: new Date().toISOString(),
    bytes: 3.4 * GIB,
    total_bytes: 84.2 * GIB,
  },
  '120938472': {
    date: new Date().toISOString().slice(0, 10),
    period_start: new Date().toISOString(),
    bytes: 1.2 * GIB,
    total_bytes: 32.8 * GIB,
  },
  '698234112': {
    date: new Date().toISOString().slice(0, 10),
    period_start: new Date().toISOString(),
    bytes: 0.6 * GIB,
    total_bytes: 14.1 * GIB,
  },
};

const INITIAL_HISTORY: Record<string, HistoryItem[]> = {
  '582104921': [
    {
      id: 'hist-1',
      user_id: 582104921,
      task_id: 't-9281',
      filename: 'Call_of_Duty_Mobile_v1.0.40.apk',
      size: 1980 * 1024 * 1024,
      created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
      expires_at: new Date(Date.now() + 3600000 * 44).toISOString(),
      urls: [
        'https://s3.todus.cu/stream/users/tg_582104921/telegram/20261024-110022-fa29be/telegram_48fa9180b721_Call_of_Duty_Mobile_v1.0.40.part001.apk',
        'https://s3.todus.cu/stream/users/tg_582104921/telegram/20261024-110022-fa29be/telegram_48fa9180b722_Call_of_Duty_Mobile_v1.0.40.part002.apk',
      ],
      is_parts: true,
      part_count: 2,
    },
    {
      id: 'hist-2',
      user_id: 582104921,
      task_id: 't-9282',
      filename: 'Trailer_Cyberpunk_4K.mp4',
      size: 450 * 1024 * 1024,
      created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
      expires_at: new Date(Date.now() + 3600000 * 30).toISOString(),
      urls: [
        'https://s3.todus.cu/stream/users/tg_582104921/telegram/20261023-221015-88e91a/telegram_09bc8729ff10_Trailer_Cyberpunk_4K.mp4',
      ],
      is_parts: false,
      part_count: 1,
    },
  ],
};

const INITIAL_AUDIT: AdminAuditEvent[] = [
  {
    at: new Date(Date.now() - 86400000 * 2).toISOString(),
    actor_id: 7935796405,
    target_id: 582104921,
    action: 'plan_assigned',
    plan: 'vip_medium',
    days: 30,
  },
  {
    at: new Date(Date.now() - 86400000 * 3).toISOString(),
    actor_id: 7935796405,
    target_id: 120938472,
    action: 'balance_granted',
    amount: 15,
    detail: 'Bono fidelidad grupo @videogameplay0406',
  },
];

export class AppStorage {
  private static load<T>(key: string, fallback: T): T {
    try {
      const saved = localStorage.getItem(key);
      if (!saved) return fallback;
      return JSON.parse(saved);
    } catch {
      return fallback;
    }
  }

  private static save<T>(key: string, data: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }

  // Users
  static getUsers(): Record<string, UserAccount> {
    return this.load<Record<string, UserAccount>>(USERS_STORAGE_KEY, INITIAL_USERS);
  }

  static saveUsers(users: Record<string, UserAccount>): void {
    this.save(USERS_STORAGE_KEY, users);
  }

  static getUser(userId: number): UserAccount {
    const users = this.getUsers();
    if (users[String(userId)]) {
      return users[String(userId)];
    }
    const newUser: UserAccount = {
      user_id: userId,
      first_name: `Usuario_${String(userId).slice(-4)}`,
      full_name: `Usuario ••••${String(userId).slice(-4)}`,
      username: `user_${userId}`,
      balance: DEFAULT_CONFIG.referral_start_balance,
      welcome_reward: DEFAULT_CONFIG.referral_start_balance,
      first_seen: new Date().toISOString(),
      last_seen: new Date().toISOString(),
    };
    users[String(userId)] = newUser;
    this.saveUsers(users);
    return newUser;
  }

  // Active User ID
  static getActiveUserId(): number {
    const raw = localStorage.getItem(ACTIVE_USER_ID_KEY);
    if (raw && !isNaN(Number(raw))) {
      return Number(raw);
    }
    return 7935796405; // Owner by default for full preview
  }

  static setActiveUserId(userId: number): void {
    localStorage.setItem(ACTIVE_USER_ID_KEY, String(userId));
  }

  // Plans
  static getPlans(): Record<string, UserPlanEntry> {
    return this.load<Record<string, UserPlanEntry>>(PLANS_STORAGE_KEY, INITIAL_PLANS);
  }

  static getUserPlan(userId: number): PlanKey {
    if (userId === DEFAULT_CONFIG.owner_telegram_id) return 'owner';
    const plans = this.getPlans();
    const entry = plans[String(userId)];
    if (!entry) return 'free';

    if (entry.expires_at) {
      const exp = new Date(entry.expires_at).getTime();
      if (Date.now() > exp) {
        return 'free';
      }
    }
    return entry.plan || 'free';
  }

  static setUserPlan(userId: number, planKey: PlanKey, days?: number, actorId = DEFAULT_CONFIG.owner_telegram_id): void {
    const plans = this.getPlans();
    const now = new Date();
    const entry: UserPlanEntry = {
      plan: planKey,
      assigned_at: now.toISOString(),
    };
    if (days && days > 0 && planKey !== 'free') {
      entry.duration_days = days;
      entry.expires_at = new Date(now.getTime() + days * 86400000).toISOString();
    }
    plans[String(userId)] = entry;
    this.save(PLANS_STORAGE_KEY, plans);

    this.addAudit({
      at: now.toISOString(),
      actor_id: actorId,
      target_id: userId,
      action: 'plan_assigned',
      plan: planKey,
      days: days || null,
    });
  }

  // Usage
  static getUsage(): Record<string, DailyUsageEntry> {
    return this.load<Record<string, DailyUsageEntry>>(USAGE_STORAGE_KEY, INITIAL_USAGE);
  }

  static getUserDailyUsage(userId: number): { bytesToday: number; totalBytes: number; resetDate: Date } {
    if (userId === DEFAULT_CONFIG.owner_telegram_id) {
      return { bytesToday: 0, totalBytes: 999 * GIB, resetDate: new Date() };
    }
    const usages = this.getUsage();
    const entry = usages[String(userId)] || {
      date: new Date().toISOString().slice(0, 10),
      period_start: new Date().toISOString(),
      bytes: 0,
      total_bytes: 0,
    };

    const todayStr = new Date().toISOString().slice(0, 10);
    const planKey = this.getUserPlan(userId);
    const plan = PLANS[planKey];

    // Reset date calculation in UTC
    const now = new Date();
    const resetDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));

    let currentDayBytes = entry.bytes;
    if (entry.date !== todayStr && plan.quota_period_days === 1) {
      currentDayBytes = 0;
    }

    return {
      bytesToday: currentDayBytes,
      totalBytes: entry.total_bytes,
      resetDate,
    };
  }

  static recordUsage(userId: number, bytesTransferred: number): void {
    const usages = this.getUsage();
    const todayStr = new Date().toISOString().slice(0, 10);
    const entry = usages[String(userId)] || {
      date: todayStr,
      period_start: new Date().toISOString(),
      bytes: 0,
      total_bytes: 0,
    };

    entry.bytes += bytesTransferred;
    entry.total_bytes += bytesTransferred;
    entry.date = todayStr;
    usages[String(userId)] = entry;
    this.save(USAGE_STORAGE_KEY, usages);
  }

  // Task History
  static getHistory(userId?: number): HistoryItem[] {
    const all = this.load<Record<string, HistoryItem[]>>(HISTORY_STORAGE_KEY, INITIAL_HISTORY);
    if (userId !== undefined) {
      return all[String(userId)] || [];
    }
    return Object.values(all).flat().sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  static addHistoryItem(userId: number, item: Omit<HistoryItem, 'id'>): HistoryItem {
    const all = this.load<Record<string, HistoryItem[]>>(HISTORY_STORAGE_KEY, INITIAL_HISTORY);
    const userItems = all[String(userId)] || [];
    const fullItem: HistoryItem = {
      ...item,
      id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    };
    userItems.unshift(fullItem);
    all[String(userId)] = userItems.slice(0, 50); // limit to 50
    this.save(HISTORY_STORAGE_KEY, all);
    return fullItem;
  }

  static deleteHistoryItem(userId: number, historyId: string): boolean {
    const all = this.load<Record<string, HistoryItem[]>>(HISTORY_STORAGE_KEY, INITIAL_HISTORY);
    const userItems = all[String(userId)];
    if (!userItems) return false;
    const initialLen = userItems.length;
    all[String(userId)] = userItems.filter(h => h.id !== historyId);
    this.save(HISTORY_STORAGE_KEY, all);
    return all[String(userId)].length < initialLen;
  }

  static clearUserHistory(userId: number): void {
    const all = this.load<Record<string, HistoryItem[]>>(HISTORY_STORAGE_KEY, INITIAL_HISTORY);
    delete all[String(userId)];
    this.save(HISTORY_STORAGE_KEY, all);
  }

  static clearAllHistory(): void {
    this.save(HISTORY_STORAGE_KEY, {});
  }

  // Audit
  static getAudit(): AdminAuditEvent[] {
    return this.load<AdminAuditEvent[]>(AUDIT_STORAGE_KEY, INITIAL_AUDIT);
  }

  static addAudit(event: AdminAuditEvent): void {
    const audit = this.getAudit();
    audit.unshift(event);
    this.save(AUDIT_STORAGE_KEY, audit.slice(0, 200));
  }

  // Balance
  static grantBalance(userId: number, amount: number, actorId = DEFAULT_CONFIG.owner_telegram_id, detail?: string): void {
    const users = this.getUsers();
    const user = this.getUser(userId);
    user.balance = (user.balance || 0) + amount;
    users[String(userId)] = user;
    this.saveUsers(users);

    this.addAudit({
      at: new Date().toISOString(),
      actor_id: actorId,
      target_id: userId,
      action: 'balance_granted',
      amount,
      detail: detail || 'Acreditación manual',
    });
  }

  static purchasePlan(userId: number, planKey: PlanKey): { success: boolean; message: string } {
    const plan = PLANS[planKey];
    if (!plan || planKey === 'free' || planKey === 'owner') {
      return { success: false, message: 'Este plan no está disponible para compra.' };
    }
    const user = this.getUser(userId);
    if (user.balance < plan.price_value) {
      return { success: false, message: `Saldo insuficiente. Tienes ${user.balance}$, necesitas ${plan.price_value}$.` };
    }

    user.balance -= plan.price_value;
    user.last_plan_purchase = {
      plan: planKey,
      price: plan.price_value,
      at: new Date().toISOString(),
    };
    const users = this.getUsers();
    users[String(userId)] = user;
    this.saveUsers(users);

    this.setUserPlan(userId, planKey, 30, userId);
    return { success: true, message: `¡Plan ${plan.display} activado por 30 días!` };
  }

  // Export full backup data object matching telegram_backup.py
  static createBackupManifest() {
    return {
      created_at: new Date().toISOString(),
      bot: DEFAULT_CONFIG.bot_name,
      owner_id: DEFAULT_CONFIG.owner_telegram_id,
      files: {
        'users.json': this.getUsers(),
        'user_plans.json': this.getPlans(),
        'daily_usage.json': this.getUsage(),
        'task_history.json': this.getHistory(),
        'admin_audit.json': this.getAudit(),
      },
    };
  }

  static restoreBackup(manifestJson: string): { success: boolean; restored: number; message: string } {
    try {
      const parsed = JSON.parse(manifestJson);
      const files = parsed.files || parsed;
      let count = 0;
      if (files['users.json']) {
        this.save(USERS_STORAGE_KEY, files['users.json']);
        count++;
      }
      if (files['user_plans.json']) {
        this.save(PLANS_STORAGE_KEY, files['user_plans.json']);
        count++;
      }
      if (files['daily_usage.json']) {
        this.save(USAGE_STORAGE_KEY, files['daily_usage.json']);
        count++;
      }
      if (files['task_history.json']) {
        this.save(HISTORY_STORAGE_KEY, files['task_history.json']);
        count++;
      }
      if (files['admin_audit.json']) {
        this.save(AUDIT_STORAGE_KEY, files['admin_audit.json']);
        count++;
      }
      return { success: true, restored: count, message: `Se restauraron ${count} módulos exitosamente.` };
    } catch (e) {
      return { success: false, restored: 0, message: 'Formato de respaldo JSON no válido.' };
    }
  }
}
