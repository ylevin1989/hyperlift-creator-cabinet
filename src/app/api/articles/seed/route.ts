import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ARTICLES } from '@/data/articles';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// POST - seed articles from static data to database
export async function POST() {
    const rows = ARTICLES.map(a => ({
        slug: a.slug,
        title: a.title,
        excerpt: a.excerpt,
        category: a.category,
        read_time: a.readTime,
        cover_image: a.coverImage,
        content: a.content,
        published: true,
    }));

    const { data, error } = await supabase
        .from('cr_articles')
        .upsert(rows, { onConflict: 'slug' })
        .select('id, slug');

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ seeded: data?.length ?? 0 });
}
