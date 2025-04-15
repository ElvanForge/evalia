import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from './db';
import * as schema from '@shared/schema';
import { IStorage } from './storage';
import session from 'express-session';
import connectPg from 'connect-pg-simple';
import { Pool } from 'pg';
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
  InsertQuizAnswer,
} from '@shared/schema';
import bcrypt from 'bcryptjs';

export class DatabaseStorage implements IStorage {
  public sessionStore: session.Store;
  
  constructor() {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    
    const PostgresStore = connectPg(session);
    this.sessionStore = new PostgresStore({
      pool,
      tableName: 'session', // Default session table name
      createTableIfMissing: true
    });
  }
  
  // School operations
  async getSchool(id: number): Promise<School | undefined> {
    return await db.query.schools.findFirst({
      where: eq(schema.schools.id, id)
    });
  }

  async getAllSchools(): Promise<School[]> {
    return await db.query.schools.findMany();
  }

  async createSchool(school: InsertSchool): Promise<School> {
    const [newSchool] = await db.insert(schema.schools)
      .values(school)
      .returning();
    return newSchool;
  }

  async updateSchool(id: number, school: Partial<InsertSchool>): Promise<School | undefined> {
    const [updatedSchool] = await db.update(schema.schools)
      .set(school)
      .where(eq(schema.schools.id, id))
      .returning();
    return updatedSchool;
  }

  async deleteSchool(id: number): Promise<boolean> {
    const result = await db.delete(schema.schools)
      .where(eq(schema.schools.id, id));
    return result.rowCount > 0;
  }

  async getTeachersBySchool(schoolId: number): Promise<Teacher[]> {
    return await db.query.teachers.findMany({
      where: eq(schema.teachers.schoolId, schoolId)
    });
  }

  async getStudentsBySchool(schoolId: number): Promise<Student[]> {
    return await db.query.students.findMany({
      where: eq(schema.students.schoolId, schoolId)
    });
  }

  // Teacher operations
  async getTeacher(id: number): Promise<Teacher | undefined> {
    return await db.query.teachers.findFirst({
      where: eq(schema.teachers.id, id)
    });
  }

  async getTeacherByUsername(username: string): Promise<Teacher | undefined> {
    return await db.query.teachers.findFirst({
      where: eq(schema.teachers.username, username)
    });
  }

  async createTeacher(teacher: InsertTeacher): Promise<Teacher> {
    // Hash password before storing
    const hashedPassword = await bcrypt.hash(teacher.password, 10);
    
    const [newTeacher] = await db.insert(schema.teachers)
      .values({
        ...teacher,
        password: hashedPassword
      })
      .returning();
    return newTeacher;
  }

  async updateTeacher(id: number, teacher: Partial<InsertTeacher>): Promise<Teacher | undefined> {
    // If password is included, hash it
    if (teacher.password) {
      teacher.password = await bcrypt.hash(teacher.password, 10);
    }
    
    const [updatedTeacher] = await db.update(schema.teachers)
      .set(teacher)
      .where(eq(schema.teachers.id, id))
      .returning();
    return updatedTeacher;
  }

  async deleteTeacher(id: number): Promise<boolean> {
    const result = await db.delete(schema.teachers)
      .where(eq(schema.teachers.id, id));
    return result.rowCount > 0;
  }

  async getAllTeachers(): Promise<Teacher[]> {
    return await db.query.teachers.findMany();
  }

  // Class operations
  async getClass(id: number): Promise<Class | undefined> {
    return await db.query.classes.findFirst({
      where: eq(schema.classes.id, id)
    });
  }

  async getClassesByTeacher(teacherId: number): Promise<Class[]> {
    return await db.query.classes.findMany({
      where: eq(schema.classes.teacherId, teacherId)
    });
  }

  async createClass(class_: InsertClass): Promise<Class> {
    const [newClass] = await db.insert(schema.classes)
      .values(class_)
      .returning();
    return newClass;
  }

  async updateClass(id: number, class_: Partial<InsertClass>): Promise<Class | undefined> {
    const [updatedClass] = await db.update(schema.classes)
      .set(class_)
      .where(eq(schema.classes.id, id))
      .returning();
    return updatedClass;
  }

  async deleteClass(id: number): Promise<boolean> {
    const result = await db.delete(schema.classes)
      .where(eq(schema.classes.id, id));
    return result.rowCount > 0;
  }

