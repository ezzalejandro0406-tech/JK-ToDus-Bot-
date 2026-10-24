import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Users, 
  DollarSign, 
  Award, 
  Trash2, 
  Radio, 
  Download, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Search,
  ExternalLink,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { AppStorage } from '../lib/storage';
import { PLANS, formatBytes, GIB, DEFAULT_CONFIG } from '../lib/constants';
import { UserAccount, PlanKey, AdminAuditEvent } from '../types';

interface AdminPanelViewProps {
  activeUserId: number;
  onRefresh: () => void;
}

export const AdminPanelView: React.FC<AdminPanelViewProps> = ({ activeUserId, onRefresh }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'audit' | 'broadcast' | 'backup'>('users');
  const [users, setUsers] = useState<Record<string, UserAccount>>(() => AppStorage.getUsers());
  const [auditEvents, setAuditEvents] = useState<AdminAuditEvent[]>(() => AppStorage.getAudit());
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);

  // User edit inputs
  const [assignPlan, setAssignPlan] = useState<PlanKey>('vip_basic');
  const [assignDays, setAssignDays] = useState<number>(30);
  const [grantAmount, setGrantAmount] = useState<number>(50);

  // Broadcast
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastResult, setBroadcastResult] = useState<string | null>(null);

  // Backup restore
  const [backupNotice, setBackupNotice] = useState<string | null>(null);
  const [showGlobalWipeConfirm, setShowGlobalWipeConfirm] = useState(false);

  const isOwner = activeUserId === DEFAULT_CONFIG.owner_telegram_id;

  const refreshAll = () => {
    setUsers(AppStorage.getUsers());
    setAuditEvents(AppStorage.getAudit());
    onRefresh();
  };

  const userList = Object.values(users);
  const pageSize = 10;
  const totalPages = Math.ceil(userList.length / pageSize) || 1;
  const pagedUsers = userList.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleAssignPlan = (userId: number) => {
    AppStorage.setUserPlan(userId, assignPlan, assignDays, activeUserId);
    setBackupNotice(`Plan ${PLANS[assignPlan].display} asignado a usuario ${userId} por ${assignDays} días.`);
    refreshAll();
    setTimeout(() => setBackupNotice(null), 4000);
  };

  const handleGrantBalance = (userId: number) => {
    if (grantAmount <= 0) return;
    AppStorage.grantBalance(userId, grantAmount, activeUserId, 'Acreditación desde Panel Admin');
    setBackupNotice(`Se acreditaron ${grantAmount}$ al usuario ${userId}.`);
    refreshAll();
    setTimeout(() => setBackupNotice(null), 4000);
  };

  const handleClearUserHistory = (userId: number) => {
    AppStorage.clearUserHistory(userId);
    setBackupNotice(`Historial y archivos de ToDus S3 eliminados para el usuario ${userId}.`);
    refreshAll();
    setTimeout(() => setBackupNotice(null), 4000);
  };

  const handleGlobalHistoryWipe = () => {
    AppStorage.clearAllHistory();
    setShowGlobalWipeConfirm(false);
    setBackupNotice('¡Se han borrado los archivos de ToDus S3 y el historial de TODOS los usuarios con éxito!');
    refreshAll();
    setTimeout(() => setBackupNotice(null), 5000);
  };

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMsg.trim()) return;
    const count = userList.length;
    AppStorage.addAudit({
      at: new Date().toISOString(),
      actor_id: activeUserId,
      target_id: 0,
      action: 'broadcast_sent',
      detail: `Difusión a ${count} usuarios: "${broadcastMsg.slice(0, 40)}..."`,
    });
    setBroadcastResult(`✅ Mensaje enviado exitosamente a ${count} usuarios registrados sin interrupciones.`);
    setBroadcastMsg('');
    refreshAll();
    setTimeout(() => setBroadcastResult(null), 5000);
  };

  const handleExportBackup = () => {
    const backupData = AppStorage.createBackupManifest();
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_jk_bot_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setBackupNotice('Respaldo generado y descargado exitosamente.');
    setTimeout(() => setBackupNotice(null), 4000);
  };

  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const result = AppStorage.restoreBackup(content);
      if (result.success) {
        setBackupNotice(`✅ ${result.message}`);
        refreshAll();
      } else {
        setBackupNotice(`❌ Error al restaurar: ${result.message}`);
      }
      setTimeout(() => setBackupNotice(null), 5000);
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Top Banner */}
      <div className="terminal-card rounded-xl p-5 border border-emerald-500/20 bg-[#0d1322] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-emerald-400" />
              <span>PANEL DE ADMINISTRACIÓN (/jkadmin)</span>
            </h2>
            <p className="text-xs text-gray-300 mt-0.5">
              Control total del bot: gestión de usuarios, auditoría, asignación de planes, cuotas y respaldos.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-400">Total Usuarios:</span>
            <span className="px-2.5 py-1 rounded bg-gray-900 border border-gray-800 text-emerald-400 font-bold">
              {userList.length}
            </span>
          </div>
        </div>

        {/* Admin Tabs */}
        <div className="flex items-center flex-wrap gap-2 pt-2 border-t border-gray-800 text-xs">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              activeTab === 'users'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-gray-400 hover:text-white bg-gray-900'
            }`}
          >
            Usuarios ({userList.length})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              activeTab === 'audit'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-gray-400 hover:text-white bg-gray-900'
            }`}
          >
            Reporte Auditoría ({auditEvents.length})
          </button>
          <button
            onClick={() => setActiveTab('broadcast')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              activeTab === 'broadcast'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-gray-400 hover:text-white bg-gray-900'
            }`}
          >
            Difusión Masiva
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              activeTab === 'backup'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-gray-400 hover:text-white bg-gray-900'
            }`}
          >
            Respaldos Telegram
          </button>
        </div>
      </div>

      {/* Notice alert */}
      {backupNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{backupNotice}</span>
        </div>
      )}

      {/* TAB 1: USERS DIRECTORY */}
      {activeTab === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User List Table */}
          <div className="lg:col-span-2 terminal-card rounded-xl border border-gray-800 overflow-hidden space-y-3 p-4">
            <div className="flex items-center justify-between text-xs text-gray-400 pb-2 border-b border-gray-800">
              <span className="font-bold text-white">USUARIOS REGISTRADOS</span>
              <span>Página {currentPage} de {totalPages}</span>
            </div>

            <div className="space-y-2">
              {pagedUsers.map((u, idx) => {
                const planKey = AppStorage.getUserPlan(u.user_id);
                const plan = PLANS[planKey];
                const usage = AppStorage.getUserDailyUsage(u.user_id);
                const isSelected = selectedUser?.user_id === u.user_id;

                return (
                  <div
                    key={u.user_id}
                    onClick={() => setSelectedUser(u)}
                    className={`p-3 rounded-lg border flex items-center justify-between text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-emerald-950/30 border-emerald-500/50 shadow-sm'
                        : 'bg-gray-950/40 border-gray-800/80 hover:border-gray-700'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">
                          USER {(currentPage - 1) * pageSize + idx + 1}: {u.first_name}
                        </span>
                        {u.username && (
                          <span className="text-gray-400">@{u.username}</span>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-500 flex items-center gap-2">
                        <span>ID: {u.user_id}</span>
                        <span>•</span>
                        <span>Saldo: {u.balance}$</span>
                        <span>•</span>
                        <span>Uso: {(usage.totalBytes / GIB).toFixed(2)} GB</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-gray-900 border border-gray-800 text-emerald-400">
                        {plan.badge} {plan.display}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-3 border-t border-gray-800 text-xs">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="px-3 py-1 rounded bg-gray-900 border border-gray-800 text-gray-300 disabled:opacity-40 flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Anterior</span>
                </button>
                <span className="text-gray-500">
                  {currentPage} / {totalPages}
                </span>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="px-3 py-1 rounded bg-gray-900 border border-gray-800 text-gray-300 disabled:opacity-40 flex items-center gap-1 cursor-pointer"
                >
                  <span>Siguiente</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* User Details & Actions Drawer */}
          <div className="terminal-card rounded-xl border border-gray-800 p-5 space-y-5">
            {selectedUser ? (
              <>
                <div className="space-y-1 pb-3 border-b border-gray-800">
                  <span className="text-[10px] text-emerald-400 font-bold uppercase">FICHA DEL USUARIO</span>
                  <h3 className="font-bold text-white text-base">{selectedUser.full_name}</h3>
                  <div className="text-xs text-gray-400">ID Telegram: {selectedUser.user_id}</div>
                </div>

                {/* Assign Plan */}
                <div className="space-y-2">
                  <label className="text-xs text-gray-300 block font-bold">Asignar Plan:</label>
                  <select
                    value={assignPlan}
                    onChange={(e) => setAssignPlan(e.target.value as PlanKey)}
                    className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2 text-xs text-emerald-300"
                  >
                    <option value="free">🆓 Plan Gratis</option>
                    <option value="vip_basic">⭐ VIP Básico (10 GB)</option>
                    <option value="vip_medium">💎 VIP Medio (15 GB)</option>
                    <option value="premium">👑 Premium (Ilimitado)</option>
                    <option value="owner">🜲 Creador</option>
                  </select>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={assignDays}
                      onChange={(e) => setAssignDays(Number(e.target.value))}
                      placeholder="Días"
                      className="w-24 bg-gray-950 border border-gray-800 rounded-lg p-2 text-xs text-white"
                    />
                    <span className="text-xs text-gray-400">días</span>
                    <button
                      onClick={() => handleAssignPlan(selectedUser.user_id)}
                      className="flex-1 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-colors cursor-pointer"
                    >
                      Guardar Plan
                    </button>
                  </div>
                </div>

                {/* Grant Balance */}
                <div className="space-y-2 pt-2 border-t border-gray-800">
                  <label className="text-xs text-gray-300 block font-bold">Dar Saldo Virtual ($):</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      value={grantAmount}
                      onChange={(e) => setGrantAmount(Number(e.target.value))}
                      className="w-28 bg-gray-950 border border-gray-800 rounded-lg p-2 text-xs text-white"
                    />
                    <button
                      onClick={() => handleGrantBalance(selectedUser.user_id)}
                      className="flex-1 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-colors cursor-pointer"
                    >
                      Acreditar ${grantAmount}
                    </button>
                  </div>
                </div>

                {/* User Danger Zone */}
                <div className="space-y-2 pt-3 border-t border-red-500/20">
                  <span className="text-[10px] text-red-400 font-bold block uppercase">Acciones Críticas:</span>
                  <button
                    onClick={() => handleClearUserHistory(selectedUser.user_id)}
                    className="w-full py-2 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-500/30 text-red-300 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar archivos ToDus de este usuario</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-gray-500 text-xs">
                Selecciona un usuario de la lista izquierda para editar su plan, saldo o archivos.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: AUDIT LOG */}
      {activeTab === 'audit' && (
        <div className="terminal-card rounded-xl border border-gray-800 p-5 space-y-4">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>REPORTE ACUMULATIVO DEL ADMINISTRADOR</span>
          </h3>

          <div className="divide-y divide-gray-800/80">
            {auditEvents.length === 0 ? (
              <div className="py-8 text-center text-gray-500 text-xs">
                No hay acciones guardadas en el reporte acumulativo.
              </div>
            ) : (
              auditEvents.map((ev, i) => (
                <div key={i} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-emerald-400 uppercase">
                        {ev.action.replace('_', ' ')}
                      </span>
                      {ev.plan && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-gray-900 border border-gray-800 text-emerald-300">
                          {PLANS[ev.plan]?.display} {ev.days ? `(${ev.days} días)` : ''}
                        </span>
                      )}
                      {ev.amount && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-950 text-amber-300 border border-amber-500/30">
                          +{ev.amount}$
                        </span>
                      )}
                    </div>
                    <div className="text-gray-400 text-[11px]">
                      Destino: ID {ev.target_id || 'Todos'} {ev.detail ? `• ${ev.detail}` : ''}
                    </div>
                  </div>

                  <span className="text-[11px] text-gray-500">
                    {new Date(ev.at).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: BROADCAST */}
      {activeTab === 'broadcast' && (
        <div className="terminal-card rounded-xl border border-gray-800 p-5 space-y-4">
          <div className="space-y-1">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400" />
              <span>DIFUSIÓN MASIVA A USUARIOS</span>
            </h3>
            <p className="text-xs text-gray-300">
              Envía un anuncio a todos los {userList.length} usuarios registrados en la base de datos con el encabezado «Mensaje del administrador».
            </p>
          </div>

          <form onSubmit={handleBroadcast} className="space-y-4">
            <textarea
              rows={4}
              value={broadcastMsg}
              onChange={(e) => setBroadcastMsg(e.target.value)}
              placeholder="Escribe el mensaje de difusión..."
              className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50"
            />

            {broadcastResult && (
              <div className="p-3 bg-emerald-950/60 border border-emerald-500/30 rounded-lg text-emerald-300 text-xs">
                {broadcastResult}
              </div>
            )}

            <button
              type="submit"
              disabled={!broadcastMsg.trim()}
              className="px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
            >
              Emitir Mensaje a la Comunidad
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: BACKUP & SYSTEM RECOVERY */}
      {activeTab === 'backup' && (
        <div className="terminal-card rounded-xl border border-gray-800 p-5 space-y-5">
          <div className="space-y-1">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Download className="w-4 h-4 text-emerald-400" />
              <span>MOTOR DE RESPALDO Y RESTAURACIÓN TELEGRAM</span>
            </h3>
            <p className="text-xs text-gray-300">
              Empaqueta todos los JSON de usuarios, planes, cuotas, historial y reportes en una copia de respaldo para migración entre servidores o hosting.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Download Backup */}
            <div className="p-4 rounded-xl bg-gray-950 border border-gray-800 space-y-3">
              <h4 className="font-bold text-white text-xs">1. Descargar Respaldo JSON Completo</h4>
              <p className="text-[11px] text-gray-400">
                Genera un archivo con todos los datos actuales del sistema ToDus S3.
              </p>
              <button
                onClick={handleExportBackup}
                className="w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Generar Respaldo</span>
              </button>
            </div>

            {/* Restore Backup */}
            <div className="p-4 rounded-xl bg-gray-950 border border-gray-800 space-y-3">
              <h4 className="font-bold text-white text-xs">2. Restaurar Datos de Migración</h4>
              <p className="text-[11px] text-gray-400">
                Sube un archivo de respaldo previo para restablecer el estado.
              </p>
              <label className="w-full py-2.5 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-200 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2">
                <Upload className="w-4 h-4 text-emerald-400" />
                <span>Seleccionar Respaldo JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleRestoreBackup}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Danger Global Wipe */}
          <div className="pt-4 border-t border-red-500/30 space-y-3">
            <h4 className="text-xs font-bold text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>ZONA DE EMERGENCIA GLOBAL</span>
            </h4>
            <p className="text-xs text-gray-400">
              «Borrar todo el historial» elimina todos los objetos ToDus S3 de todos los usuarios registrados.
            </p>

            {showGlobalWipeConfirm ? (
              <div className="p-4 rounded-lg bg-red-950/40 border border-red-500/50 space-y-2">
                <span className="text-xs font-bold text-red-300 block">
                  ¿ESTÁS COMPLETAMENTE SEGURO? Esta acción purgará todo el almacenamiento ToDus de la comunidad.
                </span>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleGlobalHistoryWipe}
                    className="px-4 py-1.5 rounded bg-red-600 hover:bg-red-500 text-white font-bold text-xs cursor-pointer"
                  >
                    Confirmar Borrado Global
                  </button>
                  <button
                    onClick={() => setShowGlobalWipeConfirm(false)}
                    className="px-4 py-1.5 rounded bg-gray-900 text-gray-300 text-xs cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowGlobalWipeConfirm(true)}
                className="py-2 px-4 rounded-lg bg-red-950/40 hover:bg-red-900 border border-red-500/30 text-red-400 text-xs font-bold cursor-pointer"
              >
                Borrar Todo el Historial Global (Todos los usuarios)
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
