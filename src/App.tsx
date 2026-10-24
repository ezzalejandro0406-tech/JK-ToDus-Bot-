import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Navigation, NavTab } from './components/Navigation';
import { UploaderView } from './components/UploaderView';
import { QueueView } from './components/QueueView';
import { HistoryView } from './components/HistoryView';
import { PlansView } from './components/PlansView';
import { LeaderboardView } from './components/LeaderboardView';
import { AdminPanelView } from './components/AdminPanelView';
import { TelegramBotTerminal } from './components/TelegramBotTerminal';
import { AppStorage } from './lib/storage';
import { taskQueue } from './lib/taskQueue';
import { DEFAULT_CONFIG } from './lib/constants';

export const App: React.FC = () => {
  const [activeUserId, setActiveUserId] = useState<number>(() => AppStorage.getActiveUserId());
  const [currentTab, setCurrentTab] = useState<NavTab>('uploader');
  const [queueCount, setQueueCount] = useState<number>(0);
  const [historyCount, setHistoryCount] = useState<number>(0);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  // Subscribe to queue changes
  useEffect(() => {
    return taskQueue.subscribe((tasks) => {
      const active = tasks.filter(t => t.user_id === activeUserId && (t.state === 'queued' || t.state === 'uploading' || t.state === 'downloading'));
      setQueueCount(active.length);
    });
  }, [activeUserId]);

  // Update history count
  useEffect(() => {
    const history = AppStorage.getHistory(activeUserId);
    setHistoryCount(history.length);
  }, [activeUserId, refreshKey]);

  const handleUserChange = (newUserId: number) => {
    setActiveUserId(newUserId);
    AppStorage.setActiveUserId(newUserId);
    setRefreshKey(k => k + 1);
  };

  const handleRefresh = () => {
    setRefreshKey(k => k + 1);
  };

  const isOwner = activeUserId === DEFAULT_CONFIG.owner_telegram_id;

  return (
    <div className="min-h-screen bg-[#080c14] text-gray-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Top Header */}
      <Header
        activeUserId={activeUserId}
        onUserChange={handleUserChange}
        onRefresh={handleRefresh}
      />

      {/* Navigation Bar */}
      <Navigation
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        queueCount={queueCount}
        historyCount={historyCount}
        isOwner={isOwner}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {currentTab === 'uploader' && (
          <UploaderView
            activeUserId={activeUserId}
            onNavigateToPlans={() => setCurrentTab('plans')}
            onNavigateToQueue={() => setCurrentTab('queue')}
          />
        )}

        {currentTab === 'queue' && (
          <QueueView
            activeUserId={activeUserId}
          />
        )}

        {currentTab === 'history' && (
          <HistoryView
            activeUserId={activeUserId}
          />
        )}

        {currentTab === 'plans' && (
          <PlansView
            activeUserId={activeUserId}
            onRefresh={handleRefresh}
          />
        )}

        {currentTab === 'leaderboard' && (
          <LeaderboardView
            activeUserId={activeUserId}
          />
        )}

        {currentTab === 'admin' && (
          <AdminPanelView
            activeUserId={activeUserId}
            onRefresh={handleRefresh}
          />
        )}

        {currentTab === 'bot' && (
          <TelegramBotTerminal
            activeUserId={activeUserId}
            onNavigateTab={(tab) => setCurrentTab(tab)}
          />
        )}
      </main>

      {/* Terminal Footer */}
      <footer className="border-t border-gray-800/80 bg-[#070a10] py-4 px-6 text-xs text-gray-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-gray-400 font-bold">{DEFAULT_CONFIG.bot_name}</span>
            <span>•</span>
            <span className="text-emerald-400">{DEFAULT_CONFIG.bot_footer}</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-gray-500">
            <span>Servidor ToDus S3: s3.todus.cu/stream</span>
            <span>•</span>
            <span>AES-256 Cloud Backup Engine</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
