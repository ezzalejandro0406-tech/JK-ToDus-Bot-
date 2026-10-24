import React, { useState } from 'react';
import { Zap, User, RefreshCw, DollarSign, FileCode } from 'lucide-react';
import { PLANS, DEFAULT_CONFIG } from '../lib/constants';
import { AppStorage } from '../lib/storage';
import { CodeExportModal } from './CodeExportModal';

interface HeaderProps {
  activeUserId: number;
  onUserChange: (userId: number) => void;
  onRefresh: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeUserId, onUserChange, onRefresh }) => {
  const [showCodeModal, setShowCodeModal] = useState(false);
  const users = AppStorage.getUsers();
  const currentUser = AppStorage.getUser(activeUserId);
  const userPlanKey = AppStorage.getUserPlan(activeUserId);
  const planInfo = PLANS[userPlanKey];
  const isOwner = activeUserId === DEFAULT_CONFIG.owner_telegram_id;

  return (
    <>
      <header className="border-b border-emerald-500/20 bg-[#090d16]/95 backdrop-blur-xl sticky top-0 z-40 px-4 py-3.5 shadow-lg shadow-black/40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Logo and Bot Title */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600/20 to-cyan-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-mono font-bold shadow-[0_0_20px_rgba(16,185,129,0.25)]">
                <Zap className="w-5 h-5 text-emerald-400 animate-pulse" />
              </div>
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#090d16] animate-ping" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#090d16]" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base md:text-lg font-bold text-white tracking-wide flex items-center gap-1.5 font-sans">
                  <span>{DEFAULT_CONFIG.bot_name}</span>
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40 shadow-sm">
                  2026 Edition • ≥ 6.8 MB/s
                </span>
              </div>
              <p className="text-xs text-gray-400 font-mono flex items-center gap-2">
                <span>ToDus S3 High-Speed</span>
                <span className="text-gray-600">•</span>
                <span className="text-emerald-400/90 font-semibold">{DEFAULT_CONFIG.bot_creator}</span>
                <span className="text-gray-600">•</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                  ONLINE
                </span>
              </p>
            </div>
          </div>

          {/* Right Controls: One-Touch Code Export, User Switcher, Balance, Plan Badge */}
          <div className="flex items-center flex-wrap gap-2 text-xs font-mono">
            {/* One-Touch Server Code Button */}
            <button
              onClick={() => setShowCodeModal(true)}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/40 text-emerald-300 hover:brightness-125 transition-all flex items-center gap-1.5 cursor-pointer font-bold shadow-sm"
              title="Copiar bot.py, platform_downloads.py y Dockerfile de 1 toque"
            >
              <FileCode className="w-4 h-4 text-emerald-400" />
              <span>Copiar Scripts Python</span>
            </button>

            {/* User selector simulator */}
            <div className="flex items-center gap-2 bg-[#0d1424] border border-gray-800 rounded-xl px-3 py-1.5">
              <User className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-gray-400">Usuario:</span>
              <select
                value={activeUserId}
                onChange={(e) => onUserChange(Number(e.target.value))}
                aria-label="Seleccionar usuario activo"
                className="bg-transparent text-emerald-300 font-medium focus:outline-none cursor-pointer"
              >
                {Object.values(users).map((u) => (
                  <option key={u.user_id} value={u.user_id} className="bg-[#0d1424] text-white">
                    {u.first_name} ({u.user_id === DEFAULT_CONFIG.owner_telegram_id ? 'Owner' : `ID: ${u.user_id}`})
                  </option>
                ))}
              </select>
            </div>

            {/* Current Plan Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300">
              <span>{planInfo.badge}</span>
              <span className="font-semibold">{planInfo.display}</span>
              {isOwner && (
                <span className="ml-1 text-[10px] bg-emerald-500 text-black px-1.5 py-0.2 rounded-full font-bold">
                  ROOT
                </span>
              )}
            </div>

            {/* Virtual Balance */}
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-300 font-bold">
              <DollarSign className="w-3.5 h-3.5 text-amber-400" />
              <span>{isOwner ? '∞ $' : `${currentUser.balance}$`}</span>
            </div>

            {/* Refresh button */}
            <button
              onClick={onRefresh}
              title="Refrescar estado"
              aria-label="Refrescar estado de la aplicación"
              className="p-2 rounded-xl bg-gray-900 border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Code Export Modal */}
      <CodeExportModal
        isOpen={showCodeModal}
        onClose={() => setShowCodeModal(false)}
      />
    </>
  );
};
