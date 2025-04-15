class Assignment < ApplicationRecord
  belongs_to :course
  has_many :grades, dependent: :destroy
  
  validates :name, presence: true
  
  # Get a specific student's grade for this assignment
  def grade_for_student(student_id)
    grades.find_by(student_id: student_id)
  end
  
  # Calculate the average score for this assignment
  def average_score
    return 0 if grades.empty?
    
    total = 0
    grades.each do |grade|
      total += grade.score
    end
    
    total / grades.count
  end
  
  # Get the letter grade representation of the average score
  def average_letter
    return nil if grades.empty?
    
    avg = average_score
    course.teacher.default_grade_scale.letter_for_percent(avg)
  end
  
  # Count how many students have been graded for this assignment
  def graded_count
    grades.count
  end
  
  # Calculate the percentage of enrolled students who have been graded
  def graded_percentage
    total_students = course.students.count
    return 100 if total_students.zero?
    
    (graded_count.to_f / total_students * 100).round
  end
  
  # Check if the assignment is overdue
  def overdue?
    due_date.present? && due_date < Time.current
  end
  
  # Check if all students have been graded
  def fully_graded?
    graded_count == course.students.count
  end
  
  # Get grades in descending order (highest first)
  def grades_by_score
    grades.order(score: :desc)
  end
  
  # Get the highest score
  def highest_score
    grades.maximum(:score) || 0
  end
  
  # Get the lowest score
  def lowest_score
    grades.minimum(:score) || 0
  end
end