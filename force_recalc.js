const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
    console.log("Forcing update on all assets to trigger KPI recalculation...");
    const { data: assets, error } = await supabase.from('cr_video_assets').select('id');
    if (error) {
        console.error(error);
        return;
    }
    
    for (const asset of assets) {
        // Trigger the db trigger by updating last_stats_update
        await supabase.from('cr_video_assets').update({ last_stats_update: new Date().toISOString() }).eq('id', asset.id);
    }
    console.log(`Successfully triggered recalculation for ${assets.length} assets.`);
}
run();
