/**
 * Video metrics parser for YouTube, TikTok, Instagram
 * 
 * YouTube/TikTok: fetch + regex (fast, reliable)
 * Instagram: 3-tier strategy — embed page → Puppeteer → RapidAPI
 */

export interface VideoMetrics {
    title: string;
    views: number;
    likes: number;
    comments: number;
    thumbnail_url?: string;
}

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

export async function parseVideoMetrics(url: string): Promise<VideoMetrics> {
    try {
        let result: VideoMetrics = { title: '', views: 0, likes: 0, comments: 0 };
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            result = await parseYouTube(url);
        } else if (url.includes('tiktok.com')) {
            result = await parseTikTok(url);
        } else if (url.includes('instagram.com')) {
            result = await parseInstagram(url);
        }
        
        // Ensure no NaN values
        return {
            title: result.title || '',
            views: Number.isNaN(result.views) ? 0 : result.views,
            likes: Number.isNaN(result.likes) ? 0 : result.likes,
            comments: Number.isNaN(result.comments) ? 0 : result.comments,
            thumbnail_url: result.thumbnail_url
        };
    } catch (e: unknown) {
        console.error('parseVideoMetrics top-level error:', e);
    }
    return { title: '', views: 0, likes: 0, comments: 0 };
}

// ─── Safe fetch wrapper ─────────────────────────────────────────────────────
async function safeFetch(url: string, extraHeaders: Record<string, string> = {}): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': UA,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9,ru;q=0.8',
                'Cache-Control': 'no-cache',
                ...extraHeaders
            },
            redirect: 'follow',
            signal: controller.signal,
        });
        return await res.text();
    } finally {
        clearTimeout(timeout);
    }
}

