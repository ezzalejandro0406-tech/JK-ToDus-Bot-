import { DEFAULT_CONFIG } from './constants';

function generateRandomHex(length: number): string {
  const characters = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

export function sanitizeFileName(name: string): string {
  const clean = name.replace(/[^A-Za-z0-9._-]+/g, '_').replace(/^[._]+|[._]+$/g, '');
  return clean || 'download.bin';
}

export function guessMimeType(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop() || '';
  const map: Record<string, string> = {
    apk: 'application/vnd.android.package-archive',
    mp4: 'video/mp4',
    mkv: 'video/x-matroska',
    webm: 'video/webm',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    zip: 'application/zip',
    rar: 'application/x-rar-compressed',
    tar: 'application/x-tar',
    gz: 'application/gzip',
    pdf: 'application/pdf',
    txt: 'text/plain; charset=utf-8',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
  };
  return map[ext] || 'application/octet-stream';
}

export function buildObjectKey(telegramUserId: number, filename: string, customDate?: Date): string {
  const now = customDate || new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  const hours = String(now.getUTCHours()).padStart(2, '0');
  const mins = String(now.getUTCMinutes()).padStart(2, '0');
  const secs = String(now.getUTCSeconds()).padStart(2, '0');
  const stamp = `${year}${month}${day}-${hours}${mins}${secs}`;

  const folderId = generateRandomHex(6);
  const fileId = generateRandomHex(12);
  const safeName = sanitizeFileName(filename);

  return `users/tg_${Math.floor(telegramUserId)}/telegram/${stamp}-${folderId}/telegram_${fileId}_${safeName}`;
}

export function buildTodusUrl(telegramUserId: number, filename: string, baseUrl = DEFAULT_CONFIG.todus_base_url): string {
  const key = buildObjectKey(telegramUserId, filename);
  return `${baseUrl.replace(/\/+$/, '')}/${encodeURI(key)}`;
}

export function calculateParts(filename: string, totalBytes: number, maxPartSizeMib: number): { partNames: string[]; partSizes: number[] } {
  const maxPartBytes = maxPartSizeMib * 1024 * 1024;
  if (totalBytes <= maxPartBytes) {
    return {
      partNames: [filename],
      partSizes: [totalBytes],
    };
  }

  const partsCount = Math.ceil(totalBytes / maxPartBytes);
  const parts: string[] = [];
  const sizes: number[] = [];
  const ext = filename.includes('.') ? '.' + filename.split('.').pop() : '';
  const base = ext ? filename.slice(0, -ext.length) : filename;

  let remaining = totalBytes;
  for (let i = 1; i <= partsCount; i++) {
    const partNum = String(i).padStart(3, '0');
    parts.push(`${base}.part${partNum}${ext}`);
    const currentPartSize = Math.min(remaining, maxPartBytes);
    sizes.push(currentPartSize);
    remaining -= currentPartSize;
  }

  return { partNames: parts, partSizes: sizes };
}

export function generateTxtExport(filename: string, urls: string[], sizeBytes: number): string {
  const isParted = urls.length > 1;
  const lines = [
    `=============================================================`,
    `               JK DOWN BOT - TODUS S3 STORAGE               `,
    `=============================================================`,
    `Archivo: ${filename}`,
    `Tamaño Total: ${(sizeBytes / (1024 * 1024)).toFixed(2)} MB (${sizeBytes} bytes)`,
    `Partes: ${urls.length}`,
    `Generado: ${new Date().toISOString()}`,
    `Mod by: ${DEFAULT_CONFIG.bot_creator}`,
    `-------------------------------------------------------------`,
    `ENLACES DE DESCARGA DIRECTA TODUS S3:`,
    ``,
  ];

  urls.forEach((url, idx) => {
    if (isParted) {
      lines.push(`Parte ${idx + 1}:`);
    }
    lines.push(url);
    lines.push(``);
  });

  if (isParted) {
    lines.push(`-------------------------------------------------------------`);
    lines.push(`INSTRUCCIONES PARA UNIR LAS PARTES:`);
    lines.push(`Linux / macOS:`);
    lines.push(`  cat "${filename}.part"* > "${filename}"`);
    lines.push(``);
    lines.push(`Windows:`);
    lines.push(`  copy /b "${filename}.part"* "${filename}"`);
    lines.push(`  O abre la primera parte con 7-Zip o WinRAR.`);
    lines.push(`-------------------------------------------------------------`);
  }

  return lines.join('\n');
}

export function downloadTextAsFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
