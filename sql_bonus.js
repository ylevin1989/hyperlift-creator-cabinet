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
                        // The kpi calculation seems to be: extra * kpi_rate
                        // Unless kpi_rate is per 1000 views. Let's assume rate is unit rate for now?
                        // Actually in previous screen they had 100 "per piece" which might be per 1000 views.
                        // Wait, it says ₽/шт (rubles per unit). If it's rubles per 1000 views...
                        // If they set rate = 100, target = 1M views.
                        // currentVal = 7.1M => extra = 6.1M
                        // (6.1M / 1000) * 100 = 610,000. So we divide by 1000? 
                        
                        // Let's set it to 0 for now to clear the weird numbers
                    }
                }
            }
        }
    }
}
recalculate();
