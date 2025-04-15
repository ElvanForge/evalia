class AdaptExistingSchema < ActiveRecord::Migration[7.0]
  def change
    # We don't need to create tables since they already exist in the PostgreSQL database
    # We just need to add any columns that might be missing for Rails to work properly
    
    # Add necessary timestamps if missing
    add_timestamps_if_missing :schools
    add_timestamps_if_missing :teachers
    add_timestamps_if_missing :courses
    add_timestamps_if_missing :students
    add_timestamps_if_missing :student_courses
    add_timestamps_if_missing :assignments
    add_timestamps_if_missing :grades
    add_timestamps_if_missing :grade_scales
    add_timestamps_if_missing :grade_scale_entries
    add_timestamps_if_missing :quizzes
    add_timestamps_if_missing :quiz_courses
    add_timestamps_if_missing :quiz_questions
    add_timestamps_if_missing :quiz_options
    add_timestamps_if_missing :quiz_submissions
    add_timestamps_if_missing :quiz_answers
    add_timestamps_if_missing :lesson_plans
    add_timestamps_if_missing :lesson_plan_materials
    add_timestamps_if_missing :lesson_plan_generated_contents
    
    # Rename any columns that need to be changed for Rails conventions
    # In Rails, the foreign key columns should be singular_table_name_id
    # Our database already follows this convention from Drizzle
    
    # Add any indexes that might be missing
    add_index_if_missing :teachers, :school_id
    add_index_if_missing :teachers, :username, unique: true
    add_index_if_missing :teachers, :email, unique: true
    
    add_index_if_missing :students, :teacher_id
    add_index_if_missing :students, :school_id
    add_index_if_missing :students, :student_number
    
    add_index_if_missing :courses, :teacher_id
    add_index_if_missing :courses, :school_id
    
    add_index_if_missing :student_courses, [:student_id, :class_id], unique: true
    
    add_index_if_missing :assignments, :class_id
    
    add_index_if_missing :grades, :student_id
    add_index_if_missing :grades, :assignment_id
    add_index_if_missing :grades, [:student_id, :assignment_id], unique: true
    
    add_index_if_missing :grade_scales, :teacher_id
    
    add_index_if_missing :grade_scale_entries, :grade_scale_id
    
    add_index_if_missing :quizzes, :teacher_id
    
    add_index_if_missing :quiz_courses, [:quiz_id, :class_id], unique: true
    
    add_index_if_missing :quiz_questions, :quiz_id
    
    add_index_if_missing :quiz_options, :question_id
    
    add_index_if_missing :quiz_submissions, :student_id
    add_index_if_missing :quiz_submissions, :quiz_id
    
    add_index_if_missing :quiz_answers, :submission_id
    add_index_if_missing :quiz_answers, :question_id
    add_index_if_missing :quiz_answers, :selected_option_id
    
    add_index_if_missing :lesson_plans, :teacher_id
    add_index_if_missing :lesson_plans, :class_id
    
    add_index_if_missing :lesson_plan_materials, :lesson_plan_id
    
    add_index_if_missing :lesson_plan_generated_contents, :lesson_plan_id
  end
  
  private
  
  def add_timestamps_if_missing(table_name)
    # Only add timestamps if the table exists and timestamps are missing
    if table_exists?(table_name)
      # Add created_at if it doesn't exist
      unless column_exists?(table_name, :created_at)
        add_column table_name, :created_at, :datetime, null: true
      end
      
      # Add updated_at if it doesn't exist
      unless column_exists?(table_name, :updated_at)
        add_column table_name, :updated_at, :datetime, null: true
      end
    end
  end
  
  def add_index_if_missing(table_name, column_name, options = {})
    # Only add index if the table exists and index doesn't exist
    if table_exists?(table_name)
      index_name = options[:name] || index_name(table_name, column_name)
      
      unless index_exists?(table_name, column_name, options)
        add_index table_name, column_name, options
      end
    end
  end
end