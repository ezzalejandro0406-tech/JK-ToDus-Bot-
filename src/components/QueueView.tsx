import React, { useState } from 'react';
import { 
  ListOrdered, 
  Pause, 
  Play, 
  X, 
  Trash2, 
  Clock, 
  Users, 
  CheckCircle2, 
  AlertTriangle,
  RotateCw
} from 'lucide-react';
import { taskQueue } from '../lib/taskQueue';
import { AppStorage } from '../lib/storage';
import { PLANS, formatBytes, formatSpeed, formatSeconds, DEFAULT_CONFIG } from '../lib/constants';
import { TransferTask } from '../types';

interface QueueViewProps {
  activeUserId: number;
}

export const QueueView: React.FC<QueueViewProps> = ({ activeUserId }) => {
  const [tasks, setTasks] = useState<TransferTask[]>([]);
  const [filterMode, setFilterMode] = useState<'my' | 'all'>('my');

  React.useEffect(() => {
    return taskQueue.subscribe((updatedTasks) => {
      setTasks(updatedTasks);
    });
  }, []);

  const displayedTasks = filterMode === 'my' 
    ? tasks.filter(t => t.user_id === activeUserId)
    : tasks;

  const userPlanKey = AppStorage.getUserPlan(activeUserId);
  const planInfo = PLANS[userPlanKey];
  const userActiveCount = tasks.filter(t => t.user_id === activeUserId && (t.state === 'queued' || t.state === 'downloading' || t.state === 'uploading')).length;

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="terminal-card rounded-xl p-5 border border-emerald-500/20 bg-[#0d1322] space-y-3 font-mono">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
              <ListOrdered className="w-4 h-4" />
              <span>COLA DE TAREAS FIFO Y ROTACIÓN JUSTA</span>
            </h2>
            <p className="text-xs text-gray-300 mt-0.5">
              Cada usuario tiene una cola privada con reparto equitativo de turnos para evitar bloqueos.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Cupo activo:</span>
            <span className="text-xs font-bold text-white px-2 py-0.5 rounded bg-gray-900 border border-gray-800">
              {userActiveCount} / {planInfo.queue_limit > 1000 ? '∞' : planInfo.queue_limit}
            </span>
          </div>
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-800 text-xs">
          <button
            onClick={() => setFilterMode('my')}
            className={`px-3 py-1 rounded-lg font-medium transition-colors ${
              filterMode === 'my'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-gray-400 hover:text-white bg-gray-900'
            }`}
          >
            Mis Tareas ({tasks.filter(t => t.user_id === activeUserId).length})
          </button>
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1 rounded-lg font-medium transition-colors ${
              filterMode === 'all'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-gray-400 hover:text-white bg-gray-900'
            }`}
          >
            Todas las Tareas del Sistema ({tasks.length})
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {displayedTasks.length === 0 ? (
          <div className="terminal-card rounded-xl p-12 text-center text-gray-500 font-mono text-xs border border-gray-800">
            No hay tareas en la cola seleccionada.
          </div>
        ) : (
          displayedTasks.map((task) => {
            const isMyTask = task.user_id === activeUserId;
            const isUploading = task.state === 'uploading' || task.state === 'downloading';
            const isPaused = task.state === 'paused';
            const isQueued = task.state === 'queued';
            const isFinished = task.state === 'completed';
            const isFailed = task.state === 'failed';

            return (
              <div
                key={task.task_id}
                className={`terminal-card rounded-xl p-4 border transition-all space-y-3 font-mono ${
                  isMyTask ? 'border-gray-800 hover:border-emerald-500/30' : 'border-gray-900/80 bg-gray-950/40 opacity-80'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white truncate max-w-md">
                        {task.filename}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border uppercase font-bold ${
                        isFinished ? 'bg-emerald-950 text-emerald-400 border-emerald-500/30' :
                        isUploading ? 'bg-blue-950 text-blue-400 border-blue-500/30 animate-pulse' :
                        isPaused ? 'bg-amber-950 text-amber-400 border-amber-500/30' :
                        isQueued ? 'bg-purple-950 text-purple-400 border-purple-500/30' :
                        'bg-red-950 text-red-400 border-red-500/30'
                      }`}>
                        {task.state}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-gray-400">
                      <span>ID: {task.task_id}</span>
                      <span>•</span>
                      <span>Usuario: ••••{String(task.user_id).slice(-4)}</span>
                      <span>•</span>
                      <span>{formatBytes(task.size)}</span>
                      <span>•</span>
                      <span>{new Date(task.created_at).toLocaleTimeString()}</span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2">
                    {isUploading && (
                      <button
                        onClick={() => taskQueue.pauseTask(task.task_id)}
                        title="Pausar tarea"
                        className="p-1.5 rounded-lg bg-gray-900 border border-gray-800 text-amber-400 hover:bg-gray-800"
                      >
                        <Pause className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {isPaused && (
                      <button
                        onClick={() => taskQueue.resumeTask(task.task_id)}
                        title="Reanudar tarea"
                        className="p-1.5 rounded-lg bg-emerald-950 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-900"
                      >
                        <Play className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {(isQueued || isUploading || isPaused) && (
                      <button
                        onClick={() => taskQueue.cancelTask(task.task_id)}
                        title="Cancelar tarea"
                        className="p-1.5 rounded-lg bg-gray-900 border border-gray-800 text-red-400 hover:bg-gray-800"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {(isFinished || isFailed) && (
                      <button
                        onClick={() => taskQueue.deleteTask(task.task_id)}
                        title="Eliminar de la cola"
                        className="p-1.5 rounded-lg bg-gray-900 border border-gray-800 text-gray-400 hover:text-white"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress bar if ongoing */}
                {!isFinished && !isFailed && (
                  <div className="space-y-1">
                    <div className="h-1.5 w-full bg-gray-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-300"
                        style={{ width: `${task.progress.percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-400">
                      <span>{task.progress.percentage}% ({formatBytes(task.progress.bytes)})</span>
                      <span>Velocidad: {formatSpeed(task.progress.speed_bps)}</span>
                      <span>ETA: {formatSeconds(task.progress.eta_seconds)}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
