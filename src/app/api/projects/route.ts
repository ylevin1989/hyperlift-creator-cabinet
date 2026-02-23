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
            .from('projects')
            .select('*, brief:briefs(*)')
            .eq('creator_id', userId)
            .order('updated_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ projects });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// POST - Submit a new video link for a project
export async function POST(request: Request) {
    try {
        const { projectId, videoUrl, userId } = await request.json();

        if (!projectId || !videoUrl || !userId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Start by verifying ownership and inserting video asset
        const { data: asset, error: assetError } = await supabase
            .from('video_assets')
            .insert({ project_id: projectId, creator_id: userId, video_url: videoUrl, status: 'pending_review' })
            .select()
            .single();

        if (assetError) throw assetError;

        // Update project status to 'Модерация'
        const { error: updateError } = await supabase
            .from('projects')
            .update({ status: 'Модерация', updated_at: new Date().toISOString() })
            .eq('id', projectId);

        if (updateError) throw updateError;

        return NextResponse.json({ success: true, asset });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
