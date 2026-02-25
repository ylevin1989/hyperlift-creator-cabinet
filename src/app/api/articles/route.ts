import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET - list all articles (or single by slug)
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (slug) {
        const { data, error } = await supabase
            .from('cr_articles')
            .select('*')
            .eq('slug', slug)
            .single();
        if (error) return NextResponse.json({ error: error.message }, { status: 404 });
        return NextResponse.json({ article: data });
    }

    const { data, error } = await supabase
        .from('cr_articles')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ articles: data });
}

// POST - create article
export async function POST(request: Request) {
    const body = await request.json();
    const { title, slug, excerpt, category, read_time, cover_image, content, published } = body;

    if (!title || !slug) {
        return NextResponse.json({ error: 'title and slug required' }, { status: 400 });
    }

    const { data, error } = await supabase
        .from('cr_articles')
        .insert({ title, slug, excerpt, category, read_time, cover_image, content, published: published ?? true })
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ article: data });
}

// PUT - update article
export async function PUT(request: Request) {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
        .from('cr_articles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ article: data });
}

// DELETE - delete article
export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const { error } = await supabase
        .from('cr_articles')
        .delete()
        .eq('id', id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
}
