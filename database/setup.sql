-- ============================================================
-- FestCommand: Consolidated Database Setup Script
-- Includes: DDL (Tables), PL/SQL Stored Function, and Trigger
-- ============================================================


-- ============================================================
-- SECTION 1: TABLE DEFINITIONS (DDL)
-- ============================================================

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS RESULT CASCADE;
DROP TABLE IF EXISTS SCORE CASCADE;
DROP TABLE IF EXISTS ENROLLMENT CASCADE;
DROP TABLE IF EXISTS TECHNICAL_EVENT CASCADE;
DROP TABLE IF EXISTS SPORTS_EVENT CASCADE;
DROP TABLE IF EXISTS CULTURAL_EVENT CASCADE;
DROP TABLE IF EXISTS EVENT CASCADE;
DROP TABLE IF EXISTS STUDENT CASCADE;
DROP TABLE IF EXISTS JUDGE CASCADE;
DROP TABLE IF EXISTS ORGANIZING_COUNCIL CASCADE;
DROP TABLE IF EXISTS USER_ACCOUNT CASCADE;

-- USER_ACCOUNT: Stores login credentials for all roles
CREATE TABLE USER_ACCOUNT (
    User_ID       VARCHAR(50) PRIMARY KEY,
    Username      VARCHAR(100) UNIQUE NOT NULL,
    Password_Hash VARCHAR(255) NOT NULL,
    Role          VARCHAR(50)  NOT NULL CHECK (Role IN ('Student', 'Judge', 'Organizer')),
    Reference_ID  VARCHAR(50)  NOT NULL  -- FK to STUDENT, JUDGE, or ORGANIZING_COUNCIL
);

-- STUDENT: Participant of college fest events
CREATE TABLE STUDENT (
    Student_ID   VARCHAR(50) PRIMARY KEY,
    Name         VARCHAR(255) NOT NULL,
    College_Name VARCHAR(255)
);

-- JUDGE: Evaluator assigned to events
CREATE TABLE JUDGE (
    Judge_ID   VARCHAR(50) PRIMARY KEY,
    Name       VARCHAR(255) NOT NULL,
    Speciality VARCHAR(100)
);

-- ORGANIZING_COUNCIL: Body responsible for running events
CREATE TABLE ORGANIZING_COUNCIL (
    Council_ID VARCHAR(50) PRIMARY KEY,
    Name       VARCHAR(255) NOT NULL,
    Department VARCHAR(100)
);

-- -----------------------------------------------
-- EVENT: Supertype table (Disjoint Subtype Strategy)
-- -----------------------------------------------
CREATE TABLE EVENT (
    ID       VARCHAR(50) PRIMARY KEY,
    Name     VARCHAR(255) NOT NULL,
    Category VARCHAR(50)  NOT NULL CHECK (Category IN ('Tech', 'Sports', 'Cultural')),
    Day      INTEGER      NOT NULL,
    Time     VARCHAR(100) NOT NULL,
    Venue    VARCHAR(255) NOT NULL,
    Status   VARCHAR(50)  DEFAULT 'upcoming'
);

-- TECHNICAL_EVENT: Subtype of EVENT (Category = 'Tech')
CREATE TABLE TECHNICAL_EVENT (
    Event_ID    VARCHAR(50) PRIMARY KEY REFERENCES EVENT(ID) ON DELETE CASCADE,
    Tech_Domain VARCHAR(100),        -- e.g., 'Web Dev', 'AI/ML', 'Cybersecurity'
    Team_Size   INTEGER DEFAULT 1
);

-- SPORTS_EVENT: Subtype of EVENT (Category = 'Sports')
CREATE TABLE SPORTS_EVENT (
    Event_ID   VARCHAR(50) PRIMARY KEY REFERENCES EVENT(ID) ON DELETE CASCADE,
    Sport_Type VARCHAR(100),         -- e.g., 'Football', 'Cricket'
    Format     VARCHAR(50)           -- e.g., 'Knockout', 'League'
);

-- CULTURAL_EVENT: Subtype of EVENT (Category = 'Cultural')
CREATE TABLE CULTURAL_EVENT (
    Event_ID       VARCHAR(50) PRIMARY KEY REFERENCES EVENT(ID) ON DELETE CASCADE,
    Performance_Type VARCHAR(100),   -- e.g., 'Dance', 'Drama', 'Fashion'
    Solo_Or_Group  VARCHAR(20) CHECK (Solo_Or_Group IN ('Solo', 'Group', 'Both'))
);

-- ENROLLMENT: Many-to-many between STUDENT and EVENT
CREATE TABLE ENROLLMENT (
    Enrollment_ID SERIAL PRIMARY KEY,
    Student_ID    VARCHAR(50) NOT NULL REFERENCES STUDENT(Student_ID) ON DELETE CASCADE,
    Event_ID      VARCHAR(50) NOT NULL REFERENCES EVENT(ID) ON DELETE CASCADE,
    Enrolled_At   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (Student_ID, Event_ID)    -- Prevent duplicate enrollments
);

