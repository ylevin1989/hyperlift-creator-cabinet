const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function recalculate() {
    const { data: assets } = await supabase.from('cr_video_assets').select('id, views, likes, comments, project_id, creator_id');
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
                        kpi_bonus += Math.floor(extra / 1000) * pc.kpi_rate;
                    }
                }
            }
        }
        await supabase.from('cr_video_assets').update({ kpi_bonus }).eq('id', asset.id);
    }
}
recalculate();
