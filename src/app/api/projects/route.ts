import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET User Projects
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId'); // In real app, extract from middleware/auth token

    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { data: projects, error } = await supabase
            .from('cr_projects')
            .select('*, brief:cr_briefs(*), video_assets:cr_video_assets(*)')
            .eq('creator_id', userId)
            .order('updated_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ projects });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// POST - Submit a new video link for a project or create a new project
export async function POST(request: Request) {
    try {
        const input = await request.json();

        // Handle creating a new independent project
        if (input.action === 'create') {
            const { title, reward, userId } = input;
            if (!title || !userId) {
                return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
            }

            const { data: project, error: insertError } = await supabase
                .from('cr_projects')
                .insert({
                    creator_id: userId,
                    title,
                    reward: reward || 0,
                    status: 'Ожидание товара'
                })
                .select()
                .single();

            if (insertError) throw insertError;
            return NextResponse.json({ success: true, project });
        }

        const { projectId, videoUrl, userId } = input;

        if (!projectId || !videoUrl || !userId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Start by verifying ownership and inserting video asset
        const { data: asset, error: assetError } = await supabase
            .from('cr_video_assets')
            .insert({ project_id: projectId, creator_id: userId, video_url: videoUrl, status: 'pending_review' })
            .select()
            .single();

        if (assetError) throw assetError;

        // Update project status to 'Модерация'
        const { error: updateError } = await supabase
            .from('cr_projects')
            .update({ status: 'Модерация', updated_at: new Date().toISOString() })
            .eq('id', projectId);

        if (updateError) throw updateError;

        return NextResponse.json({ success: true, asset });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
