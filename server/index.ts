import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Import database initialization functions
import { runMigrations, initializeDatabase } from './db';

(async () => {
  // Initialize database before starting the server
  try {
    await runMigrations();
    await initializeDatabase();
    
    // URGENT FIX: Create a simplified admin account with bcrypt
    const bcrypt = await import('bcryptjs');
    const simplePassword = 'evalia123';
    const hashedPassword = await bcrypt.hash(simplePassword, 10);
    
    // Import database connection from db.ts
    const { pool } = await import('./db');
    
    // Force update or create admin account
    await pool.query(`
      INSERT INTO teachers (
        username, password, "firstName", "lastName", email, role
      ) VALUES (
        'admin', 
        $1, 
        'Admin', 
        'User', 
        'admin@evalia.edu', 
        'manager'
      ) ON CONFLICT (username) 
      DO UPDATE SET password = $1
    `, [hashedPassword]);
    
    console.log('IMPORTANT: Admin account created/updated. Username: admin, Password: evalia123');
    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Error setting up database:', error);
  }
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
