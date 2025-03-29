import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { eq } from 'drizzle-orm';
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
    // Create schema using direct SQL instead of migrations
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "session" (
        "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL,
        CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
      );
    `);
    
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
    const managerResult = await db.select().from(schema.teachers)
      .where(eq(schema.teachers.role, 'manager'))
      .limit(1);
    
    const existingManager = managerResult.length > 0;

    if (!existingManager) {
      console.log('Creating default manager account...');
      
      // We'll use bcrypt directly for the manager password for better compatibility
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      // Create a default manager account using direct SQL
      await pool.query(`
        INSERT INTO teachers (
          username, password, "firstName", "lastName", email, role
        ) VALUES (
          'john.manager', 
          $1, 
          'John', 
          'Manager', 
          'john.manager@evalia.edu', 
          'manager'
        ) ON CONFLICT (username) DO NOTHING
      `, [hashedPassword]);
      
      console.log('Default manager account created');
    }
  } catch (error) {
    console.error('Error initializing database:', error);
  }

  // Additional initialization as needed
  console.log('Database initialization completed');
}