// ─── YouTube ────────────────────────────────────────────────────────────────
async function parseYouTube(url: string): Promise<VideoMetrics> {
    let title = '', views = 0, likes = 0, comments = 0, thumbnail_url = '';

    // YouTube thumbnail is always available
    const videoId = extractYouTubeVideoId(url);
    if (videoId) {
        thumbnail_url = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    }
    try {
        const html = await safeFetch(url);

        // Title
        const titleMatch = html.match(/<title>(.*?)<\/title>/i) || html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i);
        if (titleMatch) title = titleMatch[1].replace(/(- YouTube)/ig, '').trim();
        if (title.length > 80) title = title.substring(0, 80) + '...';

        // Views — multiple strategies
        const vMatch = html.match(/"viewCount":"(\d+)"/) ||
            html.match(/itemprop="interactionCount"\s+content="(\d+)"/i) ||
            html.match(/viewCount.*?"(\d+)"/) ||
            html.match(/"views".*?"(\d+)"/);
        if (vMatch) views = parseInt(vMatch[1].replace(/\D/g, ''), 10);

        // Likes
        const lMatch = html.match(/"likeCount":"(\d+)"/) ||
            html.match(/"likeCount":(\d+)/) ||
            html.match(/like.*?count.*?"(\d+)"/i);
        if (lMatch) likes = parseInt(lMatch[1].replace(/\D/g, ''), 10);

        // Comments — try regex first (rarely works)
        const cMatch = html.match(/"commentCount":"(\d+)"/) ||
            html.match(/"commentCount":(\d+)/);
        if (cMatch) comments = parseInt(cMatch[1].replace(/\D/g, ''), 10);

        // If no comments found, count schema.org/Comment entries in JSON-LD
        if (!comments) {
            const schemaComments = html.match(/"@type":"https:\/\/schema\.org\/Comment"/g);
            if (schemaComments && schemaComments.length > 0) {
                comments = schemaComments.length;
            }
        }

    } catch (e: any) {
        console.error('YouTube parse error:', e?.message || e);
    }

    // Always prefer YouTube Data API v3 when key is available — most accurate
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (apiKey) {
        try {
            console.log('[YT Parser] Using YouTube Data API v3 for accurate stats...');
            const videoId = extractYouTubeVideoId(url);
            if (videoId) {
                const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=${apiKey}`;
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 10000);
                try {
                    const res = await fetch(apiUrl, { signal: controller.signal });
                    const data = await res.json();
                    if (data?.items?.[0]?.statistics) {
                        const stats = data.items[0].statistics;
                        // API data overrides regex results — it's always more accurate
                        if (stats.viewCount) views = parseInt(stats.viewCount, 10);
                        if (stats.likeCount) likes = parseInt(stats.likeCount, 10);
                        if (stats.commentCount) comments = parseInt(stats.commentCount, 10);
                    }
                } finally {
                    clearTimeout(timeout);
                }
            }
        } catch (e: any) {
            console.error('[YT Parser] YouTube API error:', e?.message || e);
        }
    } else if (!comments) {
        console.log('[YT Parser] No YOUTUBE_API_KEY set, using regex data only');
    }

    return { title, views, likes, comments, thumbnail_url };
}

/**
 * Extract YouTube video ID from various URL formats
 */
function extractYouTubeVideoId(url: string): string | null {
    const patterns = [
        /[?&]v=([A-Za-z0-9_-]{11})/,
        /youtu\.be\/([A-Za-z0-9_-]{11})/,
        /embed\/([A-Za-z0-9_-]{11})/,
        /shorts\/([A-Za-z0-9_-]{11})/,
    ];
    for (const p of patterns) {
        const m = url.match(p);
        if (m) return m[1];
    }
    return null;
}

// ─── TikTok ─────────────────────────────────────────────────────────────────

function extractTikTokVideoId(url: string): string | null {
    const match = url.match(/\/video\/(\d+)/) || url.match(/\/v\/(\d+)/);
    return match ? match[1] : null;
}

async function parseTikTok(url: string): Promise<VideoMetrics> {
    let title = '', views = 0, likes = 0, comments = 0, thumbnail_url = '';

    // Strategy 1: RapidAPI — most accurate
    const rapidApiKey = process.env.RAPIDAPI_KEY;
    if (rapidApiKey) {
        try {
            console.log('[TT Parser] Strategy 1: RapidAPI...');
            const videoId = extractTikTokVideoId(url);
            if (videoId) {
                const apiUrl = `https://tiktok-scraper2.p.rapidapi.com/video/info?video_id=${videoId}`;
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 10000);
                try {
                    const res = await fetch(apiUrl, {
                        headers: {
                            'x-rapidapi-key': rapidApiKey,
                            'x-rapidapi-host': 'tiktok-scraper2.p.rapidapi.com'
                        },
                        signal: controller.signal
                    });
                    const data = await res.json();
                    const item = data?.itemInfo?.itemStruct;
                    if (item) {
                        const stats = item.stats || {};
                        views = stats.playCount || 0;
                        likes = stats.diggCount || 0;
                        comments = stats.commentCount || 0;

                        // Thumbnail — prefer originCover > cover > dynamicCover
                        const video = item.video || {};
                        thumbnail_url = video.originCover || video.cover || video.dynamicCover || '';

                        // Title from desc
                        if (item.desc) {
                            title = item.desc.length > 60 ? item.desc.substring(0, 60) + '...' : item.desc;
                        }

                        if (views > 0 || likes > 0) {
                            console.log('[TT Parser] RapidAPI success:', { title, views, likes, comments });
                            return { title, views, likes, comments, thumbnail_url };
                        }
                    }
                } finally {
                    clearTimeout(timeout);
                }
            }
        } catch (e: any) {
            console.error('[TT Parser] RapidAPI error:', e?.message || e);
        }
    }

    // Strategy 2: HTML regex fallback
    try {
        console.log('[TT Parser] Strategy 2: HTML regex...');
        const html = await safeFetch(url);

        // Title
        const titleMatch = html.match(/<title>(.*?)<\/title>/i) || html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i);
        if (titleMatch) title = titleMatch[1].replace(/(\| TikTok)/ig, '').trim();
        if (title.length > 80) title = title.substring(0, 80) + '...';

        // Thumbnail from og:image
        if (!thumbnail_url) {
            const ogImage = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
            if (ogImage) thumbnail_url = ogImage[1];
        }

        // Stats — try statsV2 JSON first
        const paramsMatch = html.match(/"statsV2":\{"diggCount":"(\d+)","shareCount":"(\d+)","commentCount":"(\d+)","playCount":"(\d+)"/);
        if (paramsMatch) {
            likes = parseInt(paramsMatch[1], 10);
            comments = parseInt(paramsMatch[3], 10);
            views = parseInt(paramsMatch[4], 10);
        } else {
            // Fallback: individual fields
            const playMatch = html.match(/"playCount":(\d+)/) || html.match(/"playCount":"(\d+)"/) || html.match(/"play_count":(\d+)/);
            const diggMatch = html.match(/"diggCount":(\d+)/) || html.match(/"diggCount":"(\d+)"/) || html.match(/"digg_count":(\d+)/);
            const commentMatch = html.match(/"commentCount":(\d+)/) || html.match(/"commentCount":"(\d+)"/) || html.match(/"comment_count":(\d+)/);
            if (playMatch) views = parseInt(playMatch[1], 10);
            if (diggMatch) likes = parseInt(diggMatch[1], 10);
            if (commentMatch) comments = parseInt(commentMatch[1], 10);
        }
    } catch (e: any) {
        console.error('TikTok parse error:', e?.message || e);
    }
    return { title, views, likes, comments, thumbnail_url };
}

