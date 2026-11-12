# FestCommand

A college fest management system built for a DBMS course. Students browse and enrol in events, judges score participants, and organizers manage events and publish the top-3 results.

Each role signs in to its own portal, backed by a normalized PostgreSQL schema that includes a stored function and a trigger.

## Features

- **Student portal:** browse events by day and category, enrol, see your enrolments and published results.
- **Judge portal:** see participants for an event and submit scores with feedback.
- **Organizer (admin) portal:** create, edit and delete events, view participants, check a student's enrolments, publish results, and see live dashboard statistics (registrations, events, judges, recent activity).
- **Database rules in SQL:** a PL/pgSQL function counts a student's enrolments, and a trigger rejects scores outside 0 to 100.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js, React, TypeScript, Tailwind CSS, Radix UI |
| Backend | Node.js, Express.js, `pg` (node-postgres) |
| Database | PostgreSQL (PL/pgSQL function and trigger) |

## Database design

11 tables in `database/setup.sql`:

- `USER_ACCOUNT` holds logins for all roles. `Reference_ID` points to a student, judge or council record.
- `STUDENT`, `JUDGE` and `ORGANIZING_COUNCIL` are the people.
- `EVENT` is the parent table. `TECHNICAL_EVENT`, `SPORTS_EVENT` and `CULTURAL_EVENT` are disjoint subtypes.
- `ENROLLMENT` links students to events.
- `SCORE` holds judge marks per enrolment.
- `RESULT` holds the published top-3 rank (rank 1, 2 or 3, one result per enrolment).

## API

The Express server (`backend/server.js`) exposes 18 REST endpoints, including:

| Area | Endpoints |
|---|---|
| Events | `GET/POST /api/events`, `PUT/DELETE /api/events/:id` |
| Enrolment | `POST /api/enroll`, `GET /api/students/:studentId/enrollments` |
| Auth | `POST /api/login`, `POST /api/register` |
| Judging | `GET /api/judge/participants/:eventId`, `POST /api/scores` |
| Results | `POST /api/events/:eventId/publish-results`, `GET /api/students/:studentId/results` |
| Admin | `GET /api/admin/dashboard-stats`, `GET /api/participants` |

## Run it locally

You need Node.js 18+ and PostgreSQL.

**1. Create the database and load the schema**

```bash
createdb festcommand_db
psql -d festcommand_db -f database/setup.sql
```

**2. Configure and start the backend**

Create `backend/.env` (this file is git-ignored):

```
DB_USER=postgres
DB_PASSWORD=your_password_here
DB_HOST=localhost
DB_NAME=festcommand_db
DB_PORT=5432
PORT=5000
```

```bash
cd backend
npm install
npm start
```

**3. Start the frontend**

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000. The frontend calls the API at `http://localhost:5000`.

## Demo accounts

Sample accounts created by `setup.sql` (fake demo data):

| Role | Username | Password |
|---|---|---|
| Organizer | `admin` | `admin123` |
| Judge | `judge1` | `judge123` |

Students register from the login screen.

## Known limitations

This is a course project, so some things are deliberately simple:

- Passwords are stored and compared as **plain text**. A production system should hash them (for example with bcrypt).
- The API has **no authentication or authorization middleware**. The role returned at login decides which portal the frontend shows, but the endpoints themselves are not protected. A real deployment would add sessions or JWTs and check the role on every route.
- The frontend has the API address `http://localhost:5000` written directly in the code, so it only works for local development.

## Author

Trisha Joy Alappat
