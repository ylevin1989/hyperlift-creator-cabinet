const project_creator = { kpi_metric: 'views', kpi_rate: 100, kpi_target: 1000000 };
const metrics = { views: 7100000 };
let kpi_bonus = 0;
if (project_creator?.kpi_rate && project_creator?.kpi_target) {
    if (metrics[project_creator.kpi_metric] > project_creator.kpi_target) {
        const extra = metrics[project_creator.kpi_metric] - project_creator.kpi_target;
        kpi_bonus = Math.floor(extra / 1000) * project_creator.kpi_rate;
    }
}
console.log({kpi_bonus});
