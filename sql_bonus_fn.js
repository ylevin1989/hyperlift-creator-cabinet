const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
   const sql = `
CREATE OR REPLACE FUNCTION public.get_kpi_bonus(p_asset_id uuid)
RETURNS numeric
LANGUAGE plpgsql
AS $function$
DECLARE
  v_bonus numeric := 0;
  v_asset record;
  v_kpi record;
  v_current_val numeric;
  v_extra numeric;
BEGIN
  -- Get asset stats and association
  SELECT views, likes, comments, project_id, creator_id 
  INTO v_asset
  FROM cr_video_assets
  WHERE id = p_asset_id;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  -- Loop through all KPIs for this creator on this project
  FOR v_kpi IN 
    SELECT kpi_metric, kpi_rate, kpi_target
    FROM cr_project_creators
    WHERE project_id = v_asset.project_id AND creator_id = v_asset.creator_id
  LOOP
    IF v_kpi.kpi_rate IS NOT NULL AND v_kpi.kpi_target IS NOT NULL THEN
      -- Determine current value based on metric type
      v_current_val := 0;
      IF v_kpi.kpi_metric = 'views' THEN
        v_current_val := COALESCE(v_asset.views, 0);
      ELSIF v_kpi.kpi_metric = 'likes' THEN
        v_current_val := COALESCE(v_asset.likes, 0);
      ELSIF v_kpi.kpi_metric = 'comments' THEN
        v_current_val := COALESCE(v_asset.comments, 0);
      END IF;

      -- Check if target is exceeded
      IF v_current_val > v_kpi.kpi_target THEN
        v_extra := v_current_val - v_kpi.kpi_target;
        
        -- IMPORTANT: Assume rate is per 1000 units (standard CPM pricing)
        -- e.g., if target=1M, rate=100 rubles, current=1.5M
        -- bonus = floor(500,000 / 1000) * 100 = 500 * 100 = 50,000
        v_bonus := v_bonus + (FLOOR(v_extra / 1000) * v_kpi.kpi_rate);
      END IF;
    END IF;
  END LOOP;

  RETURN v_bonus;
END;
$function$;
   `;
   
   // Usually we can't run DDL from js client unless we use rpc.
   // Let's just create a migration or instruct the user.
}
run();
