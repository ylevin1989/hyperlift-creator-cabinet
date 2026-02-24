import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const niche = searchParams.get('niche');

    try {
        let query = supabase.from('cr_briefs').select('*').eq('status', 'active');

        if (niche && niche !== 'Все') {
            query = query.eq('niche', niche);
        }

        const { data: briefs, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ briefs });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// POST — Откликнуться на бриф (создать проект)
export async function POST(request: Request) {
    try {
        const { briefId, userId } = await request.json();

        if (!briefId || !userId) {
            return NextResponse.json({ error: 'briefId and userId are required' }, { status: 400 });
        }

        // Check if user already applied for this brief
        const { data: existing } = await supabase
            .from('cr_projects')
            .select('id')
            .eq('brief_id', briefId)
            .eq('creator_id', userId)
            .maybeSingle();

        if (existing) {
            return NextResponse.json({ error: 'Вы уже откликнулись на этот бриф' }, { status: 409 });
        }

        // Get brief reward
        const { data: brief } = await supabase
            .from('cr_briefs')
            .select('reward')
            .eq('id', briefId)
            .single();

        // Create a new project for this creator+brief pair
        const { data: project, error: insertError } = await supabase
            .from('cr_projects')
            .insert({
                brief_id: briefId,
                creator_id: userId,
                status: 'Ожидание товара',
                reward: brief?.reward || 0,
            })
            .select('id')
            .single();

        if (insertError) throw insertError;

        return NextResponse.json({ success: true, projectId: project.id });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
