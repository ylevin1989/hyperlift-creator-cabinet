import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { parseVideoMetrics } from '@/lib/parse-video';

// GET: list portfolio items for a creator
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const creatorId = searchParams.get('creatorId');

    if (!creatorId) {
        return NextResponse.json({ error: 'Missing creatorId' }, { status: 400 });
    }

    const { data, error } = await supabase
        .from('cr_portfolio')
        .select('*')
        .eq('creator_id', creatorId)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data || []);
}

// POST: create or update portfolio item
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { action, creatorId, id, ...fields } = body;

        if (!creatorId) {
            return NextResponse.json({ error: 'Missing creatorId' }, { status: 400 });
        }

        // DELETE
        if (action === 'delete' && id) {
            const { error } = await supabase
                .from('cr_portfolio')
                .delete()
                .eq('id', id)
                .eq('creator_id', creatorId);
            if (error) return NextResponse.json({ error: error.message }, { status: 500 });
            return NextResponse.json({ success: true });
        }

        // SYNC METRICS from video URL
        if (action === 'sync' && id) {
            const { data: item } = await supabase
                .from('cr_portfolio')
                .select('video_url')
                .eq('id', id)
                .single();

            if (item?.video_url) {
                const metrics = await parseVideoMetrics(item.video_url);
                const updateFields: any = {
                    metrics: { views: metrics.views, likes: metrics.likes, comments: metrics.comments },
                    title: metrics.title || fields.title || '',
                    updated_at: new Date().toISOString()
                };
                if (metrics.thumbnail_url) {
                    updateFields.thumbnail_url = metrics.thumbnail_url;
                }
                const { data, error } = await supabase
                    .from('cr_portfolio')
                    .update(updateFields)
                    .eq('id', id)
                    .select()
                    .single();
                if (error) return NextResponse.json({ error: error.message }, { status: 500 });
                return NextResponse.json(data);
            }
            return NextResponse.json({ error: 'No video URL' }, { status: 400 });
        }

        // UPDATE existing
        if (id) {
            // Detect platform from video_url
            if (fields.video_url) {
                if (fields.video_url.includes('youtube.com') || fields.video_url.includes('youtu.be')) fields.platform = 'youtube';
                else if (fields.video_url.includes('tiktok.com')) fields.platform = 'tiktok';
                else if (fields.video_url.includes('instagram.com')) fields.platform = 'instagram';
                else fields.platform = 'other';
            }

            const { data, error } = await supabase
                .from('cr_portfolio')
                .update({ ...fields, updated_at: new Date().toISOString() })
                .eq('id', id)
                .eq('creator_id', creatorId)
                .select()
                .single();
            if (error) return NextResponse.json({ error: error.message }, { status: 500 });
            return NextResponse.json(data);
        }

        // CREATE new
        if (fields.video_url) {
            if (fields.video_url.includes('youtube.com') || fields.video_url.includes('youtu.be')) fields.platform = 'youtube';
            else if (fields.video_url.includes('tiktok.com')) fields.platform = 'tiktok';
            else if (fields.video_url.includes('instagram.com')) fields.platform = 'instagram';
            else fields.platform = 'other';
        }

        const { data, error } = await supabase
            .from('cr_portfolio')
            .insert({ creator_id: creatorId, ...fields })
            .select()
            .single();
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        // Auto-sync metrics if video URL provided
        if (data && fields.video_url) {
            try {
                const metrics = await parseVideoMetrics(fields.video_url);
                const autoUpdate: any = {
                    metrics: { views: metrics.views, likes: metrics.likes, comments: metrics.comments },
                    title: metrics.title || fields.title || data.title,
                    updated_at: new Date().toISOString()
                };
                if (metrics.thumbnail_url) {
                    autoUpdate.thumbnail_url = metrics.thumbnail_url;
                }
                const { data: updated } = await supabase
                    .from('cr_portfolio')
                    .update(autoUpdate)
                    .eq('id', data.id)
                    .select()
                    .single();
                return NextResponse.json(updated || data);
            } catch (e) {
                console.error('Auto-sync failed:', e);
            }
        }

        return NextResponse.json(data);
    } catch (err) {
        console.error('Portfolio API error:', err);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