  // Student operations
  async getStudent(id: number): Promise<Student | undefined> {
    return await db.query.students.findFirst({
      where: eq(schema.students.id, id)
    });
  }

  async getAllStudents(): Promise<Student[]> {
    return await db.query.students.findMany();
  }

  async getStudentsByClass(classId: number): Promise<Student[]> {
    const studentIds = await db.select({
      studentId: schema.studentClasses.studentId
    })
    .from(schema.studentClasses)
    .where(eq(schema.studentClasses.classId, classId));
    
    if (studentIds.length === 0) {
      return [];
    }
    
    return await db.query.students.findMany({
      where: sql`${schema.students.id} IN (${studentIds.map(item => item.studentId).join(',')})`
    });
  }

  async createStudent(student: InsertStudent): Promise<Student> {
    const [newStudent] = await db.insert(schema.students)
      .values(student)
      .returning();
    return newStudent;
  }

  async updateStudent(id: number, student: Partial<InsertStudent>): Promise<Student | undefined> {
    const [updatedStudent] = await db.update(schema.students)
      .set(student)
      .where(eq(schema.students.id, id))
      .returning();
    return updatedStudent;
  }

  async deleteStudent(id: number): Promise<boolean> {
    const result = await db.delete(schema.students)
      .where(eq(schema.students.id, id));
    return result.rowCount > 0;
  }

  // Student-Class operations
  async enrollStudent(studentClass: InsertStudentClass): Promise<StudentClass> {
    const [enrollment] = await db.insert(schema.studentClasses)
      .values(studentClass)
      .returning();
    return enrollment;
  }

  async unenrollStudent(studentId: number, classId: number): Promise<boolean> {
    const result = await db.delete(schema.studentClasses)
      .where(
        and(
          eq(schema.studentClasses.studentId, studentId),
          eq(schema.studentClasses.classId, classId)
        )
      );
    return result.rowCount > 0;
  }

  async getEnrollments(classId: number): Promise<StudentClass[]> {
    return await db.query.studentClasses.findMany({
      where: eq(schema.studentClasses.classId, classId)
    });
  }

  // Assignment operations
  async getAssignment(id: number): Promise<Assignment | undefined> {
    return await db.query.assignments.findFirst({
      where: eq(schema.assignments.id, id)
    });
  }

  async getAssignmentsByClass(classId: number): Promise<Assignment[]> {
    return await db.query.assignments.findMany({
      where: eq(schema.assignments.classId, classId)
    });
  }

  async createAssignment(assignment: InsertAssignment): Promise<Assignment> {
    const [newAssignment] = await db.insert(schema.assignments)
      .values(assignment)
      .returning();
    return newAssignment;
  }

  async updateAssignment(id: number, assignment: Partial<InsertAssignment>): Promise<Assignment | undefined> {
    const [updatedAssignment] = await db.update(schema.assignments)
      .set(assignment)
      .where(eq(schema.assignments.id, id))
      .returning();
    return updatedAssignment;
  }

  async deleteAssignment(id: number): Promise<boolean> {
    const result = await db.delete(schema.assignments)
      .where(eq(schema.assignments.id, id));
    return result.rowCount > 0;
  }

  // Grade operations
  async getGrade(id: number): Promise<Grade | undefined> {
    return await db.query.grades.findFirst({
      where: eq(schema.grades.id, id)
    });
  }

  async getGradesByStudent(studentId: number): Promise<Grade[]> {
    return await db.query.grades.findMany({
      where: eq(schema.grades.studentId, studentId)
    });
  }

  async getGradesByAssignment(assignmentId: number): Promise<Grade[]> {
    return await db.query.grades.findMany({
      where: eq(schema.grades.assignmentId, assignmentId)
    });
  }

  async getGradesByStudentAndClass(studentId: number, classId: number): Promise<Grade[]> {
    const assignmentIds = await db.select({
      id: schema.assignments.id
    })
    .from(schema.assignments)
    .where(eq(schema.assignments.classId, classId));
    
    if (assignmentIds.length === 0) {
      return [];
    }
    
    return await db.query.grades.findMany({
      where: and(
        eq(schema.grades.studentId, studentId),
        sql`${schema.grades.assignmentId} IN (${assignmentIds.map(item => item.id).join(',')})`
      )
    });
  }

  async createGrade(grade: InsertGrade): Promise<Grade> {
    const [newGrade] = await db.insert(schema.grades)
      .values(grade)
      .returning();
    return newGrade;
  }

