import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import crypto from 'crypto';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        if (!botToken) {
            return NextResponse.json({ error: 'Telegram Bot Token not configured' }, { status: 500 });
        }

        const { hash, ...data } = body;

        const secretKey = crypto.createHash('sha256').update(botToken).digest();
        const dataCheckString = Object.keys(data)
            .sort()
            .filter(key => data[key] !== undefined && data[key] !== null)
            .map(key => `${key}=${data[key]}`)
            .join('\n');
            
        const hmac = crypto.createHmac('sha256', secretKey)
            .update(dataCheckString)
            .digest('hex');
            
        if (hmac !== hash) {
            return NextResponse.json({ error: 'Data is NOT from Telegram' }, { status: 403 });
        }
        
        // Check temporal validity (e.g. within 10 minutes to prevent replay)
        const now = Math.floor(Date.now() / 1000);
        if (now - data.auth_date > 600) {
            return NextResponse.json({ error: 'Authentication data expired' }, { status: 403 });
        }

        const telegramId = data.id.toString();

        // Check if user exists with this telegram_id
        let { data: user, error: dbError } = await supabase
            .from('cr_creators')
            .select('*')
            .eq('telegram_id', telegramId)
            .single();

        if (!user) {
             // Create new user if they don't exist
             const defaultUsername = data.username || `tg_${data.id}`;
             const fullName = [data.first_name, data.last_name].filter(Boolean).join(' ');
             
             // Check if username already exists just in case
             const { data: existingName } = await supabase
                .from('cr_creators')
                .select('id')
                .eq('username', defaultUsername)
                .maybeSingle();

             const finalUsername = existingName ? `${defaultUsername}_${Math.floor(Math.random()*1000)}` : defaultUsername;

             const { data: newUser, error: insertError } = await supabase
                .from('cr_creators')
                .insert({
                    telegram_id: telegramId,
                    username: finalUsername,
                    full_name: fullName,
                    avatar_url: data.photo_url || null,
                    role: 'creator',
                    approval_status: 'pending' 
                })
                .select()
                .single();
                
             if (insertError) throw insertError;
             user = newUser;
        } else {
             // Optional: update avatar/name if changed
             const updates: any = {};
             if (data.photo_url && user.avatar_url !== data.photo_url) updates.avatar_url = data.photo_url;
             
             if (Object.keys(updates).length > 0) {
                 await supabase.from('cr_creators').update(updates).eq('id', user.id);
             }
        }

        return NextResponse.json({ success: true, userId: user.id });

    } catch (error: any) {
        console.error('Telegram auth error:', error);
        return NextResponse.json({ error: error.message || 'Ошибка сервера' }, { status: 500 });
    }
}
