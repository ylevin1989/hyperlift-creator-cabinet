import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { parseFollowerCount } from '@/lib/parse-video';

// POST: sync follower counts for a creator's social links
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { userId } = body;

        if (!userId) {
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }

        // Get current profile
        const { data: profile, error: fetchError } = await supabase
            .from('cr_creators')
            .select('social_links')
            .eq('id', userId)
            .single();

        if (fetchError || !profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        const links = Array.isArray(profile.social_links) ? profile.social_links : [];

        if (links.length === 0) {
            return NextResponse.json({ error: 'No social links to sync' }, { status: 400 });
        }

        // Fetch follower counts for each link in parallel
        const updatedLinks = await Promise.all(
            links.map(async (link: any) => {
                try {
                    const followers = await parseFollowerCount(link.url);
                    return { ...link, followers: followers || link.followers || 0 };
                } catch (e) {
                    console.error(`Failed to sync followers for ${link.platform}:`, e);
                    return link;
                }
            })
        );

        // Save updated links back to DB
        const { data, error: updateError } = await supabase
            .from('cr_creators')
            .update({ social_links: updatedLinks })
            .eq('id', userId)
            .select()
            .single();

        if (updateError) {
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        return NextResponse.json({ social_links: data.social_links });

    } catch (err) {
        console.error('Sync social error:', err);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
