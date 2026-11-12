const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function setup() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ENROLLMENT (
        Student_ID VARCHAR(50),
        Event_ID VARCHAR(50),
        PRIMARY KEY (Student_ID, Event_ID)
      );
    `);
    console.log("ENROLLMENT table created successfully.");
  } catch (err) {
    console.error("Error creating ENROLLMENT table:", err);
  } finally {
    pool.end();
  }
}

setup();
