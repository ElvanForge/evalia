import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { eq } from 'drizzle-orm';
import pg from 'pg';
import * as schema from '../shared/schema';

const { Pool } = pg;

// Create a PostgreSQL connection pool
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create the db instance with the schema
export const db = drizzle(pool, { schema });

// Function to perform migrations (runs once at startup)
export async function runMigrations() {
  console.log('Running migrations...');
  try {
    // Create session table first using direct SQL
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "session" (
        "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL,
        CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
      );
    `);
    
    // Check if teachers table exists and if so, add new subscription-related columns
    try {
      // Check for existing columns
      const checkResult = await pool.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'teachers' 
        AND column_name = 'stripeCustomerId';
      `);
      
      // Add subscription columns if they don't exist
      if (checkResult.rows.length === 0) {
        console.log('Adding Stripe subscription columns to teachers table...');
        await pool.query(`
          ALTER TABLE teachers 
          ADD COLUMN IF NOT EXISTS "stripeCustomerId" text,
          ADD COLUMN IF NOT EXISTS "stripeSubscriptionId" text,
          ADD COLUMN IF NOT EXISTS "subscriptionPlan" text DEFAULT 'free',
          ADD COLUMN IF NOT EXISTS "subscriptionStatus" text DEFAULT 'inactive',
          ADD COLUMN IF NOT EXISTS "isBetaTester" boolean DEFAULT false;
        `);
        console.log('Added Stripe subscription columns successfully');
      } else {
        console.log('Stripe subscription columns already exist');
      }
    } catch (err) {
      // Table probably doesn't exist yet, which is fine
      console.log('Teachers table not found, will be created during schema push');
    }
    
    // Create lesson plan tables if they don't exist
    try {
      // Create lesson plans table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS "lesson_plans" (
          "id" serial PRIMARY KEY,
          "title" text NOT NULL,
          "description" text,
          "teacherId" integer NOT NULL REFERENCES teachers(id),
          "classId" integer REFERENCES classes(id),
          "subject" text,
          "gradeLevel" text,
          "duration" text,
          "objectives" text[],
          "materials" text[],
          "content" text NOT NULL,
          "status" text DEFAULT 'draft',
          "createdAt" timestamp DEFAULT now() NOT NULL,
          "updatedAt" timestamp DEFAULT now() NOT NULL
        );
      `);
      console.log('Lesson plans table created or already exists');
      
      // Create lesson plan materials table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS "lesson_plan_materials" (
          "id" serial PRIMARY KEY,
          "lessonPlanId" integer NOT NULL REFERENCES lesson_plans(id) ON DELETE CASCADE,
          "fileName" text NOT NULL,
          "fileUrl" text NOT NULL,
          "fileType" text NOT NULL,
          "fileSize" integer NOT NULL,
          "uploadedAt" timestamp DEFAULT now() NOT NULL
        );
      `);
      console.log('Lesson plan materials table created or already exists');
      
      // Create lesson plan generated content table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS "lesson_plan_generated_content" (
          "id" serial PRIMARY KEY,
          "lessonPlanId" integer NOT NULL REFERENCES lesson_plans(id) ON DELETE CASCADE,
          "prompt" text NOT NULL,
          "generatedContent" text NOT NULL,
          "contentType" text NOT NULL,
          "createdAt" timestamp DEFAULT now() NOT NULL,
          "isApplied" boolean DEFAULT false
        );
      `);
      console.log('Lesson plan generated content table created or already exists');
    } catch (err) {
      // Tables or references might not exist yet, which is fine
      console.error('Error creating lesson plan tables:', err);
      console.log('Some lesson plan tables might not be created due to missing references');
    }
    
    console.log('Schema push completed successfully');
  } catch (error) {
    console.error('Error running schema push:', error);
    throw error;
  }
}

// Function to initialize the database with initial data (if needed)
export async function initializeDatabase() {
  console.log('Initializing database...');
  
  try {
    // Check if admin user exists
    const adminResult = await db.select().from(schema.teachers)
      .where(eq(schema.teachers.username, 'admin'))
      .limit(1);
    
    const existingAdmin = adminResult.length > 0;

    // Create admin account for testing and management
    const bcrypt = await import('bcryptjs');
    const adminPassword = 'evalia123';
    const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);
    
    if (!existingAdmin) {
      console.log('Creating default admin account...');
      
      // Create a default admin account using direct SQL
      await pool.query(`
        INSERT INTO teachers (
          username, password, "firstName", "lastName", email, role,
          "subscriptionPlan", "subscriptionStatus", "isBetaTester"
        ) VALUES (
          'admin', 
          $1, 
          'Admin', 
          'User', 
          'admin@evalia.edu', 
          'admin',
          'pro',
          'active',
          true
        ) ON CONFLICT (username) DO NOTHING
      `, [hashedAdminPassword]);
      
      console.log('IMPORTANT: Admin account created/updated. Username: admin, Password: evalia123');
    } else {
      // Update existing admin account if needed
      await pool.query(`
        UPDATE teachers SET 
          password = $1,
          "firstName" = 'Admin',
          "lastName" = 'User',
          email = 'admin@evalia.edu',
          role = 'admin',
          "subscriptionPlan" = 'pro',
          "subscriptionStatus" = 'active',
          "isBetaTester" = true
        WHERE username = 'admin'
      `, [hashedAdminPassword]);
      
      console.log('IMPORTANT: Admin account created/updated. Username: admin, Password: evalia123');
    }
    
    // Check if manager user exists
    const managerResult = await db.select().from(schema.teachers)
      .where(eq(schema.teachers.role, 'manager'))
      .limit(1);
    
    const existingManager = managerResult.length > 0;

    if (!existingManager) {
      console.log('Creating default manager account...');
      
      // Create a default manager account
      const managerPassword = await bcrypt.hash('password123', 10);
      
      await pool.query(`
        INSERT INTO teachers (
          username, password, "firstName", "lastName", email, role,
          "subscriptionPlan", "subscriptionStatus"
        ) VALUES (
          'john.manager', 
          $1, 
          'John', 
          'Manager', 
          'john.manager@evalia.edu', 
          'manager',
          'school',
          'active'
        ) ON CONFLICT (username) DO NOTHING
      `, [managerPassword]);
      
      console.log('Default manager account created');
    }
  } catch (error) {
    console.error('Error initializing database:', error);
  }

  console.log('Database setup completed successfully');
}