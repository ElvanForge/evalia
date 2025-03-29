import { 
  School, InsertSchool,
  Teacher, InsertTeacher, 
  Class, InsertClass, 
  Student, InsertStudent, 
  Assignment, InsertAssignment,
  Grade, InsertGrade,
  GradeScale, InsertGradeScale,
  GradeScaleEntry, InsertGradeScaleEntry,
  StudentClass, InsertStudentClass,
  Quiz, InsertQuiz,
  QuizQuestion, InsertQuizQuestion,
  QuizOption, InsertQuizOption,
  QuizSubmission, InsertQuizSubmission,
  QuizAnswer, InsertQuizAnswer,
  teachers, classes, students, assignments, grades, gradeScales, gradeScaleEntries, studentClasses,
  quizzes, quizQuestions, quizOptions, quizSubmissions, quizAnswers, schools, USER_ROLES
} from "@shared/schema";

// CRUD Interface for the grade tracking system
export interface IStorage {
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
    assignmentName: string 
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
}

export class MemStorage implements IStorage {
  private schoolData: Map<number, School>;
  private teacherData: Map<number, Teacher>;
  private classData: Map<number, Class>;
  private studentData: Map<number, Student>;
  private assignmentData: Map<number, Assignment>;
  private gradeData: Map<number, Grade>;
  private gradeScaleData: Map<number, GradeScale>;
  private gradeScaleEntryData: Map<number, GradeScaleEntry>;
  private studentClassData: Map<string, StudentClass>;
  
  // Quiz Maps
  private quizData: Map<number, Quiz>;
  private quizQuestionData: Map<number, QuizQuestion>;
  private quizOptionData: Map<number, QuizOption>;
  private quizSubmissionData: Map<number, QuizSubmission>;
  private quizAnswerData: Map<number, QuizAnswer>;
  
  private schoolId: number;
  private teacherId: number;
  private classId: number;
  private studentId: number;
  private assignmentId: number;
  private gradeId: number;
  private gradeScaleId: number;
  private gradeScaleEntryId: number;
  
  // Quiz counters
  private quizId: number;
  private quizQuestionId: number;
  private quizOptionId: number;
  private quizSubmissionId: number;
  private quizAnswerId: number;
  
  constructor() {
    this.schoolData = new Map();
    this.teacherData = new Map();
    this.classData = new Map();
    this.studentData = new Map();
    this.assignmentData = new Map();
    this.gradeData = new Map();
    this.gradeScaleData = new Map();
    this.gradeScaleEntryData = new Map();
    this.studentClassData = new Map();
    
    // Initialize quiz maps
    this.quizData = new Map();
    this.quizQuestionData = new Map();
    this.quizOptionData = new Map();
    this.quizSubmissionData = new Map();
    this.quizAnswerData = new Map();
    
    this.schoolId = 1;
    this.teacherId = 1;
    this.classId = 1;
    this.studentId = 1;
    this.assignmentId = 1;
    this.gradeId = 1;
    this.gradeScaleId = 1;
    this.gradeScaleEntryId = 1;
    
    // Initialize quiz ids
    this.quizId = 1;
    this.quizQuestionId = 1;
    this.quizOptionId = 1;
    this.quizSubmissionId = 1;
    this.quizAnswerId = 1;
    
    // Initialize with default data
    this.initializeData();
  }
  
