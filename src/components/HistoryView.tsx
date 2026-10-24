import React, { useState } from 'react';
import { 
  History as HistoryIcon, 
  Trash2, 
  Copy, 
  Check, 
  FileText, 
  ExternalLink, 
  Clock, 
  Layers, 
  AlertTriangle,
  DownloadCloud,
  CheckCircle2
} from 'lucide-react';
import { AppStorage } from '../lib/storage';
import { HistoryItem } from '../types';
import { formatBytes } from '../lib/constants';
import { downloadTextAsFile, generateTxtExport } from '../lib/todusStorage';

interface HistoryViewProps {
  activeUserId: number;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ activeUserId }) => {
  const [history, setHistory] = useState<HistoryItem[]>(() => AppStorage.getHistory(activeUserId));
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [expandedLinksId, setExpandedLinksId] = useState<string | null>(null);

  const refreshHistory = () => {
    setHistory(AppStorage.getHistory(activeUserId));
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteItem = (item: HistoryItem) => {
    // Purge simulated on ToDus S3 then remove from local records
    const deleted = AppStorage.deleteHistoryItem(activeUserId, item.id);
    if (deleted) {
      setNotice(`✅ Se eliminó de ToDus S3 y de tus registros: ${item.filename}`);
      refreshHistory();
    }
    setConfirmDeleteId(null);
    setTimeout(() => setNotice(null), 4000);
  };

  const handleClearAll = () => {
    AppStorage.clearUserHistory(activeUserId);
    refreshHistory();
    setShowClearConfirm(false);
    setNotice('El historial ha sido borrado con éxito.');
    setTimeout(() => setNotice(null), 4000);
  };

  const handleDownloadTxt = (item: HistoryItem) => {
    const content = generateTxtExport(item.filename, item.urls, item.size);
    const baseName = item.filename.replace(/\.[^/.]+$/, '');
    downloadTextAsFile(`${baseName}_links.txt`, content);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="terminal-card rounded-xl p-5 border border-emerald-500/20 bg-[#0d1322] flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono">
        <div>
          <h2 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
            <HistoryIcon className="w-4 h-4" />
            <span>HISTORIAL DE ARCHIVOS TODUS S3</span>
          </h2>
          <p className="text-xs text-gray-300 mt-0.5">
            Consulta tus enlaces generados, descarga los archivos TXT o purga objetos de la nube.
          </p>
        </div>

        {history.length > 0 && (
          <button
            onClick={() => setShowClearConfirm(true)}
            className="px-3.5 py-2 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-500/30 text-red-300 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Eliminar todo el historial</span>
          </button>
        )}
      </div>

      {/* Action Notification */}
      {notice && (
        <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Clear All Confirmation Modal */}
      {showClearConfirm && (
        <div className="terminal-card p-5 rounded-xl border border-red-500/40 bg-red-950/30 space-y-3 font-mono">
          <div className="flex items-center gap-2 text-red-400 font-bold text-xs">
            <AlertTriangle className="w-4 h-4" />
            <span>¿Confirmas que deseas eliminar todo tu historial?</span>
          </div>
          <p className="text-xs text-gray-300">
            Esta acción eliminará todos los objetos de ToDus S3 permanentemente y vaciará tus registros locales.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleClearAll}
              className="px-4 py-1.5 rounded-lg bg-red-600 text-white font-bold text-xs hover:bg-red-500 cursor-pointer"
            >
              Sí, eliminar todo
            </button>
            <button
              onClick={() => setShowClearConfirm(false)}
              className="px-4 py-1.5 rounded-lg bg-gray-900 text-gray-300 text-xs hover:bg-gray-800 border border-gray-800 cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* History Items */}
      {history.length === 0 ? (
        <div className="terminal-card rounded-xl p-12 text-center text-gray-500 font-mono text-xs border border-gray-800">
          No tienes archivos en tu historial. Los archivos que subas aparecerán aquí con sus enlaces ToDus S3.
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((item, index) => {
            const isExpanded = expandedLinksId === item.id;
            const isDeleting = confirmDeleteId === item.id;

            return (
              <div
                key={item.id}
                className="terminal-card rounded-xl p-4 border border-gray-800 hover:border-emerald-500/30 transition-all font-mono space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-bold text-xs">{index + 1}.</span>
                      <span className="font-bold text-xs text-white break-all">{item.filename}</span>
                      {item.is_parts && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-indigo-950 text-indigo-400 border border-indigo-500/30 flex items-center gap-1">
                          <Layers className="w-3 h-3" />
                          {item.part_count} partes
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-400">
                      <span>{formatBytes(item.size)}</span>
                      <span>•</span>
                      <span>Subido: {new Date(item.created_at).toLocaleString()}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-amber-400/90">
                        <Clock className="w-3 h-3" />
                        <span>Expira: {new Date(item.expires_at).toLocaleDateString()}</span>
                      </span>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center flex-wrap gap-2">
                    {item.urls.length > 1 && (
                      <button
                        onClick={() => setExpandedLinksId(isExpanded ? null : item.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-gray-900 border border-gray-800 text-xs text-gray-300 hover:text-white"
                      >
                        {isExpanded ? 'Ocultar enlaces' : 'Ver enlaces'}
                      </button>
                    )}

                    <button
                      onClick={() => handleDownloadTxt(item)}
                      title="Descargar enlaces como TXT"
                      className="p-1.5 rounded-lg bg-gray-900 border border-gray-800 text-emerald-400 hover:bg-gray-800"
                    >
                      <FileText className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setConfirmDeleteId(isDeleting ? null : item.id)}
                      title="Borrar de ToDus y del historial"
                      className="p-1.5 rounded-lg bg-gray-900 border border-gray-800 text-red-400 hover:bg-gray-800"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Confirm single delete */}
                {isDeleting && (
                  <div className="p-3 bg-red-950/40 rounded-lg border border-red-500/30 flex items-center justify-between gap-2 text-xs">
                    <span className="text-red-300">¿Eliminar este archivo de ToDus S3 y de tu historial?</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDeleteItem(item)}
                        className="px-2.5 py-1 rounded bg-red-600 text-white font-bold"
                      >
                        Confirmar
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2.5 py-1 rounded bg-gray-900 text-gray-300"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {/* Primary URL row */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    readOnly
                    value={item.urls[0] || ''}
                    aria-label={`Enlace de descarga para ${item.filename}`}
                    className="flex-1 bg-gray-950 border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-emerald-300 truncate font-mono"
                  />
                  <button
                    onClick={() => handleCopy(item.urls[0] || '', item.id)}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 text-xs flex items-center gap-1 shrink-0"
                  >
                    {copiedId === item.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar enlace</span>
                      </>
                    )}
                  </button>
                  <a
                    href={item.urls[0]}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg bg-gray-900 border border-gray-800 text-gray-400 hover:text-white shrink-0"
                    title="Descargar directo"
                  >
                    <DownloadCloud className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Expanded URLs for multi-part files */}
                {isExpanded && item.urls.length > 1 && (
                  <div className="p-3 bg-gray-950/70 rounded-lg border border-gray-800 space-y-2 mt-2">
                    <span className="text-[11px] text-gray-400 block font-bold">
                      Todas las partes ({item.urls.length}):
                    </span>
                    {item.urls.map((url, uidx) => (
                      <div key={uidx} className="flex items-center gap-2 text-xs">
                        <span className="text-gray-500 shrink-0">P{uidx + 1}:</span>
                        <input
                          type="text"
                          readOnly
                          value={url}
                          aria-label={`Enlace de descarga de parte ${uidx + 1}`}
                          className="flex-1 bg-gray-900 border border-gray-800 rounded px-2 py-1 text-emerald-400 truncate text-[11px]"
                        />
                        <button
                          onClick={() => handleCopy(url, `${item.id}_${uidx}`)}
                          className="px-2 py-1 rounded bg-gray-800 text-gray-300 hover:text-white text-[11px] shrink-0"
                        >
                          {copiedId === `${item.id}_${uidx}` ? 'Copiado' : 'Copiar'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
