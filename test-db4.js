require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  
  try {
    await client.query("ALTER TABLE cr_video_assets ADD COLUMN thumbnail_url TEXT;");
    console.log("Added thumbnail_url column to cr_video_assets");
  } catch (err) {
    if (err.code === '42701') console.log("Column already exists");
    else console.error(err);
  }
  
  await client.end();
}
run();
