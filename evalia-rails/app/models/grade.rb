class Grade < ApplicationRecord
  belongs_to :student
  belongs_to :assignment
  
  validates :score, presence: true, numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 120 }
  
  before_save :calculate_letter_grade
  
  # Get the related course through the assignment
  def course
    assignment.course
  end
  
  # Calculate points earned based on the score and max score
  def points_earned
    return nil unless assignment.max_score
    
    # Use the percentage and apply it to the max score
    (score / 100.0 * assignment.max_score).round(2)
  end
  
  private
  
  # Calculate and set the letter grade based on the score
  def calculate_letter_grade
    grade_scale = assignment.course.teacher.default_grade_scale
    self.letter_grade = grade_scale.letter_for_percent(score)
  end
end