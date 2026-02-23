import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const niche = searchParams.get('niche');

    try {
        let query = supabase.from('briefs').select('*');

        if (niche && niche !== 'Все') {
            query = query.eq('niche', niche);
        }

        // Orders briefs by most recent
        const { data: briefs, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ briefs });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
