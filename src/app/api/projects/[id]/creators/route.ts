import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Verify admin helper
async function isAdmin(userId: string): Promise<boolean> {
    const { data } = await supabase.from('cr_creators').select('role').eq('id', userId).single();
    return data?.role === 'admin';
}

// GET — list creators assigned to a project with their KPI configs
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id: projectId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        // Get assignments
        const { data: assignments, error: aErr } = await supabase
            .from('cr_project_creators')
            .select('*, creator:cr_creators(id, full_name, username, avatar_url)')
            .eq('project_id', projectId);

        if (aErr) throw aErr;

        // Get KPI configs for this project
        const { data: kpis, error: kErr } = await supabase
            .from('cr_kpi_configs')
            .select('*')
            .eq('project_id', projectId);

        if (kErr) throw kErr;

        // Merge KPIs into assignments
        const result = (assignments || []).map(a => ({
            ...a,
            kpi_configs: (kpis || []).filter(k => k.creator_id === a.creator_id)
        }));

        return NextResponse.json({ creators: result });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// POST — assign/remove creator, set KPI
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id: projectId } = await params;

    try {
        const body = await request.json();
        const { action, userId, creatorId } = body;

        if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });
        if (!(await isAdmin(userId))) return NextResponse.json({ error: 'Admin only' }, { status: 403 });

        if (action === 'assign') {
            if (!creatorId) return NextResponse.json({ error: 'creatorId required' }, { status: 400 });

            const { error } = await supabase
                .from('cr_project_creators')
                .upsert({ project_id: projectId, creator_id: creatorId, status: 'assigned' }, { onConflict: 'project_id,creator_id' });

            if (error) throw error;
            return NextResponse.json({ success: true });
        }

        if (action === 'remove') {
            if (!creatorId) return NextResponse.json({ error: 'creatorId required' }, { status: 400 });

            const { error } = await supabase
                .from('cr_project_creators')
                .delete()
                .eq('project_id', projectId)
                .eq('creator_id', creatorId);

            if (error) throw error;
            return NextResponse.json({ success: true });
        }

        if (action === 'set_kpi') {
            const { metric, rate, target } = body;
            if (!creatorId || !metric) return NextResponse.json({ error: 'creatorId and metric required' }, { status: 400 });

            const { error } = await supabase
                .from('cr_project_creators')
                .update({
                    kpi_metric: metric,
                    kpi_rate: rate || 0,
                    kpi_target: target || null
                })
                .eq('project_id', projectId)
                .eq('creator_id', creatorId);

            if (error) throw error;

            // Trigger KPI recalculation for existing assets by updating them
            await supabase.from('cr_video_assets')
                .update({ last_stats_update: new Date().toISOString() })
                .eq('project_id', projectId)
                .eq('creator_id', creatorId);

            return NextResponse.json({ success: true });
        }

        if (action === 'delete_kpi') {
            if (!creatorId) return NextResponse.json({ error: 'creatorId required' }, { status: 400 });

            const { error } = await supabase
                .from('cr_project_creators')
                .update({
                    kpi_metric: null,
                    kpi_rate: null,
                    kpi_target: null
                })
                .eq('project_id', projectId)
                .eq('creator_id', creatorId);

            if (error) throw error;
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
