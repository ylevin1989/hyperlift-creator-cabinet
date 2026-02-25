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
            .from('cr_creators')
            .select('trust_score, available_balance, holding_balance')
            .eq('id', userId)
            .single();

        if (profileErr) throw profileErr;

        // 2. Fetch projects for base pay transactions
        const { data: assignments } = await supabase
            .from('cr_project_creators')
            .select('project:cr_projects(reward, status)')
            .eq('creator_id', userId);

        let calcAvailable = 0;
        let calcHolding = 0;

        const validStatuses = ['Модерация', 'Опубликовано', 'Утверждено'];
        assignments?.forEach(a => {
            const p: any = a.project;
            if (p && validStatuses.includes(p.status)) {
                if (p.status === 'Модерация' || p.status === 'Опубликовано') calcHolding += (p.reward || 0);
                else calcAvailable += (p.reward || 0);
            }
        });

        // 3. Fetch Aggregated stats for their videos
        const { data: videos, error: videosErr } = await supabase
            .from('cr_video_assets')
            .select('views, likes, cpv, er, kpi_bonus')
            .eq('creator_id', userId)
            .eq('status', 'approved');

        if (videosErr) throw videosErr;

        // Add matching KPIs to available balance
        let totalKpi = 0;
        videos?.forEach(v => {
            calcAvailable += (v.kpi_bonus || 0);
            totalKpi += (v.kpi_bonus || 0);
        });

        if (profile) {
            profile.available_balance = calcAvailable;
            profile.holding_balance = calcHolding;
        }

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
                totalVideos: videos?.length || 0,
                totalKpi
            },
            videos: videos || []
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
