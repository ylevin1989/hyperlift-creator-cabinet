const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres' });
client.connect().then(() => {
    client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'cr_creators'").then(res => {
        console.log(res.rows);
        client.end();
    });
});
