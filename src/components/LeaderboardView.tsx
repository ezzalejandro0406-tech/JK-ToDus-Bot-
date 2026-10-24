import React from 'react';
import { Trophy, Globe, Award, Database, User } from 'lucide-react';
import { AppStorage } from '../lib/storage';
import { PLANS, formatBytes, GIB, DEFAULT_CONFIG } from '../lib/constants';

interface LeaderboardViewProps {
  activeUserId: number;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({ activeUserId }) => {
  const users = AppStorage.getUsers();
  const usages = AppStorage.getUsage();

  // Calculate sorted rankings
  const rankings = Object.keys(users)
    .map((uidStr) => {
      const uid = Number(uidStr);
      const usage = usages[uidStr];
      const totalBytes = usage ? usage.total_bytes : 0;
      const plan = AppStorage.getUserPlan(uid);
      return {
        userId: uid,
        totalBytes,
        totalGb: totalBytes / GIB,
        planKey: plan,
        isMe: uid === activeUserId,
        maskedId: `••••${String(uid).slice(-4)}`,
      };
    })
    .sort((a, b) => b.totalBytes - a.totalBytes);

  const communityTotalBytes = rankings.reduce((acc, curr) => acc + curr.totalBytes, 0);
  const myPosition = rankings.findIndex(r => r.userId === activeUserId) + 1;

  return (
    <div className="space-y-6 font-mono">
      {/* Header Stat Banner */}
      <div className="terminal-card rounded-xl p-5 border border-emerald-500/20 bg-[#0d1322] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>TOP USUARIOS DE LA COMUNIDAD TODUS S3</span>
            </h2>
            <p className="text-xs text-gray-300 mt-0.5">
              Los usuarios con mayor cantidad de datos respaldados en la nube.
            </p>
          </div>

          <div className="flex items-center gap-2 p-3 bg-gray-950 rounded-xl border border-gray-800">
            <Globe className="w-5 h-5 text-emerald-400" />
            <div>
              <span className="text-[10px] text-gray-500 block">Total Comunidad:</span>
              <span className="text-sm font-bold text-emerald-400">
                {(communityTotalBytes / GIB).toFixed(2)} GB
              </span>
            </div>
          </div>
        </div>

        {/* My current standing */}
        <div className="p-3 bg-gray-950/60 rounded-lg border border-gray-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-gray-300">
            <User className="w-4 h-4 text-emerald-400" />
            <span>Tu posición en el ranking:</span>
          </div>
          <span className="font-bold text-white px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/30 text-emerald-300">
            Puesto #{myPosition > 0 ? myPosition : 'Sin registro'}
          </span>
        </div>
      </div>

      {/* Leaderboard Table / Cards */}
      <div className="terminal-card rounded-xl border border-gray-800 overflow-hidden">
        <div className="p-4 bg-gray-950/80 border-b border-gray-800 flex items-center justify-between text-xs text-gray-400">
          <span>RANKING PÚBLICO (TOP 10)</span>
          <span>GB SUBIDOS</span>
        </div>

        <div className="divide-y divide-gray-800/60">
          {rankings.slice(0, 10).map((row, idx) => {
            const plan = PLANS[row.planKey];
            const isTop3 = idx < 3;

            return (
              <div
                key={row.userId}
                className={`p-4 flex items-center justify-between text-xs transition-colors ${
                  row.isMe
                    ? 'bg-emerald-950/20 text-emerald-300 font-bold'
                    : 'hover:bg-gray-900/30 text-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                    idx === 0 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                    idx === 1 ? 'bg-gray-400/20 text-gray-200 border border-gray-400/30' :
                    idx === 2 ? 'bg-amber-700/20 text-amber-500 border border-amber-700/30' :
                    'bg-gray-900 text-gray-500 border border-gray-800'
                  }`}>
                    {idx + 1}
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold">
                        Usuario {row.maskedId}
                      </span>
                      {row.isMe && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-500 text-black font-bold">
                          TÚ
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-gray-500 flex items-center gap-1">
                      <span>{plan.badge}</span>
                      <span>{plan.display}</span>
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-bold text-emerald-400 text-sm">
                    {row.totalGb.toFixed(2)} GB
                  </span>
                  <span className="text-[10px] text-gray-500 block">
                    {formatBytes(row.totalBytes)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