  private initializeData(): void {
    // Create a default school
    const defaultSchool: InsertSchool = {
      name: "Central High School",
      address: "123 Education Ave",
      city: "Springfield",
      state: "IL",
      zipCode: "62701",
      phoneNumber: "555-123-4567"
    };
    this.createSchool(defaultSchool);
    
    // Create a default teacher
    const defaultTeacher: InsertTeacher = {
      username: "sarah.johnson",
      password: "password123", // In a real app, this would be hashed
      firstName: "Sarah",
      lastName: "Johnson",
      email: "sarah.johnson@example.com",
      subject: "Mathematics",
      schoolId: 1,
      role: USER_ROLES.TEACHER
    };
    this.createTeacher(defaultTeacher);
    
    // Create a second teacher
    const secondTeacher: InsertTeacher = {
      username: "michael.davis",
      password: "password123",
      firstName: "Michael",
      lastName: "Davis",
      email: "michael.davis@example.com",
      subject: "Science",
      schoolId: 1,
      role: USER_ROLES.TEACHER
    };
    this.createTeacher(secondTeacher);
    
    // Create a manager account
    const managerTeacher: InsertTeacher = {
      username: "john.manager",
      password: "password123",
      firstName: "John",
      lastName: "Smith",
      email: "john.smith@example.com",
      subject: "Administration",
      schoolId: 1,
      role: USER_ROLES.MANAGER
    };
    this.createTeacher(managerTeacher);
    
    // Create a default grade scale
    const defaultGradeScale: InsertGradeScale = {
      teacherId: 1,
      name: "Standard Scale",
      isDefault: true
    };
    this.createGradeScale(defaultGradeScale);
    
    // Add grade scale entries
    const gradeEntries = [
      { scaleId: 1, minScore: 97, maxScore: 100, letter: "A+" },
      { scaleId: 1, minScore: 93, maxScore: 96.99, letter: "A" },
      { scaleId: 1, minScore: 90, maxScore: 92.99, letter: "A-" },
      { scaleId: 1, minScore: 87, maxScore: 89.99, letter: "B+" },
      { scaleId: 1, minScore: 83, maxScore: 86.99, letter: "B" },
      { scaleId: 1, minScore: 80, maxScore: 82.99, letter: "B-" },
      { scaleId: 1, minScore: 77, maxScore: 79.99, letter: "C+" },
      { scaleId: 1, minScore: 73, maxScore: 76.99, letter: "C" },
      { scaleId: 1, minScore: 70, maxScore: 72.99, letter: "C-" },
      { scaleId: 1, minScore: 67, maxScore: 69.99, letter: "D+" },
      { scaleId: 1, minScore: 63, maxScore: 66.99, letter: "D" },
      { scaleId: 1, minScore: 60, maxScore: 62.99, letter: "D-" },
      { scaleId: 1, minScore: 0, maxScore: 59.99, letter: "F" }
    ];
    
    gradeEntries.forEach(entry => this.createGradeScaleEntry(entry));
    
    // Create some sample classes
    const classes = [
      { name: "Algebra II", description: "Advanced algebra concepts", teacherId: 1, gradeLevel: "10th" },
      { name: "Geometry", description: "Geometry fundamentals", teacherId: 1, gradeLevel: "9th" },
      { name: "Pre-Calculus", description: "Preparation for calculus", teacherId: 1, gradeLevel: "11th" },
      { name: "Physics", description: "Introduction to physics", teacherId: 2, gradeLevel: "11th" },
      { name: "Chemistry", description: "Basic chemistry principles", teacherId: 2, gradeLevel: "10th" }
    ];
    
    classes.forEach(c => this.createClass(c));
    
    // Create sample students
    const students = [
      { firstName: "Emma", lastName: "Miller", email: "emma.miller@example.com", schoolId: 1, gradeLevel: "10th" },
      { firstName: "Noah", lastName: "Anderson", email: "noah.anderson@example.com", schoolId: 1, gradeLevel: "9th" },
      { firstName: "Olivia", lastName: "Williams", email: "olivia.williams@example.com", schoolId: 1, gradeLevel: "11th" },
      { firstName: "Liam", lastName: "Brown", email: "liam.brown@example.com", schoolId: 1, gradeLevel: "10th" },
      { firstName: "Sophia", lastName: "Jones", email: "sophia.jones@example.com", schoolId: 1, gradeLevel: "9th" },
      { firstName: "Mason", lastName: "Garcia", email: "mason.garcia@example.com", schoolId: 1, gradeLevel: "11th" },
      { firstName: "Isabella", lastName: "Martinez", email: "isabella.martinez@example.com", schoolId: 1, gradeLevel: "10th" },
      { firstName: "Jacob", lastName: "Lee", email: "jacob.lee@example.com", schoolId: 1, gradeLevel: "9th" }
    ];
    
    // Add students
    const createdStudents = students.map(async student => {
      return await this.createStudent(student);
    });
    
    // Enroll students in classes
    Promise.all(createdStudents).then(students => {
      // Enroll students in Algebra II
      this.enrollStudent({ studentId: 1, classId: 1 });
      this.enrollStudent({ studentId: 4, classId: 1 });
      this.enrollStudent({ studentId: 7, classId: 1 });
      
      // Enroll students in Geometry
      this.enrollStudent({ studentId: 2, classId: 2 });
      this.enrollStudent({ studentId: 5, classId: 2 });
      this.enrollStudent({ studentId: 8, classId: 2 });
      
      // Enroll students in Pre-Calculus
      this.enrollStudent({ studentId: 3, classId: 3 });
      this.enrollStudent({ studentId: 6, classId: 3 });
      
      // Enroll students in Physics
      this.enrollStudent({ studentId: 3, classId: 4 });
      this.enrollStudent({ studentId: 6, classId: 4 });
      
      // Enroll students in Chemistry
      this.enrollStudent({ studentId: 1, classId: 5 });
      this.enrollStudent({ studentId: 4, classId: 5 });
      this.enrollStudent({ studentId: 7, classId: 5 });
    });
    
    // Create sample assignments for Algebra II
    const algebraAssignments = [
      { 
        name: "Quadratic Equations Quiz", 
        classId: 1, 
        type: "Quiz", 
        maxScore: "100", 
        weight: "15",
        description: "Quiz covering quadratic equations and factoring",
        dueDate: new Date("2025-04-10")
      },
      { 
        name: "Matrix Operations", 
        classId: 1, 
        type: "Homework", 
        maxScore: "50", 
        weight: "10",
        description: "Homework on matrix addition, subtraction, and multiplication",
        dueDate: new Date("2025-04-15")
      },
      { 
        name: "Midterm Exam", 
        classId: 1, 
        type: "Exam", 
        maxScore: "100", 
        weight: "25",
        description: "Comprehensive exam covering first half of the semester",
        dueDate: new Date("2025-05-01")
      }
    ];
    
    // Create assignments
    const createdAlgebraAssignments = algebraAssignments.map(async assignment => {
      return await this.createAssignment(assignment);
    });
    
    // Add grades for the assignments
    Promise.all(createdAlgebraAssignments).then(assignments => {
      // Add grades for student 1
      this.createGrade({
        studentId: 1,
        assignmentId: 1,
        score: "87",
        comments: "Good work, but review factoring methods",
        gradedAt: new Date("2025-04-12")
      });
      
      this.createGrade({
        studentId: 1,
        assignmentId: 2,
        score: "45",
        comments: "Excellent understanding of matrix operations",
        gradedAt: new Date("2025-04-17")
      });
      
      this.createGrade({
        studentId: 1,
        assignmentId: 3,
        score: "92",
        comments: "Strong performance on the midterm",
        gradedAt: new Date("2025-05-03")
      });
      
      // Add grades for student 4
      this.createGrade({
        studentId: 4,
        assignmentId: 1,
        score: "78",
        comments: "Need to work on factoring complex expressions",
        gradedAt: new Date("2025-04-12")
      });
      
      this.createGrade({
        studentId: 4,
        assignmentId: 2,
        score: "40",
        comments: "Good work on matrix addition and subtraction",
        gradedAt: new Date("2025-04-17")
      });
      
      this.createGrade({
        studentId: 4,
        assignmentId: 3,
        score: "81",
        comments: "Solid understanding of core concepts",
        gradedAt: new Date("2025-05-03")
      });
      
      // Add grades for student 7
      this.createGrade({
        studentId: 7,
        assignmentId: 1,
        score: "95",
        comments: "Excellent work on the quadratics quiz",
        gradedAt: new Date("2025-04-12")
      });
      
      this.createGrade({
        studentId: 7,
        assignmentId: 2,
        score: "48",
        comments: "Near perfect matrix operations",
        gradedAt: new Date("2025-04-17")
      });
      
      this.createGrade({
        studentId: 7,
        assignmentId: 3,
        score: "94",
        comments: "Outstanding performance on the midterm",
        gradedAt: new Date("2025-05-03")
      });
    });
    
    // Create sample assignments for Physics
    const physicsAssignments = [
      { 
        name: "Newton's Laws Lab", 
        classId: 4, 
        type: "Lab", 
        maxScore: "100", 
        weight: "20",
        description: "Lab experiment on Newton's three laws of motion",
        dueDate: new Date("2025-04-08")
      },
      { 
        name: "Energy Conservation Quiz", 
        classId: 4, 
        type: "Quiz", 
        maxScore: "50", 
        weight: "15",
        description: "Quiz on conservation of energy and work-energy theorem",
        dueDate: new Date("2025-04-20")
      }
    ];
    
    // Create physics assignments
    const createdPhysicsAssignments = physicsAssignments.map(async assignment => {
      return await this.createAssignment(assignment);
    });
    
    // Add grades for physics assignments
    Promise.all(createdPhysicsAssignments).then(assignments => {
      // Add grades for student 3
      this.createGrade({
        studentId: 3,
        assignmentId: 4,
        score: "88",
        comments: "Good lab work, well-written report",
        gradedAt: new Date("2025-04-10")
      });
      
      this.createGrade({
        studentId: 3,
        assignmentId: 5,
        score: "42",
        comments: "Strong understanding of energy concepts",
        gradedAt: new Date("2025-04-22")
      });
      
      // Add grades for student 6
      this.createGrade({
        studentId: 6,
        assignmentId: 4,
        score: "95",
        comments: "Excellent lab work and analysis",
        gradedAt: new Date("2025-04-10")
      });
      
      this.createGrade({
        studentId: 6,
        assignmentId: 5,
        score: "47",
        comments: "Near perfect score, great work",
        gradedAt: new Date("2025-04-22")
      });
    });
    
    // Create a sample quiz
    const sampleQuiz: InsertQuiz = {
      title: "Math Fundamentals",
      description: "A quiz to test basic math knowledge",
      teacherId: 1,
      classId: 1,
      isActive: true,
      timeLimit: 30
    };
    this.createQuiz(sampleQuiz).then(quiz => {
      // Create some sample quiz questions
      const questions = [
        {
          quizId: quiz.id,
          question: "What is 2 + 2?",
          type: "multiple_choice",
          order: 0
        },
        {
          quizId: quiz.id,
          question: "What is 5 x 5?",
          type: "multiple_choice",
          order: 1
        },
        {
          quizId: quiz.id,
          question: "Is the square root of 16 equal to 4?",
          type: "true_false",
          order: 2
        }
      ];
      
      // Create the questions and add options
      questions.forEach(async (q, index) => {
        const question = await this.createQuizQuestion(q);
        
        if (index === 0) {
          // Options for first question
          const options = [
            { questionId: question.id, text: "3", isCorrect: false, order: 0 },
            { questionId: question.id, text: "4", isCorrect: true, order: 1 },
            { questionId: question.id, text: "5", isCorrect: false, order: 2 },
            { questionId: question.id, text: "22", isCorrect: false, order: 3 }
          ];
          options.forEach(o => this.createQuizOption(o));
        } else if (index === 1) {
          // Options for second question
          const options = [
            { questionId: question.id, text: "10", isCorrect: false, order: 0 },
            { questionId: question.id, text: "15", isCorrect: false, order: 1 },
            { questionId: question.id, text: "25", isCorrect: true, order: 2 },
            { questionId: question.id, text: "55", isCorrect: false, order: 3 }
          ];
          options.forEach(o => this.createQuizOption(o));
        } else if (index === 2) {
          // Options for True/False question
          const options = [
            { questionId: question.id, text: "True", isCorrect: true, order: 0 },
            { questionId: question.id, text: "False", isCorrect: false, order: 1 }
          ];
          options.forEach(o => this.createQuizOption(o));
        }
      });
    });
  }

