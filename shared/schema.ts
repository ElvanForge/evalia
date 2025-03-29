import { pgTable, text, serial, integer, boolean, decimal, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Schools table
export const schools = pgTable("schools", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zipCode"),
  phoneNumber: text("phoneNumber"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const insertSchoolSchema = createInsertSchema(schools).omit({
  id: true,
  createdAt: true,
});

// User roles enumeration
export const USER_ROLES = {
  TEACHER: "teacher",
  MANAGER: "manager",
  ADMIN: "admin",
} as const;

// Teachers table (now with role and school fields)
export const teachers = pgTable("teachers", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("firstName").notNull(),
  lastName: text("lastName").notNull(),
  email: text("email").notNull().unique(),
  subject: text("subject"),
  role: text("role").default(USER_ROLES.TEACHER),
  schoolId: integer("schoolId").references(() => schools.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const insertTeacherSchema = createInsertSchema(teachers).omit({
  id: true,
  createdAt: true,
});

// Classes/Courses table
export const classes = pgTable("classes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  gradeLevel: text("gradeLevel"),
  teacherId: integer("teacherId").notNull().references(() => teachers.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const insertClassSchema = createInsertSchema(classes).omit({
  id: true,
  createdAt: true,
});

// Students table
export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  firstName: text("firstName").notNull(),
  lastName: text("lastName").notNull(),
  email: text("email"),
  gradeLevel: text("gradeLevel"),
  schoolId: integer("schoolId").references(() => schools.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const insertStudentSchema = createInsertSchema(students).omit({
  id: true,
  createdAt: true,
});

// Student-Class relationship (many-to-many)
export const studentClasses = pgTable("student_classes", {
  studentId: integer("studentId").notNull().references(() => students.id),
  classId: integer("classId").notNull().references(() => classes.id),
}, (t) => ({
  pk: primaryKey({ columns: [t.studentId, t.classId] }),
}));

export const insertStudentClassSchema = createInsertSchema(studentClasses);

// Assignments table
export const assignments = pgTable("assignments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(), // quiz, test, homework, project, etc.
  maxScore: decimal("maxScore").notNull(), // maximum possible score
  weight: decimal("weight").notNull(), // weight in final grade calculation
  classId: integer("classId").notNull().references(() => classes.id),
  dueDate: timestamp("dueDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const insertAssignmentSchema = createInsertSchema(assignments).omit({
  id: true,
  createdAt: true,
});

// Grades table
export const grades = pgTable("grades", {
  id: serial("id").primaryKey(),
  assignmentId: integer("assignmentId").notNull().references(() => assignments.id),
  studentId: integer("studentId").notNull().references(() => students.id),
  score: decimal("score").notNull(),
  comments: text("comments"),
  submittedAt: timestamp("submittedAt"),
  gradedAt: timestamp("gradedAt").defaultNow().notNull(),
});

export const insertGradeSchema = createInsertSchema(grades).omit({
  id: true,
  gradedAt: true,
});

// GradeScale table for letter grade conversion
export const gradeScales = pgTable("grade_scales", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacherId").notNull().references(() => teachers.id),
  name: text("name").notNull(),
  isDefault: boolean("isDefault").default(false),
});

export const insertGradeScaleSchema = createInsertSchema(gradeScales).omit({
  id: true,
});

// GradeScaleEntries for the specific thresholds
export const gradeScaleEntries = pgTable("grade_scale_entries", {
  id: serial("id").primaryKey(),
  scaleId: integer("scaleId").notNull().references(() => gradeScales.id),
  minScore: decimal("minScore").notNull(),
  maxScore: decimal("maxScore").notNull(),
  letter: text("letter").notNull(),
});

export const insertGradeScaleEntrySchema = createInsertSchema(gradeScaleEntries).omit({
  id: true,
});

// Export types
export type School = typeof schools.$inferSelect;
export type InsertSchool = z.infer<typeof insertSchoolSchema>;

export type Teacher = typeof teachers.$inferSelect;
export type InsertTeacher = z.infer<typeof insertTeacherSchema>;

export type Class = typeof classes.$inferSelect;
export type InsertClass = z.infer<typeof insertClassSchema>;

export type Student = typeof students.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;

export type StudentClass = typeof studentClasses.$inferSelect;
export type InsertStudentClass = z.infer<typeof insertStudentClassSchema>;

export type Assignment = typeof assignments.$inferSelect;
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;

export type Grade = typeof grades.$inferSelect;
export type InsertGrade = z.infer<typeof insertGradeSchema>;

export type GradeScale = typeof gradeScales.$inferSelect;
export type InsertGradeScale = z.infer<typeof insertGradeScaleSchema>;

export type GradeScaleEntry = typeof gradeScaleEntries.$inferSelect;
export type InsertGradeScaleEntry = z.infer<typeof insertGradeScaleEntrySchema>;

// Authentication schemas for login validation
export const teacherLoginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type TeacherLogin = z.infer<typeof teacherLoginSchema>;

// Extended schemas with validation
export const extendedTeacherSchema = insertTeacherSchema.extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type ExtendedTeacher = z.infer<typeof extendedTeacherSchema>;

// Quiz Models
export const quizzes = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow(),
  teacherId: integer("teacherId").notNull().references(() => teachers.id),
  classId: integer("classId").references(() => classes.id),
  isActive: boolean("isActive").default(false),
  timeLimit: integer("timeLimit"), // in minutes
});

export const insertQuizSchema = createInsertSchema(quizzes).omit({
  id: true,
  createdAt: true,
});

// Create a special frontend version that doesn't require teacherId
export const quizFormSchema = insertQuizSchema.omit({
  teacherId: true,
});

export const quizQuestions = pgTable("quiz_questions", {
  id: serial("id").primaryKey(),
  quizId: integer("quizId").notNull().references(() => quizzes.id),
  question: text("question").notNull(),
  imageUrl: text("imageUrl"),
  type: text("type").default("multiple_choice"), // multiple_choice, true_false, or speaking
  createdAt: timestamp("createdAt").defaultNow(),
  order: integer("order").default(0),
});

export const insertQuizQuestionSchema = createInsertSchema(quizQuestions).omit({
  id: true,
  createdAt: true,
});

export const quizOptions = pgTable("quiz_options", {
  id: serial("id").primaryKey(),
  questionId: integer("questionId").notNull().references(() => quizQuestions.id),
  text: text("text").notNull(),
  isCorrect: boolean("isCorrect").default(false),
  order: integer("order").default(0),
});

export const insertQuizOptionSchema = createInsertSchema(quizOptions).omit({
  id: true,
});

export const quizSubmissions = pgTable("quiz_submissions", {
  id: serial("id").primaryKey(),
  quizId: integer("quizId").notNull().references(() => quizzes.id),
  studentId: integer("studentId").notNull().references(() => students.id),
  startedAt: timestamp("startedAt").defaultNow(),
  completedAt: timestamp("completedAt"),
  score: decimal("score", { precision: 5, scale: 2 }),
  maxScore: decimal("maxScore", { precision: 5, scale: 2 }),
});

export const insertQuizSubmissionSchema = createInsertSchema(quizSubmissions).omit({
  id: true,
  completedAt: true,
  score: true,
});

export const quizAnswers = pgTable("quiz_answers", {
  id: serial("id").primaryKey(),
  submissionId: integer("submissionId").notNull().references(() => quizSubmissions.id),
  questionId: integer("questionId").notNull().references(() => quizQuestions.id),
  selectedOptionId: integer("selectedOptionId").references(() => quizOptions.id),
  isCorrect: boolean("isCorrect").default(false),
  speakingAnswer: text("speakingAnswer"),
  teacherFeedback: text("teacherFeedback"),
});

export const insertQuizAnswerSchema = createInsertSchema(quizAnswers).omit({
  id: true,
});

export type Quiz = typeof quizzes.$inferSelect;
export type InsertQuiz = z.infer<typeof insertQuizSchema>;

export type QuizQuestion = typeof quizQuestions.$inferSelect;
export type InsertQuizQuestion = z.infer<typeof insertQuizQuestionSchema>;

export type QuizOption = typeof quizOptions.$inferSelect;
export type InsertQuizOption = z.infer<typeof insertQuizOptionSchema>;

export type QuizSubmission = typeof quizSubmissions.$inferSelect;
export type InsertQuizSubmission = z.infer<typeof insertQuizSubmissionSchema>;

export type QuizAnswer = typeof quizAnswers.$inferSelect;
export type InsertQuizAnswer = z.infer<typeof insertQuizAnswerSchema>;
