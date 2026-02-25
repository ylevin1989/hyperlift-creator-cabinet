import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { parseVideoMetrics } from '@/lib/parse-video';

export async function POST(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // Verify admin role
        const { data: user, error: userErr } = await supabase
            .from('cr_creators')
            .select('role')
            .eq('id', userId)
            .single();

        if (userErr || user?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Fetch all assets
        const { data: assets, error: assetsErr } = await supabase
            .from('cr_video_assets')
            .select('*');

        if (assetsErr) throw assetsErr;

        let syncCount = 0;
        const results = [];

        for (const asset of (assets || [])) {
            if (!asset.video_url) continue;

            try {
                const metrics = await parseVideoMetrics(asset.video_url);
                if (metrics && (metrics.views > 0 || metrics.likes > 0)) {
                    const updateData: any = {
                        title: metrics.title || asset.title || 'Без названия',
                        views: metrics.views,
                        likes: metrics.likes,
                        comments: metrics.comments,
                        last_stats_update: new Date().toISOString()
                    };
                    if (metrics.thumbnail_url) {
                         updateData.thumbnail_url = metrics.thumbnail_url;
                    }
                    const { error: updateErr } = await supabase.from('cr_video_assets').update(updateData).eq('id', asset.id);
                    if (!updateErr) {
                        syncCount++;
                        results.push({ id: asset.id, success: true, views: metrics.views });
                    } else {
                        results.push({ id: asset.id, success: false, error: updateErr.message });
                    }
                }
            } catch (err: any) {
                 results.push({ id: asset.id, success: false, error: err.message });
            }
        }

        return NextResponse.json({ success: true, synced: syncCount, results });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