  // Teacher operations
  async getTeacher(id: number): Promise<Teacher | undefined> {
    return this.teacherData.get(id);
  }
  
  async getTeacherByUsername(username: string): Promise<Teacher | undefined> {
    return Array.from(this.teacherData.values()).find(
      teacher => teacher.username === username
    );
  }
  
  async createTeacher(teacher: InsertTeacher): Promise<Teacher> {
    const id = this.teacherId++;
    const newTeacher = { ...teacher, id, createdAt: new Date() };
    this.teacherData.set(id, newTeacher);
    return newTeacher;
  }
  
  async updateTeacher(id: number, teacher: Partial<InsertTeacher>): Promise<Teacher | undefined> {
    const existingTeacher = this.teacherData.get(id);
    if (!existingTeacher) return undefined;
    
    const updatedTeacher = { ...existingTeacher, ...teacher };
    this.teacherData.set(id, updatedTeacher);
    return updatedTeacher;
  }
  
  async deleteTeacher(id: number): Promise<boolean> {
    return this.teacherData.delete(id);
  }
  
  async getAllTeachers(): Promise<Teacher[]> {
    return Array.from(this.teacherData.values());
  }
  
  // Class operations
  async getClass(id: number): Promise<Class | undefined> {
    return this.classData.get(id);
  }
  
