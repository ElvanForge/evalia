class Course < ApplicationRecord
  belongs_to :teacher
  belongs_to :school, optional: true
  
  has_many :student_courses, dependent: :destroy
  has_many :students, through: :student_courses
  has_many :assignments, foreign_key: 'class_id', dependent: :destroy
  has_many :grades, through: :assignments
  has_many :quiz_courses, foreign_key: 'class_id', dependent: :destroy
  has_many :quizzes, through: :quiz_courses
  has_many :lesson_plans, foreign_key: 'class_id', dependent: :destroy
  
  # Validations
  validates :name, presence: true
  validates :teacher_id, presence: true
  
  # Methods
  def student_count
    students.count
  end
  
  def average_grade
    grades = Grade.joins(:assignment)
                  .where(assignments: { class_id: id })
                  .average(:score)
                  
    grades ? grades.round(1) : nil
  end
  
  def completion_rate
    if assignments.any?
      total_possible = assignments.count * students.count
      total_graded = grades.count
      
      total_possible > 0 ? ((total_graded.to_f / total_possible) * 100).round : 0
    else
      0
    end
  end
  
  def grade_distribution
    grades.group(:letter_grade).count
  end
  
  def enrollment_status_for(student)
    student_courses.exists?(student_id: student.id)
  end
end