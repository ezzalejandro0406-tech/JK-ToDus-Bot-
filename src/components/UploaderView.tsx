import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  Link as LinkIcon, 
  FileText, 
  Copy, 
  Check, 
  AlertCircle, 
  CheckCircle2, 
  Pause, 
  Play, 
  X, 
  Layers, 
  Clock, 
  ExternalLink,
  Zap,
  PlaySquare,
  Music,
  Video,
  Download,
  Gauge
} from 'lucide-react';
import { taskQueue } from '../lib/taskQueue';
import { AppStorage } from '../lib/storage';
import { PLANS, formatBytes, formatSpeed, formatSeconds, DEFAULT_CONFIG } from '../lib/constants';
import { 
  isPlayStorePage, 
  isSupportedPlatformUrl, 
  getPlatformBadge, 
  extractUrlFilename,
  isYouTubeUrl,
  getYouTubeMetadata,
  YouTubeMetadata
} from '../lib/platformDownloads';
import { downloadTextAsFile } from '../lib/todusStorage';
import { TransferTask } from '../types';

interface UploaderViewProps {
  activeUserId: number;
  onNavigateToPlans: () => void;
  onNavigateToQueue: () => void;
}

export const UploaderView: React.FC<UploaderViewProps> = ({
  activeUserId,
  onNavigateToPlans,
  onNavigateToQueue,
}) => {
  const [activeMode, setActiveMode] = useState<'file' | 'url'>('file');
  const [urlInput, setUrlInput] = useState('');
  const [ytMeta, setYtMeta] = useState<YouTubeMetadata | null>(null);
  const [selectedYtFormat, setSelectedYtFormat] = useState('720p');
  const [simulatedFileSizeMb, setSimulatedFileSizeMb] = useState(250);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedTaskId, setCopiedTaskId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTasks, setActiveTasks] = useState<TransferTask[]>([]);

  useEffect(() => {
    return taskQueue.subscribe((tasks) => {
      setActiveTasks(tasks.filter(t => t.user_id === activeUserId));
    });
  }, [activeUserId]);

  // Inspect YouTube URL when input changes
  useEffect(() => {
    if (isYouTubeUrl(urlInput.trim())) {
      const meta = getYouTubeMetadata(urlInput.trim());
      setYtMeta(meta);
      setSelectedYtFormat('720p');
    } else {
      setYtMeta(null);
    }
  }, [urlInput]);

  const userPlanKey = AppStorage.getUserPlan(activeUserId);
  const planInfo = PLANS[userPlanKey];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    const result = taskQueue.enqueueTask({
      userId: activeUserId,
      chatId: activeUserId,
      filename: file.name,
      size: file.size > 0 ? file.size : 1024 * 1024 * 35,
      sourceKind: 'file_upload',
    });

    if (!result.success) {
      setErrorMsg(result.error || 'No se pudo encolar la tarea.');
    } else {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setErrorMsg(null);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const result = taskQueue.enqueueTask({
        userId: activeUserId,
        chatId: activeUserId,
        filename: file.name,
        size: file.size > 0 ? file.size : 1024 * 1024 * 45,
        sourceKind: 'file_upload',
      });
      if (!result.success) {
        setErrorMsg(result.error || 'No se pudo encolar la tarea.');
      }
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const cleanUrl = urlInput.trim();
    if (!cleanUrl) return;

    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      setErrorMsg('Por favor ingresa una URL válida con http:// o https://');
      return;
    }

    if (isPlayStorePage(cleanUrl)) {
      setErrorMsg('⚠️ Las URLs de Google Play Store son fichas informativas, no archivos APK directos. Por favor sube el archivo APK directamente.');
      return;
    }

    const isYt = isYouTubeUrl(cleanUrl);
    const isPlatform = isSupportedPlatformUrl(cleanUrl);
    const isAudio = selectedYtFormat === 'mp3';
    const filename = extractUrlFilename(cleanUrl, selectedYtFormat, isAudio);

    let estimatedBytes = simulatedFileSizeMb * 1024 * 1024;
    if (isYt && ytMeta) {
      const fmt = ytMeta.formats.find(f => f.formatId === selectedYtFormat);
      if (fmt) {
        estimatedBytes = fmt.approxSizeMb * 1024 * 1024;
      }
    }

    const result = taskQueue.enqueueTask({
      userId: activeUserId,
      chatId: activeUserId,
      filename,
      size: estimatedBytes,
      sourceKind: isPlatform ? 'platform_video' : 'http_url',
      sourceUrl: cleanUrl,
    });

    if (!result.success) {
      setErrorMsg(result.error || 'No se pudo encolar la tarea.');
    } else {
      setUrlInput('');
      setYtMeta(null);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTaskId(id);
    setTimeout(() => setCopiedTaskId(null), 2500);
  };

  const handleDownloadTxt = (task: TransferTask) => {
    if (!task.txt_content) return;
    const baseName = task.filename.replace(/\.[^/.]+$/, '');
    downloadTextAsFile(`${baseName}_ToDus_Links.txt`, task.txt_content);
  };

  return (
    <div className="space-y-6">
      {/* 2026 Header Status Banner */}
      <div className="terminal-card rounded-2xl p-6 border border-emerald-500/20 bg-gradient-to-r from-[#0c1322] via-[#09101d] to-[#0d1627] shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <h2 className="text-white font-bold text-base flex items-center gap-2">
                <span>SUBIDA DIRECTA A TODUS S3</span>
                <span className="text-xs font-mono font-medium text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  s3.todus.cu/stream
                </span>
              </h2>
            </div>
            <p className="text-xs text-gray-300 max-w-2xl leading-relaxed">
              Subida directa sin cuentas ni contraseñas. Velocidad mínima garantizada de{' '}
              <strong className="text-emerald-300">≥ 6.8 MB/s</strong> con retención de{' '}
              <strong className="text-emerald-300">{planInfo.storage_label}</strong> para tu {planInfo.display}.
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-3 text-xs font-mono">
            <div className="px-3.5 py-2 rounded-xl bg-[#080d18] border border-gray-800 flex items-center gap-2">
              <Gauge className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="text-[10px] text-gray-500 block">Velocidad Mínima:</span>
                <span className="text-emerald-400 font-bold">&gt; 6.5 MB/s</span>
              </div>
            </div>

            <div className="px-3.5 py-2 rounded-xl bg-[#080d18] border border-gray-800 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <div>
                <span className="text-[10px] text-gray-500 block">Límite por parte:</span>
                <span className="text-cyan-400 font-bold">{DEFAULT_CONFIG.max_part_size_mib} MiB</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error alert if any */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs font-mono flex items-start justify-between gap-3 shadow-lg">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{errorMsg}</p>
          </div>
          <button 
            onClick={() => setErrorMsg(null)}
            className="text-red-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Upload Selector & Zone */}
      <div className="terminal-card rounded-2xl border border-gray-800 p-6 space-y-6 bg-[#090d16]">
        {/* Mode Toggle Buttons */}
        <div className="flex items-center justify-center p-1.5 bg-[#060a12] rounded-2xl border border-gray-800/80 max-w-md mx-auto">
          <button
            onClick={() => setActiveMode('file')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeMode === 'file'
                ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-bold shadow-md shadow-emerald-500/20'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Subir Archivo Local</span>
          </button>
          <button
            onClick={() => setActiveMode('url')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeMode === 'url'
                ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-bold shadow-md shadow-emerald-500/20'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <LinkIcon className="w-4 h-4" />
            <span>YouTube / Enlace Web</span>
          </button>
        </div>

        {/* Tab 1: Local File Upload */}
        {activeMode === 'file' && (
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${
              isDragging
                ? 'border-emerald-400 bg-emerald-950/20 shadow-[0_0_30px_rgba(16,185,129,0.25)]'
                : 'border-gray-800 hover:border-emerald-500/40 hover:bg-[#0c121e]/40'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
              <Upload className="w-7 h-7 animate-bounce" />
            </div>
            <h3 className="text-base font-bold text-white mb-1.5">
              Arrastra y suelta tu archivo aquí
            </h3>
            <p className="text-xs text-gray-400 max-w-md mx-auto mb-5 leading-relaxed font-sans">
              Compatible con APKs, vídeos MP4, archivos comprimidos ZIP/RAR, documentos y música. Los archivos mayores a 1.9 GB se fragmentan automáticamente en partes sin pérdida.
            </p>
            <button
              type="button"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-bold text-xs hover:brightness-110 transition-all shadow-lg shadow-emerald-500/20"
            >
              Seleccionar de mi dispositivo
            </button>
          </div>
        )}

        {/* Tab 2: URL & Zero-Cookie YouTube Downloader */}
        {activeMode === 'url' && (
          <form onSubmit={handleUrlSubmit} className="space-y-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="text-gray-200 font-medium flex items-center gap-1.5">
                  <PlaySquare className="w-4 h-4 text-red-400" />
                  <span>Enlace de YouTube, Redes Sociales o Archivo Directo:</span>
                </label>
                <span className="text-emerald-400 text-[11px] font-mono flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>YouTube 100% Sin Cookies</span>
                </span>
              </div>

              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Pega enlace de YouTube (watch, youtu.be, shorts), TikTok, Facebook o URL directa..."
                className="w-full bg-[#060a12] border border-gray-800 rounded-xl px-4 py-3.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 font-sans shadow-inner"
              />
            </div>

            {/* YouTube Zero-Cookie Inspector Card */}
            {ytMeta && (
              <div className="p-4 rounded-2xl bg-[#0c1322] border border-red-500/30 space-y-4 animate-fadeIn">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="w-32 h-20 rounded-xl overflow-hidden bg-black shrink-0 relative border border-gray-800 shadow-md">
                    <img 
                      src={ytMeta.thumbnailUrl} 
                      alt="Thumbnail" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback if image blocked
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <span className="absolute bottom-1 right-1 bg-black/80 text-[10px] text-white px-1.5 py-0.5 rounded font-mono font-bold">
                      {ytMeta.durationFormatted}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider bg-red-950/60 px-2 py-0.5 rounded border border-red-500/30">
                      YouTube Video • Sin Cookies
                    </span>
                    <h4 className="text-sm font-bold text-white leading-tight">
                      {ytMeta.title}
                    </h4>
                    <span className="text-xs text-gray-400 block">
                      Canal: {ytMeta.author} • Duración: {ytMeta.durationFormatted}
                    </span>
                  </div>
                </div>

                {/* Formats Selector */}
                <div className="space-y-2 pt-2 border-t border-gray-800/80">
                  <span className="text-xs text-gray-300 font-medium block">
                    Selecciona Calidad / Formato deseado:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                    {ytMeta.formats.map((fmt) => {
                      const isSelected = selectedYtFormat === fmt.formatId;

                      return (
                        <button
                          key={fmt.formatId}
                          type="button"
                          onClick={() => setSelectedYtFormat(fmt.formatId)}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 shadow-sm'
                              : 'bg-[#080d18] border-gray-800 text-gray-400 hover:border-gray-700'
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span>{fmt.resolution}</span>
                            {fmt.isAudioOnly ? (
                              <Music className="w-3.5 h-3.5 text-cyan-400" />
                            ) : (
                              <Video className="w-3.5 h-3.5 text-red-400" />
                            )}
                          </div>
                          <span className="text-[11px] text-gray-400 block mt-1 font-mono">
                            ~{fmt.approxSizeMb} MB
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Other platform badge */}
            {urlInput && !ytMeta && (
              <div className="flex items-center gap-2 p-3 bg-[#060a12] rounded-xl border border-gray-800 text-xs">
                <span className="text-gray-400">Plataforma detectada:</span>
                {(() => {
                  const badge = getPlatformBadge(urlInput);
                  return (
                    <span className={`font-semibold px-2.5 py-1 rounded-lg border text-xs ${badge.color}`}>
                      {badge.icon} {badge.name}
                    </span>
                  );
                })()}
              </div>
            )}

            <button
              type="submit"
              disabled={!urlInput.trim()}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-bold text-sm hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xl shadow-emerald-500/20 cursor-pointer"
            >
              Comenzar Transferencia a ToDus S3 (≥ 6.8 MB/s)
            </button>
          </form>
        )}
      </div>

      {/* Active & Recent Transfers Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400" />
            <span>TRANSFERENCIAS EN VIVO Y ENLACES TODUS S3</span>
            <span className="text-xs text-gray-500 font-normal">({activeTasks.length})</span>
          </h2>
          {activeTasks.length > 0 && (
            <button
              onClick={onNavigateToQueue}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-mono"
            >
              <span>Ver cola completa</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>

        {activeTasks.length === 0 ? (
          <div className="terminal-card rounded-2xl p-10 text-center text-gray-500 text-xs border border-gray-800">
            No hay transferencias activas. Sube un archivo o pega un enlace de YouTube arriba para comenzar.
          </div>
        ) : (
          <div className="space-y-3">
            {activeTasks.slice(0, 5).map((task) => {
              const isFinished = task.state === 'completed';
              const isPaused = task.state === 'paused';
              const isUploading = task.state === 'uploading' || task.state === 'downloading';

              return (
                <div
                  key={task.task_id}
                  className="terminal-card rounded-2xl p-5 border border-gray-800 hover:border-emerald-500/30 transition-all space-y-3 bg-[#0a0f1b]"
                >
                  {/* Task Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white truncate max-w-sm">
                          {task.filename}
                        </span>
                        {task.part_names.length > 1 && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                            <Layers className="w-3 h-3" />
                            {task.part_names.length} partes
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400 font-mono">
                        <span>{formatBytes(task.size)}</span>
                        <span>•</span>
                        <span className={`font-semibold ${
                          isFinished ? 'text-emerald-400' :
                          isPaused ? 'text-amber-400' :
                          task.state === 'failed' ? 'text-red-400' : 'text-cyan-400'
                        }`}>
                          {task.state === 'queued' && 'En cola FIFO'}
                          {task.state === 'downloading' && 'Descargando origen...'}
                          {task.state === 'uploading' && 'Subiendo a ToDus S3...'}
                          {task.state === 'paused' && 'Pausado'}
                          {task.state === 'completed' && '¡Subida a ToDus S3 finalizada!'}
                          {task.state === 'failed' && (task.error || 'Falló')}
                        </span>
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-2">
                      {isUploading && (
                        <button
                          onClick={() => taskQueue.pauseTask(task.task_id)}
                          title="Pausar"
                          className="p-2 rounded-xl bg-gray-900 border border-gray-800 text-amber-400 hover:bg-gray-800 cursor-pointer"
                        >
                          <Pause className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {isPaused && (
                        <button
                          onClick={() => taskQueue.resumeTask(task.task_id)}
                          title="Reanudar"
                          className="p-2 rounded-xl bg-emerald-950 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-900 cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {!isFinished && task.state !== 'failed' && (
                        <button
                          onClick={() => taskQueue.cancelTask(task.task_id)}
                          title="Cancelar"
                          className="p-2 rounded-xl bg-gray-900 border border-gray-800 text-red-400 hover:bg-gray-800 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* High-Speed Progress Bar & Live Rate Meter */}
                  {!isFinished && task.state !== 'failed' && (
                    <div className="space-y-2 pt-1">
                      <div className="h-2.5 w-full bg-gray-900 rounded-full overflow-hidden border border-gray-800">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 transition-all duration-300 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                          style={{ width: `${task.progress.percentage}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs font-mono text-gray-400">
                        <span>
                          {formatBytes(task.progress.bytes)} / {formatBytes(task.size)} ({task.progress.percentage}%)
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <Gauge className="w-3 h-3" />
                            {formatSpeed(task.progress.speed_bps)}
                          </span>
                          <span>ETA: {formatSeconds(task.progress.eta_seconds)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Finished Action Card */}
                  {isFinished && task.final_urls.length > 0 && (
                    <div className="p-4 bg-emerald-950/20 rounded-2xl border border-emerald-500/30 space-y-3 font-mono">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>El archivo se subió a ToDus S3</span>
                        </span>
                        <span className="text-[11px] text-gray-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          <span>Expira en {planInfo.storage_label}</span>
                        </span>
                      </div>

                      {/* URL Rows */}
                      <div className="space-y-2">
                        {task.final_urls.map((url, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <input
                              type="text"
                              readOnly
                              value={url}
                              aria-label={`Enlace de descarga ToDus S3 ${task.final_urls.length > 1 ? `parte ${idx + 1}` : ''}`}
                              className="flex-1 bg-[#060a12] border border-emerald-500/20 rounded-xl px-3 py-2 text-xs text-emerald-300 select-all font-mono truncate"
                            />
                            <button
                              onClick={() => handleCopy(url, `${task.task_id}_${idx}`)}
                              className="px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 text-xs flex items-center gap-1.5 shrink-0 cursor-pointer font-bold"
                            >
                              {copiedTaskId === `${task.task_id}_${idx}` ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>¡Copiado!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copiar</span>
                                </>
                              )}
                            </button>
                            <a
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 rounded-xl bg-gray-900 border border-gray-800 text-gray-300 hover:text-white shrink-0"
                              title="Abrir descarga"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </div>
                        ))}
                      </div>

                      {/* TXT download button */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-emerald-500/15 text-xs">
                        <button
                          onClick={() => handleDownloadTxt(task)}
                          className="px-3.5 py-1.5 rounded-xl bg-[#080d18] hover:bg-gray-800 border border-gray-700 text-gray-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Convertir a TXT</span>
                        </button>

                        {task.final_urls.length > 1 && (
                          <div className="text-[11px] text-gray-400 bg-[#060a12] px-3 py-1 rounded-lg border border-gray-800">
                            <span>Unir: </span>
                            <code className="text-emerald-400">cat *.part* &gt; &quot;{task.filename}&quot;</code>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