  async getClassesByTeacher(teacherId: number): Promise<Class[]> {
    return Array.from(this.classData.values()).filter(
      c => c.teacherId === teacherId
    );
  }
  
  async createClass(class_: InsertClass): Promise<Class> {
    const id = this.classId++;
    const newClass = { ...class_, id, createdAt: new Date() };
    this.classData.set(id, newClass);
    return newClass;
  }
  
  async updateClass(id: number, class_: Partial<InsertClass>): Promise<Class | undefined> {
    const existingClass = this.classData.get(id);
    if (!existingClass) return undefined;
    
    const updatedClass = { ...existingClass, ...class_ };
    this.classData.set(id, updatedClass);
    return updatedClass;
  }
  
  async deleteClass(id: number): Promise<boolean> {
    return this.classData.delete(id);
  }
  
  // Student operations
  async getStudent(id: number): Promise<Student | undefined> {
    return this.studentData.get(id);
  }
  
  async getAllStudents(): Promise<Student[]> {
    return Array.from(this.studentData.values());
  }
  
  async getStudentsByClass(classId: number): Promise<Student[]> {
    const enrollments = this.getEnrollmentsByClass(classId);
    const studentIds = enrollments.map(e => e.studentId);
    return Array.from(this.studentData.values()).filter(
      student => studentIds.includes(student.id)
    );
  }
  
