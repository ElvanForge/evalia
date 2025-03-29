import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import * as schema from '../shared/schema';

const { Pool } = pg;

// Create a PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create the db instance with the schema
export const db = drizzle(pool, { schema });

// Function to perform migrations (runs once at startup)
export async function runMigrations() {
  console.log('Running migrations...');
  try {
    // Instead of migrations, directly push schema to database
    // Create tables if they don't exist
    const client = await pool.connect();
    try {
      // Create teachers table
      await client.query(`
        CREATE TABLE IF NOT EXISTS teachers (
          id SERIAL PRIMARY KEY,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          username TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          subject TEXT,
          role TEXT DEFAULT 'teacher',
          school_id INTEGER
        );
      `);
      
      // Create schools table
      await client.query(`
        CREATE TABLE IF NOT EXISTS schools (
          id SERIAL PRIMARY KEY,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          name TEXT NOT NULL,
          address TEXT,
          city TEXT,
          state TEXT,
          zip_code TEXT,
          phone_number TEXT
        );
      `);
      
      // Create students table
      await client.query(`
        CREATE TABLE IF NOT EXISTS students (
          id SERIAL PRIMARY KEY,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL,
          email TEXT,
          school_id INTEGER,
          grade_level TEXT
        );
      `);
      
      // Create classes table
      await client.query(`
        CREATE TABLE IF NOT EXISTS classes (
          id SERIAL PRIMARY KEY,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          name TEXT NOT NULL,
          grade_level TEXT,
          description TEXT,
          teacher_id INTEGER NOT NULL
        );
      `);
      
      // Create student_classes table
      await client.query(`
        CREATE TABLE IF NOT EXISTS student_classes (
          student_id INTEGER NOT NULL,
          class_id INTEGER NOT NULL,
          PRIMARY KEY (student_id, class_id)
        );
      `);
      
      // Create assignments table
      await client.query(`
        CREATE TABLE IF NOT EXISTS assignments (
          id SERIAL PRIMARY KEY,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          description TEXT,
          class_id INTEGER NOT NULL,
          max_score DECIMAL NOT NULL,
          weight DECIMAL NOT NULL,
          due_date TIMESTAMP WITH TIME ZONE
        );
      `);
      
      // Create grades table
      await client.query(`
        CREATE TABLE IF NOT EXISTS grades (
          id SERIAL PRIMARY KEY,
          student_id INTEGER NOT NULL,
          assignment_id INTEGER NOT NULL,
          score DECIMAL NOT NULL,
          comments TEXT,
          submitted_at TIMESTAMP WITH TIME ZONE,
          graded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      // Create grade_scales table
      await client.query(`
        CREATE TABLE IF NOT EXISTS grade_scales (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          teacher_id INTEGER NOT NULL,
          is_default BOOLEAN DEFAULT FALSE
        );
      `);
      
      // Create grade_scale_entries table
      await client.query(`
        CREATE TABLE IF NOT EXISTS grade_scale_entries (
          id SERIAL PRIMARY KEY,
          scale_id INTEGER NOT NULL,
          min_score DECIMAL NOT NULL,
          max_score DECIMAL NOT NULL,
          letter TEXT NOT NULL
        );
      `);
      
      // Create quizzes table
      await client.query(`
        CREATE TABLE IF NOT EXISTS quizzes (
          id SERIAL PRIMARY KEY,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          teacher_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          class_id INTEGER,
          is_active BOOLEAN DEFAULT FALSE,
          time_limit INTEGER
        );
      `);
      
      // Create quiz_questions table
      await client.query(`
        CREATE TABLE IF NOT EXISTS quiz_questions (
          id SERIAL PRIMARY KEY,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          quiz_id INTEGER NOT NULL,
          question TEXT NOT NULL,
          type TEXT DEFAULT 'multiple_choice',
          image_url TEXT,
          "order" INTEGER DEFAULT 0
        );
      `);
      
      // Create quiz_options table
      await client.query(`
        CREATE TABLE IF NOT EXISTS quiz_options (
          id SERIAL PRIMARY KEY,
          question_id INTEGER NOT NULL,
          text TEXT NOT NULL,
          "order" INTEGER DEFAULT 0,
          is_correct BOOLEAN DEFAULT FALSE
        );
      `);
      
      // Create quiz_submissions table
      await client.query(`
        CREATE TABLE IF NOT EXISTS quiz_submissions (
          id SERIAL PRIMARY KEY,
          started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          quiz_id INTEGER NOT NULL,
          student_id INTEGER NOT NULL,
          completed_at TIMESTAMP WITH TIME ZONE,
          score DECIMAL(5,2),
          max_score DECIMAL(5,2)
        );
      `);
      
      // Create quiz_answers table
      await client.query(`
        CREATE TABLE IF NOT EXISTS quiz_answers (
          id SERIAL PRIMARY KEY,
          question_id INTEGER NOT NULL,
          submission_id INTEGER NOT NULL,
          is_correct BOOLEAN DEFAULT FALSE,
          selected_option_id INTEGER,
          speaking_answer TEXT,
          teacher_feedback TEXT
        );
      `);
      
      // Create sessions table if it doesn't exist (needed for connect-pg-simple)
      await client.query(`
        CREATE TABLE IF NOT EXISTS "session" (
          "sid" varchar NOT NULL COLLATE "default",
          "sess" json NOT NULL,
          "expire" timestamp(6) NOT NULL,
          CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
        );
      `);
      
      console.log('Schema push completed successfully');
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error running schema push:', error);
    throw error;
  }
}

// Function to initialize the database with initial data (if needed)
export async function initializeDatabase() {
  console.log('Initializing database...');
  // Check if admin user exists using direct SQL query
  const managerResult = await pool.query(`
    SELECT * FROM teachers WHERE role = 'manager' LIMIT 1
  `);
  const existingManager = managerResult.rows.length > 0;

  if (!existingManager) {
    console.log('Creating default manager account...');
    try {
      // Create a default manager account using direct SQL query to match column names
      await pool.query(`
        INSERT INTO teachers (
          username, password, first_name, last_name, email, role, subject
        ) VALUES (
          'john.manager', 
          '$2a$10$wnpllA8H8LPp5aIJ88XYkOdEGDACLAM09/YvtXETZt7.VLCvzIgD2', 
          'John', 
          'Manager', 
          'john.manager@evalia.edu', 
          'manager', 
          NULL
        ) ON CONFLICT (username) DO NOTHING
      `);
      console.log('Default manager account created');
    } catch (error) {
      console.error('Error creating default manager account:', error);
    }
  }

  // Additional initialization as needed
  console.log('Database initialization completed');
}