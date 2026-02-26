import { parseVideoMetrics } from './src/lib/parse-video';

async function run() {
    const res = await parseVideoMetrics('https://www.instagram.com/reel/DE-sEq0NV2H/?igsh=eHNvYzF6b3I3cHN5');
    console.log(res);
}

run();
