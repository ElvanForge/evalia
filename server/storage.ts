import session from "express-session";
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
  LessonPlan,
  InsertLessonPlan,
  LessonPlanMaterial,
  InsertLessonPlanMaterial,
  LessonPlanGeneratedContent,
  InsertLessonPlanGeneratedContent
} from "@shared/schema";

// CRUD Interface for the grade tracking system
export interface IStorage {
  // Session store
  sessionStore: session.Store;
  
  // Database instance for transactions
  db: any;
  
  // School operations
  getSchool(id: number): Promise<School | undefined>;
  getAllSchools(): Promise<School[]>;
  createSchool(school: InsertSchool): Promise<School>;
  updateSchool(id: number, school: Partial<InsertSchool>): Promise<School | undefined>;
  deleteSchool(id: number): Promise<boolean>;
  getTeachersBySchool(schoolId: number): Promise<Teacher[]>;
  getStudentsBySchool(schoolId: number): Promise<Student[]>;
  
  // Teacher operations
  getTeacher(id: number): Promise<Teacher | undefined>;
  getTeacherByUsername(username: string): Promise<Teacher | undefined>;
  createTeacher(teacher: InsertTeacher): Promise<Teacher>;
  updateTeacher(id: number, teacher: Partial<InsertTeacher>): Promise<Teacher | undefined>;
  deleteTeacher(id: number): Promise<boolean>;
  getAllTeachers(): Promise<Teacher[]>;
  updateTeacherStripeCustomerId(teacherId: number, customerId: string): Promise<Teacher | undefined>;
  updateTeacherStripeSubscription(teacherId: number, 
    subscriptionData: { 
      stripeSubscriptionId: string, 
      subscriptionPlan: string, 
      subscriptionStatus: string 
    }): Promise<Teacher | undefined>;
  updateBetaTesterStatus(teacherId: number, isBetaTester: boolean): Promise<Teacher | undefined>;
  
  // Class operations
  getClass(id: number): Promise<Class | undefined>;
  getClassesByTeacher(teacherId: number): Promise<Class[]>;
  createClass(class_: InsertClass): Promise<Class>;
  updateClass(id: number, class_: Partial<InsertClass>): Promise<Class | undefined>;
  deleteClass(id: number): Promise<boolean>;
  
