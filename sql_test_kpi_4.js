const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
    const {data: asset} = await supabase.from('cr_video_assets').select('id, title, kpi_bonus').eq('title', 'but first, a snowboarding trick 🏂⁣\n⁣\n#InTheMoment ⁣\n ⁣\nVide...').single();
    console.log("kpi_bonus for snowboarding asset:", asset.kpi_bonus);
}
run();
