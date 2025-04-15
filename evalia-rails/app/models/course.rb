class Course < ApplicationRecord
  belongs_to :teacher
  belongs_to :school, optional: true
  
  has_many :student_courses, dependent: :destroy
  has_many :students, through: :student_courses
  
  has_many :assignments, dependent: :destroy
  
  has_many :quiz_courses, dependent: :destroy
  has_many :quizzes, through: :quiz_courses
  
  has_many :lesson_plans, dependent: :destroy
  
  validates :name, presence: true
  
  # Scopes
  scope :active, -> { where(archived: false) }
  scope :archived, -> { where(archived: true) }
  
  # Calculate the average grade for the class
  def average_grade
    total_grades = 0
    total_count = 0
    
    students.each do |student|
      avg = student.average_grade(id)
      next if avg.zero?
      
      total_grades += avg
      total_count += 1
    end
    
    total_count.zero? ? 0 : (total_grades / total_count)
  end
  
  # Count students at risk (with D or F average grades)
  def at_risk_count
    count = 0
    students.each do |student|
      avg = student.average_grade(id)
      letter = teacher.default_grade_scale.letter_for_percent(avg)
      count += 1 if ['D', 'F'].include?(letter)
    end
    count
  end
  
  # Get a hash of all student average grades for this course
  def all_student_averages
    result = {}
    students.each do |student|
      result[student.id] = student.average_grade(id)
    end
    result
  end
  
  # Get grade distribution for this course
  def grade_distribution
    distribution = { 'A' => 0, 'B' => 0, 'C' => 0, 'D' => 0, 'F' => 0 }
    
    students.each do |student|
      avg = student.average_grade(id)
      letter = teacher.default_grade_scale.letter_for_percent(avg)
      distribution[letter] ||= 0
      distribution[letter] += 1
    end
    
    distribution
  end
  
  # Get percentage for a specific grade letter
  def grade_distribution_percentage(letter)
    distribution = grade_distribution
    total = distribution.values.sum
    
    return 0 if total.zero?
    (distribution[letter] || 0).to_f / total
  end
end