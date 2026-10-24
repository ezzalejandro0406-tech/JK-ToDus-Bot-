export type PlanKey = 'free' | 'vip_basic' | 'vip_medium' | 'premium' | 'owner';

export interface PlanInfo {
  key: PlanKey;
  name: string;        // small caps e.g. "ɢʀᴀᴛɪꜱ"
  display: string;     // standard e.g. "Plan Gratis"
  daily_bytes: number; // bytes or Infinity
  daily_label: string; // "2.00 GB", "10.00 GB", "Ilimitado"
  badge: string;       // "🆓", "⭐", "💎", "👑", "🜲"
  rank: number;
  price: string;       // "0$", "250$", "500$", "1000$", "∞"
  price_value: number; // 0, 250, 500, 1000
  storage_hours: number; // 12, 24, 48, 72
  storage_label: string; // "12 horas", "24 horas"
  quota_period_days: number; // 2 for free, 1 for others
  queue_limit: number; // 2, 4, 8, 12, 1000000
}

export interface UserAccount {
  user_id: number;
  first_name: string;
  full_name: string;
  username: string | null;
  balance: number;
  welcome_reward: number;
  first_seen: string;
  last_seen: string;
  referred_by?: number;
  referral_rewarded?: boolean;
  last_plan_purchase?: {
    plan: PlanKey;
    price: number;
    at: string;
  };
}

export interface UserPlanEntry {
  plan: PlanKey;
  assigned_at: string;
  expires_at?: string;
  duration_days?: number;
}

export interface DailyUsageEntry {
  date: string;
  period_start: string;
  bytes: number;
  total_bytes: number;
}

export type TaskState = 'queued' | 'downloading' | 'uploading' | 'paused' | 'cancelling' | 'completed' | 'failed';

export interface TransferTask {
  task_id: string;
  user_id: number;
  chat_id: number;
  source_kind: 'file_upload' | 'http_url' | 'platform_video';
  source_url?: string;
  filename: string;
  size: number;
  state: TaskState;
  created_at: number;
  updated_at: number;
  progress: {
    bytes: number;
    total: number;
    percentage: number;
    speed_bps: number;
    eta_seconds: number;
  };
  part_urls: { [partIndex: number]: string };
  part_names: string[];
  final_urls: string[];
  expires_at?: string;
  error?: string;
  cancel_requested?: boolean;
  txt_content?: string;
}

export interface HistoryItem {
  id: string;
  user_id: number;
  task_id: string;
  filename: string;
  size: number;
  created_at: string;
  expires_at: string;
  urls: string[];
  is_parts: boolean;
  part_count: number;
  cloud_expired_at?: string;
}

export interface AdminAuditEvent {
  at: string;
  actor_id: number;
  target_id: number;
  action: 'plan_assigned' | 'balance_granted' | 'history_cleared' | 'backup_created' | 'broadcast_sent';
  plan?: PlanKey;
  days?: number | null;
  amount?: number;
  detail?: string;
}

export interface SystemConfig {
  todus_base_url: string;
  owner_telegram_id: number;
  plan_admin_username: string;
  required_channel: string;
  required_group: string;
  channel_join_url: string;
  group_join_url: string;
  max_part_size_mib: number;
  max_concurrent_uploads: number;
  max_transfer_hours: number;
  bot_name: string;
  bot_creator: string;
  bot_footer: string;
  referral_start_balance: number;
  referral_reward: number;
}