// ─── Instagram ──────────────────────────────────────────────────────────────
async function parseInstagram(url: string): Promise<VideoMetrics> {
    let title = '', views = 0, likes = 0, comments = 0, thumbnail_url = '';

    const apifyToken = process.env.APIFY_TOKEN;
    if (!apifyToken) {
        console.warn('[IG Parser] APIFY_TOKEN is missing. Returning zeros.');
        return { title, views, likes, comments, thumbnail_url };
    }

    try {
        console.log('[IG Parser] Using Apify (strictly)...');
        // We can just pass the URL directly to Apify
        const apifyUrl = `https://api.apify.com/v2/acts/shu8hvrXbJbY3Eb9W/run-sync-get-dataset-items?token=${apifyToken}`;

        const controller = new AbortController();
        // Give Apify up to 30 seconds since it spins up a headless browser
        const timeout = setTimeout(() => controller.abort(), 30000);

        try {
            const res = await fetch(apifyUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    directUrls: [url],
                    resultsLimit: 1
                }),
                signal: controller.signal,
            });

            if (!res.ok) {
                const errBody = await res.text();
                console.error(`[IG Apify] HTTP ${res.status}: ${errBody}`);
                return { title, views, likes, comments, thumbnail_url };
            }

            const data = await res.json();

            if (!Array.isArray(data) || data.length === 0) {
                console.warn('[IG Apify] Empty dataset returned');
                return { title, views, likes, comments, thumbnail_url };
            }

            const media = data[0];
            
            likes = media.likesCount || 0;
            comments = media.commentsCount || 0;
            views = media.videoViewCount || media.videoPlayCount || 0;
            
            const raw_thumb = media.displayUrl || media.thumbnailUrl || '';
            if (raw_thumb) {
                // Use a proxy (wsrv.nl) to avoid Instagram CORS block and broken images on the frontend
                thumbnail_url = `https://wsrv.nl/?url=${encodeURIComponent(raw_thumb)}`;
            }
            
            if (media.caption) {
                title = media.caption.length > 60 ? media.caption.substring(0, 60) + '...' : media.caption;
            }

        } finally {
            clearTimeout(timeout);
        }
    } catch (e: unknown) {
        const err = e as { name?: string; message?: string };
        if (err.name === 'AbortError') {
            console.error('[IG Parser] Apify request timed out (>30s)');
        } else {
            console.error('[IG Parser] Apify failed:', err.message || e);
        }
    }

    return { title, views, likes, comments, thumbnail_url };
}

// ─── Follower / Subscriber Count Parser ─────────────────────────────────────

/**
 * Fetch follower/subscriber count for a social media profile URL
 */
export async function parseFollowerCount(url: string): Promise<number> {
    try {
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            return await getYouTubeSubscribers(url);
        }
        if (url.includes('tiktok.com')) {
            return await getTikTokFollowers(url);
        }
        if (url.includes('instagram.com')) {
            return await getInstagramFollowers(url);
        }
    } catch (e: any) {
        console.error('parseFollowerCount error:', e?.message || e);
    }
    return 0;
}

