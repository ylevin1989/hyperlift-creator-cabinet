import { parseVideoMetrics } from './src/lib/parse-video';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
    console.log('Testing Instagram parsing with Apify...');
    console.log('APIFY_TOKEN:', process.env.APIFY_TOKEN ? 'Present' : 'Missing');
    const url = 'https://www.instagram.com/p/B89prebFBcw/';
    const result = await parseVideoMetrics(url);
    console.log('Result:', result);
}
main().catch(console.error);