  async updateGrade(id: number, grade: Partial<InsertGrade>): Promise<Grade | undefined> {
    const [updatedGrade] = await db.update(schema.grades)
      .set(grade)
      .where(eq(schema.grades.id, id))
      .returning();
    return updatedGrade;
  }

  async deleteGrade(id: number): Promise<boolean> {
    const result = await db.delete(schema.grades)
      .where(eq(schema.grades.id, id));
    return result.rowCount > 0;
  }

  async getRecentGrades(limit: number, offset: number): Promise<(Grade & { 
    studentName: string, 
    className: string, 
    assignmentName: string,
    maxScore: string
  })[]> {
    const result = await db.execute(sql`
      SELECT 
        g.id, g.score, g.graded_at, g.comments, g.submitted_at,
        s.first_name || ' ' || s.last_name AS student_name,
        c.name AS class_name,
        a.name AS assignment_name,
        a.max_score
      FROM grades g
      JOIN students s ON g.student_id = s.id
      JOIN assignments a ON g.assignment_id = a.id
      JOIN classes c ON a.class_id = c.id
      ORDER BY g.graded_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `);
    
    return result.rows.map(row => ({
      id: row.id,
      studentId: row.student_id,
      assignmentId: row.assignment_id,
      score: row.score,
      gradedAt: row.graded_at,
      comments: row.comments,
      submittedAt: row.submitted_at,
      studentName: row.student_name,
      className: row.class_name,
      assignmentName: row.assignment_name,
      maxScore: row.max_score
    }));
  }

  // Grade Scale operations
  async getGradeScale(id: number): Promise<GradeScale | undefined> {
    return await db.query.gradeScales.findFirst({
      where: eq(schema.gradeScales.id, id)
    });
  }

  async getGradeScalesByTeacher(teacherId: number): Promise<GradeScale[]> {
    return await db.query.gradeScales.findMany({
      where: eq(schema.gradeScales.teacherId, teacherId)
    });
  }

  async getDefaultGradeScale(teacherId: number): Promise<GradeScale | undefined> {
    return await db.query.gradeScales.findFirst({
      where: and(
        eq(schema.gradeScales.teacherId, teacherId),
        eq(schema.gradeScales.isDefault, true)
      )
    });
  }

  async createGradeScale(gradeScale: InsertGradeScale): Promise<GradeScale> {
    const [newGradeScale] = await db.insert(schema.gradeScales)
      .values(gradeScale)
      .returning();
    return newGradeScale;
  }

  async updateGradeScale(id: number, gradeScale: Partial<InsertGradeScale>): Promise<GradeScale | undefined> {
    const [updatedGradeScale] = await db.update(schema.gradeScales)
      .set(gradeScale)
      .where(eq(schema.gradeScales.id, id))
      .returning();
    return updatedGradeScale;
  }

  async deleteGradeScale(id: number): Promise<boolean> {
    const result = await db.delete(schema.gradeScales)
      .where(eq(schema.gradeScales.id, id));
    return result.rowCount > 0;
  }

  // Grade Scale Entry operations
  async getGradeScaleEntries(scaleId: number): Promise<GradeScaleEntry[]> {
    return await db.query.gradeScaleEntries.findMany({
      where: eq(schema.gradeScaleEntries.scaleId, scaleId)
    });
  }

  async createGradeScaleEntry(entry: InsertGradeScaleEntry): Promise<GradeScaleEntry> {
    const [newEntry] = await db.insert(schema.gradeScaleEntries)
      .values(entry)
      .returning();
    return newEntry;
  }

  async updateGradeScaleEntry(id: number, entry: Partial<InsertGradeScaleEntry>): Promise<GradeScaleEntry | undefined> {
    const [updatedEntry] = await db.update(schema.gradeScaleEntries)
      .set(entry)
      .where(eq(schema.gradeScaleEntries.id, id))
      .returning();
    return updatedEntry;
  }

  async deleteGradeScaleEntry(id: number): Promise<boolean> {
    const result = await db.delete(schema.gradeScaleEntries)
      .where(eq(schema.gradeScaleEntries.id, id));
    return result.rowCount > 0;
  }

  // Quiz operations
  async getQuiz(id: number): Promise<Quiz | undefined> {
    return await db.query.quizzes.findFirst({
      where: eq(schema.quizzes.id, id)
    });
  }