  async createStudent(student: InsertStudent): Promise<Student> {
    const id = this.studentId++;
    const newStudent = { ...student, id, createdAt: new Date() };
    this.studentData.set(id, newStudent);
    return newStudent;
  }
  
  async updateStudent(id: number, student: Partial<InsertStudent>): Promise<Student | undefined> {
    const existingStudent = this.studentData.get(id);
    if (!existingStudent) return undefined;
    
    const updatedStudent = { ...existingStudent, ...student };
    this.studentData.set(id, updatedStudent);
    return updatedStudent;
  }
  
  async deleteStudent(id: number): Promise<boolean> {
    return this.studentData.delete(id);
  }
  
  // Student-Class operations
  async enrollStudent(studentClass: InsertStudentClass): Promise<StudentClass> {
    const key = `${studentClass.studentId}-${studentClass.classId}`;
    this.studentClassData.set(key, studentClass);
    return studentClass;
  }
  
  async unenrollStudent(studentId: number, classId: number): Promise<boolean> {
    const key = `${studentId}-${classId}`;
    return this.studentClassData.delete(key);
  }
  
  async getEnrollments(classId: number): Promise<StudentClass[]> {
    return this.getEnrollmentsByClass(classId);
  }
  
  private getEnrollmentsByClass(classId: number): StudentClass[] {
    return Array.from(this.studentClassData.values()).filter(
      enrollment => enrollment.classId === classId
    );
  }
  
  // Assignment operations
  async getAssignment(id: number): Promise<Assignment | undefined> {
    return this.assignmentData.get(id);
  }
  
  async getAssignmentsByClass(classId: number): Promise<Assignment[]> {
    return Array.from(this.assignmentData.values()).filter(
      assignment => assignment.classId === classId
    );
  }
  
  async createAssignment(assignment: InsertAssignment): Promise<Assignment> {
    const id = this.assignmentId++;
    const newAssignment = { ...assignment, id, createdAt: new Date() };
    this.assignmentData.set(id, newAssignment);
    return newAssignment;
  }
  
  async updateAssignment(id: number, assignment: Partial<InsertAssignment>): Promise<Assignment | undefined> {
    const existingAssignment = this.assignmentData.get(id);
    if (!existingAssignment) return undefined;
    
    const updatedAssignment = { ...existingAssignment, ...assignment };
    this.assignmentData.set(id, updatedAssignment);
    return updatedAssignment;
  }
  
  async deleteAssignment(id: number): Promise<boolean> {
    return this.assignmentData.delete(id);
  }
  
  // Grade operations
  async getGrade(id: number): Promise<Grade | undefined> {
    return this.gradeData.get(id);
  }
  
  async getGradesByStudent(studentId: number): Promise<Grade[]> {
    return Array.from(this.gradeData.values()).filter(
      grade => grade.studentId === studentId
    );
  }
  
  async getGradesByAssignment(assignmentId: number): Promise<Grade[]> {
    return Array.from(this.gradeData.values()).filter(
      grade => grade.assignmentId === assignmentId
    );
  }
  
  async getGradesByStudentAndClass(studentId: number, classId: number): Promise<Grade[]> {
    const assignments = await this.getAssignmentsByClass(classId);
    const assignmentIds = assignments.map(a => a.id);
    
    return Array.from(this.gradeData.values()).filter(grade => 
      grade.studentId === studentId && assignmentIds.includes(grade.assignmentId)
    );
  }
  
