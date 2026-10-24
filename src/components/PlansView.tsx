import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Clock, 
  DollarSign, 
  Share2, 
  Copy, 
  Check, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Zap, 
  Lock
} from 'lucide-react';
import { AppStorage } from '../lib/storage';
import { PLANS, formatBytes, DEFAULT_CONFIG } from '../lib/constants';
import { PlanKey } from '../types';

interface PlansViewProps {
  activeUserId: number;
  onRefresh: () => void;
}

export const PlansView: React.FC<PlansViewProps> = ({ activeUserId, onRefresh }) => {
  const [currentUser, setCurrentUser] = useState(() => AppStorage.getUser(activeUserId));
  const [activePlanKey, setActivePlanKey] = useState<PlanKey>(() => AppStorage.getUserPlan(activeUserId));
  const [copiedRef, setCopiedRef] = useState(false);
  const [purchaseNotice, setPurchaseNotice] = useState<{ text: string; error?: boolean } | null>(null);
  const [countdownStr, setCountdownStr] = useState('');

  // Daily quota usage
  const usage = AppStorage.getUserDailyUsage(activeUserId);
  const activePlan = PLANS[activePlanKey];
  const isOwner = activeUserId === DEFAULT_CONFIG.owner_telegram_id;

  // Countdown timer to 00:00 UTC
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
      const diffSec = Math.max(0, Math.floor((tomorrow.getTime() - now.getTime()) / 1000));
      const hours = Math.floor(diffSec / 3600);
      const mins = Math.floor((diffSec % 3600) / 60);
      const secs = diffSec % 60;
      setCountdownStr(`${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')} (UTC)`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const referralLink = `https://t.me/Downfree_jk_bot?start=ref_${activeUserId}`;

  const handleCopyRef = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2500);
  };

  const handleBuyPlan = (planKey: PlanKey) => {
    setPurchaseNotice(null);
    const result = AppStorage.purchasePlan(activeUserId, planKey);
    if (result.success) {
      setPurchaseNotice({ text: result.message });
      setCurrentUser(AppStorage.getUser(activeUserId));
      setActivePlanKey(AppStorage.getUserPlan(activeUserId));
      onRefresh();
    } else {
      setPurchaseNotice({ text: result.message, error: true });
    }
    setTimeout(() => setPurchaseNotice(null), 5000);
  };

  // Quota percentage calculation
  const usedToday = usage.bytesToday;
  const limitToday = activePlan.daily_bytes;
  const percentageUsed = isOwner || limitToday === Infinity ? 0 : Math.min(100, Math.floor((usedToday / limitToday) * 100));

  return (
    <div className="space-y-6 font-mono">
      {/* Quota & Balance Dashboard Card */}
      <div className="terminal-card rounded-xl p-5 border border-emerald-500/20 bg-[#0d1322] space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-emerald-400 font-bold text-xs flex items-center gap-2">
              <Award className="w-4 h-4" />
              <span>ESTADO DE TU CUOTA DIARIA & SALDO</span>
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-white flex items-center gap-2">
                <span>{activePlan.badge}</span>
                <span>{activePlan.display}</span>
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                TTL {activePlan.storage_label}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-gray-950 rounded-xl border border-gray-800 text-right">
              <span className="text-[11px] text-gray-400 block">Saldo Virtual:</span>
              <span className="text-lg font-bold text-amber-400 flex items-center justify-end gap-1">
                <DollarSign className="w-4 h-4" />
                {isOwner ? 'Ilimitado' : `${currentUser.balance}$`}
              </span>
            </div>
          </div>
        </div>

        {/* Quota Progress Bar */}
        {!isOwner && limitToday !== Infinity && (
          <div className="space-y-2 pt-2 border-t border-gray-800">
            <div className="flex justify-between text-xs text-gray-300">
              <span>Consumo del periodo: {formatBytes(usedToday)}</span>
              <span className="text-emerald-400 font-bold">{formatBytes(Math.max(0, limitToday - usedToday))} restantes</span>
            </div>
            <div className="h-2.5 w-full bg-gray-900 rounded-full overflow-hidden border border-gray-800">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  percentageUsed > 85 ? 'bg-red-500' : percentageUsed > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${percentageUsed}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-gray-500">
              <span>0 GB</span>
              <span>Límite: {activePlan.daily_label}</span>
            </div>
          </div>
        )}

        {/* Reset Countdown notice */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-gray-950/70 rounded-xl border border-gray-800 text-xs">
          <div className="flex items-center gap-2 text-gray-300">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>Próximo reinicio de cuota:</span>
          </div>
          <span className="text-emerald-400 font-bold tracking-wider">
            {countdownStr || 'Calculando...'}
          </span>
        </div>
      </div>

      {/* Purchase feedback banner */}
      {purchaseNotice && (
        <div className={`p-4 rounded-xl border text-xs flex items-center gap-2 ${
          purchaseNotice.error 
            ? 'bg-red-950/60 border-red-500/40 text-red-300' 
            : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
        }`}>
          {purchaseNotice.error ? (
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{purchaseNotice.text}</span>
        </div>
      )}

      {/* Available Plans Grid */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <span>🛒 CATÁLOGO DE PLANES Y PRECIOS</span>
          <span className="text-xs text-gray-500 font-normal">
            (Paga con saldo de referidos o recarga)
          </span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(['free', 'vip_basic', 'vip_medium', 'premium'] as PlanKey[]).map((key) => {
            const plan = PLANS[key];
            const isCurrent = activePlanKey === key;
            const canAfford = currentUser.balance >= plan.price_value;
            const isFree = key === 'free';

            return (
              <div
                key={key}
                className={`terminal-card rounded-xl p-5 border flex flex-col justify-between transition-all ${
                  isCurrent
                    ? 'border-emerald-500 bg-emerald-950/20 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                    : 'border-gray-800 hover:border-gray-700'
                }`}
              >
                <div className="space-y-4">
                  {/* Badge & Title */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{plan.badge}</span>
                      <div>
                        <h4 className="font-bold text-white text-sm">{plan.display}</h4>
                        <span className="text-[10px] text-gray-400">{plan.name}</span>
                      </div>
                    </div>
                    {isCurrent && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500 text-black font-bold uppercase">
                        Activo
                      </span>
                    )}
                  </div>

                  {/* Price */}
                  <div className="p-3 bg-gray-950 rounded-lg border border-gray-800 text-center">
                    <span className="text-2xl font-bold text-emerald-400">{plan.price}</span>
                    <span className="text-[10px] text-gray-500 block">
                      {isFree ? 'Sin costo mensual' : 'Duración: 30 días'}
                    </span>
                  </div>

                  {/* Feature specs */}
                  <ul className="space-y-2 text-xs text-gray-300">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>Cuota: <strong>{plan.daily_label}</strong></span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>Retención ToDus: <strong>{plan.storage_label}</strong></span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>Límite de cola: <strong>{plan.queue_limit} tareas</strong></span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>Reinicio de cuota: <strong>cada {plan.quota_period_days} {plan.quota_period_days === 1 ? 'día' : 'días'}</strong></span>
                    </li>
                  </ul>
                </div>

                {/* Buy Button */}
                <div className="pt-4 mt-4 border-t border-gray-800">
                  {isCurrent ? (
                    <button
                      disabled
                      className="w-full py-2 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-xs font-bold cursor-default flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Plan Actual</span>
                    </button>
                  ) : isFree ? (
                    <button
                      onClick={() => handleBuyPlan('free')}
                      className="w-full py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold cursor-pointer transition-colors"
                    >
                      Volver a Gratis
                    </button>
                  ) : canAfford ? (
                    <button
                      onClick={() => handleBuyPlan(key)}
                      className="w-full py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-colors shadow-lg shadow-emerald-500/20 cursor-pointer"
                    >
                      Comprar por {plan.price}
                    </button>
                  ) : (
                    <div className="space-y-1">
                      <button
                        disabled
                        className="w-full py-2 rounded-lg bg-gray-900 border border-gray-800 text-gray-500 text-xs font-bold flex items-center justify-center gap-1.5 cursor-not-allowed"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Saldo insuficiente</span>
                      </button>
                      <span className="text-[10px] text-gray-500 text-center block">
                        Faltan {plan.price_value - currentUser.balance}$
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Referral Program Section */}
      <div className="terminal-card rounded-xl p-5 border border-amber-500/20 bg-amber-950/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2">
              <Share2 className="w-4 h-4" />
              <span>SISTEMA DE REFERIDOS: GANA SALDO PARA PLANES</span>
            </h4>
            <p className="text-xs text-gray-300">
              Cada usuario nuevo que entre con tu enlace recibe su bienvenida de 5$ y tú ganas <strong>10$ de saldo</strong>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="text"
            readOnly
            value={referralLink}
            aria-label="Enlace de referido personal"
            className="flex-1 bg-gray-950 border border-amber-500/30 rounded-lg px-3 py-2 text-xs text-amber-300 select-all font-mono"
          />
          <button
            onClick={handleCopyRef}
            className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
          >
            {copiedRef ? (
              <>
                <Check className="w-3.5 h-3.5 text-black" />
                <span>¡Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar Enlace</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
