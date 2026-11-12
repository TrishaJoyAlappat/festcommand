const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function addUnique() {
  try {
    await pool.query(`ALTER TABLE RESULT ADD UNIQUE (enrollment_id);`);
    console.log("Added UNIQUE constraint on RESULT.enrollment_id");
  } catch(e) {
    console.log("Constraint might already exist:", e.message);
  } finally {
    pool.end();
  }
}
addUnique();