  async createGrade(grade: InsertGrade): Promise<Grade> {
    const id = this.gradeId++;
    const newGrade = { ...grade, id, gradedAt: new Date() };
    this.gradeData.set(id, newGrade);
    return newGrade;
  }
  
  async updateGrade(id: number, grade: Partial<InsertGrade>): Promise<Grade | undefined> {
    const existingGrade = this.gradeData.get(id);
    if (!existingGrade) return undefined;
    
    const updatedGrade = { ...existingGrade, ...grade };
    this.gradeData.set(id, updatedGrade);
    return updatedGrade;
  }
  
  async deleteGrade(id: number): Promise<boolean> {
    return this.gradeData.delete(id);
  }
  
  async getRecentGrades(limit: number, offset: number): Promise<(Grade & { studentName: string; className: string; assignmentName: string; })[]> {
    const grades = Array.from(this.gradeData.values())
      .sort((a, b) => b.gradedAt.getTime() - a.gradedAt.getTime())
      .slice(offset, offset + limit);
    
    return Promise.all(grades.map(async grade => {
      const student = await this.getStudent(grade.studentId);
      const assignment = await this.getAssignment(grade.assignmentId);
      const class_ = assignment ? await this.getClass(assignment.classId) : undefined;
      
      return {
        ...grade,
        studentName: student ? `${student.firstName} ${student.lastName}` : "Unknown Student",
        className: class_ ? class_.name : "Unknown Class",
        assignmentName: assignment ? assignment.name : "Unknown Assignment"
      };
    }));
  }
  
  // Grade Scale operations
  async getGradeScale(id: number): Promise<GradeScale | undefined> {
    return this.gradeScaleData.get(id);
  }
  
  async getGradeScalesByTeacher(teacherId: number): Promise<GradeScale[]> {
    return Array.from(this.gradeScaleData.values()).filter(
      scale => scale.teacherId === teacherId
    );
  }
  
  async getDefaultGradeScale(teacherId: number): Promise<GradeScale | undefined> {
    return Array.from(this.gradeScaleData.values()).find(
      scale => scale.teacherId === teacherId && scale.isDefault
    );
  }
  
  async createGradeScale(gradeScale: InsertGradeScale): Promise<GradeScale> {
    const id = this.gradeScaleId++;
    const newGradeScale = { ...gradeScale, id };
    this.gradeScaleData.set(id, newGradeScale);
    return newGradeScale;
  }
  
  async updateGradeScale(id: number, gradeScale: Partial<InsertGradeScale>): Promise<GradeScale | undefined> {
    const existingGradeScale = this.gradeScaleData.get(id);
    if (!existingGradeScale) return undefined;
    
    const updatedGradeScale = { ...existingGradeScale, ...gradeScale };
    this.gradeScaleData.set(id, updatedGradeScale);
    return updatedGradeScale;
  }
  
  async deleteGradeScale(id: number): Promise<boolean> {
    return this.gradeScaleData.delete(id);
  }
  
  // Grade Scale Entry operations
  async getGradeScaleEntries(scaleId: number): Promise<GradeScaleEntry[]> {
    return Array.from(this.gradeScaleEntryData.values()).filter(
      entry => entry.scaleId === scaleId
    );
  }
  
  async createGradeScaleEntry(entry: InsertGradeScaleEntry): Promise<GradeScaleEntry> {
    const id = this.gradeScaleEntryId++;
    const newEntry = { ...entry, id };
    this.gradeScaleEntryData.set(id, newEntry);
    return newEntry;
  }
  
  async updateGradeScaleEntry(id: number, entry: Partial<InsertGradeScaleEntry>): Promise<GradeScaleEntry | undefined> {
    const existingEntry = this.gradeScaleEntryData.get(id);
    if (!existingEntry) return undefined;
    
    const updatedEntry = { ...existingEntry, ...entry };
    this.gradeScaleEntryData.set(id, updatedEntry);
    return updatedEntry;
  }
  
  async deleteGradeScaleEntry(id: number): Promise<boolean> {
    return this.gradeScaleEntryData.delete(id);
  }
  
