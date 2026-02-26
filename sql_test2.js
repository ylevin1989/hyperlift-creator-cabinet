const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
    const { data: cols, error: err2 } = await supabase.rpc('get_kpi_bonus', { p_asset_id: 'cee537cc-a569-497d-8ee2-eef94894ce5b' });
    console.log(cols, err2);
    
    // Also let's check asset
    const {data: asset} = await supabase.from('cr_video_assets').select('id, views, likes, comments, project_id, creator_id').eq('id', 'bba986e3-53d9-4824-9bbf-5735c02d18bc').single();
    if (asset) {
       const {data: projectCreator} = await supabase.from('cr_project_creators').select('kpi_metric, kpi_rate, kpi_target').eq('project_id', asset.project_id).eq('creator_id', asset.creator_id).single();
       console.log('Asset:', asset);
       console.log('ProjectCreator:', projectCreator);
    }
}
run();
