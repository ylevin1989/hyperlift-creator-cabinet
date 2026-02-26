const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkKpi() {
    const { data: cols } = await supabase.rpc('get_kpi_bonus', { p_asset_id: 'cee537cc-a569-497d-8ee2-eef94894ce5b' });
    console.log("Check if get_kpi_bonus RPC exists:", cols);
    // Well, it fails. The KPI bonus calculation happens when you update metrics in the parse logic maybe?
}
checkKpi();
