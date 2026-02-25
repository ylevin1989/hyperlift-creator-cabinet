import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET — applications list
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { data: user } = await supabase.from('cr_creators').select('role').eq('id', userId).single();
        const isAdmin = user?.role === 'admin';

        let query = supabase
            .from('cr_applications')
            .select(`
                *,
                brief:cr_briefs(id, title, brand, format, niche, reward),
                creator:cr_creators(id, full_name, username, avatar_url)
            `)
            .order('created_at', { ascending: false });

        if (!isAdmin) {
            query = query.eq('creator_id', userId);
        }

        const { data: applications, error } = await query;
        if (error) throw error;

        return NextResponse.json({ applications });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// POST — submit application or approve/reject
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action, userId } = body;

        if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

        // Creator submits application
        if (action === 'apply') {
            const { briefId, message } = body;
            if (!briefId) return NextResponse.json({ error: 'briefId required' }, { status: 400 });

            const { error } = await supabase
                .from('cr_applications')
                .insert({
                    brief_id: briefId,
                    creator_id: userId,
                    message: message || null,
                    status: 'pending'
                });

            if (error) {
                if (error.code === '23505') {
                    return NextResponse.json({ error: 'Вы уже подавали заявку на этот проект' }, { status: 409 });
                }
                throw error;
            }
            return NextResponse.json({ success: true });
        }

        // Admin actions
        if (action === 'approve' || action === 'reject') {
            const { applicationId } = body;
            if (!applicationId) return NextResponse.json({ error: 'applicationId required' }, { status: 400 });

            // Verify admin
            const { data: user } = await supabase.from('cr_creators').select('role').eq('id', userId).single();
            if (user?.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 });

            const { error } = await supabase
                .from('cr_applications')
                .update({ status: action === 'approve' ? 'approved' : 'rejected' })
                .eq('id', applicationId);

            if (error) throw error;
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
