const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
    const {data: asset} = await supabase.from('cr_video_assets').select('id, views, likes, comments, project_id, creator_id').order('views', {ascending: false}).limit(1);
    if (asset && asset.length > 0) {
       const a = asset[0];
       const {data: projectCreator} = await supabase.from('cr_project_creators').select('kpi_metric, kpi_rate, kpi_target').eq('project_id', a.project_id).eq('creator_id', a.creator_id).single();
       console.log('Asset:', a);
       console.log('ProjectCreator:', projectCreator);
    }
}
run();