  async getQuizzesByTeacher(teacherId: number): Promise<Quiz[]> {
    return await db.query.quizzes.findMany({
      where: eq(schema.quizzes.teacherId, teacherId)
    });
  }

  async getQuizzesByClass(classId: number): Promise<Quiz[]> {
    return await db.query.quizzes.findMany({
      where: eq(schema.quizzes.classId, classId)
    });
  }

  async createQuiz(quiz: InsertQuiz): Promise<Quiz> {
    const [newQuiz] = await db.insert(schema.quizzes)
      .values(quiz)
      .returning();
    return newQuiz;
  }

  async updateQuiz(id: number, quiz: Partial<InsertQuiz>): Promise<Quiz | undefined> {
    const [updatedQuiz] = await db.update(schema.quizzes)
      .set(quiz)
      .where(eq(schema.quizzes.id, id))
      .returning();
    return updatedQuiz;
  }

  async deleteQuiz(id: number): Promise<boolean> {
    const result = await db.delete(schema.quizzes)
      .where(eq(schema.quizzes.id, id));
    return result.rowCount > 0;
  }

  // Quiz Question operations
  async getQuizQuestion(id: number): Promise<QuizQuestion | undefined> {
    return await db.query.quizQuestions.findFirst({
      where: eq(schema.quizQuestions.id, id)
    });
  }

  async getQuizQuestionsByQuiz(quizId: number): Promise<QuizQuestion[]> {
    return await db.query.quizQuestions.findMany({
      where: eq(schema.quizQuestions.quizId, quizId),
      orderBy: (quizQuestions, { asc }) => [asc(quizQuestions.order)]
    });
  }

  async createQuizQuestion(question: InsertQuizQuestion): Promise<QuizQuestion> {
    const [newQuestion] = await db.insert(schema.quizQuestions)
      .values(question)
      .returning();
    return newQuestion;
  }

  async updateQuizQuestion(id: number, question: Partial<InsertQuizQuestion>): Promise<QuizQuestion | undefined> {
    const [updatedQuestion] = await db.update(schema.quizQuestions)
      .set(question)
      .where(eq(schema.quizQuestions.id, id))
      .returning();
    return updatedQuestion;
  }

  async deleteQuizQuestion(id: number): Promise<boolean> {
    const result = await db.delete(schema.quizQuestions)
      .where(eq(schema.quizQuestions.id, id));
    return result.rowCount > 0;
  }
  
  async getQuizQuestionsByImageUrl(): Promise<QuizQuestion[]> {
    return db
      .select()
      .from(schema.quizQuestions)
      .where(sql`${schema.quizQuestions.imageUrl} IS NOT NULL`)
      .execute();
  }
  
  async updateQuizQuestionImageUrl(id: number, imageUrl: string | null): Promise<QuizQuestion | undefined> {
    const result = await db
      .update(schema.quizQuestions)
      .set({ imageUrl })
      .where(eq(schema.quizQuestions.id, id))
      .returning();
      
    return result[0];
  }

  // Quiz Option operations
  async getQuizOption(id: number): Promise<QuizOption | undefined> {
    return await db.query.quizOptions.findFirst({
      where: eq(schema.quizOptions.id, id)
    });
  }

  async getQuizOptionsByQuestion(questionId: number): Promise<QuizOption[]> {
    return await db.query.quizOptions.findMany({
      where: eq(schema.quizOptions.questionId, questionId),
      orderBy: (quizOptions, { asc }) => [asc(quizOptions.order)]
    });
  }

  async createQuizOption(option: InsertQuizOption): Promise<QuizOption> {
    const [newOption] = await db.insert(schema.quizOptions)
      .values(option)
      .returning();
    return newOption;
  }

  async updateQuizOption(id: number, option: Partial<InsertQuizOption>): Promise<QuizOption | undefined> {
    const [updatedOption] = await db.update(schema.quizOptions)
      .set(option)
      .where(eq(schema.quizOptions.id, id))
      .returning();
    return updatedOption;
  }

  async deleteQuizOption(id: number): Promise<boolean> {
    const result = await db.delete(schema.quizOptions)
      .where(eq(schema.quizOptions.id, id));
    return result.rowCount > 0;
  }

  // Quiz Submission operations
  async getQuizSubmission(id: number): Promise<QuizSubmission | undefined> {
    return await db.query.quizSubmissions.findFirst({
      where: eq(schema.quizSubmissions.id, id)
    });
  }

