import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
    try {
        const { username, password } = await req.json();

        if (!username || !password) {
            return NextResponse.json({ error: 'Missing username or password' }, { status: 400 });
        }

        const { data: user, error: dbError } = await supabase
            .from('cr_creators')
            .select('*')
            .eq('username', username)
            .single();

        if (dbError || !user || !user.password_hash) {
            return NextResponse.json(
                { success: false, error: 'Неверные данные для входа' },
                { status: 401 }
            );
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (isMatch) {
            return NextResponse.json({ success: true, userId: user.id });
        }

        return NextResponse.json(
            { success: false, error: 'Неверный пароль' },
            { status: 401 }
        );
    } catch (error) {
        return NextResponse.json(
            { success: false, error: 'Внутренняя ошибка сервера' },
            { status: 500 }
        );
    }
}
