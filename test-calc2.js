const project_creator = { kpi_metric: 'views', kpi_rate: 100, kpi_target: 1000000 };
const metrics = { views: 7100000 };
let kpi_bonus = 0;
// Example: rate is per unit, not per 1000? Let's check calculation.
// If it's 100 rubles per 1 view that's over target.
// 7.1M - 1M = 6.1M views over target.
// 6.1M * 100 = 610,000,000 rub. That's likely very wrong.
// If it's 100 rubles per 1000 views over target:
// 6.1M / 1000 = 6100. 6100 * 100 = 610,000. Wait, the screenshot shows +352,000.
// Let's reverse engineer:
// Let extra = 6,100,000.
// Let kpi_rate = 100 per 1000. => Math.floor(6,100,000 / 1000) * 100 = 610,000. 
// What if calculation is based on total views? No, target is 1M.
// Let's check project creator info in DB.
