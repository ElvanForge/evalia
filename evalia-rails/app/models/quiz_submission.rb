class QuizSubmission < ApplicationRecord
  belongs_to :student
  belongs_to :quiz
  
  has_many :quiz_answers, foreign_key: 'submission_id', dependent: :destroy
  
  # Validations
  validates :student_id, presence: true
  validates :quiz_id, presence: true
  validates :score, numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 100 }, allow_nil: true
  validates :student_id, uniqueness: { scope: :quiz_id, message: "has already submitted this quiz" }
  
  # Callbacks
  before_save :calculate_score, if: :completed?
  after_save :create_grade, if: :completed?
  
  # Scopes
  scope :completed, -> { where(completed: true) }
  scope :in_progress, -> { where(completed: false) }
  scope :recent, -> { order(created_at: :desc) }
  
  # Methods
  def answer_count
    quiz_answers.count
  end
  
  def correct_answer_count
    quiz_answers.joins(:selected_option).where(quiz_options: { is_correct: true }).count
  end
  
  def question_count
    quiz.quiz_questions.count
  end
  
  def calculate_score
    return unless completed?
    return if question_count == 0
    
    correct = correct_answer_count
    total = question_count
    
    self.score = ((correct.to_f / total) * 100).round(1)
  end
  
  def letter_grade
    # Get the teacher's grade scale
    teacher_id = quiz.teacher_id
    teacher = Teacher.find(teacher_id)
    grade_scale = teacher.default_grade_scale
    
    # If no grade scale exists, use standard scale
    unless grade_scale
      return case score
             when 90..100 then 'A'
             when 80...90 then 'B'
             when 70...80 then 'C'
             when 60...70 then 'D'
             else 'F'
             end
    end
    
    # Find the appropriate entry in the grade scale
    entries = grade_scale.grade_scale_entries.order(min_score: :desc)
    
    entries.each do |entry|
      if score >= entry.min_score
        return entry.letter_grade
      end
    end
    
    # Default to F if no match found
    'F'
  end
  
  private
  
  def create_grade
    # Find or create a corresponding grade record
    # First check if an assignment exists for this quiz in the student's classes
    student_class_ids = student.courses.pluck(:id)
    
    quiz.quiz_courses.where(class_id: student_class_ids).each do |quiz_course|
      # Find or create an assignment for this quiz in this class
      assignment = Assignment.find_or_create_by(
        class_id: quiz_course.class_id,
        name: "Quiz: #{quiz.title}",
        description: "Automatically generated from quiz #{quiz.title}",
        points_possible: quiz.total_points
      )
      
      # Create or update the grade
      grade = Grade.find_or_initialize_by(
        student_id: student_id,
        assignment_id: assignment.id
      )
      
      grade.score = score
      grade.letter_grade = letter_grade
      grade.comment = "Quiz submission on #{created_at.strftime('%Y-%m-%d')}"
      grade.save!
    end
  end
end