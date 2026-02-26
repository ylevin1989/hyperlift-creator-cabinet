let asset_kpi_bonus = 352000;
let kpi_rate = 100;
let kpi_target = 1000000;
let views = 4520000;
console.log({ views_over_target: views - kpi_target, should_be: Math.floor((views - kpi_target)/1000) * kpi_rate });
