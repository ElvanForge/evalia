/**
 * OpenAI service for lesson plan generation
 */
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { storage } from './storage';
import { LessonPlan, LessonPlanMaterial, InsertLessonPlanGeneratedContent } from '@shared/schema';

// Initialize OpenAI with API key from environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-dev',
});

// Validate OpenAI configuration
const validateOpenAIConfig = () => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured. Please add OPENAI_API_KEY to your deployment secrets.');
  }
};

// Interface for the lesson plan generation request
interface LessonPlanGenerationOptions {
  title: string;
  subject: string;
  gradeLevel: string;
  duration: string;
  teacherNotes?: string;
  materialIds?: number[];
}

// Interface for the material analysis result
interface MaterialAnalysisResult {
  keyTopics: string[];
  keyVocabulary: string[];
  suggestedActivities: string[];
  contentSummary: string;
  fileType: string;
  fileName: string;
}

/**
 * Analyzes an uploaded material to extract key information
 * @param materialId The ID of the material to analyze
 * @returns Analysis of the material content
 */
export async function analyzeMaterial(materialId: number): Promise<MaterialAnalysisResult | null> {
  try {
    // Get the material details from the database
    const material = await storage.getLessonPlanMaterial(materialId);
    if (!material) {
      console.error(`Material with ID ${materialId} not found`);
      return null;
    }

    // Read the file content
    const filePath = material.fileUrl.replace(`${process.env.BASE_URL || ''}`, '');
    const absolutePath = path.join(process.cwd(), filePath);
    
    if (!fs.existsSync(absolutePath)) {
      console.error(`File not found at path: ${absolutePath}`);
      return null;
    }
    
    // Extract file extension
    const fileExt = path.extname(absolutePath).toLowerCase();
    let fileContent = '';
    
    // Process based on file type
    if (['.txt', '.md', '.rtf'].includes(fileExt)) {
      fileContent = fs.readFileSync(absolutePath, 'utf8');
    } else if (fileExt === '.pdf') {
      // Extract content from PDF using OpenAI vision API
      try {
        const fileBase64 = fs.readFileSync(absolutePath).toString('base64');
        const response = await openai.chat.completions.create({
          model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
          messages: [
            {
              role: "system",
              content: "You are an expert at extracting and summarizing educational content from PDF documents. Extract all text, tables, and relevant information from the PDF document provided."
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Extract all the educational content from this PDF document. Include any text, tables, and relevant information that could be used for creating a lesson plan."
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:application/pdf;base64,${fileBase64}`
                  }
                }
              ]
            }
          ],
          max_tokens: 4000,
        });
        
        fileContent = response.choices[0].message.content || `Failed to extract content from PDF: ${material.fileName}`;
      } catch (error) {
        console.error('Error extracting PDF content with OpenAI:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        fileContent = `Error extracting content from PDF: ${material.fileName}. Error: ${errorMessage}`;
      }
    } else if (['.docx', '.doc'].includes(fileExt)) {
      // For DOC/DOCX files, we're still not implementing full extraction yet
      // In a complete implementation, you would use a library like mammoth
      fileContent = `[Content extracted from ${fileExt} file: ${material.fileName}]`;
    } else {
      // For other file types, we'll just use the file name
      fileContent = `File: ${material.fileName}`;
    }
    
    // Analyze the content with OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an expert educational content analyst. Your task is to analyze teaching materials and extract key information that would be useful for creating lesson plans."
        },
        {
          role: "user",
          content: `Analyze the following educational material and extract key information in JSON format:\n\n${fileContent}\n\nProvide the following: keyTopics (array), keyVocabulary (array), suggestedActivities (array), contentSummary (string).`
        }
      ],
      response_format: { type: "json_object" }
    });
    
    // Parse the JSON response
    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      ...result,
      fileType: material.fileType,
      fileName: material.fileName
    };
  } catch (error) {
    console.error('Error analyzing material:', error);
    return null;
  }
}

/**
 * Generates a lesson plan based on analyzed materials and teacher inputs
 * @param options The options for lesson plan generation
 * @returns Generated lesson plan content
 */
export async function generateLessonPlan(
  options: LessonPlanGenerationOptions,
  lessonPlanId: number
): Promise<string | null> {
  try {
    let materials: MaterialAnalysisResult[] = [];
    
    // If material IDs are provided, analyze each material
    if (options.materialIds && options.materialIds.length > 0) {
      const materialAnalyses = await Promise.all(
        options.materialIds.map(id => analyzeMaterial(id))
      );
      materials = materialAnalyses.filter(m => m !== null) as MaterialAnalysisResult[];
    }
    
    // Prepare the prompt for lesson plan generation
    const prompt = `
Create a comprehensive lesson plan for a ${options.duration} class on "${options.title}" for ${options.gradeLevel} grade ${options.subject} class.

${options.teacherNotes ? `Additional notes from the teacher: ${options.teacherNotes}` : ''}

${materials.length > 0 ? `
Based on the following uploaded materials:
${materials.map((m, i) => `
Material ${i+1}: ${m.fileName}
Key Topics: ${m.keyTopics.join(', ')}
Key Vocabulary: ${m.keyVocabulary.join(', ')}
Content Summary: ${m.contentSummary}
`).join('\n')}
` : ''}

Create a structured lesson plan in HTML format with the following sections:
1. Learning Objectives (list of 3-5 clear objectives)
2. Standards Alignment (reference relevant educational standards)
3. Materials Needed (comprehensive list)
4. Warm-up Activity (5-10 minutes)
5. Main Lesson (step-by-step instructions)
6. Guided Practice (activities for students to apply concepts)
7. Independent Practice (individual work)
8. Assessment (formative and summative)
9. Differentiation (for different learning needs)
10. Closure (summary and reflection)
11. Extensions/Homework (if applicable)

For each section, provide detailed content in HTML format using <h2> for section headers, <p> for paragraphs, <ul>/<li> for lists, etc.
`;

    // Generate the lesson plan using OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an expert educator with years of experience creating effective lesson plans. Your task is to create a detailed, engaging, and standards-aligned lesson plan based on the teacher's inputs and any uploaded materials."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 2500,
    });
    
    const generatedContent = response.choices[0].message.content;
    
    // Store the generated content in the database
    if (generatedContent) {
      await storage.createLessonPlanGeneratedContent({
        lessonPlanId,
        prompt,
        generatedContent,
        contentType: 'full_lesson_plan',
        isApplied: true
      });
    }
    
    return generatedContent || null;
  } catch (error) {
    console.error('Error generating lesson plan:', error);
    return null;
  }
}

/**
 * Generates specific components of a lesson plan
 * @param lessonPlanId The ID of the lesson plan
 * @param componentType The type of component to generate (objectives, activities, assessment, etc.)
 * @param context Additional context for the generation
 * @returns Generated component content
 */
export async function generateLessonPlanComponent(
  lessonPlanId: number,
  componentType: string,
  context: string
): Promise<string | null> {
  try {
    // Get the lesson plan details
    const lessonPlan = await storage.getLessonPlan(lessonPlanId);
    if (!lessonPlan) {
      console.error(`Lesson plan with ID ${lessonPlanId} not found`);
      return null;
    }
    
    // Prepare component-specific prompt
    let prompt = '';
    
    switch (componentType) {
      case 'objectives':
        prompt = `Create 3-5 clear, measurable learning objectives for a lesson on "${lessonPlan.title}" for ${lessonPlan.gradeLevel} grade ${lessonPlan.subject}. ${context}`;
        break;
      case 'activities':
        prompt = `Create a series of engaging activities for a ${lessonPlan.duration} lesson on "${lessonPlan.title}" for ${lessonPlan.gradeLevel} grade ${lessonPlan.subject}. Include warm-up, main activities, and closure. ${context}`;
        break;
      case 'assessment':
        prompt = `Create assessment strategies for a lesson on "${lessonPlan.title}" for ${lessonPlan.gradeLevel} grade ${lessonPlan.subject}. Include both formative and summative assessment ideas. ${context}`;
        break;
      case 'differentiation':
        prompt = `Provide differentiation strategies for a lesson on "${lessonPlan.title}" for ${lessonPlan.gradeLevel} grade ${lessonPlan.subject}. Include accommodations for advanced learners, struggling students, and students with different learning styles. ${context}`;
        break;
      case 'materials':
        prompt = `List all materials needed for a ${lessonPlan.duration} lesson on "${lessonPlan.title}" for ${lessonPlan.gradeLevel} grade ${lessonPlan.subject}. Be comprehensive and specific. ${context}`;
        break;
      default:
        prompt = `Generate content for the ${componentType} section of a lesson plan on "${lessonPlan.title}" for ${lessonPlan.gradeLevel} grade ${lessonPlan.subject}. ${context}`;
    }
    
    // Generate the component content using OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an expert educator specializing in creating effective lesson plans. Your task is to generate a specific component of a lesson plan based on the provided information."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1000,
    });
    
    const generatedContent = response.choices[0].message.content;
    
    // Store the generated content in the database
    if (generatedContent) {
      await storage.createLessonPlanGeneratedContent({
        lessonPlanId,
        prompt,
        generatedContent,
        contentType: componentType,
        isApplied: false
      });
    }
    
    return generatedContent || null;
  } catch (error) {
    console.error(`Error generating lesson plan ${componentType}:`, error);
    return null;
  }
}

/**
 * Formats a lesson plan for export to docx format
 * @param lessonPlanId The ID of the lesson plan to format
 * @returns Formatted lesson plan content for export
 */
export async function formatLessonPlanForExport(lessonPlanId: number): Promise<string | null> {
  try {
    // Get the lesson plan and related content
    const lessonPlan = await storage.getLessonPlan(lessonPlanId);
    if (!lessonPlan) {
      console.error(`Lesson plan with ID ${lessonPlanId} not found`);
      return null;
    }
    
    // Get the teacher details
    const teacher = await storage.getTeacher(lessonPlan.teacherId);
    
    // Get the class details if a class is associated
    let className = "";
    if (lessonPlan.classId) {
      const class_ = await storage.getClass(lessonPlan.classId);
      if (class_) {
        className = class_.name;
      }
    }
    
    // Format the content using the standard lesson plan template structure
    const exportContent = `
# ${lessonPlan.title}

## Lesson Information
- **Subject:** ${lessonPlan.subject || 'N/A'}
- **Grade Level:** ${lessonPlan.gradeLevel || 'N/A'}
- **Duration:** ${lessonPlan.duration || 'N/A'}
- **Teacher:** ${teacher ? `${teacher.firstName} ${teacher.lastName}` : 'N/A'}
${className ? `- **Class:** ${className}` : ''}

## Description
${lessonPlan.description || 'No description provided.'}

## Objectives
${lessonPlan.objectives && lessonPlan.objectives.length > 0 
  ? lessonPlan.objectives.map((obj: string) => `- ${obj}`).join('\n') 
  : 'No objectives specified.'}

## Materials
${lessonPlan.materials && lessonPlan.materials.length > 0 
  ? lessonPlan.materials.map((mat: string) => `- ${mat}`).join('\n') 
  : 'No materials specified.'}

${lessonPlan.content}

## Notes
- Created using Evalia Lesson Plan Generator
- Date: ${new Date().toLocaleDateString()}
    `;
    
    return exportContent;
  } catch (error) {
    console.error('Error formatting lesson plan for export:', error);
    return null;
  }
}