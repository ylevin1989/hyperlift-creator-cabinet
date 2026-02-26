const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
    const {data, error} = await supabase.rpc('get_kpi_bonus', { p_asset_id: 'cee537cc-a569-497d-8ee2-eef94894ce5b' });
    console.log(data, error);
}
run();
