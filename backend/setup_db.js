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
    console.log("Connecting to the database...");
    
    // Create tables
    await pool.query(`
      DROP TABLE IF EXISTS PARTICIPANT CASCADE;
      DROP TABLE IF EXISTS EVENT CASCADE;

      CREATE TABLE EVENT (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(50) NOT NULL,
        day INTEGER NOT NULL,
        time VARCHAR(100) NOT NULL,
        venue VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'upcoming'
      );

      CREATE TABLE PARTICIPANT (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        event_id VARCHAR(50) REFERENCES EVENT(id) ON DELETE CASCADE,
        team VARCHAR(255) DEFAULT '-',
        marks VARCHAR(10) DEFAULT '',
        feedback TEXT DEFAULT '',
        submitted BOOLEAN DEFAULT FALSE
      );
    `);
    
    console.log("Tables created successfully.");

    // Insert events
    const events = [
      { id: "E1", name: "24hr Hackathon", category: "Tech", day: 1, time: "09:00 AM", venue: "Main Lab", status: "in-progress" },
      { id: "E2", name: "Futsal Tournament", category: "Sports", day: 1, time: "10:00 AM", venue: "College Turf", status: "upcoming" },
      { id: "E3", name: "Solo Dance Battle", category: "Cultural", day: 1, time: "03:00 PM", venue: "Auditorium", status: "upcoming" },
      { id: "E4", name: "Basketball 3v3", category: "Sports", day: 2, time: "09:00 AM", venue: "Sports Court", status: "upcoming" },
      { id: "E5", name: "UI/UX Sprint", category: "Tech", day: 2, time: "10:00 AM", venue: "Lab 2", status: "upcoming" },
      { id: "E6", name: "Nukkad Natak", category: "Cultural", day: 2, time: "04:30 PM", venue: "Quadrangle", status: "upcoming" },
      { id: "E7", name: "Capture The Flag", category: "Tech", day: 3, time: "09:00 AM", venue: "Server Room", status: "upcoming" },
      { id: "E8", name: "Fashion Show", category: "Cultural", day: 3, time: "05:00 PM", venue: "Main Stage", status: "upcoming" },
    ];

    for (const ev of events) {
      await pool.query(
        'INSERT INTO EVENT (id, name, category, day, time, venue, status) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [ev.id, ev.name, ev.category, ev.day, ev.time, ev.venue, ev.status]
      );
    }
    console.log("Events seeded successfully.");

    // Insert participants
    const participants = [
      { id: "P1", name: "Rahul Sharma", email: "rahul@uni.edu", event_id: "E1", team: "ByteForce" },
      { id: "P2", name: "Priya Patel", email: "priya@uni.edu", event_id: "E3", team: "-" },
      { id: "P3", name: "Arjun Singh", email: "arjun@uni.edu", event_id: "E2", team: "FC Thunder" },
      { id: "P4", name: "Sneha Gupta", email: "sneha@uni.edu", event_id: "E5", team: "DesignPro" },
      { id: "P5", name: "Vikram Reddy", email: "vikram@uni.edu", event_id: "E7", team: "H4ckT34m" },
      { id: "P6", name: "Ananya Iyer", email: "ananya@uni.edu", event_id: "E8", team: "Style Squad" },
      { id: "P7", name: "Karthik Nair", email: "karthik@uni.edu", event_id: "E4", team: "Slam Dunk" },
      { id: "P8", name: "Meera Joshi", email: "meera@uni.edu", event_id: "E6", team: "Drama Kings" },
      
      // For Judge Portal (assigned to E1)
      { id: "T1", name: "ByteForce", email: "t1@uni.edu", event_id: "E1", team: "Rahul, Priya, Amit" },
      { id: "T2", name: "CodeCrafters", email: "t2@uni.edu", event_id: "E1", team: "Sneha, Vikram, Arun" },
      { id: "T3", name: "TechTitans", email: "t3@uni.edu", event_id: "E1", team: "Karthik, Meera, Rohan" },
      { id: "T4", name: "InnovatorsHub", email: "t4@uni.edu", event_id: "E1", team: "Ananya, Deepak, Sanya" },
      { id: "T5", name: "PixelPioneers", email: "t5@uni.edu", event_id: "E1", team: "Arjun, Neha, Siddharth" },
    ];

    for (const p of participants) {
      await pool.query(
        'INSERT INTO PARTICIPANT (id, name, email, event_id, team) VALUES ($1, $2, $3, $4, $5)',
        [p.id, p.name, p.email, p.event_id, p.team]
      );
    }
    console.log("Participants seeded successfully.");

  } catch (err) {
    console.error("Error setting up database:", err);
  } finally {
    pool.end();
  }
}

setup();