  // Stats operations
  async getDashboardStats(teacherId: number): Promise<{ totalStudents: number; activeClasses: number; openAssignments: number; averageGrade: number; }> {
    const classes = await this.getClassesByTeacher(teacherId);
    const classIds = classes.map(c => c.id);
    
    // Count unique students across all classes
    const enrollments = Array.from(this.studentClassData.values()).filter(
      enrollment => classIds.includes(enrollment.classId)
    );
    const uniqueStudentIds = new Set(enrollments.map(e => e.studentId));
    const totalStudents = uniqueStudentIds.size;
    
    // Count active classes
    const activeClasses = classes.length;
    
    // Count open assignments
    const assignments = Array.from(this.assignmentData.values()).filter(
      assignment => classIds.includes(assignment.classId)
    );
    const openAssignments = assignments.length;
    
    // Calculate average grade across all assignments
    const grades = Array.from(this.gradeData.values()).filter(grade => {
      const assignment = this.assignmentData.get(grade.assignmentId);
      return assignment && classIds.includes(assignment.classId);
    });
    
    let totalScore = 0;
    let totalMaxScore = 0;
    
    for (const grade of grades) {
      const assignment = this.assignmentData.get(grade.assignmentId);
      if (assignment) {
        totalScore += Number(grade.score);
        totalMaxScore += Number(assignment.maxScore);
      }
    }
    
    const averageGrade = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0;
    
    return {
      totalStudents,
      activeClasses,
      openAssignments,
      averageGrade
    };
  }
  
  // Quiz operations
  async getQuiz(id: number): Promise<Quiz | undefined> {
    return this.quizData.get(id);
  }
  
  async getQuizzesByTeacher(teacherId: number): Promise<Quiz[]> {
    return Array.from(this.quizData.values()).filter(
      quiz => quiz.teacherId === teacherId
    );
  }
  
  async getQuizzesByClass(classId: number): Promise<Quiz[]> {
    return Array.from(this.quizData.values()).filter(
      quiz => quiz.classId === classId
    );
  }
  
  async createQuiz(quiz: InsertQuiz): Promise<Quiz> {
    const id = this.quizId++;
    const newQuiz = { ...quiz, id, createdAt: new Date() };
    this.quizData.set(id, newQuiz);
    return newQuiz;
  }
  
  async updateQuiz(id: number, quiz: Partial<InsertQuiz>): Promise<Quiz | undefined> {
    const existingQuiz = this.quizData.get(id);
    if (!existingQuiz) return undefined;
    
    const updatedQuiz = { ...existingQuiz, ...quiz };
    this.quizData.set(id, updatedQuiz);
    return updatedQuiz;
  }
  
  async deleteQuiz(id: number): Promise<boolean> {
    return this.quizData.delete(id);
  }
  
  // Quiz Question operations
  async getQuizQuestion(id: number): Promise<QuizQuestion | undefined> {
    return this.quizQuestionData.get(id);
  }
  
  async getQuizQuestionsByQuiz(quizId: number): Promise<QuizQuestion[]> {
    return Array.from(this.quizQuestionData.values())
      .filter(question => question.quizId === quizId)
      .sort((a, b) => a.order - b.order);
  }
  
  async createQuizQuestion(question: InsertQuizQuestion): Promise<QuizQuestion> {
    const id = this.quizQuestionId++;
    const newQuestion = { ...question, id, createdAt: new Date() };
    this.quizQuestionData.set(id, newQuestion);
    return newQuestion;
  }
  
  async updateQuizQuestion(id: number, question: Partial<InsertQuizQuestion>): Promise<QuizQuestion | undefined> {
    const existingQuestion = this.quizQuestionData.get(id);
    if (!existingQuestion) return undefined;
    
    const updatedQuestion = { ...existingQuestion, ...question };
    this.quizQuestionData.set(id, updatedQuestion);
    return updatedQuestion;
  }
  
  async deleteQuizQuestion(id: number): Promise<boolean> {
    return this.quizQuestionData.delete(id);
  }
  
  // Quiz Option operations
  async getQuizOption(id: number): Promise<QuizOption | undefined> {
    return this.quizOptionData.get(id);
  }
  
  async getQuizOptionsByQuestion(questionId: number): Promise<QuizOption[]> {
    return Array.from(this.quizOptionData.values())
      .filter(option => option.questionId === questionId)
      .sort((a, b) => a.order - b.order);
  }
  
  async createQuizOption(option: InsertQuizOption): Promise<QuizOption> {
    const id = this.quizOptionId++;
    const newOption = { ...option, id };
    this.quizOptionData.set(id, newOption);
    return newOption;
  }
  
