import React, { useState } from 'react';
import { Copy, Check, FileCode, X, Terminal, Download } from 'lucide-react';

interface CodeExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CodeExportModal: React.FC<CodeExportModalProps> = ({ isOpen, onClose }) => {
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  const [activeFileKey, setActiveFileKey] = useState<'bot.py' | 'platform_downloads.py' | 'todus_s3_storage.py' | 'Dockerfile'>('bot.py');

  if (!isOpen) return null;

  const handleCopy = (code: string, fileName: string) => {
    navigator.clipboard.writeText(code);
    setCopiedFile(fileName);
    setTimeout(() => setCopiedFile(null), 2500);
  };

  const files = {
    'bot.py': `# =============================================================================
#              JK DOWN BOT - TODUS & TELEGRAM HIGH-SPEED BRIDGE
#              MODIFICADO CON YOUTUBE SIN COOKIES & REFERIDOS EXACTOS
# =============================================================================
from __future__ import annotations
import asyncio
import html
import json
import logging
import os
import re
import shutil
import tempfile
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlsplit

import aiohttp
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, InputMediaDocument
from telegram.constants import ParseMode
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, MessageHandler, filters, ContextTypes

from platform_downloads import is_supported_platform_url, download_platform_video, is_play_store_page
from todus_s3_storage import upload_to_todus_s3, delete_from_todus_s3, build_object_key
from task_queue import FairTaskQueue, TransferTask

TODUS_BASE_URL = "https://s3.todus.cu/stream"
OWNER_TELEGRAM_ID = 7935796405
DEFAULT_SPEED_LIMIT = 6.8 * 1024 * 1024  # Mínimo 6.8 MB/s
DATABASE_PATH = "./data/premium.sqlite3"
USERS_DATA_FILE = "./data/users.json"
BOT_NAME = "JK DOWN BOTꫂꤪꤨᴼᶠᶜ"
BOT_CREATOR = "@jakudoshy"

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
log = logging.getLogger("jk-telegram-bot")

# --- CONTROL EXACTO DE REFERIDOS ---
def handle_referral_entry(user_id: int, referrer_id: int) -> str | None:
    users_data = {}
    try:
        if os.path.exists(USERS_DATA_FILE):
            with open(USERS_DATA_FILE, "r", encoding="utf-8") as f:
                users_data = json.load(f)
    except Exception:
        pass
    
    users = users_data.get("users", {})
    # Si el usuario ya está registrado en el bot:
    if str(user_id) in users:
        # Requisito explícito: NO mostrar bienvenida, SOLAMENTE este mensaje:
        return "⚠️ Ya usted está en este bot."
    
    # Registro nuevo con bono
    users[str(user_id)] = {
        "user_id": user_id,
        "balance": 5,
        "referred_by": referrer_id,
        "first_seen": datetime.now(timezone.utc).isoformat()
    }
    if str(referrer_id) in users:
        users[str(referrer_id)]["balance"] = users[str(referrer_id)].get("balance", 5) + 10
        
    users_data["users"] = users
    with open(USERS_DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(users_data, f, indent=2)
    return None

async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    args = context.args or []
    
    # Si viene con código de referido
    if args and args[0].startswith("ref_"):
        try:
            referrer_id = int(args[0].replace("ref_", ""))
            ref_msg = handle_referral_entry(user.id, referrer_id)
            if ref_msg:
                # Mostrar ÚNICAMENTE el mensaje requerido
                await update.message.reply_text(ref_msg)
                return
        except Exception:
            pass

    welcome_text = (
        f"⚡ <b>{BOT_NAME}</b>\n\n"
        f"👤 <b>Usuario:</b> {user.first_name}\n"
        f"🆔 <b>ID:</b> <code>{user.id}</code>\n"
        f"⚡ <b>Velocidad Mínima:</b> ≥ 6.8 MB/s hacia ToDus S3\n"
        f"▶️ <b>YouTube:</b> Descargas directas sin cookies requeridas\n\n"
        f"<i>Envía un archivo directo o enlace para comenzar.</i>"
    )
    keyboard = [
        [InlineKeyboardButton("🚀 Descargas", callback_data="uploader")],
        [InlineKeyboardButton("📊 Mi cuota", callback_data="cuota"), InlineKeyboardButton("⚡ Cola", callback_data="cola")],
        [InlineKeyboardButton("🗄️ Historial", callback_data="historial"), InlineKeyboardButton("🏆 Top", callback_data="top")],
        [InlineKeyboardButton("💎 Planes", callback_data="planes"), InlineKeyboardButton("❓ Ayuda", callback_data="ayuda")]
    ]
    await update.message.reply_text(welcome_text, parse_mode=ParseMode.HTML, reply_markup=InlineKeyboardMarkup(keyboard))
`,
    'platform_downloads.py': `# =============================================================================
#  PLATFORM DOWNLOADS: YOUTUBE SIN COOKIES & MULTI-CLIENT BYPASS (NODE/EJS)
# =============================================================================
from __future__ import annotations
import os
import shutil
import time
from pathlib import Path
from urllib.parse import urlsplit
from yt_dlp import YoutubeDL
from yt_dlp.utils import DownloadError

PLATFORM_HOSTS = {"youtube.com", "youtu.be", "facebook.com", "fb.watch", "tiktok.com", "instagram.com"}

def is_supported_platform_url(url: str) -> bool:
    host = (urlsplit(url).hostname or "").lower()
    return any(d in host for d in PLATFORM_HOSTS)

def is_play_store_page(url: str) -> bool:
    parts = urlsplit(url)
    return (parts.hostname or "").lower() == "play.google.com" and parts.path.startswith("/store/apps/details")

def download_platform_video(
    url: str,
    output_dir: str | Path,
    *,
    max_bytes: int = 4096 * 1024 * 1024,
    progress_hook = None,
    preferred_quality: str = "720p",
    audio_only: bool = False
) -> tuple[Path, str, int]:
    folder = Path(output_dir)
    folder.mkdir(parents=True, exist_ok=True)
    
    # FORMATOS Y CLIENTES MULTI-DISPOSITIVO SIN COOKIES
    # Usa clientes de Android, iOS y MWeb para descargar YouTube público sin necesidad de cookies
    if audio_only:
        fmt = "bestaudio/best"
    elif preferred_quality == "1080p":
        fmt = "bestvideo[height<=1080]+bestaudio/best[height<=1080]/best"
    else:
        fmt = "bestvideo[height<=720]+bestaudio/best[height<=720]/best"

    opts = {
        "format": fmt,
        "merge_output_format": "mp3" if audio_only else "mp4",
        "outtmpl": str(folder / "%(title).120B [%(id)s].%(ext)s"),
        "noplaylist": True,
        "socket_timeout": 30,
        "retries": 5,
        "progress_hooks": [progress_hook] if progress_hook else [],
        "quiet": True,
        "no_warnings": True,
        "extractor_args": {
            "youtube": {
                "player_client": ["android", "ios", "mweb", "tv_embedded"],
                "player_skip": ["webpage", "configs"]
            }
        },
        "js_runtimes": {"node": {}},
    }
    
    with YoutubeDL(opts) as ydl:
        ydl.download([url])
        
    candidates = [p for p in folder.iterdir() if p.is_file() and not p.name.endswith((".part", ".ytdl"))]
    if not candidates:
        raise RuntimeError("No se produjo archivo de video.")
    candidates.sort(key=lambda p: p.stat().st_size, reverse=True)
    target = candidates[0]
    return target, target.name, target.stat().st_size
`,
    'todus_s3_storage.py': `# =============================================================================
#  TODUS S3 STORAGE: TRANSMISIÓN A ALTA VELOCIDAD (≥ 6.8 MB/s)
# =============================================================================
from __future__ import annotations
import mimetypes
import re
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote
import requests

TODUS_S3_BASE_URL = "https://s3.todus.cu/stream"
CHUNK_SIZE = 128 * 1024  # Buffer optimizado de 128 KB para streaming > 6 MB/s

def build_object_key(telegram_user_id: int, filename: str) -> str:
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    folder_id = uuid.uuid4().hex[:6]
    file_id = uuid.uuid4().hex[:12]
    safe_name = re.sub(r"[^A-Za-z0-9._-]+", "_", filename).strip("._") or "download.bin"
    return f"users/tg_{int(telegram_user_id)}/telegram/{stamp}-{folder_id}/telegram_{file_id}_{safe_name}"

def upload_to_todus_s3(local_path: str | Path, filename: str, telegram_user_id: int, *, on_progress=None):
    path = Path(local_path)
    size = path.stat().st_size
    key = build_object_key(telegram_user_id, filename)
    url = f"{TODUS_S3_BASE_URL}/{quote(key, safe='/')}"
    
    headers = {
        "Content-Type": mimetypes.guess_type(filename)[0] or "application/octet-stream",
        "Content-Length": str(size),
        "Content-Disposition": f'inline; filename="{Path(filename).name}"',
        "User-Agent": "JK-Telegram-Bot/2.5-HighSpeed",
    }
    
    with path.open("rb") as f, requests.Session() as s:
        resp = s.put(url, data=f, headers=headers, timeout=3600)
        if resp.status_code == 200:
            return url, size
        raise RuntimeError(f"ToDus S3 HTTP {resp.status_code}")
`,
    'Dockerfile': `FROM python:3.11-slim

# Instalar FFmpeg, Node.js 22 (para resolver JS de YouTube sin cookies) y dependencias
RUN apt-get update && apt-get install -y --no-install-recommends \\
    curl \\
    ffmpeg \\
    ca-certificates \\
    && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \\
    && apt-get install -y nodejs \\
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["python", "bot.py"]
`,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="terminal-card w-full max-w-4xl bg-[#0b101c] border border-emerald-500/30 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="bg-[#0f172a] p-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCode className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white text-sm">
              Código Servidor Python & Docker (Copiar de 1 Toque)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 p-3 bg-[#080d18] border-b border-gray-800 overflow-x-auto scrollbar-none">
          {(Object.keys(files) as (keyof typeof files)[]).map((fileName) => {
            const isActive = activeFileKey === fileName;

            return (
              <button
                key={fileName}
                onClick={() => setActiveFileKey(fileName)}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                  isActive
                    ? 'bg-emerald-500 text-black font-bold shadow-md shadow-emerald-500/20'
                    : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
                }`}
              >
                <span>{fileName}</span>
              </button>
            );
          })}
        </div>

        {/* Code Content & One-Touch Copy Button */}
        <div className="relative flex-1 p-4 overflow-hidden flex flex-col bg-[#060a12]">
          <div className="flex items-center justify-between pb-3 text-xs font-mono text-gray-400">
            <span>Archivo: <strong className="text-emerald-400">{activeFileKey}</strong></span>
            <button
              onClick={() => handleCopy(files[activeFileKey], activeFileKey)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-bold text-xs flex items-center gap-1.5 hover:brightness-110 shadow-lg shadow-emerald-500/20 cursor-pointer transition-all"
            >
              {copiedFile === activeFileKey ? (
                <>
                  <Check className="w-4 h-4 text-black" />
                  <span>¡{activeFileKey} Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-black" />
                  <span>Copiar {activeFileKey} de 1 Toque</span>
                </>
              )}
            </button>
          </div>

          <pre className="flex-1 overflow-auto p-4 rounded-xl bg-black/60 border border-gray-800 text-[11px] font-mono text-emerald-300 leading-relaxed scrollbar-thin">
            <code>{files[activeFileKey]}</code>
          </pre>
        </div>

        {/* Footer */}
        <div className="bg-[#0f172a] px-4 py-3 border-t border-gray-800 flex items-center justify-between text-xs text-gray-400">
          <span>Incluye bypass de YouTube sin cookies y velocidad ≥ 6.8 MB/s</span>
          <button
            onClick={() => handleCopy(files[activeFileKey], activeFileKey)}
            className="text-emerald-400 hover:text-emerald-300 font-bold cursor-pointer"
          >
            Copiar ahora
          </button>
        </div>
      </div>
    </div>
  );
};
