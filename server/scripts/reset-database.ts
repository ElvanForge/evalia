/**
 * Database reset script
 * This script drops all tables and recreates the schema
 */
import { pool, db } from '../db';
import { sql } from 'drizzle-orm';
import * as schema from '../../shared/schema';
import * as bcrypt from 'bcryptjs';

async function resetDatabase() {
  console.log('Starting database reset...');
  
  try {
    // Drop all existing tables (in reverse order to avoid foreign key constraints)
    const dropTablesQuery = `
      DROP TABLE IF EXISTS "session" CASCADE;
      DROP TABLE IF EXISTS "quiz_answers" CASCADE;
      DROP TABLE IF EXISTS "quiz_submissions" CASCADE;
      DROP TABLE IF EXISTS "quiz_options" CASCADE;
      DROP TABLE IF EXISTS "quiz_questions" CASCADE;
      DROP TABLE IF EXISTS "quizzes" CASCADE;
      DROP TABLE IF EXISTS "grade_scale_entries" CASCADE;
      DROP TABLE IF EXISTS "grade_scales" CASCADE;
      DROP TABLE IF EXISTS "grades" CASCADE;
      DROP TABLE IF EXISTS "assignments" CASCADE;
      DROP TABLE IF EXISTS "student_classes" CASCADE;
      DROP TABLE IF EXISTS "students" CASCADE;
      DROP TABLE IF EXISTS "classes" CASCADE;
      DROP TABLE IF EXISTS "teachers" CASCADE;
      DROP TABLE IF EXISTS "schools" CASCADE;
    `;
    
    console.log('Dropping all tables...');
    await pool.query(dropTablesQuery);
    console.log('All tables dropped successfully.');
    
    // Create session table
    console.log('Creating session table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "session" (
        "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL,
        CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
      );
    `);
    
    // Create schema tables using schema definitions
    console.log('Creating new tables based on schema definitions...');
    
    // Schools table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "schools" (
        "id" serial PRIMARY KEY,
        "name" text NOT NULL,
        "address" text,
        "city" text,
        "state" text,
        "zipCode" text,
        "phoneNumber" text,
        "createdAt" timestamp DEFAULT now() NOT NULL
      );
    `);
    
    // Teachers table with Stripe fields
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "teachers" (
        "id" serial PRIMARY KEY,
        "username" text NOT NULL UNIQUE,
        "password" text NOT NULL,
        "firstName" text NOT NULL,
        "lastName" text NOT NULL,
        "email" text NOT NULL UNIQUE,
        "subject" text,
        "role" text DEFAULT 'teacher',
        "schoolId" integer REFERENCES "schools"("id"),
        "stripeCustomerId" text,
        "stripeSubscriptionId" text,
        "subscriptionPlan" text DEFAULT 'free',
        "subscriptionStatus" text DEFAULT 'inactive',
        "isBetaTester" boolean DEFAULT false,
        "createdAt" timestamp DEFAULT now() NOT NULL
      );
    `);
    
    // Classes table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "classes" (
        "id" serial PRIMARY KEY,
        "name" text NOT NULL,
        "description" text,
        "gradeLevel" text,
        "teacherId" integer NOT NULL REFERENCES "teachers"("id"),
        "createdAt" timestamp DEFAULT now() NOT NULL
      );
    `);
    
    // Students table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "students" (
        "id" serial PRIMARY KEY,
        "firstName" text NOT NULL,
        "lastName" text,
        "studentNumber" text,
        "email" text,
        "gradeLevel" text,
        "schoolId" integer REFERENCES "schools"("id"),
        "createdAt" timestamp DEFAULT now() NOT NULL
      );
    `);
    
    // Student-Class relationship
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "student_classes" (
        "studentId" integer NOT NULL REFERENCES "students"("id"),
        "classId" integer NOT NULL REFERENCES "classes"("id"),
        PRIMARY KEY ("studentId", "classId")
      );
    `);
    
    // Assignments table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "assignments" (
        "id" serial PRIMARY KEY,
        "name" text NOT NULL,
        "description" text,
        "type" text NOT NULL,
        "maxScore" decimal NOT NULL,
        "weight" decimal NOT NULL,
        "classId" integer NOT NULL REFERENCES "classes"("id"),
        "dueDate" timestamp,
        "createdAt" timestamp DEFAULT now() NOT NULL
      );
    `);
    
    // Grades table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "grades" (
        "id" serial PRIMARY KEY,
        "assignmentId" integer NOT NULL REFERENCES "assignments"("id"),
        "studentId" integer NOT NULL REFERENCES "students"("id"),
        "score" decimal NOT NULL,
        "comments" text,
        "submittedAt" timestamp,
        "gradedAt" timestamp DEFAULT now() NOT NULL
      );
    `);
    
    // GradeScale table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "grade_scales" (
        "id" serial PRIMARY KEY,
        "teacherId" integer NOT NULL REFERENCES "teachers"("id"),
        "name" text NOT NULL,
        "isDefault" boolean DEFAULT false
      );
    `);
    
    // GradeScaleEntries table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "grade_scale_entries" (
        "id" serial PRIMARY KEY,
        "scaleId" integer NOT NULL REFERENCES "grade_scales"("id"),
        "minScore" decimal NOT NULL,
        "maxScore" decimal NOT NULL,
        "letter" text NOT NULL
      );
    `);
    
    // Quizzes table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "quizzes" (
        "id" serial PRIMARY KEY,
        "title" text NOT NULL,
        "description" text,
        "createdAt" timestamp DEFAULT now(),
        "teacherId" integer NOT NULL REFERENCES "teachers"("id"),
        "classId" integer REFERENCES "classes"("id"),
        "isActive" boolean DEFAULT false,
        "timeLimit" integer
      );
    `);
    
    // QuizQuestions table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "quiz_questions" (
        "id" serial PRIMARY KEY,
        "quizId" integer NOT NULL REFERENCES "quizzes"("id"),
        "question" text NOT NULL,
        "imageUrl" text,
        "type" text DEFAULT 'multiple_choice',
        "createdAt" timestamp DEFAULT now(),
        "order" integer DEFAULT 0
      );
    `);
    
    // QuizOptions table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "quiz_options" (
        "id" serial PRIMARY KEY,
        "questionId" integer NOT NULL REFERENCES "quiz_questions"("id"),
        "text" text NOT NULL,
        "isCorrect" boolean DEFAULT false,
        "order" integer DEFAULT 0
      );
    `);
    
    // QuizSubmissions table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "quiz_submissions" (
        "id" serial PRIMARY KEY,
        "quizId" integer NOT NULL REFERENCES "quizzes"("id"),
        "studentId" integer NOT NULL REFERENCES "students"("id"),
        "startedAt" timestamp DEFAULT now(),
        "completedAt" timestamp,
        "score" decimal(5,2),
        "maxScore" decimal(5,2)
      );
    `);
    
    // QuizAnswers table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "quiz_answers" (
        "id" serial PRIMARY KEY,
        "submissionId" integer NOT NULL REFERENCES "quiz_submissions"("id"),
        "questionId" integer NOT NULL REFERENCES "quiz_questions"("id"),
        "selectedOptionId" integer REFERENCES "quiz_options"("id"),
        "isCorrect" boolean DEFAULT false,
        "speakingAnswer" text,
        "teacherFeedback" text
      );
    `);
    
    console.log('All tables created successfully.');
    
    // Create admin user
    console.log('Creating admin user...');
    const adminPassword = await bcrypt.hash('evalia123', 10);
    
    await db.execute(sql`
      INSERT INTO "teachers" (
        "username", "password", "firstName", "lastName", "email", "role",
        "subscriptionPlan", "subscriptionStatus", "isBetaTester"
      ) VALUES (
        'admin', 
        ${adminPassword}, 
        'Admin', 
        'User', 
        'admin@evalia.edu', 
        'admin',
        'pro',
        'active',
        true
      );
    `);
    
    // Create manager user
    console.log('Creating manager user...');
    const managerPassword = await bcrypt.hash('password123', 10);
    
    await db.execute(sql`
      INSERT INTO "teachers" (
        "username", "password", "firstName", "lastName", "email", "role",
        "subscriptionPlan", "subscriptionStatus"
      ) VALUES (
        'john.manager', 
        ${managerPassword}, 
        'John', 
        'Manager', 
        'john.manager@evalia.edu', 
        'manager',
        'school',
        'active'
      );
    `);
    
    console.log('Database reset complete.');
    console.log('Admin credentials: username=admin, password=evalia123');
    console.log('Manager credentials: username=john.manager, password=password123');
    
  } catch (error) {
    console.error('Error resetting database:', error);
  } finally {
    // Close the connection pool
    await pool.end();
  }
}

resetDatabase().then(() => process.exit(0)).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});