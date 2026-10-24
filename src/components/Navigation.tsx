import React from 'react';
import { UploadCloud, ListOrdered, History, Award, Trophy, Terminal, ShieldAlert } from 'lucide-react';

export type NavTab = 'uploader' | 'queue' | 'history' | 'plans' | 'leaderboard' | 'bot' | 'admin';

interface NavigationProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  queueCount: number;
  historyCount: number;
  isOwner: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onTabChange,
  queueCount,
  historyCount,
  isOwner,
}) => {
  const tabs = [
    {
      id: 'uploader' as NavTab,
      label: 'Descargas & ToDus',
      icon: UploadCloud,
    },
    {
      id: 'queue' as NavTab,
      label: 'Cola',
      icon: ListOrdered,
      badge: queueCount > 0 ? queueCount : undefined,
    },
    {
      id: 'history' as NavTab,
      label: 'Historial',
      icon: History,
      badge: historyCount > 0 ? historyCount : undefined,
    },
    {
      id: 'plans' as NavTab,
      label: 'Planes & Cuota',
      icon: Award,
    },
    {
      id: 'leaderboard' as NavTab,
      label: 'Top Usuarios',
      icon: Trophy,
    },
    {
      id: 'bot' as NavTab,
      label: 'Terminal Bot',
      icon: Terminal,
      highlight: true,
    },
    {
      id: 'admin' as NavTab,
      label: 'Admin Panel',
      icon: ShieldAlert,
      ownerOnly: false,
    },
  ];

  return (
    <nav className="border-b border-gray-800 bg-[#090d16] px-4 overflow-x-auto scrollbar-none">
      <div className="max-w-7xl mx-auto flex space-x-1 sm:space-x-2 py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)] font-mono'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/40 border border-transparent font-mono'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-gray-500'}`} />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-emerald-500 text-black' : 'bg-gray-800 text-gray-300'
                }`}>
                  {tab.badge}
                </span>
              )}
              {tab.id === 'admin' && isOwner && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
