// Shared utilities — single source of truth

export const PLATFORMS = [
    { key: 'youtube', label: 'YouTube', color: 'text-red-400 bg-red-500/10' },
    { key: 'tiktok', label: 'TikTok', color: 'text-violet-400 bg-violet-500/10' },
    { key: 'instagram', label: 'Instagram', color: 'text-pink-400 bg-pink-500/10' },
    { key: 'vk', label: 'ВК', color: 'text-blue-400 bg-blue-500/10' },
    { key: 'threads', label: 'Threads', color: 'text-neutral-300 bg-neutral-500/10' },
    { key: 'telegram', label: 'Telegram', color: 'text-sky-400 bg-sky-500/10' },
    { key: 'max', label: 'Макс', color: 'text-cyan-400 bg-cyan-500/10' },
    { key: 'likee', label: 'Лайки', color: 'text-orange-400 bg-orange-500/10' },
] as const;

export function formatNumber(n: number): string {
    if (!n && n !== 0) return '0';
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
    return n.toLocaleString('ru-RU');
}

export function transliterate(text: string): string {
    const ru: { [key: string]: string } = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 
        'е': 'e', 'ё': 'e', 'ж': 'zh', 'з': 'zh', 'и': 'i', 
        'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 
        'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 
        'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 
        'ш': 'sh', 'щ': 'sch', 'ъ': 'sch', 'ы': 'y', 'ь': '', 
        'э': 'e', 'ю': 'yu', 'я': 'ya'
    };
    return text.toLowerCase().split('').map(char => ru[char] || char).join('');
}

export function getYouTubeThumbnail(url: string): string {
    const match = url.match(/[?&]v=([A-Za-z0-9_-]{11})/) || url.match(/youtu\.be\/([A-Za-z0-9_-]{11})/);
    return match ? `https://i.ytimg.com/vi/${match[1]}/hqdefault.jpg` : '';
}

export function detectPlatform(url: string): string {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('tiktok.com')) return 'tiktok';
    if (url.includes('instagram.com')) return 'instagram';
    if (url.includes('vk.com') || url.includes('vk.ru')) return 'vk';
    if (url.includes('threads.net')) return 'threads';
    if (url.includes('t.me') || url.includes('telegram')) return 'telegram';
    if (url.includes('max.ru')) return 'max';
    if (url.includes('likee.video') || url.includes('likee.com')) return 'likee';
    return 'other';
}

export function getProjectThumbnail(project: { cover_url?: string; video_assets?: Array<{ thumbnail_url?: string; video_url?: string }> }): string {
    if (project.cover_url) return project.cover_url;
    const assets = project.video_assets || [];
    for (const a of assets) {
        if (a.thumbnail_url) return a.thumbnail_url;
        if (a.video_url?.includes('youtu')) {
            const t = getYouTubeThumbnail(a.video_url);
            if (t) return t;
        }
    }
    return '';
}
