import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // 1. Fetch balances
        const { data: profile, error: profileErr } = await supabase
            .from('cr_creators')
            .select('available_balance, holding_balance')
            .eq('id', userId)
            .single();

        if (profileErr) throw profileErr;

        // 2. Fetch projects for base pay transactions
        const { data: projects, error: projectsErr } = await supabase
            .from('cr_projects')
            .select('id, reward, status, updated_at, brief:cr_briefs(title)')
            .eq('creator_id', userId)
            .in('status', ['Модерация', 'Опубликовано', 'Утверждено'])
            .order('updated_at', { ascending: false });

        if (projectsErr) throw projectsErr;

        // 3. Fetch video assets for KPI bonuses
        const { data: videos, error: videosErr } = await supabase
            .from('cr_video_assets')
            .select('id, kpi_bonus, created_at, project:cr_projects(title)')
            .eq('creator_id', userId)
            .gt('kpi_bonus', 0);

        if (videosErr) throw videosErr;

        // Construct transactions array
        const transactions: any[] = [];

        projects?.forEach(p => {
            const brief: any = p.brief;
            const briefTitle = brief ? (Array.isArray(brief) ? brief[0]?.title : brief.title) : undefined;
            const isHolding = p.status === 'Модерация' || p.status === 'Опубликовано';
            transactions.push({
                id: `PRJ-${p.id.substring(0, 6)}`,
                project: briefTitle || 'Проект',
                type: isHolding ? 'holding' : 'income',
                amount: `${p.reward} ₽`,
                date: new Date(p.updated_at).toLocaleDateString('ru-RU'),
                status: isHolding ? 'Холдирование' : 'Зачислено'
            });
        });

        videos?.forEach(v => {
            const proj: any = v.project;
            const projTitle = proj ? (Array.isArray(proj) ? proj[0]?.title : proj.title) : undefined;
            transactions.push({
                id: `KPI-${v.id.substring(0, 6)}`,
                project: `Бонус KPI: ${projTitle || 'Проект'}`,
                type: 'income',
                amount: `${v.kpi_bonus} ₽`,
                date: new Date(v.created_at).toLocaleDateString('ru-RU'),
                status: 'Зачислено'
            });
        });

        // Sort transactions by date descending (mock approach string sorting or just keep them)
        // For simplicity, we just return them.

        return NextResponse.json({
            profile,
            transactions
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
