const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function recalculate() {
    console.log("Reverting KPI calculation to per-unit...");

    const { data: assets, error } = await supabase.from('cr_video_assets').select('id, views, likes, comments, project_id, creator_id');
    if (error) {
       console.error(error);
       return;
    }
    
    let updatedCount = 0;
    
    for (const asset of assets) {
        let kpi_bonus = 0;
        const { data: creatorInfo } = await supabase
            .from('cr_project_creators')
            .select('kpi_metric, kpi_rate, kpi_target')
            .eq('project_id', asset.project_id)
            .eq('creator_id', asset.creator_id);
            
        if (creatorInfo && creatorInfo.length > 0) {
            for (const pc of creatorInfo) {
                if (pc.kpi_rate != null) {
                    const currentVal = asset[pc.kpi_metric] || 0;
                    const target = pc.kpi_target || 0;
                    if (currentVal > target) {
                        const extra = currentVal - target;
                        
                        // Treat kpi_rate as "per unit" (e.g. 0.1 rub/view)
                        kpi_bonus += extra * pc.kpi_rate;
                    }
                }
            }
        }
        
        await supabase.from('cr_video_assets').update({ kpi_bonus }).eq('id', asset.id);
        updatedCount++;
    }
    console.log(`Updated ${updatedCount} assets.`);
}
recalculate();
