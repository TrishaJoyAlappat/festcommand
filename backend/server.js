const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Test the connection
pool.connect()
  .then(() => console.log("✅ Connected to PostgreSQL Successfully!"))
  .catch(err => console.error("❌ Database connection error", err.message));

// ==========================================
// EVENTS API
// ==========================================

// Get all events
app.get('/api/events', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM EVENT ORDER BY day ASC, time ASC;');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

app.post('/api/enroll', async (req, res) => {
  const { student_id, event_id } = req.body;
  try {
    const newEnrollment = await pool.query(
      'INSERT INTO ENROLLMENT (Student_ID, Event_ID) VALUES ($1, $2) RETURNING *',
      [student_id, event_id]
    );
    res.json({ success: true, message: "Successfully enrolled!" });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ success: false, message: "Already enrolled." });
    }
    res.status(500).send("Server Error");
  }
});

// Create event
app.post('/api/events', async (req, res) => {
  try {
    const { name, category, day, time, venue } = req.body;
    const id = "E" + Date.now().toString().slice(-4);
    const result = await pool.query(
      'INSERT INTO EVENT (id, name, category, day, time, venue, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [id, name, category, parseInt(day), time, venue, 'upcoming']
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Update event
app.put('/api/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, day, time, venue, status } = req.body;
    const result = await pool.query(
      'UPDATE EVENT SET name=$1, category=$2, day=$3, time=$4, venue=$5, status=$6 WHERE id=$7 RETURNING *',
      [name, category, parseInt(day), time, venue, status, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Delete event
app.delete('/api/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM EVENT WHERE id = $1', [id]);
    res.json({ message: 'Event deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// ==========================================
// 🚀 API ROUTE: GET STUDENT'S ENROLLED EVENTS
// ==========================================
app.get('/api/students/:studentId/enrollments', async (req, res) => {
  const { studentId } = req.params;
  try {
    const query = `
      SELECT e.id, e.name, e.category, e.day, e.time, e.venue 
      FROM EVENT e
      JOIN ENROLLMENT en ON e.id = en.event_id
      WHERE en.student_id = $1
    `;
    const result = await pool.query(query, [studentId]);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error("Error fetching enrollments:", err.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// ==========================================
// PARTICIPANTS API
// ==========================================

// ==========================================
// 🚀 API ROUTE: GET ALL PARTICIPANTS (ADMIN)
// ==========================================
app.get('/api/participants', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM STUDENT ORDER BY Name ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// ==========================================
// 🚀 API ROUTE: USER LOGIN
// ==========================================
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // 1. Check if user exists in the database
    const result = await pool.query(
      'SELECT * FROM USER_ACCOUNT WHERE Username = $1',
      [username]
    );

    // 2. If no rows are returned, the user hasn't signed up
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "Account not found. Please Sign Up first!" 
      });
    }

    const user = result.rows[0];

    // 3. Check if password matches (Note: using plain text for demo purposes)
    if (user.password_hash !== password) {
      return res.status(401).json({ 
        success: false, 
        message: "Incorrect password." 
      });
    }

    // 4. Success! Send back the user details
    res.json({ 
      success: true, 
      user: { 
        userId: user.user_id,
        username: user.username, 
        role: user.role, 
        referenceId: user.reference_id // This is the Student_ID, Judge_ID, etc.
      } 
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// ==========================================
// 🚀 API ROUTE: REGISTER NEW STUDENT
// ==========================================
app.post('/api/register', async (req, res) => {
  const { username, password, name, college } = req.body;
  const studentId = 'S' + Date.now().toString().slice(-6); // Simple ID generation
  const userId = 'U' + Date.now().toString().slice(-6);

  try {
    await pool.query('BEGIN'); // Start SQL Transaction
    
    // 1. Create Student Profile
    await pool.query(
      'INSERT INTO STUDENT (Student_ID, Name, College_name) VALUES ($1, $2, $3)',
      [studentId, name, college]
    );
    
    // 2. Create User Account (Linked via Reference_ID)
    // Note: In production, password must be hashed using bcrypt. Using raw for demo.
    await pool.query(
      'INSERT INTO USER_ACCOUNT (User_ID, Username, Password_Hash, Role, Reference_ID) VALUES ($1, $2, $3, $4, $5)',
      [userId, username, password, 'Student', studentId]
    );
    
    await pool.query('COMMIT'); // Save both
    res.json({ success: true, message: "Registration successful!", user: { username, role: 'Student', studentId } });
  } catch (err) {
    await pool.query('ROLLBACK'); // Cancel if error occurs
    console.error(err);
    if (err.code === '23505') return res.status(400).json({ success: false, message: "Username already exists." });
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// Enroll in an event
app.post('/api/participants/enroll', async (req, res) => {
  try {
    const { event_id, name, email, team } = req.body;
    const id = "P" + Date.now().toString().slice(-4);
    const result = await pool.query(
      'INSERT INTO PARTICIPANT (id, name, email, event_id, team) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [id, name, email, event_id, team || '-']
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Get participants by event id (for judge portal)
app.get('/api/judge/participants/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const result = await pool.query('SELECT * FROM PARTICIPANT WHERE event_id = $1', [eventId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// ==========================================
// 🚀 API ROUTE: GET EVENT PARTICIPANTS (FOR JUDGING)
// ==========================================
app.get('/api/events/:eventId/participants', async (req, res) => {
  const { eventId } = req.params;
  try {
    const query = `
      SELECT s.student_id, s.name, en.enrollment_id 
      FROM STUDENT s
      JOIN ENROLLMENT en ON s.student_id = en.student_id
      WHERE en.event_id = $1
    `;
    const result = await pool.query(query, [eventId]);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error("Error fetching participants:", err.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// ==========================================
// 🚀 API ROUTE: SCORE SUBMISSION
// ==========================================
app.post('/api/scores', async (req, res) => {
  const { marks, feedback, enrollment_id, judge_id } = req.body;
  try {
    await pool.query(
      'INSERT INTO SCORE (marks, feedback, enrollment_id, judge_id) VALUES ($1, $2, $3, $4)',
      [marks, feedback, enrollment_id, judge_id]
    );
    res.json({ success: true, message: "Score submitted successfully!" });
  } catch (err) {
    console.error("Score Error:", err.message);
    // Forward the exact DB error (e.g., trigger RAISE EXCEPTION) to the frontend
    res.status(400).json({ success: false, message: err.message });
  }
});

// ==========================================
// 🚀 API ROUTE: PUBLISH TOP 3 RESULTS
// ==========================================
app.post('/api/events/:eventId/publish-results', async (req, res) => {
  const { eventId } = req.params;
  const council_id = 'C01'; // Defaulting to the main organizer ID
  
  try {
    // 1. Fetch top 3 highest scores for the event
    const topScores = await pool.query(`
      SELECT s.enrollment_id, s.marks 
      FROM SCORE s
      JOIN ENROLLMENT e ON s.enrollment_id = e.enrollment_id
      WHERE e.event_id = $1
      ORDER BY s.marks DESC LIMIT 3
    `, [eventId]);

    if (topScores.rows.length === 0) {
      return res.status(400).json({ success: false, message: "No scores found for this event yet." });
    }

    // 2. Insert into RESULT table (1st, 2nd, 3rd)
    for (let i = 0; i < topScores.rows.length; i++) {
      // Use ON CONFLICT DO NOTHING to prevent duplicate winners if clicked twice
      await pool.query(`
        INSERT INTO RESULT (rank, enrollment_id, council_id) 
        VALUES ($1, $2, $3)
        ON CONFLICT (enrollment_id) DO NOTHING
      `, [i + 1, topScores.rows[i].enrollment_id, council_id]);
    }
    res.json({ success: true, message: "Top 3 Results Published Successfully!" });
  } catch (err) {
    console.error("Publish Error:", err.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// ==========================================
// 🚀 API ROUTE: GET STUDENT RESULTS
// ==========================================
app.get('/api/students/:studentId/results', async (req, res) => {
  const { studentId } = req.params;
  try {
    const query = `
      SELECT r.rank, ev.name as event_name
      FROM RESULT r
      JOIN ENROLLMENT en ON r.enrollment_id = en.enrollment_id
      JOIN EVENT ev ON en.event_id = ev.id
      WHERE en.student_id = $1
    `;
    const result = await pool.query(query, [studentId]);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// Get user enrolled events (simulated by email)
app.get('/api/participants/my-events/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const result = await pool.query(`
      SELECT e.*, p.marks, p.submitted 
      FROM EVENT e 
      JOIN PARTICIPANT p ON e.id = p.event_id 
      WHERE p.email = $1
    `, [email]);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// ==========================================
// 🚀 API ROUTE: EXECUTE PL/SQL FUNCTION
// ==========================================
app.get('/api/admin/check-enrollments/:studentId', async (req, res) => {
  const { studentId } = req.params;
  try {
    const result = await pool.query(
      'SELECT get_student_enrollment_count($1) AS total_events',
      [studentId]
    );
    res.json({ success: true, count: result.rows[0].total_events });
  } catch (err) {
    console.error("PL/SQL Error:", err.message);
    res.status(500).json({ success: false, message: "Database Error" });
  }
});

// ==========================================
// 🚀 API ROUTE: GET ADMIN DASHBOARD STATS
// ==========================================
app.get('/api/admin/dashboard-stats', async (req, res) => {
  try {
    // Run all count queries concurrently for performance
    const [enrollments, events, judges, recent] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM ENROLLMENT'),
      pool.query('SELECT COUNT(*) FROM EVENT'),
      pool.query('SELECT COUNT(*) FROM JUDGE'),
      pool.query(`
        SELECT s.name AS student_name, ev.name AS event_name 
        FROM ENROLLMENT en
        JOIN STUDENT s ON en.student_id = s.student_id
        JOIN EVENT ev ON en.event_id = ev.id
        ORDER BY en.enrollment_id DESC 
        LIMIT 4
      `)
    ]);

    res.json({
      success: true,
      data: {
        totalRegistrations: enrollments.rows[0].count,
        activeEvents: events.rows[0].count,
        totalJudges: judges.rows[0].count,
        recentActivity: recent.rows
      }
    });
  } catch (err) {
    console.error("Dashboard Stats Error:", err.message);
    res.status(500).json({ success: false, message: "Failed to fetch stats" });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
