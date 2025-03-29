import { eq, and, desc, sql } from 'drizzle-orm';
import { db, pool } from './db';
import * as schema from '@shared/schema';
import { IStorage } from './storage';
import session from 'express-session';
import connectPg from 'connect-pg-simple';
import type {
  School,
  InsertSchool,
  Teacher,
  InsertTeacher,
  Class,
  InsertClass,
  Student,
  InsertStudent,
  StudentClass,
  InsertStudentClass,
  Assignment,
  InsertAssignment,
  Grade,
  InsertGrade,
  GradeScale,
  InsertGradeScale,
  GradeScaleEntry,
  InsertGradeScaleEntry,
  Quiz,
  InsertQuiz,
  QuizQuestion,
  InsertQuizQuestion,
  QuizOption,
  InsertQuizOption,
  QuizSubmission,
  InsertQuizSubmission,
  QuizAnswer,
  InsertQuizAnswer
} from '@shared/schema';

// Reusing the pool from db.ts

// Configure PostgreSQL session store
const PostgresStore = connectPg(session);

// This is the database implementation of our storage interface
export class DBStorage implements IStorage {
  public sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresStore({
      pool,
      createTableIfMissing: true
    });
  }

  // School operations
  async getSchool(id: number): Promise<School | undefined> {
    const [school] = await db.select().from(schema.schools).where(eq(schema.schools.id, id));
    return school;
  }

  async getAllSchools(): Promise<School[]> {
    return db.select().from(schema.schools);
  }

  async createSchool(school: InsertSchool): Promise<School> {
    const [newSchool] = await db.insert(schema.schools).values(school).returning();
    return newSchool;
  }

  async updateSchool(id: number, school: Partial<InsertSchool>): Promise<School | undefined> {
    const [updatedSchool] = await db
      .update(schema.schools)
      .set(school)
      .where(eq(schema.schools.id, id))
      .returning();
    return updatedSchool;
  }

  async deleteSchool(id: number): Promise<boolean> {
    const result = await db.delete(schema.schools).where(eq(schema.schools.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getTeachersBySchool(schoolId: number): Promise<Teacher[]> {
    return db.select().from(schema.teachers).where(eq(schema.teachers.schoolId, schoolId));
  }

  async getStudentsBySchool(schoolId: number): Promise<Student[]> {
    return db.select().from(schema.students).where(eq(schema.students.schoolId, schoolId));
  }

  // Teacher operations
  async getTeacher(id: number): Promise<Teacher | undefined> {
    const [teacher] = await db.select().from(schema.teachers).where(eq(schema.teachers.id, id));
    return teacher;
  }

  async getTeacherByUsername(username: string): Promise<Teacher | undefined> {
    const [teacher] = await db.select().from(schema.teachers).where(eq(schema.teachers.username, username));
    return teacher;
  }

  async createTeacher(teacher: InsertTeacher): Promise<Teacher> {
    const [newTeacher] = await db.insert(schema.teachers).values(teacher).returning();
    return newTeacher;
  }

  async updateTeacher(id: number, teacher: Partial<InsertTeacher>): Promise<Teacher | undefined> {
    const [updatedTeacher] = await db
      .update(schema.teachers)
      .set(teacher)
      .where(eq(schema.teachers.id, id))
      .returning();
    return updatedTeacher;
  }

  async deleteTeacher(id: number): Promise<boolean> {
    const result = await db.delete(schema.teachers).where(eq(schema.teachers.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getAllTeachers(): Promise<Teacher[]> {
    return db.select().from(schema.teachers);
  }

  // Class operations
  async getClass(id: number): Promise<Class | undefined> {
    const [class_] = await db.select().from(schema.classes).where(eq(schema.classes.id, id));
    return class_;
  }

  async getClassesByTeacher(teacherId: number): Promise<Class[]> {
    return db.select().from(schema.classes).where(eq(schema.classes.teacherId, teacherId));
  }

  async createClass(class_: InsertClass): Promise<Class> {
    const [newClass] = await db.insert(schema.classes).values(class_).returning();
    return newClass;
  }

  async updateClass(id: number, class_: Partial<InsertClass>): Promise<Class | undefined> {
    const [updatedClass] = await db
      .update(schema.classes)
      .set(class_)
      .where(eq(schema.classes.id, id))
      .returning();
    return updatedClass;
  }

  async deleteClass(id: number): Promise<boolean> {
    const result = await db.delete(schema.classes).where(eq(schema.classes.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Student operations
  async getStudent(id: number): Promise<Student | undefined> {
    const [student] = await db.select().from(schema.students).where(eq(schema.students.id, id));
    return student;
  }

  async getAllStudents(): Promise<Student[]> {
    return db.select().from(schema.students);
  }

  async getStudentsByClass(classId: number): Promise<Student[]> {
    try {
      // First get all enrollments for this class
      const enrollments = await db
        .select()
        .from(schema.studentClasses)
        .where(eq(schema.studentClasses.classId, classId));
      
      if (enrollments.length === 0) return [];
      
      // Direct query with parameterized query for safety
      const result = await pool.query(
        `SELECT * FROM students WHERE id = ANY($1)`,
        [enrollments.map(e => e.studentId)]
      );
      
      return result.rows;
    } catch (error) {
      console.error("Error in getStudentsByClass:", error);
      return [];
    }
  }

  async createStudent(student: InsertStudent): Promise<Student> {
    const [newStudent] = await db.insert(schema.students).values(student).returning();
    return newStudent;
  }

  async updateStudent(id: number, student: Partial<InsertStudent>): Promise<Student | undefined> {
    const [updatedStudent] = await db
      .update(schema.students)
      .set(student)
      .where(eq(schema.students.id, id))
      .returning();
    return updatedStudent;
  }

  async deleteStudent(id: number): Promise<boolean> {
    const result = await db.delete(schema.students).where(eq(schema.students.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Student-Class operations
  async enrollStudent(studentClass: InsertStudentClass): Promise<StudentClass> {
    const [enrollment] = await db.insert(schema.studentClasses).values(studentClass).returning();
    return enrollment;
  }

  async unenrollStudent(studentId: number, classId: number): Promise<boolean> {
    const result = await db
      .delete(schema.studentClasses)
      .where(
        and(
          eq(schema.studentClasses.studentId, studentId),
          eq(schema.studentClasses.classId, classId)
        )
      );
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getEnrollments(classId: number): Promise<StudentClass[]> {
    return db.select().from(schema.studentClasses).where(eq(schema.studentClasses.classId, classId));
  }

  // Assignment operations
  async getAssignment(id: number): Promise<Assignment | undefined> {
    const [assignment] = await db.select().from(schema.assignments).where(eq(schema.assignments.id, id));
    return assignment;
  }

  async getAssignmentsByClass(classId: number): Promise<Assignment[]> {
    return db.select().from(schema.assignments).where(eq(schema.assignments.classId, classId));
  }

  async createAssignment(assignment: InsertAssignment): Promise<Assignment> {
    const [newAssignment] = await db.insert(schema.assignments).values(assignment).returning();
    return newAssignment;
  }

  async updateAssignment(id: number, assignment: Partial<InsertAssignment>): Promise<Assignment | undefined> {
    const [updatedAssignment] = await db
      .update(schema.assignments)
      .set(assignment)
      .where(eq(schema.assignments.id, id))
      .returning();
    return updatedAssignment;
  }

  async deleteAssignment(id: number): Promise<boolean> {
    const result = await db.delete(schema.assignments).where(eq(schema.assignments.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Grade operations
  async getGrade(id: number): Promise<Grade | undefined> {
    const [grade] = await db.select().from(schema.grades).where(eq(schema.grades.id, id));
    return grade;
  }

  async getGradesByStudent(studentId: number): Promise<Grade[]> {
    return db.select().from(schema.grades).where(eq(schema.grades.studentId, studentId));
  }

  async getGradesByAssignment(assignmentId: number): Promise<Grade[]> {
    return db.select().from(schema.grades).where(eq(schema.grades.assignmentId, assignmentId));
  }

  async getGradesByStudentAndClass(studentId: number, classId: number): Promise<Grade[]> {
    // Get all assignments for the class
    const assignments = await this.getAssignmentsByClass(classId);
    if (assignments.length === 0) return [];
    
    const assignmentIds = assignments.map(a => a.id);
    return db
      .select()
      .from(schema.grades)
      .where(
        and(
          eq(schema.grades.studentId, studentId),
          sql`${schema.grades.assignmentId} IN (${sql.join(assignmentIds, sql`, `)})`
        )
      );
  }

  async createGrade(grade: InsertGrade): Promise<Grade> {
    const [newGrade] = await db.insert(schema.grades).values(grade).returning();
    return newGrade;
  }

  async updateGrade(id: number, grade: Partial<InsertGrade>): Promise<Grade | undefined> {
    const [updatedGrade] = await db
      .update(schema.grades)
      .set(grade)
      .where(eq(schema.grades.id, id))
      .returning();
    return updatedGrade;
  }

  async deleteGrade(id: number): Promise<boolean> {
    const result = await db.delete(schema.grades).where(eq(schema.grades.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getRecentGrades(limit: number, offset: number): Promise<(Grade & { 
    studentName: string, 
    className: string, 
    assignmentName: string,
    maxScore: string
  })[]> {
    const query = sql`
      SELECT g.*, 
        s."firstName" || ' ' || s."lastName" as "studentName", 
        c.name as "className", 
        a.name as "assignmentName", 
        a."maxScore" as "maxScore"
      FROM ${schema.grades} g
      JOIN ${schema.students} s ON g."studentId" = s.id
      JOIN ${schema.assignments} a ON g."assignmentId" = a.id
      JOIN ${schema.classes} c ON a."classId" = c.id
      ORDER BY g."gradedAt" DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    
    const result = await db.execute(query);
    return result.rows.map((row: any) => ({
      id: row.id,
      studentId: row.studentId,
      assignmentId: row.assignmentId,
      score: row.score,
      comments: row.comments,
      submittedAt: row.submittedAt,
      gradedAt: row.gradedAt,
      studentName: row.studentName,
      className: row.className,
      assignmentName: row.assignmentName,
      maxScore: row.maxScore
    }));
  }

  // Grade Scale operations
  async getGradeScale(id: number): Promise<GradeScale | undefined> {
    const [scale] = await db.select().from(schema.gradeScales).where(eq(schema.gradeScales.id, id));
    return scale;
  }

  async getGradeScalesByTeacher(teacherId: number): Promise<GradeScale[]> {
    return db.select().from(schema.gradeScales).where(eq(schema.gradeScales.teacherId, teacherId));
  }

  async getDefaultGradeScale(teacherId: number): Promise<GradeScale | undefined> {
    const [scale] = await db
      .select()
      .from(schema.gradeScales)
      .where(
        and(
          eq(schema.gradeScales.teacherId, teacherId),
          eq(schema.gradeScales.isDefault, true)
        )
      );
    return scale;
  }

  async createGradeScale(gradeScale: InsertGradeScale): Promise<GradeScale> {
    const [newScale] = await db.insert(schema.gradeScales).values(gradeScale).returning();
    return newScale;
  }

  async updateGradeScale(id: number, gradeScale: Partial<InsertGradeScale>): Promise<GradeScale | undefined> {
    const [updatedScale] = await db
      .update(schema.gradeScales)
      .set(gradeScale)
      .where(eq(schema.gradeScales.id, id))
      .returning();
    return updatedScale;
  }

  async deleteGradeScale(id: number): Promise<boolean> {
    const result = await db.delete(schema.gradeScales).where(eq(schema.gradeScales.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Grade Scale Entry operations
  async getGradeScaleEntries(scaleId: number): Promise<GradeScaleEntry[]> {
    return db
      .select()
      .from(schema.gradeScaleEntries)
      .where(eq(schema.gradeScaleEntries.scaleId, scaleId))
      .orderBy(desc(schema.gradeScaleEntries.maxScore));
  }

  async createGradeScaleEntry(entry: InsertGradeScaleEntry): Promise<GradeScaleEntry> {
    const [newEntry] = await db.insert(schema.gradeScaleEntries).values(entry).returning();
    return newEntry;
  }

  async updateGradeScaleEntry(id: number, entry: Partial<InsertGradeScaleEntry>): Promise<GradeScaleEntry | undefined> {
    const [updatedEntry] = await db
      .update(schema.gradeScaleEntries)
      .set(entry)
      .where(eq(schema.gradeScaleEntries.id, id))
      .returning();
    return updatedEntry;
  }

  async deleteGradeScaleEntry(id: number): Promise<boolean> {
    const result = await db.delete(schema.gradeScaleEntries).where(eq(schema.gradeScaleEntries.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Quiz operations
  async getQuiz(id: number): Promise<Quiz | undefined> {
    const [quiz] = await db.select().from(schema.quizzes).where(eq(schema.quizzes.id, id));
    return quiz;
  }

  async getQuizzesByTeacher(teacherId: number): Promise<Quiz[]> {
    return db.select().from(schema.quizzes).where(eq(schema.quizzes.teacherId, teacherId));
  }

  async getQuizzesByClass(classId: number): Promise<Quiz[]> {
    return db.select().from(schema.quizzes).where(eq(schema.quizzes.classId, classId));
  }

  async createQuiz(quiz: InsertQuiz): Promise<Quiz> {
    const [newQuiz] = await db.insert(schema.quizzes).values(quiz).returning();
    return newQuiz;
  }

  async updateQuiz(id: number, quiz: Partial<InsertQuiz>): Promise<Quiz | undefined> {
    const [updatedQuiz] = await db
      .update(schema.quizzes)
      .set(quiz)
      .where(eq(schema.quizzes.id, id))
      .returning();
    return updatedQuiz;
  }

  async deleteQuiz(id: number): Promise<boolean> {
    const result = await db.delete(schema.quizzes).where(eq(schema.quizzes.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Quiz Question operations
  async getQuizQuestion(id: number): Promise<QuizQuestion | undefined> {
    const [question] = await db.select().from(schema.quizQuestions).where(eq(schema.quizQuestions.id, id));
    return question;
  }

  async getQuizQuestionsByQuiz(quizId: number): Promise<QuizQuestion[]> {
    return db
      .select()
      .from(schema.quizQuestions)
      .where(eq(schema.quizQuestions.quizId, quizId))
      .orderBy(schema.quizQuestions.order);
  }

  async createQuizQuestion(question: InsertQuizQuestion): Promise<QuizQuestion> {
    const [newQuestion] = await db.insert(schema.quizQuestions).values(question).returning();
    return newQuestion;
  }

  async updateQuizQuestion(id: number, question: Partial<InsertQuizQuestion>): Promise<QuizQuestion | undefined> {
    const [updatedQuestion] = await db
      .update(schema.quizQuestions)
      .set(question)
      .where(eq(schema.quizQuestions.id, id))
      .returning();
    return updatedQuestion;
  }

  async deleteQuizQuestion(id: number): Promise<boolean> {
    const result = await db.delete(schema.quizQuestions).where(eq(schema.quizQuestions.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Quiz Option operations
  async getQuizOption(id: number): Promise<QuizOption | undefined> {
    const [option] = await db.select().from(schema.quizOptions).where(eq(schema.quizOptions.id, id));
    return option;
  }

  async getQuizOptionsByQuestion(questionId: number): Promise<QuizOption[]> {
    return db
      .select()
      .from(schema.quizOptions)
      .where(eq(schema.quizOptions.questionId, questionId))
      .orderBy(schema.quizOptions.order);
  }

  async createQuizOption(option: InsertQuizOption): Promise<QuizOption> {
    const [newOption] = await db.insert(schema.quizOptions).values(option).returning();
    return newOption;
  }

  async updateQuizOption(id: number, option: Partial<InsertQuizOption>): Promise<QuizOption | undefined> {
    const [updatedOption] = await db
      .update(schema.quizOptions)
      .set(option)
      .where(eq(schema.quizOptions.id, id))
      .returning();
    return updatedOption;
  }

  async deleteQuizOption(id: number): Promise<boolean> {
    const result = await db.delete(schema.quizOptions).where(eq(schema.quizOptions.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Quiz Submission operations
  async getQuizSubmission(id: number): Promise<QuizSubmission | undefined> {
    const [submission] = await db.select().from(schema.quizSubmissions).where(eq(schema.quizSubmissions.id, id));
    return submission;
  }

  async getQuizSubmissionsByStudent(studentId: number): Promise<QuizSubmission[]> {
    return db.select().from(schema.quizSubmissions).where(eq(schema.quizSubmissions.studentId, studentId));
  }

  async getQuizSubmissionsByQuiz(quizId: number): Promise<QuizSubmission[]> {
    return db.select().from(schema.quizSubmissions).where(eq(schema.quizSubmissions.quizId, quizId));
  }

  async createQuizSubmission(submission: InsertQuizSubmission): Promise<QuizSubmission> {
    const [newSubmission] = await db.insert(schema.quizSubmissions).values(submission).returning();
    return newSubmission;
  }

  async updateQuizSubmission(id: number, submission: Partial<InsertQuizSubmission>): Promise<QuizSubmission | undefined> {
    const [updatedSubmission] = await db
      .update(schema.quizSubmissions)
      .set(submission)
      .where(eq(schema.quizSubmissions.id, id))
      .returning();
    return updatedSubmission;
  }

  async deleteQuizSubmission(id: number): Promise<boolean> {
    const result = await db.delete(schema.quizSubmissions).where(eq(schema.quizSubmissions.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Quiz Answer operations
  async getQuizAnswer(id: number): Promise<QuizAnswer | undefined> {
    const [answer] = await db.select().from(schema.quizAnswers).where(eq(schema.quizAnswers.id, id));
    return answer;
  }

  async getQuizAnswersBySubmission(submissionId: number): Promise<QuizAnswer[]> {
    return db.select().from(schema.quizAnswers).where(eq(schema.quizAnswers.submissionId, submissionId));
  }

  async createQuizAnswer(answer: InsertQuizAnswer): Promise<QuizAnswer> {
    const [newAnswer] = await db.insert(schema.quizAnswers).values(answer).returning();
    return newAnswer;
  }

  async updateQuizAnswer(id: number, answer: Partial<InsertQuizAnswer>): Promise<QuizAnswer | undefined> {
    const [updatedAnswer] = await db
      .update(schema.quizAnswers)
      .set(answer)
      .where(eq(schema.quizAnswers.id, id))
      .returning();
    return updatedAnswer;
  }

  async deleteQuizAnswer(id: number): Promise<boolean> {
    const result = await db.delete(schema.quizAnswers).where(eq(schema.quizAnswers.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Dashboard stats operations
  async getDashboardStats(teacherId: number): Promise<{
    totalStudents: number,
    activeClasses: number,
    openAssignments: number,
    averageGrade: number
  }> {
    try {
      // Use a simplified approach with a single query for class count
      const classCountQuery = `
        SELECT COUNT(*) as count FROM classes WHERE "teacherId" = $1
      `;
      const { rows: classRows } = await pool.query(classCountQuery, [teacherId]);
      const activeClasses = parseInt(classRows[0]?.count || '0', 10) || 0;
      
      if (activeClasses === 0) {
        return {
          totalStudents: 0,
          activeClasses: 0,
          openAssignments: 0,
          averageGrade: 0
        };
      }
      
      // Get all class IDs in one query
      const classIdsQuery = `
        SELECT id FROM classes WHERE "teacherId" = $1
      `;
      const { rows: classIdsRows } = await pool.query(classIdsQuery, [teacherId]);
      const classIds = classIdsRows.map(row => row.id);
      
      // Count distinct students in teacher's classes, but only count students that still exist
      const studentCountQuery = `
        SELECT COUNT(DISTINCT sc."studentId") as count
        FROM student_classes sc
        JOIN students s ON sc."studentId" = s.id
        WHERE sc."classId" IN (${classIds.join(',')})
      `;
      const { rows: studentRows } = await pool.query(studentCountQuery);
      const totalStudents = parseInt(studentRows[0]?.count || '0', 10) || 0;
      
      // Count open assignments
      const now = new Date().toISOString();
      const openAssignmentsQuery = `
        SELECT COUNT(*) as count
        FROM assignments
        WHERE "classId" IN (${classIds.join(',')}) AND 
              "dueDate" > $1
      `;
      const { rows: assignmentRows } = await pool.query(openAssignmentsQuery, [now]);
      const openAssignments = parseInt(assignmentRows[0]?.count || '0', 10) || 0;
      
      // Calculate average grade
      const avgGradeQuery = `
        SELECT AVG(CAST(g.score AS DECIMAL) / CAST(a."maxScore" AS DECIMAL) * 100) as avg_grade
        FROM grades g
        JOIN assignments a ON g."assignmentId" = a.id
        WHERE a."classId" IN (${classIds.join(',')})
      `;
      const { rows: gradeRows } = await pool.query(avgGradeQuery);
      const averageGrade = parseFloat(gradeRows[0]?.avg_grade || '0') || 0;
      
      console.log("Dashboard stats calculated successfully:", {
        totalStudents,
        activeClasses,
        openAssignments,
        averageGrade
      });
      
      return {
        totalStudents,
        activeClasses,
        openAssignments,
        averageGrade
      };
    } catch (error) {
      console.error("Error in getDashboardStats:", error);
      // Return safe default values on error
      return {
        totalStudents: 0,
        activeClasses: 0,
        openAssignments: 0,
        averageGrade: 0
      };
    }
  }
}