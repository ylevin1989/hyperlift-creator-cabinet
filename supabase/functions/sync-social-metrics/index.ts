import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || "";
const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY') || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function scrapeWithFirecrawl(url: string) {
    if (!FIRECRAWL_API_KEY) {
        console.error("Missing FIRECRAWL_API_KEY");
        return null;
    }

    try {
        console.log(`Calling Firecrawl for: ${url}`);
        const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                url: url,
                formats: ["extract"],
                extract: {
                    schema: {
                        type: "object",
                        properties: {
                            views: { type: "number", description: "The number of views or plays the video has recieved" },
                            likes: { type: "number", description: "The number of likes the video has recieved" },
                            comments: { type: "number", description: "The number of comments the video has recieved" },
                            shares: { type: "number", description: "The number of shares for this video" }
                        },
                        required: ["views"]
                    },
                    prompt: "Extract the exact play count / view count, likes, comments, and shares of this social media video."
                }
            })
        });

        const data = await response.json();

        if (data.success && data.data && data.data.extract) {
            const extract = data.data.extract;
            return {
                views: extract.views || 0,
                likes: extract.likes || 0,
                comments: extract.comments || 0,
                shares: extract.shares || 0,
            };
        } else {
            console.error("Firecrawl Error:", data);
            return null;
        }

    } catch (e) {
        console.error("Firecrawl scrape error:", e);
        return null;
    }
}

serve(async (req: Request) => {
    try {
        let targetId = undefined;
        try {
            const body = await req.json();
            targetId = body.assetId;
        } catch (e) { }

        let query = supabase.from('cr_video_assets').select('*');
        if (targetId) {
            query = query.eq('id', targetId);
        } else {
            // Syncing logic: up to 10 assets, ascending last_synced_at to rotate oldest first
            query = query.order('last_stats_update', { ascending: true, nullsFirst: true }).limit(10);
        }

        const { data: assets, error: fetchErr } = await query;
        if (fetchErr) throw fetchErr;

        const updates = [];

        for (const asset of (assets || [])) {
            if (!asset.video_url) continue;

            const stats = await scrapeWithFirecrawl(asset.video_url);
            if (stats && (stats.views > 0 || stats.likes > 0)) {
                // update db
                const { error: updateErr } = await supabase.from('cr_video_assets').update({
                    views: stats.views,
                    likes: stats.likes,
                    comments: stats.comments,
                    last_stats_update: new Date().toISOString()
                }).eq('id', asset.id);

                if (updateErr) {
                    console.error("Update err:", updateErr);
                } else {
                    updates.push({ id: asset.id, ...stats, project_id: asset.project_id });
                }
            } else {
                console.log("No valid stats found for", asset.video_url);
            }
        }

        return new Response(
            JSON.stringify({ success: true, updated: updates }),
            { headers: { "Content-Type": "application/json" } }
        );
    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
});
