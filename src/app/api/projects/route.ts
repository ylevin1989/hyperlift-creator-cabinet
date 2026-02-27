import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { notifyNewVideo } from '@/lib/telegram-notify';
import { detectPlatform } from '@/lib/utils';

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
                    brand_ref:cr_brands(id, name, logo_url, color),
                    video_assets:cr_video_assets(id, title, video_url, views, likes, comments, status, platform, thumbnail_url, creator_id, last_stats_update, kpi_bonus),
                    assignments:cr_project_creators(id, creator_id, status, kpi_metric, kpi_rate, kpi_target, creator:cr_creators(id, full_name, username, avatar_url))
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

        // Attach KPI configs for this creator from cr_project_creators
        const { data: kpis } = await supabase
            .from('cr_project_creators')
            .select('project_id, kpi_metric, kpi_rate, kpi_target')
            .eq('creator_id', userId)
            .in('project_id', allIds);

        const projectsWithKpi = (projects || []).map(p => ({
            ...p,
            kpi_configs: (kpis || []).filter(k => k.project_id === p.id).map(k => ({
                project_id: k.project_id,
                creator_id: userId,
                metric: k.kpi_metric,
                rate: k.kpi_rate,
                target: k.kpi_target
            }))
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
            const { title, description, brand, brand_id, reward, cover_url, deadline, userId } = input;
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

            // If brand_id provided, get brand name
            let brandName = brand || null;
            if (brand_id && !brandName) {
                const { data: brandData } = await supabase.from('cr_brands').select('name').eq('id', brand_id).single();
                if (brandData) brandName = brandData.name;
            }

            const { data: project, error: insertError } = await supabase
                .from('cr_projects')
                .insert({
                    title,
                    description: description || null,
                    brand: brandName,
                    brand_id: brand_id || null,
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

        let { data: asset, error: assetError } = await supabase
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

        // Parse video metrics synchronously so frontend gets updated data immediately
        const { parseVideoMetrics } = await import('@/lib/parse-video');
        try {
            console.log('[Auto-parse] Fetching metrics for:', videoUrl);
            const metrics = await parseVideoMetrics(videoUrl);
            if (metrics.title || metrics.views > 0 || metrics.likes > 0) {
                const updateData: any = {
                    title: metrics.title || undefined,
                    views: metrics.views || undefined,
                    likes: metrics.likes || undefined,
                    comments: metrics.comments || undefined,
                    last_stats_update: new Date().toISOString()
                };
                if (metrics.thumbnail_url) updateData.thumbnail_url = metrics.thumbnail_url;
                // Remove undefined values
                Object.keys(updateData).forEach(k => updateData[k] === undefined && delete updateData[k]);
                
                // Update in DB
                const { data: updatedAsset } = await supabase
                    .from('cr_video_assets')
                    .update(updateData)
                    .eq('id', asset.id)
                    .select()
                    .single();
                
                if (updatedAsset) {
                    asset = updatedAsset;
                }
                console.log('[Auto-parse] Updated:', asset.id, metrics.title, metrics.views);
            }
        } catch (e: any) {
            console.error('[Auto-parse] Error:', e?.message);
        }

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
