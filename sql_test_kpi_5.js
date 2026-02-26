const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
    const assetId = 'e2980f8a-a837-4893-a631-0732269a455a';
    const {data: asset} = await supabase.from('cr_video_assets').select('id, kpi_bonus').eq('id', assetId).single();
    if(asset.kpi_bonus === 0) {
        console.log("kpi_bonus is 0. Setting rate to 0.1 and target 0 for testing...");
        const {data: assetData} = await supabase.from('cr_video_assets').select('project_id, creator_id').eq('id', assetId).single();
        await supabase.from('cr_project_creators').update({ kpi_rate: 0.1, kpi_target: 0 }).eq('project_id', assetData.project_id).eq('creator_id', assetData.creator_id);
    }
}
run();
