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

        // 2. Fetch projects for base pay transactions (via cr_project_creators)
        const { data: assignments, error: projectsErr } = await supabase
            .from('cr_project_creators')
            .select('project:cr_projects(id, reward, status, updated_at, brief:cr_briefs(title))')
            .eq('creator_id', userId);

        if (projectsErr) throw projectsErr;

        // Extract valid projects based on status
        const validStatuses = ['Модерация', 'Опубликовано', 'Утверждено'];
        const projects = assignments
            ?.map(a => a.project as any)
            ?.filter(p => p && validStatuses.includes(p.status));

        // 3. Fetch video assets for KPI bonuses
        const { data: videos, error: videosErr } = await supabase
            .from('cr_video_assets')
            .select('id, kpi_bonus, created_at, project:cr_projects(title)')
            .eq('creator_id', userId)
            .gt('kpi_bonus', 0);

        if (videosErr) throw videosErr;

        // Construct transactions array
        const transactions: any[] = [];

        let calcAvailable = 0;
        let calcHolding = 0;

        projects?.forEach(p => {
            const brief: any = p.brief;
            const briefTitle = brief ? (Array.isArray(brief) ? brief[0]?.title : brief.title) : undefined;
            const isHolding = p.status === 'Модерация' || p.status === 'Опубликовано';
            const dateObj = new Date(p.updated_at);
            
            if (isHolding) calcHolding += (p.reward || 0);
            else calcAvailable += (p.reward || 0);
            
            transactions.push({
                id: `PRJ-${p.id.substring(0, 6)}`,
                project: briefTitle || 'Проект',
                type: isHolding ? 'holding' : 'income',
                amount: `${p.reward} ₽`,
                date: dateObj.toLocaleDateString('ru-RU'),
                _rawDate: dateObj,
                status: isHolding ? 'Холдирование' : 'Зачислено'
            });
        });

        videos?.forEach(v => {
            const proj: any = v.project;
            const projTitle = proj ? (Array.isArray(proj) ? proj[0]?.title : proj.title) : undefined;
            const dateObj = new Date(v.created_at);
            
            calcAvailable += (v.kpi_bonus || 0);

            transactions.push({
                id: `KPI-${v.id.substring(0, 6)}`,
                project: `Бонус KPI: ${projTitle || 'Проект'}`,
                type: 'income',
                amount: `${v.kpi_bonus} ₽`,
                date: dateObj.toLocaleDateString('ru-RU'),
                _rawDate: dateObj,
                status: 'Зачислено'
            });
        });

        // Sort transactions by date descending
        transactions.sort((a, b) => {
            // Need to parse from original timestamps, so let's attach raw date and sort, then remove
            return b._rawDate.getTime() - a._rawDate.getTime();
        });

        // Clean up _rawDate
        transactions.forEach(t => { delete t._rawDate; });

        if (profile) {
            profile.available_balance = calcAvailable;
            profile.holding_balance = calcHolding;
        }

        return NextResponse.json({
            profile,
            transactions
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
