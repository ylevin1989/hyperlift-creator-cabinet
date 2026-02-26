CREATE OR REPLACE FUNCTION public.update_asset_kpi_bonus()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_metric text;
    v_rate numeric;
    v_target numeric;
    v_current_val numeric;
    v_extra numeric;
    v_new_bonus numeric := 0;
BEGIN
    FOR v_metric, v_rate, v_target IN
        SELECT kpi_metric, kpi_rate, kpi_target
        FROM cr_project_creators
        WHERE project_id = NEW.project_id
        AND creator_id = NEW.creator_id
    LOOP
        IF v_rate IS NOT NULL AND v_target IS NOT NULL THEN
            IF v_metric = 'views' THEN
                v_current_val := COALESCE(NEW.views, 0);
            ELSIF v_metric = 'likes' THEN
                v_current_val := COALESCE(NEW.likes, 0);
            ELSIF v_metric = 'comments' THEN
                v_current_val := COALESCE(NEW.comments, 0);
            ELSE
                v_current_val := 0;
            END IF;

            IF v_current_val > v_target THEN
                v_extra := v_current_val - v_target;
                -- The crucial fix: Divide by 1000 for rate calculation
                v_new_bonus := v_new_bonus + (FLOOR(v_extra / 1000) * v_rate);
            END IF;
        END IF;
    END LOOP;

    NEW.kpi_bonus := v_new_bonus;
    RETURN NEW;
END;
$function$;
