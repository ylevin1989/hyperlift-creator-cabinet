import { parseVideoMetrics } from './src/lib/parse-video';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
    console.log('Testing TikTok parsing...');
    console.log('RAPIDAPI_KEY:', process.env.RAPIDAPI_KEY ? 'Present' : 'Missing');
    // We use a sample URL
    const url = 'https://www.tiktok.com/@tiktok/video/7303032585501871391';
    const result = await parseVideoMetrics(url);
    console.log('Result:', result);
}
main().catch(console.error);
