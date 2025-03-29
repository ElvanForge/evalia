import { db } from '../db';
import * as schema from '../../shared/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

/**
 * This script creates test data for the application
 * Run it with: npx tsx server/scripts/create-test-data.ts
 */
async function createTestData() {
  try {
    console.log('Creating test data...');
    
    // Get the admin user we created
    const [admin] = await db.select().from(schema.teachers)
      .where(eq(schema.teachers.username, 'admin'));
    
    if (!admin) {
      console.error('Admin user not found. Please make sure to start the application first.');
      return;
    }
    
    console.log('Using admin user ID:', admin.id);

    // Create a test class
    const [math101] = await db.insert(schema.classes).values({
      name: 'Math 101',
      description: 'Introduction to basic mathematics',
      gradeLevel: '9th Grade',
      teacherId: admin.id,
    }).returning();
    
    console.log('Created class:', math101.name, 'with ID:', math101.id);
    
    // Create some students
    const students = await Promise.all([
      db.insert(schema.students).values({
        firstName: 'Alice',
        lastName: 'Johnson',
        email: 'alice@example.com',
        gradeLevel: '9th Grade',
      }).returning(),
      
      db.insert(schema.students).values({
        firstName: 'Bob',
        lastName: 'Smith',
        email: 'bob@example.com',
        gradeLevel: '9th Grade',
      }).returning(),
      
      db.insert(schema.students).values({
        firstName: 'Charlie',
        lastName: 'Brown',
        email: 'charlie@example.com',
        gradeLevel: '9th Grade',
      }).returning(),
    ]);
    
    const studentIds = students.map(s => s[0].id);
    console.log('Created students with IDs:', studentIds);
    
    // Enroll students in the class
    for (const studentId of studentIds) {
      await db.insert(schema.studentClasses).values({
        studentId,
        classId: math101.id,
      });
    }
    
    console.log('Enrolled students in class');
    
    // Create assignments
    const assignments = await Promise.all([
      db.insert(schema.assignments).values({
        name: 'Quiz 1',
        description: 'First quiz of the semester',
        type: 'quiz',
        maxScore: '100',
        weight: '10',
        classId: math101.id,
        dueDate: new Date('2025-04-15'),
      }).returning(),
      
      db.insert(schema.assignments).values({
        name: 'Homework 1',
        description: 'First homework assignment',
        type: 'homework',
        maxScore: '50',
        weight: '5',
        classId: math101.id,
        dueDate: new Date('2025-04-10'),
      }).returning(),
      
      db.insert(schema.assignments).values({
        name: 'Midterm Exam',
        description: 'Midterm examination',
        type: 'exam',
        maxScore: '200',
        weight: '30',
        classId: math101.id,
        dueDate: new Date('2025-05-01'),
      }).returning(),
    ]);
    
    const assignmentIds = assignments.map(a => a[0].id);
    console.log('Created assignments with IDs:', assignmentIds);
    
    // Create a default grade scale
    const [gradeScale] = await db.insert(schema.gradeScales).values({
      name: 'Standard Scale',
      teacherId: admin.id,
      isDefault: true,
    }).returning();
    
    console.log('Created grade scale with ID:', gradeScale.id);
    
    // Create grade scale entries
    const gradeEntries = [
      { letter: 'A', minScore: '90', maxScore: '100' },
      { letter: 'B', minScore: '80', maxScore: '89.99' },
      { letter: 'C', minScore: '70', maxScore: '79.99' },
      { letter: 'D', minScore: '60', maxScore: '69.99' },
      { letter: 'F', minScore: '0', maxScore: '59.99' },
    ];
    
    for (const entry of gradeEntries) {
      await db.insert(schema.gradeScaleEntries).values({
        scaleId: gradeScale.id,
        ...entry,
      });
    }
    
    console.log('Created grade scale entries');
    
    // Create some grades for each student and assignment
    const grades = [];
    for (const studentId of studentIds) {
      for (const assignmentId of assignmentIds) {
        // Generate a random score between 60 and 100
        const score = Math.floor(Math.random() * 41) + 60;
        const [grade] = await db.insert(schema.grades).values({
          studentId,
          assignmentId,
          score: score.toString(), // Convert to string as score is decimal
          comments: `Good job! You scored ${score}%.`,
        }).returning();
        grades.push(grade);
      }
    }
    
    console.log(`Created ${grades.length} grades`);
    
    // Create a quiz
    const [quiz] = await db.insert(schema.quizzes).values({
      title: 'Math Fundamentals',
      description: 'Test your basic math knowledge',
      teacherId: admin.id,
      classId: math101.id,
      timeLimit: 30, // 30 minutes
      isActive: true,
    }).returning();
    
    console.log('Created quiz with ID:', quiz.id);
    
    // Create quiz questions
    const questions = await Promise.all([
      db.insert(schema.quizQuestions).values({
        quizId: quiz.id,
        question: 'What is 2 + 2?',
        type: 'multiple_choice',
        order: 1,
      }).returning(),
      
      db.insert(schema.quizQuestions).values({
        quizId: quiz.id,
        question: 'What is the solution to x + 5 = 9?',
        type: 'multiple_choice',
        order: 2,
      }).returning(),
      
      db.insert(schema.quizQuestions).values({
        quizId: quiz.id,
        question: 'Explain the Pythagorean theorem.',
        type: 'essay',
        order: 3,
      }).returning(),
    ]);
    
    console.log('Created quiz questions');
    
    // Create quiz options for multiple-choice questions
    await db.insert(schema.quizOptions).values({
      questionId: questions[0][0].id,
      text: '3',
      isCorrect: false,
      order: 1,
    });
    
    await db.insert(schema.quizOptions).values({
      questionId: questions[0][0].id,
      text: '4',
      isCorrect: true,
      order: 2,
    });
    
    await db.insert(schema.quizOptions).values({
      questionId: questions[0][0].id,
      text: '5',
      isCorrect: false,
      order: 3,
    });
    
    await db.insert(schema.quizOptions).values({
      questionId: questions[1][0].id,
      text: '4',
      isCorrect: true,
      order: 1,
    });
    
    await db.insert(schema.quizOptions).values({
      questionId: questions[1][0].id,
      text: '14',
      isCorrect: false,
      order: 2,
    });
    
    await db.insert(schema.quizOptions).values({
      questionId: questions[1][0].id,
      text: '-5',
      isCorrect: false,
      order: 3,
    });
    
    console.log('Created quiz options');
    
    console.log('Test data creation completed successfully!');
  } catch (error) {
    console.error('Error creating test data:', error);
  }
}

// Execute the function
createTestData();