// YouTube: API v3 or HTML scraping
async function getYouTubeSubscribers(url: string): Promise<number> {
    // Extract channel handle/id from URL
    const handleMatch = url.match(/youtube\.com\/@([A-Za-z0-9_.-]+)/) ||
        url.match(/youtube\.com\/channel\/([A-Za-z0-9_-]+)/) ||
        url.match(/youtube\.com\/c\/([A-Za-z0-9_.-]+)/);
    if (!handleMatch) return 0;

    const apiKey = process.env.YOUTUBE_API_KEY;
    if (apiKey) {
        try {
            const isChannelId = url.includes('/channel/');
            const param = isChannelId ? `id=${handleMatch[1]}` : `forHandle=${handleMatch[1]}`;
            const apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics&${param}&key=${apiKey}`;
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 10000);
            try {
                const res = await fetch(apiUrl, { signal: controller.signal });
                const data = await res.json();
                if (data?.items?.[0]?.statistics?.subscriberCount) {
                    return parseInt(data.items[0].statistics.subscriberCount, 10);
                }
            } finally {
                clearTimeout(timeout);
            }
        } catch (e: any) {
            console.error('[YT Subscribers] API error:', e?.message);
        }
    }

    // Fallback: scrape channel page
    try {
        const html = await safeFetch(url);
        const match = html.match(/"subscriberCountText":\{"simpleText":"([\d,.KMBкмлн\s]+)/) ||
            html.match(/"subscriberCountText".*?"([\d,.]+\s*[KMBкмлн]*)\s*(subscribers|подписчик)/i);
        if (match) {
            return parseHumanNumber(match[1]);
        }
    } catch (e: any) {
        console.error('[YT Subscribers] Scrape error:', e?.message);
    }
    return 0;
}

// TikTok: scrape profile page
async function getTikTokFollowers(url: string): Promise<number> {
    try {
        const html = await safeFetch(url);
        const match = html.match(/"followerCount":(\d+)/) ||
            html.match(/"followerCount":"(\d+)"/) ||
            html.match(/"fans":(\d+)/) ||
            html.match(/"fansCount":(\d+)/);
        if (match) return parseInt(match[1], 10);

        // Try from meta description: "123K Followers"
        const metaMatch = html.match(/([\d,.]+[KMB]?)\s*Followers/i);
        if (metaMatch) return parseHumanNumber(metaMatch[1]);
    } catch (e: any) {
        console.error('[TikTok Followers] error:', e?.message);
    }
    return 0;
}

// Instagram: embed or RapidAPI
async function getInstagramFollowers(url: string): Promise<number> {
    // Extract username
    const usernameMatch = url.match(/instagram\.com\/([A-Za-z0-9_.]+)/);
    if (!usernameMatch) return 0;
    const username = usernameMatch[1];

    // Strategy 1: Scrape profile page
    try {
        const html = await safeFetch(`https://www.instagram.com/${username}/`);
        const match = html.match(/"edge_followed_by":\{"count":(\d+)\}/) ||
            html.match(/"follower_count":(\d+)/) ||
            html.match(/([\d,.]+)\s*Followers/i);
        if (match) return parseHumanNumber(match[1]);
    } catch (e: any) {
        console.error('[IG Followers] scrape error:', e?.message);
    }

    // Strategy 2: RapidAPI (instagram-scraper2)
    const rapidApiKey = process.env.RAPIDAPI_KEY;
    if (rapidApiKey) {
        try {
            const apiUrl = `https://instagram-scraper2.p.rapidapi.com/user_info?username=${username}`;
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 10000);
            try {
                const res = await fetch(apiUrl, {
                    headers: {
                        'x-rapidapi-key': rapidApiKey,
                        'x-rapidapi-host': 'instagram-scraper2.p.rapidapi.com'
                    },
                    signal: controller.signal
                });
                const data = await res.json();
                // Try multiple response formats
                const followers = data?.data?.user?.edge_followed_by?.count
                    || data?.data?.follower_count
                    || data?.edge_followed_by?.count
                    || data?.follower_count;
                if (followers) return followers;
            } finally {
                clearTimeout(timeout);
            }
        } catch (e: any) {
            console.error('[IG Followers] RapidAPI error:', e?.message);
        }
    }
    return 0;
}

// Parse human-readable numbers like "1.2K", "3.5M", "12.3к"
function parseHumanNumber(str: string): number {
    const cleaned = str.replace(/\s/g, '').replace(',', '.');
    const match = cleaned.match(/([\d.]+)\s*([KkкМMмBб]?)/i);
    if (!match) return parseInt(str.replace(/\D/g, ''), 10) || 0;
    let num = parseFloat(match[1]);
    const suffix = match[2].toUpperCase();
    if (suffix === 'K' || suffix === 'К') num *= 1000;
    else if (suffix === 'M' || suffix === 'М') num *= 1000000;
    else if (suffix === 'B' || suffix === 'Б') num *= 1000000000;
    return Math.round(num);
}