-- SCORE: Marks given by a JUDGE per ENROLLMENT
CREATE TABLE SCORE (
    Score_ID      SERIAL PRIMARY KEY,
    Marks         NUMERIC(5, 2) NOT NULL,   -- Range enforced by trigger below
    Feedback      TEXT,
    Enrollment_ID INTEGER    NOT NULL REFERENCES ENROLLMENT(Enrollment_ID) ON DELETE CASCADE,
    Judge_ID      VARCHAR(50) NOT NULL REFERENCES JUDGE(Judge_ID) ON DELETE CASCADE,
    Scored_At     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RESULT: Final published rank for top performers
CREATE TABLE RESULT (
    Result_ID     SERIAL PRIMARY KEY,
    Rank          INTEGER    NOT NULL CHECK (Rank IN (1, 2, 3)),
    Enrollment_ID INTEGER    UNIQUE NOT NULL REFERENCES ENROLLMENT(Enrollment_ID) ON DELETE CASCADE,
    Council_ID    VARCHAR(50) NOT NULL REFERENCES ORGANIZING_COUNCIL(Council_ID),
    Published_At  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- SECTION 2: SEED DATA
-- ============================================================

INSERT INTO ORGANIZING_COUNCIL (Council_ID, Name, Department)
VALUES ('C01', 'FestCommand Council', 'Student Affairs');

INSERT INTO JUDGE (Judge_ID, Name, Speciality) VALUES
    ('J01', 'Dr. Anika Sharma',   'Technology'),
    ('J02', 'Prof. Rahul Mehta',  'Sports Science'),
    ('J03', 'Ms. Priya Desai',    'Performing Arts');

INSERT INTO USER_ACCOUNT (User_ID, Username, Password_Hash, Role, Reference_ID) VALUES
    ('UA_J01', 'judge1', 'judge123',    'Judge',     'J01'),
    ('UA_J02', 'judge2', 'judge123',    'Judge',     'J02'),
    ('UA_C01', 'admin',  'admin123',    'Organizer', 'C01');

INSERT INTO EVENT (ID, Name, Category, Day, Time, Venue, Status) VALUES
    ('E1', '24hr Hackathon',      'Tech',     1, '09:00 AM', 'Main Lab',      'in-progress'),
    ('E2', 'Futsal Tournament',   'Sports',   1, '10:00 AM', 'College Turf',  'upcoming'),
    ('E3', 'Solo Dance Battle',   'Cultural', 1, '03:00 PM', 'Auditorium',    'upcoming'),
    ('E4', 'Basketball 3v3',      'Sports',   2, '09:00 AM', 'Sports Court',  'upcoming'),
    ('E5', 'UI/UX Sprint',        'Tech',     2, '10:00 AM', 'Lab 2',         'upcoming'),
    ('E6', 'Nukkad Natak',        'Cultural', 2, '04:30 PM', 'Quadrangle',    'upcoming'),
    ('E7', 'Capture The Flag',    'Tech',     3, '09:00 AM', 'Server Room',   'upcoming'),
    ('E8', 'Fashion Show',        'Cultural', 3, '05:00 PM', 'Main Stage',    'upcoming');

-- Subtype records (Disjoint Specialization)
INSERT INTO TECHNICAL_EVENT (Event_ID, Tech_Domain, Team_Size) VALUES
    ('E1', 'Full Stack Dev', 3),
    ('E5', 'UI/UX Design',   2),
    ('E7', 'Cybersecurity',  2);

INSERT INTO SPORTS_EVENT (Event_ID, Sport_Type, Format) VALUES
    ('E2', 'Futsal',      'Knockout'),
    ('E4', 'Basketball',  'Knockout');

INSERT INTO CULTURAL_EVENT (Event_ID, Performance_Type, Solo_Or_Group) VALUES
    ('E3', 'Dance',   'Solo'),
    ('E6', 'Drama',   'Group'),
    ('E8', 'Fashion', 'Group');


-- ============================================================
-- SECTION 3: PL/pgSQL STORED FUNCTION
-- ============================================================
-- Function: get_student_enrollment_count
-- Purpose : Returns the total number of events a student has enrolled in.
-- Usage   : SELECT get_student_enrollment_count('S123456');
-- ============================================================

CREATE OR REPLACE FUNCTION get_student_enrollment_count(p_student_id VARCHAR)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO   v_count
    FROM   ENROLLMENT
    WHERE  Student_ID = p_student_id;

    RETURN v_count;
END;
$$;


-- ============================================================
-- SECTION 4: TRIGGER — Validate Score Range (0–100)
-- ============================================================
-- Trigger Function : validate_score_range
-- Trigger Name     : enforce_valid_score
-- Fires            : BEFORE INSERT OR UPDATE on SCORE table
-- Behaviour        : Raises an exception if marks < 0 OR marks > 100,
--                    preventing the invalid row from being written.
-- ============================================================

CREATE OR REPLACE FUNCTION validate_score_range()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.marks < 0 OR NEW.marks > 100 THEN
        RAISE EXCEPTION
            'Score out of range: % is not a valid score. Marks must be between 0 and 100.',
            NEW.marks;
    END IF;

    RETURN NEW;  -- Allow the INSERT/UPDATE to proceed
END;
$$;

-- Attach the trigger to the SCORE table
DROP TRIGGER IF EXISTS enforce_valid_score ON SCORE;

CREATE TRIGGER enforce_valid_score
    BEFORE INSERT OR UPDATE ON SCORE
    FOR EACH ROW
    EXECUTE FUNCTION validate_score_range();
