import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // 1. Fetch Creator Profile for Overall Trust Score & Balance
        const { data: profile, error: profileErr } = await supabase
            .from('creators')
            .select('trust_score, available_balance, holding_balance')
            .eq('id', userId)
            .single();

        if (profileErr) throw profileErr;

        // 2. Fetch Aggregated stats for their videos
        const { data: videos, error: videosErr } = await supabase
            .from('video_assets')
            .select('views, likes, cpv, er')
            .eq('creator_id', userId)
            .eq('status', 'approved');

        if (videosErr) throw videosErr;

        // Calculate aggregated metrics
        const totalViews = videos?.reduce((acc, curr) => acc + (curr.views || 0), 0) || 0;
        const avgER = videos?.length
            ? videos.reduce((acc, curr) => acc + (curr.er || 0), 0) / videos.length
            : 0;

        return NextResponse.json({
            profile,
            metrics: {
                totalViews,
                avgER: avgER.toFixed(2),
                totalVideos: videos?.length || 0
            }
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
