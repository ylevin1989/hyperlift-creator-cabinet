const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
async function run() {
    const assetId = 'e2980f8a-a837-4893-a631-0732269a455a'
    const {data: asset} = await supabase.from('cr_video_assets').select('id, kpi_bonus').eq('id', assetId).single()
    console.log("Current asset KPI bonus:", asset.kpi_bonus)
}
run()
