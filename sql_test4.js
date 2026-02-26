const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
    const {data: asset} = await supabase.from('cr_video_assets').select('id, views, likes, comments, project_id, creator_id, kpi_bonus').order('kpi_bonus', {ascending: false}).limit(5);
    console.log(asset);
    
    // update to null mapping 
}
run();
