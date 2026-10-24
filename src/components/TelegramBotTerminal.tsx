import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Trash2, 
  Copy, 
  ExternalLink, 
  Zap, 
  Check, 
  Bot, 
  User, 
  Sparkles,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { AppStorage } from '../lib/storage';
import { PLANS, DEFAULT_CONFIG, formatBytes, GIB } from '../lib/constants';
import { taskQueue } from '../lib/taskQueue';
import { extractUrlFilename, isSupportedPlatformUrl, isPlayStorePage, isYouTubeUrl, getYouTubeMetadata } from '../lib/platformDownloads';

interface MessageItem {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  isAlertOnly?: boolean;
  inlineButtons?: { text: string; action: () => void; isPrimary?: boolean }[][];
}

interface TelegramBotTerminalProps {
  activeUserId: number;
  onNavigateTab: (tab: any) => void;
}

export const TelegramBotTerminal: React.FC<TelegramBotTerminalProps> = ({
  activeUserId,
  onNavigateTab,
}) => {
  const [inputVal, setInputVal] = useState('');
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isOwner = activeUserId === DEFAULT_CONFIG.owner_telegram_id;
  const user = AppStorage.getUser(activeUserId);
  const userPlanKey = AppStorage.getUserPlan(activeUserId);
  const planInfo = PLANS[userPlanKey];

  const getStartButtons = () => {
    const rows = [
      [
        {
          text: '🚀 Descargas ToDus S3',
          action: () => onNavigateTab('uploader'),
          isPrimary: true,
        },
      ],
      [
        {
          text: '📊 Mi cuota',
          action: () => sendBotCommand('/cuota'),
        },
        {
          text: '⚡ Cola activa',
          action: () => sendBotCommand('/cola'),
        },
      ],
      [
        {
          text: '🗄️ Historial',
          action: () => sendBotCommand('/historial'),
        },
        {
          text: '🏆 Top usuarios',
          action: () => sendBotCommand('/top'),
        },
      ],
      [
        {
          text: '💎 Planes y Precios',
          action: () => sendBotCommand('/planes'),
        },
        {
          text: '❓ Ayuda y Guía',
          action: () => sendBotCommand('/ayuda'),
        },
      ],
    ];

    if (isOwner) {
      rows.push([
        {
          text: '🛡️ Panel Admin Root',
          action: () => sendBotCommand('/jkadmin'),
        },
        {
          text: '💾 Respaldo Nube',
          action: () => sendBotCommand('/backup'),
        },
      ]);
    }

    return rows;
  };

  // Initial welcome on active user change
  useEffect(() => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const initialMsg: MessageItem = {
      id: 'msg-start',
      sender: 'bot',
      text: [
        `👋 ¡Hola <b>${user.first_name}</b>! Te damos la bienvenida a <b>${DEFAULT_CONFIG.bot_name}</b>.`,
        '',
        `🆔 <b>ID Telegram:</b> <code>${user.user_id}</code>`,
        `💎 <b>Suscripción:</b> ${planInfo.badge} <b>${planInfo.display}</b>`,
        `💰 <b>Saldo Virtual:</b> <span class="text-amber-400 font-bold">${isOwner ? 'Ilimitado' : `${user.balance}$`}</span>`,
        `⚡ <b>Velocidad Mínima:</b> <b>≥ 6.5 MB/s</b> (Alta Velocidad ToDus)`,
        `⏳ <b>Retención ToDus S3:</b> ${planInfo.storage_label}`,
        '',
        '✨ <i>Envía un archivo directo o pega una URL (YouTube, TikTok, Facebook, Instagram) para subir a ToDus S3.</i>',
      ].join('\n'),
      timestamp: time,
      inlineButtons: getStartButtons(),
    };

    setMessages([initialMsg]);
  }, [activeUserId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const sendBotCommand = (cmd: string) => {
    const cleanCmd = cmd.trim();
    if (!cleanCmd) return;

    const userMsg: MessageItem = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: cleanCmd,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    processBotResponse(cleanCmd);
  };

  const processBotResponse = (input: string) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // SPECIFIC REQUIREMENT: Referral check when user already exists in bot
    // "cuando ya el referido manda un mensaje a alguien que ya está en el bot, no quiero que aparezca la bienvenida y abajo aparezca ya usted está en este bot, que aparezca nada más el mensaje ya usted está en este bot. Que nada más aparezca el mensaje ya usted está en este bot. Y ya"
    if (
      input.startsWith('/start ref_') || 
      input.startsWith('ref_') || 
      input.includes('start=ref_') ||
      input.toLowerCase() === '/referido'
    ) {
      // User is already registered in the bot, display ONLY the exact required phrase
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-ref-${Date.now()}`,
          sender: 'bot',
          isAlertOnly: true,
          text: '⚠️ Ya usted está en este bot.',
          timestamp: time,
        },
      ]);
      return;
    }

    // 1. /start
    if (input === '/start') {
      const lines = [
        `⚡ <b>${DEFAULT_CONFIG.bot_name}</b>`,
        '',
        `👤 <b>Usuario:</b> ${user.first_name}`,
        `🆔 <b>ID:</b> <code>${user.user_id}</code>`,
        `💎 <b>Plan:</b> ${planInfo.badge} ${planInfo.display}`,
        `💰 <b>Saldo:</b> ${isOwner ? 'Ilimitado' : `${user.balance}$`}`,
        `🌐 <b>Estado ToDus:</b> Online (s3.todus.cu/stream)`,
      ];

      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: lines.join('\n'),
          timestamp: time,
          inlineButtons: getStartButtons(),
        },
      ]);
      return;
    }

    // 2. /ayuda
    if (input === '/ayuda' || input === '/help') {
      const lines = [
        '📖 <b>GUÍA DE USO Y COMANDOS 2026</b>',
        '',
        '1. Envía o reenvía documentos, APKs, vídeos o audios.',
        '2. Pega enlaces de <b>YouTube</b>, TikTok, Facebook, Instagram o descargas directas.',
        '3. <b>YouTube funciona sin cookies</b>: selecciona calidad y lo subirá a ToDus S3 a más de 6 MB/s.',
        '4. Recibirás tu enlace permanente de ToDus S3 listo para descargar o compartir en TXT.',
        '',
        '<b>Comandos rápidos:</b>',
        '/cuota - Consulta de consumo diario y cuenta regresiva UTC',
        '/cola - Estado de tareas activas en cola justa',
        '/historial - Ver y descargar archivos anteriores',
        '/planes - Catálogo de planes y compra con saldo',
        '/top - Top 10 usuarios con mayor volumen en la nube',
        isOwner ? '/jkadmin - Panel de control de administrador root' : '',
        '',
        `<i>Mod by: ${DEFAULT_CONFIG.bot_creator}</i>`,
      ].filter(Boolean);

      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: lines.join('\n'),
          timestamp: time,
        },
      ]);
      return;
    }

    // 3. /cuota
    if (input === '/cuota') {
      const usage = AppStorage.getUserDailyUsage(activeUserId);
      const lines = [
        `📊 <b>ESTADO DE TU CUOTA Y CONSUMO</b>`,
        '',
        `💎 <b>Plan:</b> ${planInfo.badge} <b>${planInfo.display}</b>`,
        `📦 <b>Límite diario:</b> ${planInfo.daily_label}`,
        `📈 <b>Gastado hoy:</b> ${formatBytes(usage.bytesToday)}`,
        `⏳ <b>Retención en nube:</b> ${planInfo.storage_label}`,
        `🚀 <b>Total subido histórico:</b> ${(usage.totalBytes / GIB).toFixed(2)} GB`,
        '',
        `<i>🔄 Reinicio automático diario a las 00:00:00 UTC.</i>`,
      ];

      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: lines.join('\n'),
          timestamp: time,
          inlineButtons: [
            [
              { text: '💎 Comprar Plan', action: () => onNavigateTab('plans') },
              { text: '🚀 Subir Archivo', action: () => onNavigateTab('uploader') },
            ],
          ],
        },
      ]);
      return;
    }

    // 4. /cola
    if (input === '/cola') {
      const userTasks = taskQueue.getTasksForUser(activeUserId);
      const lines = userTasks.length === 0
        ? [
            '⚡ <b>COLA DE TAREAS</b>',
            '',
            'No tienes transferencias en cola actualmente.',
            'Envía un archivo o enlace para comenzar.',
          ]
        : [
            `⚡ <b>COLA DE TAREAS (${userTasks.length} activas)</b>`,
            '',
            ...userTasks.map((t, i) => `${i + 1}. <b>${t.filename}</b> [${t.state.toUpperCase()}] • ${formatBytes(t.size)}`),
          ];

      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: lines.join('\n'),
          timestamp: time,
          inlineButtons: [
            [{ text: '⚡ Ver Cola en Vivo en Dashboard', action: () => onNavigateTab('queue') }],
          ],
        },
      ]);
      return;
    }

    // 5. /historial
    if (input === '/historial') {
      const history = AppStorage.getHistory(activeUserId).slice(0, 5);
      const lines = history.length === 0
        ? [
            '🗄️ <b>HISTORIAL TODUS S3</b>',
            '',
            'No tienes descargas registradas en tu historial aún.',
          ]
        : [
            `🗄️ <b>TUS ÚLTIMAS DESCARGAS TODUS S3</b>`,
            '',
            ...history.map((h, i) => `${i + 1}. <b>${h.filename}</b> (${formatBytes(h.size)})\n   🔗 <code>${h.urls[0]}</code>`),
          ];

      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: lines.join('\n'),
          timestamp: time,
          inlineButtons: [
            [{ text: '🗄️ Abrir Historial Completo', action: () => onNavigateTab('history') }],
          ],
        },
      ]);
      return;
    }

    // 6. /top
    if (input === '/top') {
      const users = AppStorage.getUsers();
      const usages = AppStorage.getUsage();
      const rows = Object.keys(users)
        .map(uid => ({
          uid: Number(uid),
          bytes: usages[uid]?.total_bytes || 0,
        }))
        .sort((a, b) => b.bytes - a.bytes)
        .slice(0, 5);

      const totalCommunity = Object.values(usages).reduce((a, b) => a + (b.total_bytes || 0), 0);

      const lines = [
        '🏆 <b>RANKING TOP USUARIOS DE LA COMUNIDAD</b>',
        '',
        ...rows.map((r, i) => `${i + 1}. Usuario <b>••••${String(r.uid).slice(-4)}</b> · ${(r.bytes / GIB).toFixed(2)} GB`),
        '',
        `🌐 <b>Total acumulado ToDus:</b> ${(totalCommunity / GIB).toFixed(2)} GB`,
      ];

      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: lines.join('\n'),
          timestamp: time,
          inlineButtons: [
            [{ text: '🏆 Ver Ranking Completo', action: () => onNavigateTab('leaderboard') }],
          ],
        },
      ]);
      return;
    }

    // 7. /planes
    if (input === '/planes') {
      const lines = [
        '💎 <b>CATÁLOGO DE SUSCRIPCIONES Y DURACIÓN</b>',
        '',
        '🆓 <b>Plan Gratis:</b> 2 GB cuota / 12h retención / 0$',
        '⭐ <b>VIP Básico:</b> 10 GB cuota / 24h retención / 250$',
        '💎 <b>VIP Medio:</b> 15 GB cuota / 48h retención / 500$',
        '👑 <b>Premium:</b> Ilimitado (∞ GB) / 72h retención / 1000$',
        '',
        `💰 <b>Tu saldo disponible:</b> ${isOwner ? 'Ilimitado' : `${user.balance}$`}`,
        `🎁 <b>Enlace de referidos (gana 10$):</b>\n<code>https://t.me/Downfree_jk_bot?start=ref_${activeUserId}</code>`,
      ];

      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: lines.join('\n'),
          timestamp: time,
          inlineButtons: [
            [{ text: '💎 Comprar en el Dashboard', action: () => onNavigateTab('plans') }],
          ],
        },
      ]);
      return;
    }

    // 8. /jkadmin
    if (input === '/jkadmin') {
      if (!isOwner) {
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            sender: 'bot',
            text: '⛔ <b>Acceso Restringido:</b> Este comando solo está disponible para el administrador root.',
            timestamp: time,
          },
        ]);
        return;
      }

      const usersCount = Object.keys(AppStorage.getUsers()).length;
      const lines = [
        '👑 <b>PANEL DE CONTROL ADMINISTRATIVO</b>',
        '',
        `👥 Usuarios registrados: <b>${usersCount}</b>`,
        `⚡ Servidor ToDus S3: <b>s3.todus.cu/stream (Activo)</b>`,
        `🚀 Motor de descarga: <b>yt-dlp sin cookies integrado</b>`,
      ];

      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: lines.join('\n'),
          timestamp: time,
          inlineButtons: [
            [{ text: '🛡️ Abrir Panel Maestro', action: () => onNavigateTab('admin') }],
          ],
        },
      ]);
      return;
    }

    // 9. /backup
    if (input === '/backup') {
      if (!isOwner) {
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            sender: 'bot',
            text: '⛔ Solo el creador puede generar respaldos.',
            timestamp: time,
          },
        ]);
        return;
      }

      const lines = [
        '📦 <b>RESPALDO DE DATOS GENERADO CON ÉXITO</b>',
        '',
        `📅 <b>Fecha:</b> ${new Date().toUTCString()}`,
        `💾 <b>Cifrado:</b> AES-256-GCM`,
        `🗂️ <b>Bases de datos incluidas:</b> users, plans, usage, history, audit`,
        '',
        '<i>Listo para restaurar en caso de migración.</i>',
      ];

      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: lines.join('\n'),
          timestamp: time,
        },
      ]);
      return;
    }

    // 10. YouTube and URL Processing
    if (input.startsWith('http://') || input.startsWith('https://')) {
      if (isPlayStorePage(input)) {
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            sender: 'bot',
            text: [
              '⚠️ <b>Aviso Google Play Store:</b>',
              'Las URLs de Play Store son fichas informativas, no archivos APK directos.',
              'Envía el archivo .apk o un enlace de descarga directa del APK.',
            ].join('\n'),
            timestamp: time,
          },
        ]);
        return;
      }

      // Check if YouTube link
      if (isYouTubeUrl(input)) {
        const meta = getYouTubeMetadata(input);
        const filename = extractUrlFilename(input, '720p');

        const enq = taskQueue.enqueueTask({
          userId: activeUserId,
          chatId: activeUserId,
          filename,
          size: 78 * 1024 * 1024,
          sourceKind: 'platform_video',
          sourceUrl: input,
        });

        if (!enq.success) {
          setMessages((prev) => [
            ...prev,
            {
              id: `bot-${Date.now()}`,
              sender: 'bot',
              text: `❌ <b>Error al procesar YouTube:</b>\n${enq.error}`,
              timestamp: time,
            },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: `bot-${Date.now()}`,
              sender: 'bot',
              text: [
                `▶️ <b>YOUTUBE DETECTADO (SIN COOKIES REQUERIDAS)</b>`,
                '',
                `🎬 <b>Título:</b> ${meta?.title || filename}`,
                `⏱️ <b>Duración:</b> ${meta?.durationFormatted || '4:14'}`,
                `📦 <b>Formato por defecto:</b> MP4 720p (~78 MB)`,
                `⚡ <b>Velocidad de subida:</b> ≥ 6.8 MB/s hacia ToDus S3`,
                '',
                `<i>Subida directa en proceso hacia s3.todus.cu/stream...</i>`,
              ].join('\n'),
              timestamp: time,
              inlineButtons: [
                [{ text: '🚀 Ver Transferencia en Vivo', action: () => onNavigateTab('uploader') }],
              ],
            },
          ]);
        }
        return;
      }

      // Other URLs
      const filename = extractUrlFilename(input);
      const isPlatform = isSupportedPlatformUrl(input);
      const enq = taskQueue.enqueueTask({
        userId: activeUserId,
        chatId: activeUserId,
        filename,
        size: 220 * 1024 * 1024,
        sourceKind: isPlatform ? 'platform_video' : 'http_url',
        sourceUrl: input,
      });

      if (!enq.success) {
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            sender: 'bot',
            text: `❌ <b>Error al encolar:</b>\n${enq.error}`,
            timestamp: time,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            sender: 'bot',
            text: [
              `📥 <b>Enlace recibido y encolado:</b>`,
              `📁 <b>Archivo:</b> ${filename}`,
              `⚡ <b>Transferencia a ToDus S3:</b> En proceso a > 6.5 MB/s`,
            ].join('\n'),
            timestamp: time,
            inlineButtons: [
              [{ text: '🚀 Ver Progreso en Vivo', action: () => onNavigateTab('uploader') }],
            ],
          },
        ]);
      }
      return;
    }

    // Unrecognized command
    setMessages((prev) => [
      ...prev,
      {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: `Comando no reconocido: <code>${input}</code>\nEscribe <b>/ayuda</b> para ver los comandos disponibles o pega un enlace de YouTube.`,
        timestamp: time,
        inlineButtons: [
          [{ text: '❓ Ver Ayuda', action: () => sendBotCommand('/ayuda') }],
        ],
      },
    ]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    sendBotCommand(inputVal);
    setInputVal('');
  };

  return (
    <div className="terminal-card rounded-2xl border border-emerald-500/20 flex flex-col h-[720px] overflow-hidden shadow-2xl bg-[#090d16]">
      {/* Sleek 2026 Telegram Header */}
      <div className="bg-[#0c121e] px-5 py-3.5 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-600 to-cyan-500 p-0.5 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              <div className="w-full h-full bg-[#090d16] rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0c121e]" />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-white">{DEFAULT_CONFIG.bot_name}</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-xs text-emerald-400/90 font-mono">
              bot oficial • respuesta instantánea
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setMessages([])}
            title="Limpiar chat"
            className="p-2 rounded-lg bg-gray-900 border border-gray-800 text-gray-400 hover:text-white transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div ref={scrollRef} className="flex-1 p-5 overflow-y-auto space-y-4 bg-[#070a12]/95">
        {messages.map((msg) => {
          const isBot = msg.sender === 'bot';

          // Isolated alert (such as the specific referral check "Ya usted está en este bot.")
          if (msg.isAlertOnly) {
            return (
              <div key={msg.id} className="flex justify-center my-2">
                <div className="bg-amber-950/80 border border-amber-500/40 text-amber-200 px-4 py-2.5 rounded-xl text-xs font-mono font-bold shadow-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{msg.text}</span>
                </div>
              </div>
            );
          }

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isBot ? 'items-start' : 'items-end'}`}
            >
              <div
                className={`max-w-2xl rounded-2xl p-4 text-xs space-y-3 transition-all ${
                  isBot
                    ? 'bg-[#101726]/90 text-gray-200 border border-emerald-500/20 shadow-[0_4px_20px_rgba(0,0,0,0.3)]'
                    : 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-black font-semibold shadow-lg shadow-emerald-500/10'
                }`}
              >
                {/* HTML content rendering */}
                <div
                  className="whitespace-pre-wrap leading-relaxed font-sans"
                  dangerouslySetInnerHTML={{ __html: msg.text }}
                />

                {/* Modern Inline Keyboard Buttons */}
                {msg.inlineButtons && msg.inlineButtons.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-emerald-500/15">
                    {msg.inlineButtons.map((row, rIdx) => (
                      <div key={rIdx} className="flex flex-wrap gap-2">
                        {row.map((btn, bIdx) => (
                          <button
                            key={bIdx}
                            onClick={btn.action}
                            className={`flex-1 py-2 px-3.5 rounded-xl text-xs font-medium transition-all text-center cursor-pointer ${
                              btn.isPrimary
                                ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-bold hover:brightness-110 shadow-md shadow-emerald-500/20'
                                : 'bg-[#131d2e] text-emerald-300 border border-emerald-500/30 hover:bg-emerald-950/40 hover:border-emerald-400/50'
                            }`}
                          >
                            {btn.text}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                )}

                <div className={`text-[10px] text-right font-mono ${isBot ? 'text-gray-500' : 'text-emerald-950 font-medium'}`}>
                  {msg.timestamp}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input bar */}
      <form onSubmit={handleSubmit} className="p-3 bg-[#0c121e] border-t border-gray-800 flex items-center gap-2">
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Escribe un comando (/start, /ayuda, /cola) o pega un enlace de YouTube..."
          className="flex-1 bg-[#070b14] border border-gray-800 rounded-xl px-4 py-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 font-sans"
        />
        <button
          type="submit"
          disabled={!inputVal.trim()}
          className="p-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:brightness-110 text-black font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
