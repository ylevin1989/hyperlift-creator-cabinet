
import { parseVideoMetrics, parseFollowerCount } from './lib/parse-video';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function runTests() {
    const testUrls = [
        { name: 'VK Video', url: 'https://vk.com/video-152205883_456239241' },
        { name: 'VK Profile', url: 'https://vk.com/durov' },
        { name: 'Threads Post', url: 'https://www.threads.net/@zuck/post/CuX9_4_r2_p' },
        { name: 'Telegram Channel', url: 'https://t.me/durov' },
        { name: 'Likee Video', url: 'https://likee.video/@user/video/12345678' },
        { name: 'MAX Post', url: 'https://max.ru/c/123456/789012' },
        { name: 'MAX Channel', url: 'https://max.ru/durov' }
    ];

    console.log('--- Testing parseVideoMetrics ---');
    for (const test of testUrls) {
        try {
            console.log(`Testing ${test.name}: ${test.url}...`);
            // We can't see the raw data because parseVideoMetrics doesn't return it.
            // But we can check if it succeeds.
            const metrics = await parseVideoMetrics(test.url);
            console.log(`Result for ${test.name}:`, JSON.stringify(metrics, null, 2));
        } catch (e) {
            console.error(`Error for ${test.name}:`, e);
        }
    }

    console.log('\n--- Testing parseFollowerCount ---');
    for (const test of testUrls) {
        try {
            console.log(`Testing followers for ${test.name}: ${test.url}...`);
            const count = await parseFollowerCount(test.url);
            console.log(`Followers for ${test.name}:`, count);
        } catch (e) {
            console.error(`Error followers for ${test.name}:`, e);
        }
    }
}

runTests().catch(console.error);
