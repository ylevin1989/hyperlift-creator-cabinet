import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET — list all brands
export async function GET() {
    try {
        const { data: brands, error } = await supabase
            .from('cr_brands')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;
        return NextResponse.json({ brands });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// POST — create or update brand (admin only)
export async function POST(request: Request) {
    try {
        const { userId, action, ...brandData } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify admin
        const { data: user } = await supabase
            .from('cr_creators')
            .select('role')
            .eq('id', userId)
            .single();

        if (user?.role !== 'admin') {
            return NextResponse.json({ error: 'Only admins' }, { status: 403 });
        }

        if (action === 'create') {
            const { name, logo_url, description, website, color } = brandData;
            if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

            const { data: brand, error } = await supabase
                .from('cr_brands')
                .insert({ name, logo_url: logo_url || null, description: description || null, website: website || null, color: color || '#3b82f6' })
                .select()
                .single();

            if (error) throw error;
            return NextResponse.json({ success: true, brand });
        }

        if (action === 'update') {
            const { id, ...fields } = brandData;
            if (!id) return NextResponse.json({ error: 'Brand ID required' }, { status: 400 });

            const { error } = await supabase.from('cr_brands').update(fields).eq('id', id);
            if (error) throw error;
            return NextResponse.json({ success: true });
        }

        if (action === 'delete') {
            const { id } = brandData;
            if (!id) return NextResponse.json({ error: 'Brand ID required' }, { status: 400 });

            // Detach from projects first
            await supabase.from('cr_projects').update({ brand_id: null }).eq('brand_id', id);
            const { error } = await supabase.from('cr_brands').delete().eq('id', id);
            if (error) throw error;
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
