const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
async function run() {
    const assetId = 'e2980f8a-a837-4893-a631-0732269a455a'
    const {data: asset} = await supabase.from('cr_video_assets').select('views, kpi_bonus').eq('id', assetId).single()
    const {data: pc} = await supabase.from('cr_project_creators').select('*').eq('project_id', '2a01b229-4ede-4da0-9509-4711022dc2f1').eq('creator_id', '8668a902-9d18-4ab8-b553-9362612a31a0').single()
    console.log("Views:", asset.views, "KPI Bonus:", asset.kpi_bonus)
    console.log("PC Config:", pc)
    
    // Force trigger by manual update
    await supabase.from('cr_video_assets').update({ views: 22800001 }).eq('id', assetId)
    const {data: updated} = await supabase.from('cr_video_assets').select('kpi_bonus').eq('id', assetId).single()
    console.log("After update KPI Bonus:", updated.kpi_bonus)
}
run()
