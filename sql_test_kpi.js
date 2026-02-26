const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
    const {data: asset} = await supabase.from('cr_video_assets').select('title, kpi_bonus, project_id, creator_id').eq('title', 'but first, a snowboarding trick 🏂⁣\n⁣\n#InTheMoment ⁣\n ⁣\nVide...').single();
    console.log("Asset:", asset);
    if(asset) {
        const {data: pc} = await supabase.from('cr_project_creators').select('kpi_metric, kpi_rate, kpi_target').eq('project_id', asset.project_id).eq('creator_id', asset.creator_id);
        console.log("Project Creators:", pc);
    }
}
run();
