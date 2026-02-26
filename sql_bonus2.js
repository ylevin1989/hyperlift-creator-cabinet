const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function recalculate() {
    console.log("Updating KPI calculation...");

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
                if (pc.kpi_rate && pc.kpi_target) {
                    const currentVal = asset[pc.kpi_metric] || 0;
                    if (currentVal > pc.kpi_target) {
                        const extra = currentVal - pc.kpi_target;
                        
                        // Fix for huge bonus calculation
                        // Divide by 1000 since rate is usually per 1000 views
                        kpi_bonus += Math.floor(extra / 1000) * pc.kpi_rate;
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
