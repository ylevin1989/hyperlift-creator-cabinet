const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
    const assetId = 'e2980f8a-a837-4893-a631-0732269a455a'; // 2.1M views
    
    // First let's check current KPI setup for this asset's creator/project
    const {data: asset} = await supabase.from('cr_video_assets').select('project_id, creator_id, views').eq('id', assetId).single();
    const {data: pc} = await supabase.from('cr_project_creators').select('kpi_metric, kpi_rate, kpi_target').eq('project_id', asset.project_id).eq('creator_id', asset.creator_id).single();
    
    console.log("Current asset views:", asset.views);
    console.log("Current KPI config:", pc);
    
    // If no KPI metric is set, that's why it's 0. Let's force an update to see if it changes from 0.
    const { error: updateErr } = await supabase.from('cr_video_assets').update({ last_stats_update: new Date().toISOString() }).eq('id', assetId);
    if(updateErr) console.error("Update error:", updateErr);
    
    const {data: updated} = await supabase.from('cr_video_assets').select('kpi_bonus').eq('id', assetId).single();
    console.log("Updated KPI bonus:", updated.kpi_bonus);
}
run();
