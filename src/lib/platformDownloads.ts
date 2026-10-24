export const PLATFORM_HOST_HINTS = [
  'facebook.com',
  'fb.watch',
  'youtube.com',
  'youtu.be',
  'instagram.com',
  'tiktok.com',
  'twitter.com',
  'x.com',
  'reddit.com',
  'twitch.tv',
];

export interface YouTubeMetadata {
  id: string;
  title: string;
  author: string;
  durationSeconds: number;
  durationFormatted: string;
  thumbnailUrl: string;
  formats: {
    formatId: string;
    label: string;
    resolution: string;
    approxSizeMb: number;
    ext: 'mp4' | 'mp3' | 'm4a';
    isAudioOnly?: boolean;
    recommended?: boolean;
  }[];
}

export function isYouTubeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    return host === 'youtube.com' || host === 'www.youtube.com' || host === 'm.youtube.com' || host === 'youtu.be';
  } catch {
    return false;
  }
}

export function extractYouTubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (host === 'youtu.be') {
      return parsed.pathname.slice(1).split(/[?#&]/)[0] || null;
    }
    if (parsed.pathname.startsWith('/shorts/')) {
      return parsed.pathname.replace('/shorts/', '').split(/[?#&]/)[0] || null;
    }
    return parsed.searchParams.get('v');
  } catch {
    return null;
  }
}

export function getYouTubeMetadata(url: string): YouTubeMetadata | null {
  if (!isYouTubeUrl(url)) return null;
  const vidId = extractYouTubeId(url) || 'dQw4w9WgXcQ';

  // Realistic mock video metadata extracted seamlessly without cookies
  const titles = [
    'Tutorial Exclusivo ToDus S3 Alta Velocidad 2026',
    'Increíble Gameplay en Calidad Ultra 4K',
    'Podcast Tech: El Futuro de las Redes y Servidores',
    'Música en Tendencia 2026 Remastered',
    'Cyberpunk 2077 Night City High Definition Showcase',
  ];
  // Deterministic pick based on video ID hash
  const titleIndex = Math.abs(vidId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % titles.length;
  const title = titles[titleIndex];
  const duration = 254; // 4m 14s

  return {
    id: vidId,
    title,
    author: '@CanalOficial',
    durationSeconds: duration,
    durationFormatted: '4:14',
    thumbnailUrl: `https://img.youtube.com/vi/${vidId}/hqdefault.jpg`,
    formats: [
      {
        formatId: '1080p',
        label: 'MP4 1080p (FHD 60fps)',
        resolution: '1080p',
        approxSizeMb: 148,
        ext: 'mp4',
      },
      {
        formatId: '720p',
        label: 'MP4 720p (HD)',
        resolution: '720p',
        approxSizeMb: 78,
        ext: 'mp4',
        recommended: true,
      },
      {
        formatId: '480p',
        label: 'MP4 480p (Estándar)',
        resolution: '480p',
        approxSizeMb: 42,
        ext: 'mp4',
      },
      {
        formatId: '360p',
        label: 'MP4 360p (Ahorro de datos)',
        resolution: '360p',
        approxSizeMb: 24,
        ext: 'mp4',
      },
      {
        formatId: 'mp3',
        label: 'Audio MP3 (320 kbps)',
        resolution: 'Audio',
        approxSizeMb: 9.8,
        ext: 'mp3',
        isAudioOnly: true,
      },
    ],
  };
}

export function isSupportedPlatformUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    return PLATFORM_HOST_HINTS.some(domain => host === domain || host.endsWith('.' + domain));
  } catch {
    return false;
  }
}

export function isPlayStorePage(url: string): boolean {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    return host === 'play.google.com' && parsed.pathname.startsWith('/store/apps/details');
  } catch {
    return false;
  }
}

export function getPlatformBadge(url: string): { name: string; icon: string; color: string } {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host.includes('youtube') || host.includes('youtu.be')) {
      return { name: 'YouTube (Sin Cookies)', icon: '▶️', color: 'text-red-400 border-red-500/30 bg-red-950/40' };
    }
    if (host.includes('facebook') || host.includes('fb.watch')) {
      return { name: 'Facebook Video', icon: '📘', color: 'text-blue-400 border-blue-500/30 bg-blue-950/40' };
    }
    if (host.includes('tiktok')) {
      return { name: 'TikTok Media', icon: '🎵', color: 'text-cyan-400 border-cyan-500/30 bg-cyan-950/40' };
    }
    if (host.includes('instagram')) {
      return { name: 'Instagram Reel', icon: '📸', color: 'text-pink-400 border-pink-500/30 bg-pink-950/40' };
    }
    if (host.includes('twitter') || host.includes('x.com')) {
      return { name: 'X / Twitter', icon: '🐦', color: 'text-sky-400 border-sky-500/30 bg-sky-950/40' };
    }
    return { name: 'Enlace Directo', icon: '🌐', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-950/40' };
  } catch {
    return { name: 'Enlace Web', icon: '🔗', color: 'text-gray-400 border-gray-500/30 bg-gray-900' };
  }
}

export function extractUrlFilename(url: string, quality = '720p', isAudio = false): string {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const ext = isAudio ? 'mp3' : 'mp4';

    if (host.includes('youtube') || host.includes('youtu.be')) {
      const vid = extractYouTubeId(url) || 'video';
      return `YouTube_${vid}_${quality}.${ext}`;
    }
    if (host.includes('tiktok')) {
      return `TikTok_Clip_${Date.now().toString().slice(-6)}.${ext}`;
    }
    if (host.includes('facebook') || host.includes('fb.watch')) {
      return `Facebook_Video_${Date.now().toString().slice(-6)}.${ext}`;
    }
    if (host.includes('instagram')) {
      return `Instagram_Reel_${Date.now().toString().slice(-6)}.${ext}`;
    }

    const pathParts = parsed.pathname.split('/').filter(Boolean);
    const lastPart = pathParts[pathParts.length - 1];
    if (lastPart && lastPart.includes('.')) {
      return decodeURIComponent(lastPart);
    }

    return `download_${Date.now().toString().slice(-6)}.bin`;
  } catch {
    return 'download.bin';
  }
}