  async getQuizSubmissionsByStudent(studentId: number): Promise<QuizSubmission[]> {
    return await db.query.quizSubmissions.findMany({
      where: eq(schema.quizSubmissions.studentId, studentId)
    });
  }

  async getQuizSubmissionsByQuiz(quizId: number): Promise<QuizSubmission[]> {
    return await db.query.quizSubmissions.findMany({
      where: eq(schema.quizSubmissions.quizId, quizId)
    });
  }

  async createQuizSubmission(submission: InsertQuizSubmission): Promise<QuizSubmission> {
    const [newSubmission] = await db.insert(schema.quizSubmissions)
      .values(submission)
      .returning();
    return newSubmission;
  }

  async updateQuizSubmission(id: number, submission: Partial<InsertQuizSubmission>): Promise<QuizSubmission | undefined> {
    const [updatedSubmission] = await db.update(schema.quizSubmissions)
      .set(submission)
      .where(eq(schema.quizSubmissions.id, id))
      .returning();
    return updatedSubmission;
  }

  async deleteQuizSubmission(id: number): Promise<boolean> {
    const result = await db.delete(schema.quizSubmissions)
      .where(eq(schema.quizSubmissions.id, id));
    return result.rowCount > 0;
  }

  // Quiz Answer operations
  async getQuizAnswer(id: number): Promise<QuizAnswer | undefined> {
    return await db.query.quizAnswers.findFirst({
      where: eq(schema.quizAnswers.id, id)
    });
  }

  async getQuizAnswersBySubmission(submissionId: number): Promise<QuizAnswer[]> {
    return await db.query.quizAnswers.findMany({
      where: eq(schema.quizAnswers.submissionId, submissionId)
    });
  }

  async createQuizAnswer(answer: InsertQuizAnswer): Promise<QuizAnswer> {
    const [newAnswer] = await db.insert(schema.quizAnswers)
      .values(answer)
      .returning();
    return newAnswer;
  }

  async updateQuizAnswer(id: number, answer: Partial<InsertQuizAnswer>): Promise<QuizAnswer | undefined> {
    const [updatedAnswer] = await db.update(schema.quizAnswers)
      .set(answer)
      .where(eq(schema.quizAnswers.id, id))
      .returning();
    return updatedAnswer;
  }

  async deleteQuizAnswer(id: number): Promise<boolean> {
    const result = await db.delete(schema.quizAnswers)
      .where(eq(schema.quizAnswers.id, id));
    return result.rowCount > 0;
  }

  // Dashboard stats
  async getDashboardStats(teacherId: number): Promise<{
    totalStudents: number,
    activeClasses: number,
    openAssignments: number,
    averageGrade: number
  }> {
    // Get total number of students enrolled in all classes taught by this teacher
    const classIds = await db.select({ id: schema.classes.id })
      .from(schema.classes)
      .where(eq(schema.classes.teacherId, teacherId));
    
    const classIdValues = classIds.map(c => c.id);
    
    if (classIdValues.length === 0) {
      return {
        totalStudents: 0,
        activeClasses: 0,
        openAssignments: 0,
        averageGrade: 0
      };
    }
    
    // Count unique students
    const studentsResult = await db.execute(sql`
      SELECT COUNT(DISTINCT student_id) as count
      FROM student_classes
      WHERE class_id IN (${classIdValues.join(',')})
    `);
    
    // Count active classes
    const classesResult = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM classes
      WHERE teacher_id = ${teacherId}
    `);
    
    // Count open assignments (due date in the future)
    const now = new Date();
    const assignmentsResult = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM assignments
      WHERE class_id IN (${classIdValues.join(',')})
      AND (due_date IS NULL OR due_date > ${now.toISOString()})
    `);
    
    // Calculate average grade across all assignments
    const gradesResult = await db.execute(sql`
      SELECT AVG(CAST(g.score AS DECIMAL) / CAST(a.max_score AS DECIMAL) * 100) as avg_grade
      FROM grades g
      JOIN assignments a ON g.assignment_id = a.id
      WHERE a.class_id IN (${classIdValues.join(',')})
    `);
    
    return {
      totalStudents: parseInt(studentsResult.rows[0]?.count || '0'),
      activeClasses: parseInt(classesResult.rows[0]?.count || '0'),
      openAssignments: parseInt(assignmentsResult.rows[0]?.count || '0'),
      averageGrade: parseFloat(gradesResult.rows[0]?.avg_grade || '0')
    };
  }
}