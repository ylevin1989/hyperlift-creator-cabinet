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
                const rewardVal = parseFloat(p.reward) || 0;
                if (p.status === 'Модерация' || p.status === 'Опубликовано') calcHolding += rewardVal;
                else calcAvailable += rewardVal;
            }
        });

        // 3. Fetch Aggregated stats for their videos
        const { data: videos, error: videosErr } = await supabase
            .from('cr_video_assets')
            .select('id, views, likes, comments, cpv, er, kpi_bonus, thumbnail_url, platform, last_stats_update, title, video_url, project_id')
            .eq('creator_id', userId)
            .eq('status', 'approved');

        if (videosErr) throw videosErr;

        // Add matching KPIs to available balance
        let totalKpi = 0;
        videos?.forEach(v => {
            const kpiBonus = parseFloat(v.kpi_bonus) || 0;
            calcAvailable += kpiBonus;
            totalKpi += kpiBonus;
        });

        if (profile) {
            profile.available_balance = calcAvailable;
            profile.holding_balance = calcHolding;
        }

        // Calculate aggregated metrics dynamically
        const videosWithStats = videos?.map(v => {
            const views = v.views || 0;
            const likes = v.likes || 0;
            const comments = v.comments || 0;
            let er = v.er || 0;
            if (er === 0 && views > 0) {
                er = ((likes + comments) / views) * 100;
            }
            return { ...v, er: Number(er.toFixed(2)) };
        }) || [];

        const totalViews = videosWithStats.reduce((acc, curr) => acc + (curr.views || 0), 0);
        const totalLikes = videosWithStats.reduce((acc, curr) => acc + (curr.likes || 0), 0);
        const totalComments = videosWithStats.reduce((acc, curr) => acc + (curr.comments || 0), 0);
        
        // accurate average ER across all views
        const avgER = totalViews > 0 ? ((totalLikes + totalComments) / totalViews) * 100 : 0;

        return NextResponse.json({
            profile,
            metrics: {
                totalViews,
                avgER: avgER.toFixed(2),
                totalVideos: videos?.length || 0,
                totalKpi
            },
            videos: videosWithStats
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
