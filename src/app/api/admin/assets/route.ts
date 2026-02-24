import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { parseVideoMetrics } from '@/lib/parse-video';

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
                id, title, video_url, views, likes, comments, 
                kpi_bonus, created_at, last_stats_update, status,
                project:cr_projects(title, brief:cr_briefs(title)),
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
        } else if (action === 'update_metrics') {
            // Manual metrics update by admin
            const { views, likes, comments: commentCount } = body;
            const { error: updateErr } = await supabase.from('cr_video_assets').update({
                views: views ?? 0,
                likes: likes ?? 0,
                comments: commentCount ?? 0,
                last_stats_update: new Date().toISOString()
            }).eq('id', assetId);
            if (updateErr) throw updateErr;
            return NextResponse.json({ success: true });
        } else if (action === 'sync') {
            const { data: asset, error: getErr } = await supabase.from('cr_video_assets').select('video_url').eq('id', assetId).single();
            if (getErr || !asset?.video_url) throw getErr || new Error("Asset not found");

            const metrics = await parseVideoMetrics(asset.video_url);

            if (metrics.views > 0 || metrics.likes > 0 || metrics.comments > 0 || metrics.title) {
                const { error: updateErr } = await supabase.from('cr_video_assets').update({
                    title: metrics.title || 'Без названия',
                    views: metrics.views,
                    likes: metrics.likes,
                    comments: metrics.comments,
                    last_stats_update: new Date().toISOString()
                }).eq('id', assetId);
                if (updateErr) throw updateErr;
            } else {
                return NextResponse.json({ error: 'Не удалось получить метрики. Попробуйте ввести вручную.' }, { status: 400 });
            }

            return NextResponse.json({ success: true, ...metrics });
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
