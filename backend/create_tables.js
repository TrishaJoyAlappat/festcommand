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
      CREATE TABLE IF NOT EXISTS STUDENT (
        Student_ID VARCHAR(50) PRIMARY KEY,
        Name VARCHAR(255) NOT NULL,
        College_name VARCHAR(255) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS USER_ACCOUNT (
        User_ID VARCHAR(50) PRIMARY KEY,
        Username VARCHAR(255) UNIQUE NOT NULL,
        Password_Hash VARCHAR(255) NOT NULL,
        Role VARCHAR(50) NOT NULL,
        Reference_ID VARCHAR(50)
      );
    `);
    console.log("Tables created successfully.");
  } catch (err) {
    console.error("Error creating tables:", err);
  } finally {
    pool.end();
  }
}

setup();
