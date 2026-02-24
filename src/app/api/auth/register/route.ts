import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { username, password, name, phone, equipment, socials } = body;

        if (!username || !password || !name) {
            return NextResponse.json({ error: 'Username, password and name are required' }, { status: 400 });
        }

        // Check if username exists
        const { data: existingUser } = await supabase
            .from('cr_creators')
            .select('id')
            .eq('username', username)
            .single();

        if (existingUser) {
            return NextResponse.json({ success: false, error: 'Пользователь с таким логином уже существует' }, { status: 409 });
        }

        const password_hash = await bcrypt.hash(password, 10);

        const { data: newUser, error: insertError } = await supabase
            .from('cr_creators')
            .insert({
                username,
                password_hash,
                name,
                phone: phone || null,
                equipment: equipment || null,
                socials: socials || null,
                metrics: { total_views: 0, avg_er: 0, content_score: 0 },
                available_balance: 0,
                holding_balance: 0,
                kpi_score: 0
            })
            .select('id')
            .single();

        if (insertError) {
            console.error("Insert err:", insertError);
            throw insertError;
        }

        return NextResponse.json({ success: true, userId: newUser.id });
    } catch (error: any) {
        console.error("Register Error:", error);
        return NextResponse.json(
            { success: false, error: 'Внутренняя ошибка сервера' },
            { status: 500 }
        );
    }
}
