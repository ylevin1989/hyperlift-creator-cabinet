/**
 * Telegram Bot notification helper
 * Sends notifications to admin chat when new videos are uploaded
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://creator.hyperlift.ru';

interface NotifyOptions {
    creatorName: string;
    projectTitle: string;
    videoUrl: string;
    platform: string;
    projectId?: string;
}

export async function notifyNewVideo(opts: NotifyOptions): Promise<boolean> {
    if (!BOT_TOKEN || !CHAT_ID) {
        console.log('[TG Notify] No TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID set, skipping');
        return false;
    }

    const platformEmoji: Record<string, string> = {
        youtube: '🔴 YouTube',
        tiktok: '🎵 TikTok',
        instagram: '📸 Instagram',
        vk: '🔵 ВК',
        threads: '🧵 Threads',
        telegram: '✈️ Telegram',
        max: '🟦 Макс',
        likee: '🟠 Лайки',
        other: '📎 Другое',
    };

    const adminLink = `${SITE_URL}/admin`;
    const platLabel = platformEmoji[opts.platform] || platformEmoji.other;

    const text = [
        `🎬 <b>Новый ролик загружен!</b>`,
        ``,
        `👤 Креатор: <b>${escapeHtml(opts.creatorName)}</b>`,
        `📁 Проект: <b>${escapeHtml(opts.projectTitle)}</b>`,
        `📺 Платформа: ${platLabel}`,
        `🔗 <a href="${opts.videoUrl}">Ссылка на ролик</a>`,
        ``,
        `👉 <a href="${adminLink}">Открыть админку</a>`,
    ].join('\n');

    try {
        const apiUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
        const res = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text,
                parse_mode: 'HTML',
                disable_web_page_preview: true,
            }),
        });
        const data = await res.json();
        if (data.ok) {
            console.log('[TG Notify] Notification sent successfully');
            return true;
        } else {
            console.error('[TG Notify] API error:', data.description);
            return false;
        }
    } catch (e: any) {
        console.error('[TG Notify] Send error:', e?.message || e);
        return false;
    }
}

export async function notifyNewCreator(creatorName: string, username: string): Promise<boolean> {
    if (!BOT_TOKEN || !CHAT_ID) return false;

    const adminLink = `${SITE_URL}/admin`;
    const text = [
        `👋 <b>Новый креатор зарегистрирован!</b>`,
        ``,
        `👤 ${escapeHtml(creatorName)}`,
        `📛 @${escapeHtml(username)}`,
        ``,
        `⏳ Ожидает одобрения`,
        `👉 <a href="${adminLink}">Открыть админку</a>`,
    ].join('\n');

    try {
        const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: 'HTML', disable_web_page_preview: true }),
        });
        return (await res.json()).ok || false;
    } catch { return false; }
}

function escapeHtml(str: string): string {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