  // Student operations
  getStudent(id: number): Promise<Student | undefined>;
  getAllStudents(): Promise<Student[]>;
  getStudentsByClass(classId: number): Promise<Student[]>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: number, student: Partial<InsertStudent>): Promise<Student | undefined>;
  deleteStudent(id: number): Promise<boolean>;
  
  // Student-Class operations
  enrollStudent(studentClass: InsertStudentClass): Promise<StudentClass>;
  unenrollStudent(studentId: number, classId: number): Promise<boolean>;
  getEnrollments(classId: number): Promise<StudentClass[]>;
  getEnrollmentsByStudent(studentId: number): Promise<StudentClass[]>;
  
  // Assignment operations
  getAssignment(id: number): Promise<Assignment | undefined>;
  getAssignmentsByClass(classId: number): Promise<Assignment[]>;
  createAssignment(assignment: InsertAssignment): Promise<Assignment>;
  updateAssignment(id: number, assignment: Partial<InsertAssignment>): Promise<Assignment | undefined>;
  deleteAssignment(id: number): Promise<boolean>;
  
  // Grade operations
  getGrade(id: number): Promise<Grade | undefined>;
  getGradesByStudent(studentId: number): Promise<Grade[]>;
  getGradesByAssignment(assignmentId: number): Promise<Grade[]>;
  getGradesByStudentAndClass(studentId: number, classId: number): Promise<Grade[]>;
  createGrade(grade: InsertGrade): Promise<Grade>;
  updateGrade(id: number, grade: Partial<InsertGrade>): Promise<Grade | undefined>;
  deleteGrade(id: number): Promise<boolean>;
  getRecentGrades(limit: number, offset: number): Promise<(Grade & { 
    studentName: string, 
    className: string, 
    assignmentName: string,
    maxScore: string 
  })[]>;
  
  // Grade Scale operations
  getGradeScale(id: number): Promise<GradeScale | undefined>;
  getGradeScalesByTeacher(teacherId: number): Promise<GradeScale[]>;
  getDefaultGradeScale(teacherId: number): Promise<GradeScale | undefined>;
  createGradeScale(gradeScale: InsertGradeScale): Promise<GradeScale>;
  updateGradeScale(id: number, gradeScale: Partial<InsertGradeScale>): Promise<GradeScale | undefined>;
  deleteGradeScale(id: number): Promise<boolean>;
  
  // Grade Scale Entry operations
  getGradeScaleEntries(scaleId: number): Promise<GradeScaleEntry[]>;
  createGradeScaleEntry(entry: InsertGradeScaleEntry): Promise<GradeScaleEntry>;
  updateGradeScaleEntry(id: number, entry: Partial<InsertGradeScaleEntry>): Promise<GradeScaleEntry | undefined>;
  deleteGradeScaleEntry(id: number): Promise<boolean>;

  // Quiz operations
  getQuiz(id: number): Promise<Quiz | undefined>;
  getQuizzesByTeacher(teacherId: number): Promise<Quiz[]>;
  getQuizzesByClass(classId: number): Promise<Quiz[]>;
  createQuiz(quiz: InsertQuiz): Promise<Quiz>;
  updateQuiz(id: number, quiz: Partial<InsertQuiz>): Promise<Quiz | undefined>;
  deleteQuiz(id: number): Promise<boolean>;
  
  // Quiz Question operations
  getQuizQuestion(id: number): Promise<QuizQuestion | undefined>;
  getQuizQuestionsByQuiz(quizId: number): Promise<QuizQuestion[]>;
  createQuizQuestion(question: InsertQuizQuestion): Promise<QuizQuestion>;
  updateQuizQuestion(id: number, question: Partial<InsertQuizQuestion>): Promise<QuizQuestion | undefined>;
  deleteQuizQuestion(id: number): Promise<boolean>;
  
  // Quiz Option operations
  getQuizOption(id: number): Promise<QuizOption | undefined>;
  getQuizOptionsByQuestion(questionId: number): Promise<QuizOption[]>;
  createQuizOption(option: InsertQuizOption): Promise<QuizOption>;
  updateQuizOption(id: number, option: Partial<InsertQuizOption>): Promise<QuizOption | undefined>;
  deleteQuizOption(id: number): Promise<boolean>;
  
  // Quiz Submission operations
  getQuizSubmission(id: number): Promise<QuizSubmission | undefined>;
  getQuizSubmissionsByStudent(studentId: number): Promise<QuizSubmission[]>;
  getQuizSubmissionsByQuiz(quizId: number): Promise<QuizSubmission[]>;
  createQuizSubmission(submission: InsertQuizSubmission): Promise<QuizSubmission>;
  updateQuizSubmission(id: number, submission: Partial<InsertQuizSubmission>): Promise<QuizSubmission | undefined>;
  deleteQuizSubmission(id: number): Promise<boolean>;
  
  // Quiz Answer operations
  getQuizAnswer(id: number): Promise<QuizAnswer | undefined>;
  getQuizAnswersBySubmission(submissionId: number): Promise<QuizAnswer[]>;
  createQuizAnswer(answer: InsertQuizAnswer): Promise<QuizAnswer>;
  updateQuizAnswer(id: number, answer: Partial<InsertQuizAnswer>): Promise<QuizAnswer | undefined>;
  deleteQuizAnswer(id: number): Promise<boolean>;

  // Stats operations
  getDashboardStats(teacherId: number): Promise<{
    totalStudents: number,
    activeClasses: number,
    openAssignments: number,
    averageGrade: number
  }>;

  // Lesson Plan operations
  getLessonPlan(id: number): Promise<LessonPlan | undefined>;
  getLessonPlansByTeacher(teacherId: number): Promise<LessonPlan[]>;
  getLessonPlansByClass(classId: number): Promise<LessonPlan[]>;
  createLessonPlan(lessonPlan: InsertLessonPlan): Promise<LessonPlan>;
  updateLessonPlan(id: number, lessonPlan: Partial<InsertLessonPlan>): Promise<LessonPlan | undefined>;
  deleteLessonPlan(id: number): Promise<boolean>;
  
  // Lesson Plan Material operations
  getLessonPlanMaterial(id: number): Promise<LessonPlanMaterial | undefined>;
  getLessonPlanMaterialsByLessonPlan(lessonPlanId: number): Promise<LessonPlanMaterial[]>;
  createLessonPlanMaterial(material: InsertLessonPlanMaterial): Promise<LessonPlanMaterial>;
  deleteLessonPlanMaterial(id: number): Promise<boolean>;
  
  // Lesson Plan Generated Content operations
  getLessonPlanGeneratedContent(id: number): Promise<LessonPlanGeneratedContent | undefined>;
  getLessonPlanGeneratedContentsByLessonPlan(lessonPlanId: number): Promise<LessonPlanGeneratedContent[]>;
  createLessonPlanGeneratedContent(content: InsertLessonPlanGeneratedContent): Promise<LessonPlanGeneratedContent>;
  updateLessonPlanGeneratedContentStatus(id: number, isApplied: boolean): Promise<LessonPlanGeneratedContent | undefined>;
  deleteLessonPlanGeneratedContent(id: number): Promise<boolean>;
}

// Import our database storage implementation
import { DBStorage } from './db-storage';

// Export an instance of DBStorage for use throughout the application
export const storage = new DBStorage();