import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
        return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    try {
        // Verify admin role
        const { data: user, error: userErr } = await supabase
            .from('cr_creators')
            .select('role')
            .eq('id', userId)
            .single();

        if (userErr || user?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Fetch assets
        const { data: assets, error: assetsErr } = await supabase
            .from('cr_video_assets')
            .select(`
                id, video_url, views, likes, comments, 
                kpi_bonus, created_at, last_stats_update, status,
                project:cr_projects(brief:cr_briefs(title)),
                creator:cr_creators(full_name, username, social_links)
            `)
            .order('created_at', { ascending: false });

        if (assetsErr) throw assetsErr;

        return NextResponse.json({ assets });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
        return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    try {
        // Verify admin role
        const { data: user, error: userErr } = await supabase
            .from('cr_creators')
            .select('role')
            .eq('id', userId)
            .single();

        if (userErr || user?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { assetId, action } = body;

        if (!assetId || !action) {
            return NextResponse.json({ error: 'assetId and action are required' }, { status: 400 });
        }

        if (action === 'approve') {
            const { error } = await supabase.from('cr_video_assets').update({ status: 'approved' }).eq('id', assetId);
            if (error) throw error;
        } else if (action === 'reject') {
            const { error } = await supabase.from('cr_video_assets').update({ status: 'rejected' }).eq('id', assetId);
            if (error) throw error;
        } else if (action === 'sync') {
            const { data: asset, error: getErr } = await supabase.from('cr_video_assets').select('video_url').eq('id', assetId).single();
            if (getErr || !asset?.video_url) throw getErr || new Error("Asset not found");

            const url = asset.video_url;
            let views = 0;
            let likes = 0;
            let comments = 0;

            try {
                const fetchRes = await fetch(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                        'Accept-Language': 'en-US,en;q=0.9',
                    }
                });
                const html = await fetchRes.text();

                if (url.includes('tiktok.com')) {
                    const playMatch = html.match(/"playCount":(\d+)/) || html.match(/"play_count":(\d+)/);
                    const diggMatch = html.match(/"diggCount":(\d+)/) || html.match(/"digg_count":(\d+)/);
                    const commentMatch = html.match(/"commentCount":(\d+)/) || html.match(/"comment_count":(\d+)/);

                    if (playMatch) views = parseInt(playMatch[1], 10);
                    if (diggMatch) likes = parseInt(diggMatch[1], 10);
                    if (commentMatch) comments = parseInt(commentMatch[1], 10);
                } else if (url.includes('youtube.com') || url.includes('youtu.be')) {
                    const viewMatch = html.match(/"viewCount":"?(\d+)"?/) || html.match(/(\d+)\s+views/);
                    let likeMatch = html.match(/"likeCount":"?(\d+)"?/);
                    if (!likeMatch) {
                        const m = html.match(/"defaultText":\{"accessibility":\{"accessibilityData":\{"label":"(.*?) likes"/);
                        if (m) likeMatch = m;
                    }

                    let commentMatch = html.match(/"commentCount":\s*\{"accessibility":\{"accessibilityData":\{"label":"([^\d]*)?([\d,]+)/);
                    if (!commentMatch) {
                        commentMatch = html.match(/([\d,]+)\s+comments/i);
                    }

                    if (viewMatch) views = parseInt(viewMatch[1].replace(/\D/g, ''), 10);
                    if (likeMatch) likes = parseInt(likeMatch[1].replace(/\D/g, ''), 10);
                    if (commentMatch && commentMatch[commentMatch.length - 1]) {
                        comments = parseInt(commentMatch[commentMatch.length - 1].replace(/\D/g, ''), 10);
                    }
                }
            } catch (e) {
                console.error("Scrape error:", e);
            }

            if (views > 0 || likes > 0 || comments > 0) {
                const { error: updateErr } = await supabase.from('cr_video_assets').update({
                    views,
                    likes,
                    comments,
                    last_stats_update: new Date().toISOString()
                }).eq('id', assetId);
                if (updateErr) throw updateErr;
            } else {
                return NextResponse.json({ error: 'Не удалось получить метрики' }, { status: 400 });
            }

            return NextResponse.json({ success: true, views, likes, comments });
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
