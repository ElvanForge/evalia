import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage as dbStorage } from "./storage";
import builder from "xmlbuilder";
import Stripe from "stripe";

// Helper function to convert numerical score to letter grade
function getLetterGrade(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}
import {
  teacherLoginSchema,
  insertTeacherSchema,
  insertClassSchema,
  insertStudentSchema,
  insertAssignmentSchema,
  insertGradeSchema,
  insertGradeScaleSchema,
  insertGradeScaleEntrySchema,
  insertStudentClassSchema,
  insertQuizSchema,
  quizFormSchema,
  insertQuizQuestionSchema,
  insertQuizOptionSchema,
  insertQuizSubmissionSchema,
  insertQuizAnswerSchema,
  insertSchoolSchema,
  USER_ROLES,
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { setupAuth } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication with Passport.js
  const { requireAuth, requireRole } = setupAuth(app);

  // Error handling middleware for Zod validation
  const validateRequest = (schema: any) => {
    return (req: Request, res: Response, next: express.NextFunction) => {
      try {
        schema.parse(req.body);
        next();
      } catch (error) {
        if (error instanceof ZodError) {
          const validationError = fromZodError(error);
          return res.status(400).json({ 
            message: "Validation error", 
            errors: validationError.details 
          });
        }
        next(error);
      }
    };
  };

  // Teacher routes
  app.get("/api/teachers", requireAuth, async (req, res) => {
    try {
      const teachers = await dbStorage.getAllTeachers();
      // Remove passwords from response
      const teachersWithoutPasswords = teachers.map(({ password: _, ...teacher }) => teacher);
      res.status(200).json(teachersWithoutPasswords);
    } catch (error) {
      console.error("Error fetching teachers:", error);
      res.status(500).json({ message: "Server error fetching teachers" });
    }
  });

  // Class routes
  app.get("/api/classes", requireAuth, async (req, res) => {
    try {
      // Fix for NaN issue: Use req.user.id instead of req.session.teacherId
      const teacherId = req.user?.id;
      
      if (!teacherId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const classes = await dbStorage.getClassesByTeacher(teacherId);
      res.status(200).json(classes);
    } catch (error) {
      console.error("Error fetching classes:", error);
      res.status(500).json({ message: "Server error fetching classes" });
    }
  });

  // Custom validation for class creation to avoid teacherId validation issues
  app.post("/api/classes", requireAuth, async (req, res) => {
    try {
      // Manual validation for required fields
      if (!req.body.name || typeof req.body.name !== 'string') {
        return res.status(400).json({
          message: "Validation error",
          errors: [{ code: "invalid_type", path: ["name"], expected: "string", received: typeof req.body.name }]
        });
      }
      
      // Fix for NaN issue: Use req.user.id instead of req.session.teacherId
      const teacherId = req.user?.id;
      
      console.log("Creating class - User:", req.user);
      console.log("Creating class - teacherId:", teacherId);
      console.log("Creating class - req.body:", req.body);
      
      if (!teacherId) {
        console.log("Authentication failed - no teacher ID");
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const dataToCreate = {
        ...req.body,
        teacherId,
        // Handle optional fields with default null values
        description: req.body.description || null,
        gradeLevel: req.body.gradeLevel || null
      };
      
      console.log("Creating class with data:", dataToCreate);
      
      try {
        const newClass = await dbStorage.createClass(dataToCreate);
        console.log("Class created successfully:", newClass);
        res.status(201).json(newClass);
      } catch (dbError: any) {
        console.error("Database error creating class:", dbError);
        res.status(500).json({ message: "Database error creating class", error: dbError?.message || String(dbError) });
      }
    } catch (error) {
      console.error("Error creating class:", error);
      res.status(500).json({ message: "Server error creating class" });
    }
  });

  app.get("/api/classes/:id", requireAuth, async (req, res) => {
    try {
      const classId = Number(req.params.id);
      const class_ = await dbStorage.getClass(classId);
      
      if (!class_) {
        return res.status(404).json({ message: "Class not found" });
      }

      // Fix for NaN issue: Use req.user.id instead of req.session.teacherId
      const teacherId = req.user?.id;
      
      if (!teacherId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      if (class_.teacherId !== teacherId) {
        return res.status(403).json({ message: "Not authorized to view this class" });
      }

      res.status(200).json(class_);
    } catch (error) {
      console.error("Error fetching class:", error);
      res.status(500).json({ message: "Server error fetching class" });
    }
  });

  app.put("/api/classes/:id", requireAuth, validateRequest(insertClassSchema.partial()), async (req, res) => {
    try {
      const classId = Number(req.params.id);
      // Fix for NaN issue: Use req.user.id instead of req.session.teacherId
      const teacherId = req.user?.id;
      
      if (!teacherId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const class_ = await dbStorage.getClass(classId);
      if (!class_) {
        return res.status(404).json({ message: "Class not found" });
      }
      
      if (class_.teacherId !== teacherId) {
        return res.status(403).json({ message: "Not authorized to update this class" });
      }

      const updatedClass = await dbStorage.updateClass(classId, req.body);
      res.status(200).json(updatedClass);
    } catch (error) {
      console.error("Error updating class:", error);
      res.status(500).json({ message: "Server error updating class" });
    }
  });

  app.delete("/api/classes/:id", requireAuth, async (req, res) => {
    try {
      const classId = Number(req.params.id);
      // Fix for NaN issue: Use req.user.id instead of req.session.teacherId
      const teacherId = req.user?.id;
      
      if (!teacherId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const class_ = await dbStorage.getClass(classId);
      if (!class_) {
        return res.status(404).json({ message: "Class not found" });
      }
      
      if (class_.teacherId !== teacherId) {
        return res.status(403).json({ message: "Not authorized to delete this class" });
      }

      await dbStorage.deleteClass(classId);
      res.status(200).json({ message: "Class deleted successfully" });
    } catch (error) {
      console.error("Error deleting class:", error);
      res.status(500).json({ message: "Server error deleting class" });
    }
  });

  // Student routes
  app.get("/api/students", requireAuth, async (req, res) => {
    try {
      const students = await dbStorage.getAllStudents();
      res.status(200).json(students);
    } catch (error) {
      console.error("Error fetching students:", error);
      res.status(500).json({ message: "Server error fetching students" });
    }
  });

  app.post("/api/students", requireAuth, validateRequest(insertStudentSchema), async (req, res) => {
    try {
      // Extract classId from the request if provided
      const { classId, ...studentData } = req.body;
      
      // Create the student
      const newStudent = await dbStorage.createStudent(studentData);
      
      // If a classId is provided, enroll the student in that class
      if (classId) {
        try {
          await dbStorage.enrollStudent({
            studentId: newStudent.id,
            classId: Number(classId)
          });
          console.log(`Enrolled student ${newStudent.id} in class ${classId}`);
        } catch (enrollError) {
          console.error("Error enrolling student:", enrollError);
          // Continue even if enrollment fails, as student was created
        }
      }
      
      res.status(201).json(newStudent);
    } catch (error) {
      console.error("Error creating student:", error);
      res.status(500).json({ message: "Server error creating student" });
    }
  });

  app.get("/api/students/:id", requireAuth, async (req, res) => {
    try {
      const studentId = Number(req.params.id);
      const student = await dbStorage.getStudent(studentId);
      
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      res.status(200).json(student);
    } catch (error) {
      console.error("Error fetching student:", error);
      res.status(500).json({ message: "Server error fetching student" });
    }
  });

  app.put("/api/students/:id", requireAuth, validateRequest(insertStudentSchema.partial()), async (req, res) => {
    try {
      const studentId = Number(req.params.id);
      const student = await dbStorage.getStudent(studentId);
      
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      // Extract classId from request body if present
      const { classId, ...studentData } = req.body;
      
      // Update student basic information
      const updatedStudent = await dbStorage.updateStudent(studentId, studentData);
      
      // If classId is provided, update the student's class enrollment
      if (classId !== undefined) {
        try {
          // Check if student is already enrolled in any classes
          const enrolledClasses = await dbStorage.getEnrollmentsByStudent(studentId);
          
          // If student is already enrolled in the target class, nothing to do
          if (!enrolledClasses.some(enrollment => enrollment.classId === classId)) {
            // Unenroll from all current classes (this is a simplified version - may want to modify this behavior)
            for (const enrollment of enrolledClasses) {
              await dbStorage.unenrollStudent(studentId, enrollment.classId);
            }
            
            // Enroll in the new class if classId is not null
            if (classId !== null) {
              await dbStorage.enrollStudent({
                studentId,
                classId
              });
            }
          }
        } catch (enrollmentError) {
          console.error("Error updating student class assignment:", enrollmentError);
          // Still return the updated student, but with a warning
          return res.status(200).json({
            ...updatedStudent,
            warning: "Student basic info was updated, but class assignment could not be updated"
          });
        }
      }
      
      res.status(200).json(updatedStudent);
    } catch (error) {
      console.error("Error updating student:", error);
      res.status(500).json({ message: "Server error updating student" });
    }
  });

  app.delete("/api/students/:id", requireAuth, async (req, res) => {
    try {
      const studentId = Number(req.params.id);
      const student = await dbStorage.getStudent(studentId);
      
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      await dbStorage.deleteStudent(studentId);
      res.status(200).json({ message: "Student deleted successfully" });
    } catch (error) {
      console.error("Error deleting student:", error);
      res.status(500).json({ message: "Server error deleting student" });
    }
  });

  // Class enrollment routes
  app.post("/api/enrollments", requireAuth, validateRequest(insertStudentClassSchema), async (req, res) => {
    try {
      // Use req.user.id instead of req.session.teacherId
      const teacherId = req.user?.id;
      
      if (!teacherId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const classId = Number(req.body.classId);
      
      // Verify the class belongs to the teacher
      const class_ = await dbStorage.getClass(classId);
      if (!class_ || class_.teacherId !== teacherId) {
        return res.status(403).json({ message: "Not authorized to enroll students in this class" });
      }

      const enrollment = await dbStorage.enrollStudent(req.body);
      res.status(201).json(enrollment);
    } catch (error) {
      console.error("Error enrolling student:", error);
      res.status(500).json({ message: "Server error enrolling student" });
    }
  });

  app.delete("/api/enrollments/:studentId/:classId", requireAuth, async (req, res) => {
    try {
      // Use req.user.id instead of req.session.teacherId
      const teacherId = req.user?.id;
      
      if (!teacherId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const studentId = Number(req.params.studentId);
      const classId = Number(req.params.classId);
      
      // Verify the class belongs to the teacher
      const class_ = await dbStorage.getClass(classId);
      if (!class_ || class_.teacherId !== teacherId) {
        return res.status(403).json({ message: "Not authorized to unenroll students from this class" });
      }

      await dbStorage.unenrollStudent(studentId, classId);
      res.status(200).json({ message: "Student unenrolled successfully" });
    } catch (error) {
      console.error("Error unenrolling student:", error);
      res.status(500).json({ message: "Server error unenrolling student" });
    }
  });

  app.get("/api/classes/:id/students", requireAuth, async (req, res) => {
    try {
      // Use req.user.id instead of req.session.teacherId
      const teacherId = req.user?.id;
      
      if (!teacherId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const classId = Number(req.params.id);
      if (isNaN(classId) || classId <= 0) {
        return res.status(400).json({ message: "Invalid class ID" });
      }
      
      // Verify the class belongs to the teacher
      const class_ = await dbStorage.getClass(classId);
      if (!class_) {
        return res.status(404).json({ message: "Class not found" });
      }
      
      if (class_.teacherId !== teacherId) {
        return res.status(403).json({ message: "Not authorized to view students in this class" });
      }

      // Check student enrollments
      const enrollments = await dbStorage.getEnrollments(classId);
      console.log(`Found ${enrollments.length} student enrollments for class ${classId}`);
      if (enrollments.length === 0) {
        return res.status(200).json([]); // No enrollments, return empty array
      }
      
      // Get students for the class
      const students = await dbStorage.getStudentsByClass(classId);
      console.log(`Retrieved ${students.length} students for class ${classId}`);
      
      // Return the students
      res.status(200).json(students);
    } catch (error) {
      console.error("Error fetching class students:", error);
      res.status(500).json({ message: "Server error fetching class students" });
    }
  });

  // Assignment routes
  app.get("/api/assignments", requireAuth, async (req, res) => {
    try {
      // Fix for NaN issue: Use req.user.id instead of req.session.teacherId
      const teacherId = req.user?.id;
      
      if (!teacherId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const classId = req.query.classId ? Number(req.query.classId) : undefined;
      
      if (classId) {
        // Verify the class belongs to the teacher
        const class_ = await dbStorage.getClass(classId);
        if (!class_ || class_.teacherId !== teacherId) {
          return res.status(403).json({ message: "Not authorized to view assignments for this class" });
        }
        
        const assignments = await dbStorage.getAssignmentsByClass(classId);
        return res.status(200).json(assignments);
      }
      
      // If no classId is provided, return all assignments for all classes belonging to the teacher
      const classes = await dbStorage.getClassesByTeacher(teacherId);
      const classIds = classes.map(c => c.id);
      
      const assignments = [];
      for (const classId of classIds) {
        const classAssignments = await dbStorage.getAssignmentsByClass(classId);
        assignments.push(...classAssignments);
      }
      
      res.status(200).json(assignments);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      res.status(500).json({ message: "Server error fetching assignments" });
    }
  });
  
  // Get recent assignments endpoint for the dashboard
  app.get("/api/assignments/recent", requireAuth, async (req, res) => {
    try {
      const teacherId = req.user?.id;
      
      if (!teacherId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      // Get all assignments for this teacher
      const classes = await dbStorage.getClassesByTeacher(teacherId);
      const classIds = classes.map(c => c.id);
      
      const allAssignments = [];
      for (const classId of classIds) {
        const classAssignments = await dbStorage.getAssignmentsByClass(classId);
        allAssignments.push(...classAssignments);
      }
      
      // Sort by due date, with most recent first
      const recentAssignments = allAssignments
        .sort((a, b) => {
          const dateA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
          const dateB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
          return dateB - dateA;
        })
        .slice(0, 5); // Get only the 5 most recent assignments
      
      res.status(200).json(recentAssignments);
    } catch (error) {
      console.error("Error fetching recent assignments:", error);
      res.status(500).json({ message: "Server error fetching recent assignments" });
    }
  });

  app.post("/api/assignments", requireAuth, validateRequest(insertAssignmentSchema), async (req, res) => {
    try {
      const teacherId = Number(req.session.teacherId);
      const classId = Number(req.body.classId);
      
      // Verify the class belongs to the teacher
      const class_ = await dbStorage.getClass(classId);
      if (!class_ || class_.teacherId !== teacherId) {
        return res.status(403).json({ message: "Not authorized to create assignments for this class" });
      }

      const newAssignment = await dbStorage.createAssignment(req.body);
      res.status(201).json(newAssignment);
    } catch (error) {
      console.error("Error creating assignment:", error);
      res.status(500).json({ message: "Server error creating assignment" });
    }
  });

  app.get("/api/assignments/:id", requireAuth, async (req, res) => {
    try {
      const teacherId = Number(req.session.teacherId);
      const assignmentId = Number(req.params.id);
      
      const assignment = await dbStorage.getAssignment(assignmentId);
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }
      
      // Verify the assignment's class belongs to the teacher
      const class_ = await dbStorage.getClass(assignment.classId);
      if (!class_ || class_.teacherId !== teacherId) {
        return res.status(403).json({ message: "Not authorized to view this assignment" });
      }

      res.status(200).json(assignment);
    } catch (error) {
      console.error("Error fetching assignment:", error);
      res.status(500).json({ message: "Server error fetching assignment" });
    }
  });

  app.put("/api/assignments/:id", requireAuth, validateRequest(insertAssignmentSchema.partial()), async (req, res) => {
    try {
      const teacherId = Number(req.session.teacherId);
      const assignmentId = Number(req.params.id);
      
      const assignment = await dbStorage.getAssignment(assignmentId);
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }
      
      // Verify the assignment's class belongs to the teacher
      const class_ = await dbStorage.getClass(assignment.classId);
      if (!class_ || class_.teacherId !== teacherId) {
        return res.status(403).json({ message: "Not authorized to update this assignment" });
      }

      const updatedAssignment = await dbStorage.updateAssignment(assignmentId, req.body);
      res.status(200).json(updatedAssignment);
    } catch (error) {
      console.error("Error updating assignment:", error);
      res.status(500).json({ message: "Server error updating assignment" });
    }
  });

  app.delete("/api/assignments/:id", requireAuth, async (req, res) => {
    try {
      const teacherId = Number(req.session.teacherId);
      const assignmentId = Number(req.params.id);
      
      const assignment = await dbStorage.getAssignment(assignmentId);
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }
      
      // Verify the assignment's class belongs to the teacher
      const class_ = await dbStorage.getClass(assignment.classId);
      if (!class_ || class_.teacherId !== teacherId) {
        return res.status(403).json({ message: "Not authorized to delete this assignment" });
      }

      await dbStorage.deleteAssignment(assignmentId);
      res.status(200).json({ message: "Assignment deleted successfully" });
    } catch (error) {
      console.error("Error deleting assignment:", error);
      res.status(500).json({ message: "Server error deleting assignment" });
    }
  });

  // Grade routes
  app.get("/api/grades", requireAuth, async (req, res) => {
    try {
      // Fix for NaN issue: Use req.user.id instead of req.session.teacherId
      const teacherId = req.user?.id;
      
      if (!teacherId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const studentId = req.query.studentId ? Number(req.query.studentId) : undefined;
      const assignmentId = req.query.assignmentId ? Number(req.query.assignmentId) : undefined;
      const classId = req.query.classId ? Number(req.query.classId) : undefined;
      
      // If assignmentId is provided, verify the assignment's class belongs to the teacher
      if (assignmentId) {
        const assignment = await dbStorage.getAssignment(assignmentId);
        if (!assignment) {
          return res.status(404).json({ message: "Assignment not found" });
        }
        
        const class_ = await dbStorage.getClass(assignment.classId);
        if (!class_ || class_.teacherId !== teacherId) {
          return res.status(403).json({ message: "Not authorized to view grades for this assignment" });
        }
        
        const grades = await dbStorage.getGradesByAssignment(assignmentId);
        return res.status(200).json(grades);
      }
      
      // If classId and studentId are provided, verify the class belongs to the teacher
      if (classId && studentId) {
        const class_ = await dbStorage.getClass(classId);
        if (!class_ || class_.teacherId !== teacherId) {
          return res.status(403).json({ message: "Not authorized to view grades for this class" });
        }
        
        const grades = await dbStorage.getGradesByStudentAndClass(studentId, classId);
        return res.status(200).json(grades);
      }
      
      // If only studentId is provided, verify the student is in one of the teacher's classes
      if (studentId) {
        const classes = await dbStorage.getClassesByTeacher(teacherId);
        const classIds = classes.map(c => c.id);
        
        const grades = [];
        for (const classId of classIds) {
          const classGrades = await dbStorage.getGradesByStudentAndClass(studentId, classId);
          grades.push(...classGrades);
        }
        
        return res.status(200).json(grades);
      }
      
      // If only classId is provided, verify the class belongs to the teacher
      if (classId) {
        const class_ = await dbStorage.getClass(classId);
        if (!class_ || class_.teacherId !== teacherId) {
          return res.status(403).json({ message: "Not authorized to view grades for this class" });
        }
        
        const assignments = await dbStorage.getAssignmentsByClass(classId);
        const assignmentIds = assignments.map(a => a.id);
        
        const grades = [];
        for (const assignmentId of assignmentIds) {
          const assignmentGrades = await dbStorage.getGradesByAssignment(assignmentId);
          grades.push(...assignmentGrades);
        }
        
        return res.status(200).json(grades);
      }
      
      // If no specific parameters, return recent grades for all classes
      const limit = req.query.limit ? Number(req.query.limit) : 10;
      const offset = req.query.offset ? Number(req.query.offset) : 0;
      
      const recentGrades = await dbStorage.getRecentGrades(limit, offset);
      res.status(200).json(recentGrades);
    } catch (error) {
      console.error("Error fetching grades:", error);
      res.status(500).json({ message: "Server error fetching grades" });
    }
  });

  app.post("/api/grades", requireAuth, validateRequest(insertGradeSchema), async (req, res) => {
    try {
      // Fix for NaN issue: Use req.user.id instead of req.session.teacherId
      const teacherId = req.user?.id;
      
      if (!teacherId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const assignmentId = Number(req.body.assignmentId);
      
      // Verify the assignment's class belongs to the teacher
      const assignment = await dbStorage.getAssignment(assignmentId);
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }
      
      const class_ = await dbStorage.getClass(assignment.classId);
      if (!class_ || class_.teacherId !== teacherId) {
        return res.status(403).json({ message: "Not authorized to create grades for this assignment" });
      }

      const newGrade = await dbStorage.createGrade(req.body);
      res.status(201).json(newGrade);
    } catch (error) {
      console.error("Error creating grade:", error);
      res.status(500).json({ message: "Server error creating grade" });
    }
  });

  app.put("/api/grades/:id", requireAuth, validateRequest(insertGradeSchema.partial()), async (req, res) => {
    try {
      const teacherId = Number(req.session.teacherId);
      const gradeId = Number(req.params.id);
      
      const grade = await dbStorage.getGrade(gradeId);
      if (!grade) {
        return res.status(404).json({ message: "Grade not found" });
      }
      
      // Verify the grade's assignment's class belongs to the teacher
      const assignment = await dbStorage.getAssignment(grade.assignmentId);
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }
      
      const class_ = await dbStorage.getClass(assignment.classId);
      if (!class_ || class_.teacherId !== teacherId) {
        return res.status(403).json({ message: "Not authorized to update this grade" });
      }

      const updatedGrade = await dbStorage.updateGrade(gradeId, req.body);
      res.status(200).json(updatedGrade);
    } catch (error) {
      console.error("Error updating grade:", error);
      res.status(500).json({ message: "Server error updating grade" });
    }
  });

  app.delete("/api/grades/:id", requireAuth, async (req, res) => {
    try {
      const teacherId = Number(req.session.teacherId);
      const gradeId = Number(req.params.id);
      
      const grade = await dbStorage.getGrade(gradeId);
      if (!grade) {
        return res.status(404).json({ message: "Grade not found" });
      }
      
      // Verify the grade's assignment's class belongs to the teacher
      const assignment = await dbStorage.getAssignment(grade.assignmentId);
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }
      
      const class_ = await dbStorage.getClass(assignment.classId);
      if (!class_ || class_.teacherId !== teacherId) {
        return res.status(403).json({ message: "Not authorized to delete this grade" });
      }

      await dbStorage.deleteGrade(gradeId);
      res.status(200).json({ message: "Grade deleted successfully" });
    } catch (error) {
      console.error("Error deleting grade:", error);
      res.status(500).json({ message: "Server error deleting grade" });
    }
  });

  // Grade Scale routes
  app.get("/api/grade-scales", requireAuth, async (req, res) => {
    try {
      const teacherId = Number(req.session.teacherId);
      const gradeScales = await dbStorage.getGradeScalesByTeacher(teacherId);
      res.status(200).json(gradeScales);
    } catch (error) {
      console.error("Error fetching grade scales:", error);
      res.status(500).json({ message: "Server error fetching grade scales" });
    }
  });

  app.post("/api/grade-scales", requireAuth, validateRequest(insertGradeScaleSchema), async (req, res) => {
    try {
      const teacherId = Number(req.session.teacherId);
      const newGradeScale = await dbStorage.createGradeScale({
        ...req.body,
        teacherId
      });
      res.status(201).json(newGradeScale);
    } catch (error) {
      console.error("Error creating grade scale:", error);
      res.status(500).json({ message: "Server error creating grade scale" });
    }
  });

  app.get("/api/grade-scales/:id", requireAuth, async (req, res) => {
    try {
      const teacherId = Number(req.session.teacherId);
      const scaleId = Number(req.params.id);
      
      const gradeScale = await dbStorage.getGradeScale(scaleId);
      if (!gradeScale) {
        return res.status(404).json({ message: "Grade scale not found" });
      }
      
      if (gradeScale.teacherId !== teacherId) {
        return res.status(403).json({ message: "Not authorized to view this grade scale" });
      }

      res.status(200).json(gradeScale);
    } catch (error) {
      console.error("Error fetching grade scale:", error);
      res.status(500).json({ message: "Server error fetching grade scale" });
    }
  });

  app.put("/api/grade-scales/:id", requireAuth, validateRequest(insertGradeScaleSchema.partial()), async (req, res) => {
    try {
      const teacherId = Number(req.session.teacherId);
      const scaleId = Number(req.params.id);
      
      const gradeScale = await dbStorage.getGradeScale(scaleId);
      if (!gradeScale) {
        return res.status(404).json({ message: "Grade scale not found" });
      }
      
      if (gradeScale.teacherId !== teacherId) {
        return res.status(403).json({ message: "Not authorized to update this grade scale" });
      }

      const updatedGradeScale = await dbStorage.updateGradeScale(scaleId, req.body);
      res.status(200).json(updatedGradeScale);
    } catch (error) {
      console.error("Error updating grade scale:", error);
      res.status(500).json({ message: "Server error updating grade scale" });
    }
  });

  app.delete("/api/grade-scales/:id", requireAuth, async (req, res) => {
    try {
      const teacherId = Number(req.session.teacherId);
      const scaleId = Number(req.params.id);
      
      const gradeScale = await dbStorage.getGradeScale(scaleId);
      if (!gradeScale) {
        return res.status(404).json({ message: "Grade scale not found" });
      }
      
      if (gradeScale.teacherId !== teacherId) {
        return res.status(403).json({ message: "Not authorized to delete this grade scale" });
      }

      await dbStorage.deleteGradeScale(scaleId);
      res.status(200).json({ message: "Grade scale deleted successfully" });
    } catch (error) {
      console.error("Error deleting grade scale:", error);
      res.status(500).json({ message: "Server error deleting grade scale" });
    }
  });

  // Grade Scale Entry routes
  app.get("/api/grade-scales/:id/entries", requireAuth, async (req, res) => {
    try {
      const teacherId = Number(req.session.teacherId);
      const scaleId = Number(req.params.id);
      
      const gradeScale = await dbStorage.getGradeScale(scaleId);
      if (!gradeScale) {
        return res.status(404).json({ message: "Grade scale not found" });
      }
      
      if (gradeScale.teacherId !== teacherId) {
        return res.status(403).json({ message: "Not authorized to view entries for this grade scale" });
      }

      const entries = await dbStorage.getGradeScaleEntries(scaleId);
      res.status(200).json(entries);
    } catch (error) {
      console.error("Error fetching grade scale entries:", error);
      res.status(500).json({ message: "Server error fetching grade scale entries" });
    }
  });

  app.post("/api/grade-scale-entries", requireAuth, validateRequest(insertGradeScaleEntrySchema), async (req, res) => {
    try {
      const teacherId = Number(req.session.teacherId);
      const scaleId = Number(req.body.scaleId);
      
      const gradeScale = await dbStorage.getGradeScale(scaleId);
      if (!gradeScale) {
        return res.status(404).json({ message: "Grade scale not found" });
      }
      
      if (gradeScale.teacherId !== teacherId) {
        return res.status(403).json({ message: "Not authorized to create entries for this grade scale" });
      }

      const newEntry = await dbStorage.createGradeScaleEntry(req.body);
      res.status(201).json(newEntry);
    } catch (error) {
      console.error("Error creating grade scale entry:", error);
      res.status(500).json({ message: "Server error creating grade scale entry" });
    }
  });

  app.put("/api/grade-scale-entries/:id", requireAuth, validateRequest(insertGradeScaleEntrySchema.partial()), async (req, res) => {
    try {
      const teacherId = Number(req.session.teacherId);
      const entryId = Number(req.params.id);
      
      const entry = await dbStorage.getGradeScaleEntries(0).then(
        entries => entries.find(e => e.id === entryId)
      );
      
      if (!entry) {
        return res.status(404).json({ message: "Grade scale entry not found" });
      }
      
      const gradeScale = await dbStorage.getGradeScale(entry.scaleId);
      if (!gradeScale || gradeScale.teacherId !== teacherId) {
        return res.status(403).json({ message: "Not authorized to update this grade scale entry" });
      }

      const updatedEntry = await dbStorage.updateGradeScaleEntry(entryId, req.body);
      res.status(200).json(updatedEntry);
    } catch (error) {
      console.error("Error updating grade scale entry:", error);
      res.status(500).json({ message: "Server error updating grade scale entry" });
    }
  });

  app.delete("/api/grade-scale-entries/:id", requireAuth, async (req, res) => {
    try {
      const teacherId = Number(req.session.teacherId);
      const entryId = Number(req.params.id);
      
      const entry = await dbStorage.getGradeScaleEntries(0).then(
        entries => entries.find(e => e.id === entryId)
      );
      
      if (!entry) {
        return res.status(404).json({ message: "Grade scale entry not found" });
      }
      
      const gradeScale = await dbStorage.getGradeScale(entry.scaleId);
      if (!gradeScale || gradeScale.teacherId !== teacherId) {
        return res.status(403).json({ message: "Not authorized to delete this grade scale entry" });
      }

      await dbStorage.deleteGradeScaleEntry(entryId);
      res.status(200).json({ message: "Grade scale entry deleted successfully" });
    } catch (error) {
      console.error("Error deleting grade scale entry:", error);
      res.status(500).json({ message: "Server error deleting grade scale entry" });
    }
  });

  // Dashboard stats route
  app.get("/api/dashboard/stats", requireAuth, async (req, res) => {
    try {
      // Fix for NaN issue: Use req.user.id instead of req.session.teacherId
      const teacherId = req.user?.id;
      
      if (!teacherId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const stats = await dbStorage.getDashboardStats(teacherId);
      res.status(200).json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Server error fetching dashboard stats" });
    }
  });
  
  app.get("/api/dashboard", requireAuth, async (req, res) => {
    try {
      const teacherId = req.user?.id;
      const classId = req.query.classId ? parseInt(req.query.classId as string) : undefined;
      
      if (!teacherId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      // Get main dashboard stats
      const stats = await dbStorage.getDashboardStats(teacherId);
      
      // Get classes with additional information (studentCount, openAssignments, avgGrade)
      const classes = await dbStorage.getClassesByTeacher(teacherId);
      const classCards = await Promise.all(classes.map(async (cls) => {
        const students = await dbStorage.getStudentsByClass(cls.id);
        const assignments = await dbStorage.getAssignmentsByClass(cls.id);
        
        // Calculate average grade if there are grades
        let averageGrade = "N/A";
        if (students.length > 0) {
          let totalGrades = 0;
          let gradeCount = 0;
          
          for (const student of students) {
            const grades = await dbStorage.getGradesByStudentAndClass(student.id, cls.id);
            // Convert string scores to numbers before summing
            totalGrades += grades.reduce((sum, grade) => sum + parseFloat(grade.score), 0);
            gradeCount += grades.length;
          }
          
          if (gradeCount > 0) {
            const avgScore = totalGrades / gradeCount;
            averageGrade = avgScore.toFixed(1) + "%";
          }
        }
        
        return {
          id: cls.id,
          name: cls.name,
          studentCount: students.length,
          openAssignments: assignments.length,
          averageGrade: averageGrade
        };
      }));
      
      // Get recent activities (simplified version)
      const recentActivities = [];
      
      // Get grade distribution (simplified)
      const gradeDistribution = {
        A: 0,
        B: 0,
        C: 0,
        D: 0,
        F: 0
      };
      
      // Format stats for frontend
      const formattedStats = {
        students: { total: stats.totalStudents, change: 0 },
        classes: { total: stats.activeClasses, change: 0 },
        avgGrade: { 
          value: stats.averageGrade ? stats.averageGrade.toFixed(1) : "N/A", 
          letter: getLetterGrade(stats.averageGrade || 0),
          change: 0 
        },
        pendingGrades: { total: stats.openAssignments || 0, dueToday: 0 }
      };
      
      res.status(200).json({
        stats: formattedStats,
        classCards: classCards,
        gradeDistribution: gradeDistribution,
        recentActivities: recentActivities
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      res.status(500).json({ message: "Server error fetching dashboard data" });
    }
  });

  // Quiz routes
  app.get("/api/quizzes", requireAuth, async (req, res) => {
    try {
      // Fix for NaN issue: Use req.user.id instead of req.session.teacherId
      const teacherId = req.user?.id;
      
      if (!teacherId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const classId = req.query.classId ? Number(req.query.classId) : undefined;
      
      let quizzes;
      if (classId) {
        // Verify the class belongs to the teacher
        const class_ = await dbStorage.getClass(classId);
        if (!class_ || class_.teacherId !== teacherId) {
          return res.status(403).json({ message: "Not authorized to view quizzes for this class" });
        }
        quizzes = await dbStorage.getQuizzesByClass(classId);
      } else {
        quizzes = await dbStorage.getQuizzesByTeacher(teacherId);
      }
      
      res.status(200).json(quizzes);
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      res.status(500).json({ message: "Server error fetching quizzes" });
    }
  });

  app.post("/api/quizzes", requireAuth, validateRequest(quizFormSchema), async (req, res) => {
    try {
      // Fix for NaN issue: Use req.user.id instead of req.session.teacherId
      const teacherId = req.user?.id;
      
      if (!teacherId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      // If a classId is provided, verify it belongs to the teacher
      if (req.body.classId) {
        const classId = Number(req.body.classId);
        const class_ = await dbStorage.getClass(classId);
        if (!class_ || class_.teacherId !== teacherId) {
          return res.status(403).json({ message: "Not authorized to create quizzes for this class" });
        }
      }
      
      const newQuiz = await dbStorage.createQuiz({
        ...req.body,
        teacherId
      });
      
      res.status(201).json(newQuiz);
    } catch (error) {
      console.error("Error creating quiz:", error);
      res.status(500).json({ message: "Server error creating quiz" });
    }
  });

  app.get("/api/quizzes/:id", requireAuth, async (req, res) => {
    try {
      // Fix for NaN issue: Use req.user.id instead of req.session.teacherId
      const teacherId = req.user?.id;
      
      if (!teacherId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const quizId = Number(req.params.id);
      
      const quiz = await dbStorage.getQuiz(quizId);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      
      if (quiz.teacherId !== teacherId) {
        return res.status(403).json({ message: "Not authorized to view this quiz" });
      }
      
      res.status(200).json(quiz);
    } catch (error) {
      console.error("Error fetching quiz:", error);
      res.status(500).json({ message: "Server error fetching quiz" });
    }
  });

  app.put("/api/quizzes/:id", requireAuth, validateRequest(quizFormSchema.partial()), async (req, res) => {
    try {
      // Fix for NaN issue: Use req.user.id instead of req.session.teacherId
      const teacherId = req.user?.id;
      
      if (!teacherId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const quizId = Number(req.params.id);
      
      const quiz = await dbStorage.getQuiz(quizId);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      
      if (quiz.teacherId !== teacherId) {
        return res.status(403).json({ message: "Not authorized to update this quiz" });
      }
      
      const updatedQuiz = await dbStorage.updateQuiz(quizId, req.body);
      res.status(200).json(updatedQuiz);
    } catch (error) {
      console.error("Error updating quiz:", error);
      res.status(500).json({ message: "Server error updating quiz" });
    }
  });

  app.delete("/api/quizzes/:id", requireAuth, async (req, res) => {
    try {
      // Fix for NaN issue: Use req.user.id instead of req.session.teacherId
      const teacherId = req.user?.id;
      
      if (!teacherId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const quizId = Number(req.params.id);
      
      const quiz = await dbStorage.getQuiz(quizId);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      
      if (quiz.teacherId !== teacherId) {
        return res.status(403).json({ message: "Not authorized to delete this quiz" });
      }
      
      await dbStorage.deleteQuiz(quizId);
      res.status(200).json({ message: "Quiz deleted successfully" });
    } catch (error) {
      console.error("Error deleting quiz:", error);
      res.status(500).json({ message: "Server error deleting quiz" });
    }
  });

  // Quiz Question routes
  // Helper function to process quiz question image URLs for consistency
  function processQuizImageUrl(question: any): any {
    if (!question || !question.imageUrl) return question;
    
    // Return a new object with processed URL to avoid modifying the original
    const processed = { ...question };
    
    // Ensure image URL is properly formatted
    // If it doesn't start with /uploads, add it
    if (!processed.imageUrl.startsWith('/uploads/')) {
      // Check if it's a filename only or a partial path
      if (processed.imageUrl.includes('/uploads/')) {
        // Extract from uploads/ onward
        const uploadsIndex = processed.imageUrl.indexOf('/uploads/');
        processed.imageUrl = processed.imageUrl.substring(uploadsIndex);
      } else if (processed.imageUrl.includes('/images/')) {
        // If it has /images/ but not /uploads/, add the uploads part
        const imagesIndex = processed.imageUrl.indexOf('/images/');
        processed.imageUrl = '/uploads' + processed.imageUrl.substring(imagesIndex);
      } else {
        // Assume it's just a filename
        processed.imageUrl = `/uploads/images/${processed.imageUrl}`;
      }
    }
    
    console.log(`Processed image URL for question ${processed.id}: ${processed.imageUrl}`);
    return processed;
  }
  
  app.get("/api/quizzes/:quizId/questions", requireAuth, async (req, res) => {
    try {
      // Fix for NaN issue: Use req.user.id instead of req.session.teacherId
      const teacherId = req.user?.id;
      
      if (!teacherId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const quizId = Number(req.params.quizId);
      
      const quiz = await dbStorage.getQuiz(quizId);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      
      if (quiz.teacherId !== teacherId) {
        return res.status(403).json({ message: "Not authorized to view questions for this quiz" });
      }
      
      const questions = await dbStorage.getQuizQuestionsByQuiz(quizId);
      
      // Process image URLs for correct frontend display
      const processedQuestions = questions.map(question => processQuizImageUrl(question));
      
      res.status(200).json(processedQuestions);
    } catch (error) {
      console.error("Error fetching quiz questions:", error);
      res.status(500).json({ message: "Server error fetching quiz questions" });
    }
  });
  
  // Add endpoint to get a single quiz question
  app.get("/api/quiz-questions/:id", requireAuth, async (req, res) => {
    try {
      const teacherId = req.user?.id;
      
      if (!teacherId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const questionId = Number(req.params.id);
      
      const question = await dbStorage.getQuizQuestion(questionId);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }
      
      const quiz = await dbStorage.getQuiz(question.quizId);
      if (!quiz || quiz.teacherId !== teacherId) {
        return res.status(403).json({ message: "Not authorized to view this question" });
      }
      
      // Process image URL for consistency
      const processedQuestion = processQuizImageUrl(question);
      
      res.status(200).json(processedQuestion);
    } catch (error) {
      console.error("Error fetching quiz question:", error);
      res.status(500).json({ message: "Server error fetching quiz question" });
    }
  });

  app.post("/api/quizzes/:quizId/questions", requireAuth, validateRequest(insertQuizQuestionSchema), async (req, res) => {
    try {
      // Fix: Use req.user.id instead of req.session.teacherId
      const teacherId = req.user?.id;
      
      if (!teacherId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const quizId = Number(req.params.quizId);
      
      const quiz = await dbStorage.getQuiz(quizId);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      
      if (quiz.teacherId !== teacherId) {
        return res.status(403).json({ message: "Not authorized to add questions to this quiz" });
      }
      
      const newQuestion = await dbStorage.createQuizQuestion({
        ...req.body,
        quizId
      });
      
      res.status(201).json(newQuestion);
    } catch (error) {
      console.error("Error creating quiz question:", error);
      res.status(500).json({ message: "Server error creating quiz question" });
    }
  });

  app.put("/api/quiz-questions/:id", requireAuth, validateRequest(insertQuizQuestionSchema.partial()), async (req, res) => {
    try {
      // Fix: Use req.user.id instead of req.session.teacherId
      const teacherId = req.user?.id;
      
      if (!teacherId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const questionId = Number(req.params.id);
      
      const question = await dbStorage.getQuizQuestion(questionId);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }
      
      const quiz = await dbStorage.getQuiz(question.quizId);
      if (!quiz || quiz.teacherId !== teacherId) {
        return res.status(403).json({ message: "Not authorized to update this question" });
      }
      
      const updatedQuestion = await dbStorage.updateQuizQuestion(questionId, req.body);
      res.status(200).json(updatedQuestion);
    } catch (error) {
      console.error("Error updating quiz question:", error);
      res.status(500).json({ message: "Server error updating quiz question" });
    }
  });

  app.delete("/api/quiz-questions/:id", requireAuth, async (req, res) => {
    try {
      // Fix: Use req.user.id instead of req.session.teacherId
      const teacherId = req.user?.id;
      
      if (!teacherId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const questionId = Number(req.params.id);
      
      const question = await dbStorage.getQuizQuestion(questionId);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }
      
      const quiz = await dbStorage.getQuiz(question.quizId);
      if (!quiz || quiz.teacherId !== teacherId) {
        return res.status(403).json({ message: "Not authorized to delete this question" });
      }
      
      await dbStorage.deleteQuizQuestion(questionId);
      res.status(200).json({ message: "Question deleted successfully" });
    } catch (error) {
      console.error("Error deleting quiz question:", error);
      res.status(500).json({ message: "Server error deleting quiz question" });
    }
  });

  // Quiz Option routes - Update to use req.user.id and also add a new route format for frontend compatibility
  app.get("/api/quiz-questions/:questionId/options", requireAuth, async (req, res) => {
    try {
      // Fix for NaN issue: Use req.user.id instead of req.session.teacherId
      const teacherId = req.user?.id;
      
      if (!teacherId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const questionId = Number(req.params.questionId);
      
      const question = await dbStorage.getQuizQuestion(questionId);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }
      
      const quiz = await dbStorage.getQuiz(question.quizId);
      if (!quiz || quiz.teacherId !== teacherId) {
        return res.status(403).json({ message: "Not authorized to view options for this question" });
      }
      
      const options = await dbStorage.getQuizOptionsByQuestion(questionId);
      res.status(200).json(options);
    } catch (error) {
      console.error("Error fetching quiz options:", error);
      res.status(500).json({ message: "Server error fetching quiz options" });
    }
  });

  // Additional route for frontend compatibility
  app.get("/api/quizzes/:quizId/options", requireAuth, async (req, res) => {
    try {
      const teacherId = req.user?.id;
      
      if (!teacherId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const quizId = Number(req.params.quizId);
      console.log(`Fetching all options for quiz ${quizId} by teacher ${teacherId}`);
      
      const quiz = await dbStorage.getQuiz(quizId);
      if (!quiz) {
        console.log(`Quiz ${quizId} not found`);
        return res.status(404).json({ message: "Quiz not found" });
      }
      
      if (quiz.teacherId !== teacherId) {
        console.log(`Teacher ${teacherId} not authorized for quiz ${quizId} (owned by ${quiz.teacherId})`);
        return res.status(403).json({ message: "Not authorized to view options for this quiz" });
      }
      
      // Get all questions for this quiz
      const questions = await dbStorage.getQuizQuestionsByQuiz(quizId);
      console.log(`Found ${questions.length} questions for quiz ${quizId}`);
      
      // For each question, get the options and organize by question ID
      const optionsByQuestion: Record<string, any[]> = {};
      for (const question of questions) {
        console.log(`Fetching options for question ${question.id}`);
        const questionOptions = await dbStorage.getQuizOptionsByQuestion(question.id);
        console.log(`Found ${questionOptions.length} options for question ${question.id}`);
        optionsByQuestion[question.id] = questionOptions;
      }
      
      console.log(`Returning options by question:`, optionsByQuestion);
      res.status(200).json(optionsByQuestion);
    } catch (error) {
      console.error("Error fetching quiz options:", error);
      res.status(500).json({ message: "Server error fetching quiz options" });
    }
  });

  app.post("/api/quiz-questions/:questionId/options", requireAuth, validateRequest(insertQuizOptionSchema), async (req, res) => {
    try {
      // Fix: Use req.user.id instead of req.session.teacherId
      const teacherId = req.user?.id;
      
      if (!teacherId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const questionId = Number(req.params.questionId);
      
      const question = await dbStorage.getQuizQuestion(questionId);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }
      
      const quiz = await dbStorage.getQuiz(question.quizId);
      if (!quiz || quiz.teacherId !== teacherId) {
        return res.status(403).json({ message: "Not authorized to add options to this question" });
      }
      
      const newOption = await dbStorage.createQuizOption({
        ...req.body,
        questionId
      });
      
      res.status(201).json(newOption);
    } catch (error) {
      console.error("Error creating quiz option:", error);
      res.status(500).json({ message: "Server error creating quiz option" });
    }
  });

  app.put("/api/quiz-options/:id", requireAuth, validateRequest(insertQuizOptionSchema.partial()), async (req, res) => {
    try {
      // Fix: Use req.user.id instead of req.session.teacherId
      const teacherId = req.user?.id;
      
      if (!teacherId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const optionId = Number(req.params.id);
      
      const option = await dbStorage.getQuizOption(optionId);
      if (!option) {
        return res.status(404).json({ message: "Option not found" });
      }
      
      const question = await dbStorage.getQuizQuestion(option.questionId);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }
      
      const quiz = await dbStorage.getQuiz(question.quizId);
      if (!quiz || quiz.teacherId !== teacherId) {
        return res.status(403).json({ message: "Not authorized to update this option" });
      }
      
      const updatedOption = await dbStorage.updateQuizOption(optionId, req.body);
      res.status(200).json(updatedOption);
    } catch (error) {
      console.error("Error updating quiz option:", error);
      res.status(500).json({ message: "Server error updating quiz option" });
    }
  });

  app.delete("/api/quiz-options/:id", requireAuth, async (req, res) => {
    try {
      // Fix: Use req.user.id instead of req.session.teacherId
      const teacherId = req.user?.id;
      
      if (!teacherId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const optionId = Number(req.params.id);
      console.log(`Deleting quiz option ${optionId} by teacher ${teacherId}`);
      
      const option = await dbStorage.getQuizOption(optionId);
      if (!option) {
        console.log(`Option ${optionId} not found`);
        return res.status(404).json({ message: "Option not found" });
      }
      
      const question = await dbStorage.getQuizQuestion(option.questionId);
      if (!question) {
        console.log(`Question ${option.questionId} not found for option ${optionId}`);
        return res.status(404).json({ message: "Question not found" });
      }
      
      const quiz = await dbStorage.getQuiz(question.quizId);
      if (!quiz) {
        console.log(`Quiz ${question.quizId} not found for question ${question.id}`);
        return res.status(404).json({ message: "Quiz not found" });
      }
      
      if (quiz.teacherId !== teacherId) {
        console.log(`Teacher ${teacherId} not authorized to delete option ${optionId} (quiz belongs to teacher ${quiz.teacherId})`);
        return res.status(403).json({ message: "Not authorized to delete this option" });
      }
      
      console.log(`Deleting option ${optionId} from database`);
      await dbStorage.deleteQuizOption(optionId);
      console.log(`Option ${optionId} deleted successfully`);
      
      res.status(200).json({ message: "Option deleted successfully" });
    } catch (error) {
      console.error("Error deleting quiz option:", error);
      res.status(500).json({ message: "Server error deleting quiz option" });
    }
  });

  // Quiz Submission routes
  app.get("/api/quizzes/:quizId/submissions", requireAuth, async (req, res) => {
    try {
      const teacherId = Number(req.session.teacherId);
      const quizId = Number(req.params.quizId);
      
      const quiz = await dbStorage.getQuiz(quizId);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      
      if (quiz.teacherId !== teacherId) {
        return res.status(403).json({ message: "Not authorized to view submissions for this quiz" });
      }
      
      const submissions = await dbStorage.getQuizSubmissionsByQuiz(quizId);
      res.status(200).json(submissions);
    } catch (error) {
      console.error("Error fetching quiz submissions:", error);
      res.status(500).json({ message: "Server error fetching quiz submissions" });
    }
  });

  app.post("/api/quizzes/:quizId/submissions", validateRequest(insertQuizSubmissionSchema), async (req, res) => {
    // This endpoint is public, students can submit quizzes
    try {
      const quizId = Number(req.params.quizId);
      const studentId = Number(req.body.studentId);
      
      const quiz = await dbStorage.getQuiz(quizId);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      
      // Check if the quiz is active
      if (!quiz.isActive) {
        return res.status(403).json({ message: "This quiz is not currently active" });
      }
      
      // Create the submission
      const newSubmission = await dbStorage.createQuizSubmission({
        quizId,
        studentId,
        startedAt: new Date()
      });
      
      res.status(201).json(newSubmission);
    } catch (error) {
      console.error("Error creating quiz submission:", error);
      res.status(500).json({ message: "Server error creating quiz submission" });
    }
  });

  app.put("/api/quiz-submissions/:id", validateRequest(insertQuizSubmissionSchema.partial()), async (req, res) => {
    // This endpoint is public too, for student to complete their submission
    try {
      const submissionId = Number(req.params.id);
      
      const submission = await dbStorage.getQuizSubmission(submissionId);
      if (!submission) {
        return res.status(404).json({ message: "Submission not found" });
      }
      
      // Only allow updating the submission if it's not completed yet
      if (submission.completedAt) {
        return res.status(403).json({ message: "This submission is already completed" });
      }
      
      const updatedSubmission = await dbStorage.updateQuizSubmission(submissionId, {
        ...req.body,
        completedAt: new Date() // Set completion time
      });
      
      res.status(200).json(updatedSubmission);
    } catch (error) {
      console.error("Error updating quiz submission:", error);
      res.status(500).json({ message: "Server error updating quiz submission" });
    }
  });

  // Quiz Answer routes
  app.post("/api/quiz-submissions/:submissionId/answers", validateRequest(insertQuizAnswerSchema), async (req, res) => {
    // This endpoint is public, for students to submit their answers
    try {
      const submissionId = Number(req.params.submissionId);
      
      const submission = await dbStorage.getQuizSubmission(submissionId);
      if (!submission) {
        return res.status(404).json({ message: "Submission not found" });
      }
      
      // Only allow adding answers if the submission is not completed yet
      if (submission.completedAt) {
        return res.status(403).json({ message: "This submission is already completed" });
      }
      
      const questionId = Number(req.body.questionId);
      const question = await dbStorage.getQuizQuestion(questionId);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }
      
      // For multiple choice questions, check if the answer is correct
      let isCorrect = false;
      if (req.body.selectedOptionId) {
        const option = await dbStorage.getQuizOption(Number(req.body.selectedOptionId));
        if (option && option.isCorrect) {
          isCorrect = true;
        }
      }
      
      const newAnswer = await dbStorage.createQuizAnswer({
        ...req.body,
        submissionId,
        isCorrect
      });
      
      res.status(201).json(newAnswer);
    } catch (error) {
      console.error("Error creating quiz answer:", error);
      res.status(500).json({ message: "Server error creating quiz answer" });
    }
  });

  app.get("/api/quiz-submissions/:submissionId/answers", async (req, res) => {
    // This endpoint can be used by both students and teachers
    try {
      const submissionId = Number(req.params.submissionId);
      
      const submission = await dbStorage.getQuizSubmission(submissionId);
      if (!submission) {
        return res.status(404).json({ message: "Submission not found" });
      }
      
      // If a teacher is requesting, check authorization
      if (req.session.teacherId) {
        const teacherId = Number(req.session.teacherId);
        const quiz = await dbStorage.getQuiz(submission.quizId);
        
        if (quiz && quiz.teacherId !== teacherId) {
          return res.status(403).json({ message: "Not authorized to view answers for this submission" });
        }
      }
      
      const answers = await dbStorage.getQuizAnswersBySubmission(submissionId);
      res.status(200).json(answers);
    } catch (error) {
      console.error("Error fetching quiz answers:", error);
      res.status(500).json({ message: "Server error fetching quiz answers" });
    }
  });

  app.put("/api/quiz-answers/:id", requireAuth, validateRequest(insertQuizAnswerSchema.partial()), async (req, res) => {
    // This endpoint is for teachers to grade speaking answers
    try {
      const teacherId = Number(req.session.teacherId);
      const answerId = Number(req.params.id);
      
      const answer = await dbStorage.getQuizAnswer(answerId);
      if (!answer) {
        return res.status(404).json({ message: "Answer not found" });
      }
      
      const submission = await dbStorage.getQuizSubmission(answer.submissionId);
      if (!submission) {
        return res.status(404).json({ message: "Submission not found" });
      }
      
      const quiz = await dbStorage.getQuiz(submission.quizId);
      if (!quiz || quiz.teacherId !== teacherId) {
        return res.status(403).json({ message: "Not authorized to update this answer" });
      }
      
      const updatedAnswer = await dbStorage.updateQuizAnswer(answerId, req.body);
      res.status(200).json(updatedAnswer);
    } catch (error) {
      console.error("Error updating quiz answer:", error);
      res.status(500).json({ message: "Server error updating quiz answer" });
    }
  });

  // Configure multer for file upload
  const uploadDir = './uploads/images';
  
  // Ensure upload directory exists
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('Created upload directory:', path.resolve(uploadDir));
  } else {
    console.log('Upload directory exists:', path.resolve(uploadDir));
    // Make sure directory permissions are correct
    fs.chmodSync(uploadDir, 0o777);
  }
  
  const multerStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      console.log('Setting destination for uploaded file:', path.resolve(uploadDir));
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const fileExt = path.extname(file.originalname);
      const filename = 'image-' + uniqueSuffix + fileExt;
      console.log('Generated filename for upload:', filename);
      cb(null, filename);
    }
  });
  
  const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Accept only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  };
  
  const upload = multer({ 
    storage: multerStorage,
    fileFilter: fileFilter,
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB max file size
    }
  });
  
  // Image upload endpoint for quiz questions
  app.post('/api/upload/image', upload.single('image'), (req, res) => {
    console.log('============= IMAGE UPLOAD REQUEST RECEIVED =============');
    try {
      if (!req.file) {
        console.log('No file found in request');
        console.log('Request body:', req.body);
        console.log('Request content type:', req.headers['content-type']);
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      // Log detailed file information
      console.log('File uploaded successfully:', {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        destination: req.file.destination
      });
      
      // Double-check file exists on disk
      const filePath = path.join(uploadDir, req.file.filename);
      if (!fs.existsSync(filePath)) {
        console.error('File does not exist at expected path:', filePath);
        return res.status(500).json({ message: 'File upload failed: file not saved to disk' });
      }
      
      // Create a nice absolute URL path
      const imageUrl = `/uploads/images/${req.file.filename}`;
      
      console.log('Image URL to be returned:', imageUrl);
      console.log('Full file path on disk:', path.resolve(filePath));
      
      // Ensure upload directory and file have correct permissions
      try {
        // Make sure upload directory is readable and executable
        fs.chmodSync(uploadDir, 0o755);
        // Make sure the file is readable by all
        fs.chmodSync(filePath, 0o644);
        console.log('Updated permissions for upload directory and file');
      } catch (permError) {
        console.error('Error setting permissions:', permError);
      }
      
      // Verify file is readable
      try {
        const fileStats = fs.statSync(filePath);
        console.log('File stats:', {
          size: fileStats.size,
          permissions: fileStats.mode.toString(8),
          created: fileStats.birthtime,
          modified: fileStats.mtime
        });
        
        // Read a few bytes to confirm file can be read
        const fd = fs.openSync(filePath, 'r');
        const buffer = Buffer.alloc(Math.min(fileStats.size, 32)); // Read up to 32 bytes
        fs.readSync(fd, buffer, 0, buffer.length, 0);
        fs.closeSync(fd);
        console.log('File is readable, first bytes:', buffer.toString('hex').substring(0, 50));
        
        // For image files, log the mime type
        if (req.file.mimetype.startsWith('image/')) {
          console.log('Image mime type:', req.file.mimetype);
        }
      } catch (readError) {
        console.error('Error reading uploaded file:', readError);
      }
      
      // Test if the image is accessible via the URL
      const testUrl = `http://localhost:5000${imageUrl}`;
      console.log('Image should be accessible at:', testUrl);
      
      // Return success response with the URL
      console.log('Returning image URL to client:', imageUrl);
      res.status(200).json({ 
        message: 'File uploaded successfully',
        imageUrl: imageUrl
      });
      
      console.log('============= IMAGE UPLOAD COMPLETED =============');
    } catch (error) {
      console.error('Error uploading file:', error);
      res.status(500).json({ message: 'Failed to upload file' });
    }
  });
  
  // Static file serving from uploads directory
  app.use('/uploads', (req, res, next) => {
    console.log('============ STATIC FILE REQUEST ============');
    console.log('Uploads static file request received for:', req.url);
    
    // Check if file exists before serving
    const filePath = path.join('./uploads', req.url);
    if (fs.existsSync(filePath)) {
      console.log('File exists at path:', filePath);
      
      // Ensure file has correct permissions
      try {
        // Make sure the file is readable by all
        fs.chmodSync(filePath, 0o644);
        
        // Log file stats for debugging
        const stats = fs.statSync(filePath);
        console.log('File stats:', {
          size: stats.size,
          permissions: stats.mode.toString(8),
          created: stats.birthtime,
          modified: stats.mtime
        });
      } catch (error) {
        console.error('Error updating file permissions:', error);
      }
      
      // Get file mime type
      let contentType = 'application/octet-stream'; // default
      const ext = path.extname(filePath).toLowerCase();
      
      if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
      else if (ext === '.png') contentType = 'image/png';
      else if (ext === '.gif') contentType = 'image/gif';
      else if (ext === '.svg') contentType = 'image/svg+xml';
      
      console.log('Setting Content-Type:', contentType);
      
      // For debugging only - this won't run for most requests as express.static will handle them
      res.setHeader('Content-Type', contentType);
      
      // Try to serve the file directly (for debugging only)
      if (req.query.direct === '1') {
        console.log('Serving file directly (bypass express.static)');
        try {
          const fileContent = fs.readFileSync(filePath);
          res.setHeader('Content-Length', stats.size);
          res.status(200).end(fileContent);
          return; // Skip remaining middleware
        } catch (readError) {
          console.error('Error reading file for direct serving:', readError);
          // Continue to next middleware
        }
      }
    } else {
      console.log('File does not exist at path:', filePath);
      // Log the list of files in the uploads/images directory to debug
      try {
        const uploadsDir = './uploads/images';
        if (fs.existsSync(uploadsDir)) {
          const files = fs.readdirSync(uploadsDir);
          console.log('Files in uploads directory:', files);
        } else {
          console.log('Uploads directory does not exist');
        }
      } catch (error) {
        console.error('Error listing files in uploads directory:', error);
      }
    }
    
    console.log('Continuing to express.static middleware');
    next();
  }, express.static('uploads', {
    setHeaders: (res, filePath) => {
      // Set explicit cache control to prevent caching issues
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      // Log the headers we're setting
      console.log(`Setting headers for ${filePath}`);
      console.log('============ STATIC FILE SERVED ============');
    }
  }));
  
  // School routes
  app.get('/api/schools', requireAuth, async (req, res) => {
    try {
      const schools = await dbStorage.getAllSchools();
      res.status(200).json(schools);
    } catch (error) {
      console.error("Error fetching schools:", error);
      res.status(500).json({ message: "Server error fetching schools" });
    }
  });
  
  app.post('/api/schools', requireAuth, requireRole([USER_ROLES.MANAGER, USER_ROLES.ADMIN]), validateRequest(insertSchoolSchema), async (req, res) => {
    try {
      const newSchool = await dbStorage.createSchool(req.body);
      res.status(201).json(newSchool);
    } catch (error) {
      console.error("Error creating school:", error);
      res.status(500).json({ message: "Server error creating school" });
    }
  });
  
  app.get('/api/schools/:id', requireAuth, async (req, res) => {
    try {
      const schoolId = Number(req.params.id);
      const school = await dbStorage.getSchool(schoolId);
      
      if (!school) {
        return res.status(404).json({ message: "School not found" });
      }
      
      res.status(200).json(school);
    } catch (error) {
      console.error("Error fetching school:", error);
      res.status(500).json({ message: "Server error fetching school" });
    }
  });
  
  app.put('/api/schools/:id', requireAuth, requireRole([USER_ROLES.MANAGER, USER_ROLES.ADMIN]), validateRequest(insertSchoolSchema.partial()), async (req, res) => {
    try {
      const schoolId = Number(req.params.id);
      const school = await dbStorage.getSchool(schoolId);
      
      if (!school) {
        return res.status(404).json({ message: "School not found" });
      }
      
      const updatedSchool = await dbStorage.updateSchool(schoolId, req.body);
      res.status(200).json(updatedSchool);
    } catch (error) {
      console.error("Error updating school:", error);
      res.status(500).json({ message: "Server error updating school" });
    }
  });
  
  app.delete('/api/schools/:id', requireAuth, requireRole([USER_ROLES.ADMIN]), async (req, res) => {
    try {
      const schoolId = Number(req.params.id);
      const school = await dbStorage.getSchool(schoolId);
      
      if (!school) {
        return res.status(404).json({ message: "School not found" });
      }
      
      await dbStorage.deleteSchool(schoolId);
      res.status(200).json({ message: "School deleted successfully" });
    } catch (error) {
      console.error("Error deleting school:", error);
      res.status(500).json({ message: "Server error deleting school" });
    }
  });
  
  // School data for managers
  app.get('/api/schools/:id/teachers', requireAuth, requireRole([USER_ROLES.MANAGER, USER_ROLES.ADMIN]), async (req, res) => {
    try {
      const schoolId = Number(req.params.id);
      const teachers = await dbStorage.getTeachersBySchool(schoolId);
      // Remove passwords from response
      const teachersWithoutPasswords = teachers.map(({ password: _, ...teacher }) => teacher);
      res.status(200).json(teachersWithoutPasswords);
    } catch (error) {
      console.error("Error fetching school teachers:", error);
      res.status(500).json({ message: "Server error fetching school teachers" });
    }
  });
  
  app.get('/api/schools/:id/students', requireAuth, requireRole([USER_ROLES.MANAGER, USER_ROLES.ADMIN]), async (req, res) => {
    try {
      const schoolId = Number(req.params.id);
      const students = await dbStorage.getStudentsBySchool(schoolId);
      res.status(200).json(students);
    } catch (error) {
      console.error("Error fetching school students:", error);
      res.status(500).json({ message: "Server error fetching school students" });
    }
  });
  
  // Manager endpoints to review teacher content
  app.get('/api/schools/:id/quizzes', requireAuth, requireRole([USER_ROLES.MANAGER, USER_ROLES.ADMIN]), async (req, res) => {
    try {
      const schoolId = Number(req.params.id);
      
      // Get all teachers in this school
      const teachers = await dbStorage.getTeachersBySchool(schoolId);
      const teacherIds = teachers.map(teacher => teacher.id);
      
      // Get all quizzes by those teachers
      const allQuizzes = [];
      for (const teacherId of teacherIds) {
        const quizzes = await dbStorage.getQuizzesByTeacher(teacherId);
        const quizzesWithTeacher = await Promise.all(quizzes.map(async quiz => {
          const teacher = await dbStorage.getTeacher(quiz.teacherId);
          const class_ = quiz.classId ? await dbStorage.getClass(quiz.classId) : null;
          return {
            ...quiz,
            teacherName: teacher ? `${teacher.firstName} ${teacher.lastName}` : "Unknown",
            className: class_ ? class_.name : "Not assigned to class"
          };
        }));
        allQuizzes.push(...quizzesWithTeacher);
      }
      
      res.status(200).json(allQuizzes);
    } catch (error) {
      console.error("Error fetching school quizzes:", error);
      res.status(500).json({ message: "Server error fetching school quizzes" });
    }
  });
  
  app.get('/api/schools/:id/all-grades', requireAuth, requireRole([USER_ROLES.MANAGER, USER_ROLES.ADMIN]), async (req, res) => {
    try {
      const schoolId = Number(req.params.id);
      
      // Get all students in this school
      const students = await dbStorage.getStudentsBySchool(schoolId);
      
      // Get all grades for these students
      const allGradeData = [];
      for (const student of students) {
        const grades = await dbStorage.getGradesByStudent(student.id);
        const gradesWithDetails = await Promise.all(grades.map(async grade => {
          const assignment = await dbStorage.getAssignment(grade.assignmentId);
          const class_ = assignment ? await dbStorage.getClass(assignment.classId) : null;
          const teacher = class_ ? await dbStorage.getTeacher(class_.teacherId) : null;
          
          return {
            ...grade,
            assignmentName: assignment ? assignment.name : "Unknown Assignment",
            assignmentType: assignment ? assignment.type : "Unknown",
            className: class_ ? class_.name : "Unknown Class",
            teacherName: teacher ? `${teacher.firstName} ${teacher.lastName}` : "Unknown Teacher",
            studentName: `${student.firstName} ${student.lastName}`
          };
        }));
        
        allGradeData.push(...gradesWithDetails);
      }
      
      res.status(200).json(allGradeData);
    } catch (error) {
      console.error("Error fetching school grades:", error);
      res.status(500).json({ message: "Server error fetching school grades" });
    }
  });
  
  // XML Export of all grades in a school for managers
  app.post('/api/export/school-grades', requireAuth, requireRole([USER_ROLES.MANAGER, USER_ROLES.ADMIN]), async (req, res) => {
    try {
      const { schoolId, format } = req.body;
      
      // Get the school
      const school = await dbStorage.getSchool(schoolId);
      if (!school) {
        return res.status(404).json({ message: "School not found" });
      }
      
      // Get all students in this school
      const students = await dbStorage.getStudentsBySchool(schoolId);
      
      // Create a map to group grades by class and student
      const classesByIdMap = new Map();
      const studentGradesByClassMap = new Map();
      
      // Process all students' grades
      for (const student of students) {
        const grades = await dbStorage.getGradesByStudent(student.id);
        
        // Group by class
        for (const grade of grades) {
          const assignment = await dbStorage.getAssignment(grade.assignmentId);
          if (!assignment) continue;
          
          const classId = assignment.classId;
          
          // Store class info
          if (!classesByIdMap.has(classId)) {
            const class_ = await dbStorage.getClass(classId);
            if (class_) {
              classesByIdMap.set(classId, class_);
            }
          }
          
          // Store grade with student info
          if (!studentGradesByClassMap.has(classId)) {
            studentGradesByClassMap.set(classId, new Map());
          }
          
          const classGrades = studentGradesByClassMap.get(classId);
          if (!classGrades.has(student.id)) {
            classGrades.set(student.id, {
              student,
              grades: []
            });
          }
          
          classGrades.get(student.id).grades.push({
            ...grade,
            assignmentName: assignment.name,
            assignmentType: assignment.type,
            maxScore: assignment.maxScore
          });
        }
      }
      
      if (format === 'xml') {
        // Generate XML
        const root = builder.create('SchoolGrades');
        
        root.ele('SchoolName', school.name);
        root.ele('SchoolAddress', school.address || 'N/A');
        root.ele('ExportDate', new Date().toISOString());
        
        const classesEle = root.ele('Classes');
        
        // For each class
        for (const [classId, class_] of classesByIdMap.entries()) {
          const classEle = classesEle.ele('Class');
          classEle.att('id', class_.id);
          classEle.ele('ClassName', class_.name);
          classEle.ele('GradeLevel', class_.gradeLevel || 'N/A');
          
          const studentsEle = classEle.ele('Students');
          
          // Get all students in this class along with their grades
          const classGrades = studentGradesByClassMap.get(classId) || new Map();
          
          // For each student
          for (const [_, studentData] of classGrades.entries()) {
            const student = studentData.student;
            const grades = studentData.grades;
            
            // Skip if no grades
            if (!grades.length) continue;
            
            const studentEle = studentsEle.ele('Student');
            studentEle.att('id', student.id);
            studentEle.ele('Name', `${student.firstName} ${student.lastName}`);
            studentEle.ele('Email', student.email || 'N/A');
            studentEle.ele('GradeLevel', student.gradeLevel || 'N/A');
            
            // Calculate average grade for this student in this class
            let totalScore = 0;
            let totalMaxScore = 0;
            
            grades.forEach(grade => {
              totalScore += parseFloat(grade.score);
              totalMaxScore += parseFloat(grade.maxScore);
            });
            
            const averagePercentage = totalMaxScore > 0 
              ? (totalScore / totalMaxScore * 100).toFixed(2) 
              : "N/A";
              
            studentEle.ele('AveragePercentage', averagePercentage);
            
            const gradesEle = studentEle.ele('Grades');
            
            // For each grade
            grades.forEach(grade => {
              const gradeEle = gradesEle.ele('Grade');
              gradeEle.att('id', grade.id);
              gradeEle.ele('Assignment', grade.assignmentName);
              gradeEle.ele('Type', grade.assignmentType);
              gradeEle.ele('Score', grade.score);
              gradeEle.ele('MaxScore', grade.maxScore);
              gradeEle.ele('Comments', grade.comments || '');
              gradeEle.ele('GradedAt', grade.gradedAt.toISOString());
            });
          }
        }
        
        const xml = root.end({ pretty: true });
        
        // Set Content-Type and Content-Disposition headers
        res.setHeader('Content-Type', 'application/xml');
        res.setHeader('Content-Disposition', `attachment; filename="school_${schoolId}_grades.xml"`);
        
        // Send the XML response
        res.status(200).send(xml);
      } else {
        // Default to JSON format with flat structure
        const allGradeData = [];
        
        // Flatten the data structure for JSON
        for (const [classId, classGrades] of studentGradesByClassMap.entries()) {
          const class_ = classesByIdMap.get(classId);
          
          for (const [_, studentData] of classGrades.entries()) {
            const student = studentData.student;
            const grades = studentData.grades;
            
            for (const grade of grades) {
              allGradeData.push({
                studentId: student.id,
                studentName: `${student.firstName} ${student.lastName}`,
                classId: class_.id,
                className: class_.name,
                assignmentName: grade.assignmentName,
                assignmentType: grade.assignmentType,
                score: grade.score,
                maxScore: grade.maxScore,
                gradedAt: grade.gradedAt
              });
            }
          }
        }
        
        res.status(200).json(allGradeData);
      }
    } catch (error) {
      console.error("Error exporting school grades:", error);
      res.status(500).json({ message: "Server error exporting school grades" });
    }
  });
  
  // XML Grade Export
  app.post('/api/export/grades', requireAuth, async (req, res) => {
    try {
      const teacherId = Number(req.session.teacherId);
      const { classId, format } = req.body;
      
      // Verify the class belongs to the teacher
      const class_ = await dbStorage.getClass(classId);
      if (!class_ || class_.teacherId !== teacherId) {
        return res.status(403).json({ message: "Not authorized to export grades for this class" });
      }
      
      // Get students in this class
      const students = await dbStorage.getStudentsByClass(classId);
      
      // Get assignments for this class
      const assignments = await dbStorage.getAssignmentsByClass(classId);
      
      // For each student, get their grades
      const studentGrades = await Promise.all(
        students.map(async (student) => {
          const grades = await dbStorage.getGradesByStudentAndClass(student.id, classId);
          
          // Calculate average grade percentage 
          const totalScore = grades.reduce((sum, grade) => {
            const assignment = assignments.find(a => a.id === grade.assignmentId);
            if (!assignment) return sum;
            
            const scoreNum = parseFloat(grade.score);
            const maxScoreNum = parseFloat(assignment.maxScore);
            const weightNum = parseFloat(assignment.weight);
            
            return sum + (scoreNum / maxScoreNum * weightNum);
          }, 0);
          
          const totalWeight = assignments.reduce((sum, assignment) => {
            const weightNum = parseFloat(assignment.weight);
            return sum + weightNum;
          }, 0);
          
          const averagePercentage = totalWeight > 0 
            ? (totalScore / totalWeight * 100).toFixed(2) 
            : "N/A";
          
          // Return student with grades
          return {
            student,
            grades: grades.map(grade => {
              const assignment = assignments.find(a => a.id === grade.assignmentId);
              return {
                ...grade,
                assignmentName: assignment ? assignment.name : "Unknown",
                assignmentType: assignment ? assignment.type : "Unknown",
              };
            }),
            averagePercentage
          };
        })
      );
      
      if (format === 'xml') {
        // Generate XML
        const root = builder.create('ClassGrades');
        
        root.ele('ClassName', class_.name);
        root.ele('ClassDescription', class_.description || '');
        
        const studentsEle = root.ele('Students');
        
        studentGrades.forEach(({ student, grades, averagePercentage }) => {
          const studentEle = studentsEle.ele('Student');
          studentEle.att('id', student.id);
          studentEle.ele('Name', `${student.firstName} ${student.lastName}`);
          studentEle.ele('Email', student.email || '');
          studentEle.ele('AveragePercentage', averagePercentage);
          
          const gradesEle = studentEle.ele('Grades');
          
          grades.forEach(grade => {
            const gradeEle = gradesEle.ele('Grade');
            gradeEle.att('id', grade.id);
            gradeEle.ele('Assignment', grade.assignmentName);
            gradeEle.ele('Type', grade.assignmentType);
            gradeEle.ele('Score', grade.score);
            gradeEle.ele('Comments', grade.comments || '');
            gradeEle.ele('GradedAt', grade.gradedAt.toISOString());
          });
        });
        
        const xml = root.end({ pretty: true });
        
        // Set Content-Type and Content-Disposition headers
        res.setHeader('Content-Type', 'application/xml');
        res.setHeader('Content-Disposition', `attachment; filename="class_${classId}_grades.xml"`);
        
        // Send the XML response
        res.status(200).send(xml);
      } else {
        // Default to JSON response
        res.status(200).json(studentGrades);
      }
    } catch (error) {
      console.error("Error exporting grades:", error);
      res.status(500).json({ message: "Server error exporting grades" });
    }
  });

  // Stripe payment routes
  // Initialize Stripe with API key
  if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('STRIPE_SECRET_KEY environment variable not set. Stripe payment features will be disabled.');
  } else {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2023-10-16",
    });

    // Route for creating a payment intent for one-time payments
    app.post("/api/create-payment-intent", requireAuth, async (req, res) => {
      try {
        const { amount, plan } = req.body;
        
        // Determine amount based on plan if not provided
        let paymentAmount = amount;
        if (!paymentAmount) {
          paymentAmount = plan === 'school' ? 29900 : 1200; // School plan: $299, Pro plan: $12
        } else {
          // Convert to cents if provided as dollars
          paymentAmount = Math.round(amount * 100);
        }
        
        // Create a payment intent
        const paymentIntent = await stripe.paymentIntents.create({
          amount: paymentAmount,
          currency: "usd",
          // Add metadata for tracking
          metadata: {
            plan: plan || 'pro',
            userId: req.session.user?.id?.toString() || 'unknown'
          }
        });
        
        res.status(200).json({ 
          clientSecret: paymentIntent.client_secret,
          amount: paymentAmount / 100, // Send back the dollar amount
          plan: plan || 'pro'
        });
      } catch (error: any) {
        console.error("Error creating payment intent:", error);
        res.status(500).json({ 
          message: "Error creating payment intent",
          error: error.message 
        });
      }
    });

    // Route for processing beta applications
    app.post("/api/beta-application", requireAuth, async (req, res) => {
      try {
        const userId = req.session.user?.id;
        if (!userId) {
          return res.status(401).json({ message: "Authentication required" });
        }
        
        // Store the beta application (in a real app, this would be stored in a database)
        // For this demo, we'll just return success
        console.log(`Beta application received for user ${userId}:`, req.body);
        
        res.status(200).json({ 
          message: "Beta application received successfully",
          status: "pending_review"
        });
      } catch (error: any) {
        console.error("Error processing beta application:", error);
        res.status(500).json({ 
          message: "Error processing beta application",
          error: error.message 
        });
      }
    });

    // Route for handling webhook events from Stripe (for production use)
    app.post("/api/webhook", express.raw({type: 'application/json'}), async (req, res) => {
      try {
        const sig = req.headers['stripe-signature'] as string;
        
        // In production, you would verify the webhook signature
        // const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
        
        // For demo purposes, just parse the event
        const event = JSON.parse(req.body.toString());
        
        // Handle the event
        switch (event.type) {
          case 'payment_intent.succeeded':
            // Payment was successful, update the user's subscription status
            console.log('Payment succeeded:', event.data.object);
            break;
          case 'payment_intent.payment_failed':
            // Payment failed, maybe notify the user
            console.log('Payment failed:', event.data.object);
            break;
          default:
            console.log(`Unhandled event type ${event.type}`);
        }
        
        res.status(200).json({received: true});
      } catch (error: any) {
        console.error('Webhook error:', error.message);
        res.status(400).send(`Webhook Error: ${error.message}`);
      }
    });
  }

  const httpServer = createServer(app);
  return httpServer;
}