  async updateQuizOption(id: number, option: Partial<InsertQuizOption>): Promise<QuizOption | undefined> {
    const existingOption = this.quizOptionData.get(id);
    if (!existingOption) return undefined;
    
    const updatedOption = { ...existingOption, ...option };
    this.quizOptionData.set(id, updatedOption);
    return updatedOption;
  }
  
  async deleteQuizOption(id: number): Promise<boolean> {
    return this.quizOptionData.delete(id);
  }
  
  // Quiz Submission operations
  async getQuizSubmission(id: number): Promise<QuizSubmission | undefined> {
    return this.quizSubmissionData.get(id);
  }
  
  async getQuizSubmissionsByStudent(studentId: number): Promise<QuizSubmission[]> {
    return Array.from(this.quizSubmissionData.values()).filter(
      submission => submission.studentId === studentId
    );
  }
  
  async getQuizSubmissionsByQuiz(quizId: number): Promise<QuizSubmission[]> {
    return Array.from(this.quizSubmissionData.values()).filter(
      submission => submission.quizId === quizId
    );
  }
  
  async createQuizSubmission(submission: InsertQuizSubmission): Promise<QuizSubmission> {
    const id = this.quizSubmissionId++;
    const newSubmission = { 
      ...submission, 
      id, 
      startedAt: new Date(),
      completedAt: null,
      score: null,
      maxScore: null
    };
    this.quizSubmissionData.set(id, newSubmission);
    return newSubmission;
  }
  
  async updateQuizSubmission(id: number, submission: Partial<InsertQuizSubmission>): Promise<QuizSubmission | undefined> {
    const existingSubmission = this.quizSubmissionData.get(id);
    if (!existingSubmission) return undefined;
    
    const updatedSubmission = { ...existingSubmission, ...submission };
    this.quizSubmissionData.set(id, updatedSubmission);
    return updatedSubmission;
  }
  
  async deleteQuizSubmission(id: number): Promise<boolean> {
    return this.quizSubmissionData.delete(id);
  }
  
  // Quiz Answer operations
  async getQuizAnswer(id: number): Promise<QuizAnswer | undefined> {
    return this.quizAnswerData.get(id);
  }
  
  async getQuizAnswersBySubmission(submissionId: number): Promise<QuizAnswer[]> {
    return Array.from(this.quizAnswerData.values()).filter(
      answer => answer.submissionId === submissionId
    );
  }
  
  async createQuizAnswer(answer: InsertQuizAnswer): Promise<QuizAnswer> {
    const id = this.quizAnswerId++;
    const newAnswer = { ...answer, id };
    this.quizAnswerData.set(id, newAnswer);
    return newAnswer;
  }
  
  async updateQuizAnswer(id: number, answer: Partial<InsertQuizAnswer>): Promise<QuizAnswer | undefined> {
    const existingAnswer = this.quizAnswerData.get(id);
    if (!existingAnswer) return undefined;
    
    const updatedAnswer = { ...existingAnswer, ...answer };
    this.quizAnswerData.set(id, updatedAnswer);
    return updatedAnswer;
  }
  
  async deleteQuizAnswer(id: number): Promise<boolean> {
    return this.quizAnswerData.delete(id);
  }

  // School operations
  async getSchool(id: number): Promise<School | undefined> {
    return this.schoolData.get(id);
  }
  
  async getAllSchools(): Promise<School[]> {
    return Array.from(this.schoolData.values());
  }
  
  async createSchool(school: InsertSchool): Promise<School> {
    const id = this.schoolId++;
    const newSchool = { ...school, id, createdAt: new Date() };
    this.schoolData.set(id, newSchool);
    return newSchool;
  }
  
  async updateSchool(id: number, school: Partial<InsertSchool>): Promise<School | undefined> {
    const existingSchool = this.schoolData.get(id);
    if (!existingSchool) return undefined;
    
    const updatedSchool = { ...existingSchool, ...school };
    this.schoolData.set(id, updatedSchool);
    return updatedSchool;
  }
  
  async deleteSchool(id: number): Promise<boolean> {
    return this.schoolData.delete(id);
  }
  
  async getTeachersBySchool(schoolId: number): Promise<Teacher[]> {
    return Array.from(this.teacherData.values()).filter(
      teacher => teacher.schoolId === schoolId
    );
  }
  
  async getStudentsBySchool(schoolId: number): Promise<Student[]> {
    return Array.from(this.studentData.values()).filter(
      student => student.schoolId === schoolId
    );
  }
}

export const storage = new MemStorage();
