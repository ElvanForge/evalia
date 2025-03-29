import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { Teacher } from "@shared/schema";
import { USER_ROLES } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends Teacher {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "evalia-secret-key",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      secure: process.env.NODE_ENV === "production",
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      const teacher = await storage.getTeacherByUsername(username);
      if (!teacher) {
        return done(null, false, { message: "Incorrect username" });
      }
      
      if (process.env.NODE_ENV === "development" && password === teacher.password) {
        // In development, allow direct password comparison for testing accounts
        return done(null, teacher);
      } else {
        // In all other cases, use secure password comparison
        try {
          const isValid = await comparePasswords(password, teacher.password);
          if (!isValid) {
            return done(null, false, { message: "Incorrect password" });
          }
          return done(null, teacher);
        } catch (error) {
          return done(error);
        }
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const teacher = await storage.getTeacher(id);
      done(null, teacher);
    } catch (error) {
      done(error, null);
    }
  });

  app.post("/api/auth/register", async (req, res, next) => {
    try {
      const { username, email } = req.body;
      
      // Check if username or email already exists
      const existingTeacher = await storage.getTeacherByUsername(username);
      if (existingTeacher) {
        return res.status(400).send("Username already exists");
      }

      const existingTeacherByEmail = await storage.getAllTeachers().then(
        teachers => teachers.find(t => t.email === email)
      );
      if (existingTeacherByEmail) {
        return res.status(400).send("Email already exists");
      }

      // Hash the password before storing
      const hashedPassword = await hashPassword(req.body.password);
      
      // Create the teacher with hashed password
      const teacher = await storage.createTeacher({
        ...req.body,
        password: hashedPassword
      });

      // Log the user in
      req.login(teacher, (err) => {
        if (err) return next(err);
        
        // Remove password from response
        const { password: _, ...teacherWithoutPassword } = teacher;
        res.status(201).json(teacherWithoutPassword);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info?.message || "Authentication failed" });
      
      req.login(user, (err) => {
        if (err) return next(err);
        
        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/auth/me", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });

  // Middleware for requiring authentication
  const requireAuth = (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  // Middleware for role-based authorization
  const requireRole = (roles: string[]) => {
    return (req, res, next) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      if (!req.user.role || !roles.includes(req.user.role)) {
        return res.status(403).json({ message: "Insufficient permissions for this action" });
      }
      
      next();
    };
  };

  // Return the authentication and authorization middlewares
  return { requireAuth, requireRole };
}