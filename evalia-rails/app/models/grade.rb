class Grade < ApplicationRecord
  belongs_to :student
  belongs_to :assignment
  
  # Validations
  validates :student_id, presence: true
  validates :assignment_id, presence: true
  validates :score, numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 100 }
  validates :student_id, uniqueness: { scope: :assignment_id, message: "already has a grade for this assignment" }
  
  # Callbacks
  before_save :calculate_letter_grade
  
  # Scopes
  scope :recent, -> { order(created_at: :desc) }
  scope :by_student, ->(student_id) { where(student_id: student_id) }
  scope :by_assignment, ->(assignment_id) { where(assignment_id: assignment_id) }
  scope :by_letter_grade, ->(letter_grade) { where(letter_grade: letter_grade) }
  
  # Methods
  def points_earned
    if assignment.points_possible.present?
      (score / 100.0 * assignment.points_possible).round(1)
    else
      score
    end
  end
  
  def submission_status
    if created_at > assignment.due_date
      'late'
    else
      'on_time'
    end
  end
  
  def formatted_score
    "#{score}%"
  end
  
  private
  
  def calculate_letter_grade
    # Get the teacher's grade scale
    teacher_id = assignment.course.teacher_id
    teacher = Teacher.find(teacher_id)
    grade_scale = teacher.default_grade_scale
    
    # If no grade scale exists, use standard scale
    unless grade_scale
      self.letter_grade = case score
                         when 90..100 then 'A'
                         when 80...90 then 'B'
                         when 70...80 then 'C'
                         when 60...70 then 'D'
                         else 'F'
                         end
      return
    end
    
    # Find the appropriate entry in the grade scale
    entries = grade_scale.grade_scale_entries.order(min_score: :desc)
    
    entries.each do |entry|
      if score >= entry.min_score
        self.letter_grade = entry.letter_grade
        return
      end
    end
    
    # Default to F if no match found
    self.letter_grade = 'F'
  end
end