import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { notifyNewVideo } from '@/lib/telegram-notify';

// Helper: detect platform from URL
function detectPlatform(url: string): string {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('tiktok.com')) return 'tiktok';
    if (url.includes('instagram.com')) return 'instagram';
    if (url.includes('vk.com') || url.includes('vk.video')) return 'vk';
    if (url.includes('threads.net')) return 'threads';
    if (url.includes('t.me') || url.includes('telegram.me') || url.includes('telegram.org')) return 'telegram';
    if (url.includes('likee.video') || url.includes('likee.com')) return 'likee';
    return 'other';
}

// GET Projects — role-aware
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const mode = searchParams.get('mode'); // 'admin' for admin view

    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Check user role
        const { data: user } = await supabase
            .from('cr_creators')
            .select('role')
            .eq('id', userId)
            .single();

        const isAdmin = user?.role === 'admin';

        if (mode === 'admin' && isAdmin) {
            // Admin: all projects with stats
            const { data: projects, error } = await supabase
                .from('cr_projects')
                .select(`
                    *, 
                    brief:cr_briefs(*),
                    video_assets:cr_video_assets(id, title, video_url, views, likes, comments, status, platform, thumbnail_url, creator_id, last_stats_update, kpi_bonus),
                    assignments:cr_project_creators(id, creator_id, status, creator:cr_creators(id, full_name, username, avatar_url))
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return NextResponse.json({ projects });
        }

        // Creator: only assigned projects via cr_project_creators
        const { data: assignments, error: aErr } = await supabase
            .from('cr_project_creators')
            .select('project_id')
            .eq('creator_id', userId);

        if (aErr) throw aErr;

        const projectIds = (assignments || []).map(a => a.project_id);

        // Also include legacy projects where creator_id matches directly
        const { data: legacyProjects } = await supabase
            .from('cr_projects')
            .select('id')
            .eq('creator_id', userId);

        const allIds = [...new Set([...projectIds, ...(legacyProjects || []).map(p => p.id)])];

        if (allIds.length === 0) {
            return NextResponse.json({ projects: [] });
        }

        const { data: projects, error } = await supabase
            .from('cr_projects')
            .select(`
                *, 
                brief:cr_briefs(*),
                video_assets:cr_video_assets(id, title, video_url, views, likes, comments, status, platform, thumbnail_url, kpi_bonus, last_stats_update, created_at)
            `)
            .in('id', allIds)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Attach KPI configs for this creator
        const { data: kpis } = await supabase
            .from('cr_kpi_configs')
            .select('*')
            .eq('creator_id', userId)
            .in('project_id', allIds);

        const projectsWithKpi = (projects || []).map(p => ({
            ...p,
            kpi_configs: (kpis || []).filter(k => k.project_id === p.id)
        }));

        return NextResponse.json({ projects: projectsWithKpi });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// POST — create project or submit video
export async function POST(request: Request) {
    try {
        const input = await request.json();

        // Create project (admin only)
        if (input.action === 'create') {
            const { title, description, brand, reward, cover_url, deadline, userId } = input;
            if (!title || !userId) {
                return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
            }

            // Verify admin
            const { data: user } = await supabase
                .from('cr_creators')
                .select('role')
                .eq('id', userId)
                .single();

            if (user?.role !== 'admin') {
                return NextResponse.json({ error: 'Only admins can create projects' }, { status: 403 });
            }

            const { data: project, error: insertError } = await supabase
                .from('cr_projects')
                .insert({
                    title,
                    description: description || null,
                    brand: brand || null,
                    reward: reward || '0',
                    cover_url: cover_url || null,
                    deadline: deadline || null,
                    status: 'Ожидание товара'
                })
                .select()
                .single();

            if (insertError) throw insertError;
            return NextResponse.json({ success: true, project });
        }

        // Submit video link
        const { projectId, videoUrl, userId, platform: manualPlatform } = input;

        if (!projectId || !videoUrl || !userId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const platform = manualPlatform || detectPlatform(videoUrl);

        const { data: asset, error: assetError } = await supabase
            .from('cr_video_assets')
            .insert({
                project_id: projectId,
                creator_id: userId,
                video_url: videoUrl,
                platform,
                status: 'pending_review'
            })
            .select()
            .single();

        if (assetError) throw assetError;

        // Update project timestamp
        await supabase
            .from('cr_projects')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', projectId);

        // Send Telegram notification (non-blocking)
        try {
            const { data: creator } = await supabase.from('cr_creators').select('full_name, username').eq('id', userId).single();
            const { data: project } = await supabase.from('cr_projects').select('title, brand').eq('id', projectId).single();
            notifyNewVideo({
                creatorName: creator?.full_name || creator?.username || 'Unknown',
                projectTitle: project?.title || project?.brand || 'Без названия',
                videoUrl: videoUrl,
                platform,
                projectId,
            }).catch(() => {}); // fire-and-forget
        } catch (e) { /* ignore notification errors */ }

        return NextResponse.json({ success: true, asset });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
