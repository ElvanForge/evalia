class QuizSubmission < ApplicationRecord
  # Associations
  belongs_to :quiz
  belongs_to :student
  has_many :quiz_answers, dependent: :destroy
  
  # Validations
  validates :score, numericality: { greater_than_or_equal_to: 0 }
  validates :score_percent, numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 100 }
  validates :student_id, uniqueness: { scope: :quiz_id, message: "has already submitted this quiz" }
  
  # Scopes
  scope :completed, -> { where(completed: true) }
  scope :recent, -> { order(created_at: :desc) }
  scope :passing, -> { joins(:quiz).where('quiz_submissions.score_percent >= quizzes.passing_score') }
  scope :failing, -> { joins(:quiz).where('quiz_submissions.score_percent < quizzes.passing_score') }
  
  # Callbacks
  before_validation :calculate_score, on: [:create, :update]
  
  def completed?
    completed
  end
  
  def passed?
    passing_score = quiz.passing_score || 60
    score_percent >= passing_score
  end
  
  def failed?
    !passed?
  end
  
  def letter_grade
    teacher = quiz.teacher
    grade_scale = teacher.default_grade_scale
    
    grade_scale.grade_scale_entries.each do |entry|
      if score_percent >= entry.min_score && score_percent <= entry.max_score
        return entry.letter
      end
    end
    
    'F' # Default to F if no matching range found
  end
  
  def color_class
    case letter_grade
    when 'A'
      'text-green-600 bg-green-100'
    when 'B'
      'text-blue-600 bg-blue-100'
    when 'C'
      'text-yellow-600 bg-yellow-100'
    when 'D'
      'text-orange-600 bg-orange-100'
    when 'F'
      'text-red-600 bg-red-100'
    else
      'text-gray-600 bg-gray-100'
    end
  end
  
  def completion_time
    return nil unless started_at && completed_at
    
    seconds = (completed_at - started_at).to_i
    minutes = seconds / 60
    
    if minutes > 60
      hours = minutes / 60
      remaining_minutes = minutes % 60
      "#{hours}h #{remaining_minutes}m"
    else
      "#{minutes}m #{seconds % 60}s"
    end
  end
  
  def answers_by_question
    result = {}
    
    quiz_answers.includes(:quiz_question, :quiz_option).each do |answer|
      result[answer.quiz_question_id] = answer
    end
    
    result
  end
  
  def calculate_grade_for_assignment(assignment_id)
    assignment = Assignment.find_by(id: assignment_id)
    return unless assignment
    
    # Create or update grade
    grade = Grade.find_or_initialize_by(
      student_id: student_id,
      assignment_id: assignment_id
    )
    
    # Calculate score based on assignment max_score
    if assignment.max_score
      grade.score = (score_percent / 100.0) * assignment.max_score
    else
      grade.score = score
    end
    
    grade.save
  end
  
  private
  
  def calculate_score
    return if quiz_answers.empty?
    
    total_points = quiz.quiz_questions.sum(:points)
    earned_points = 0
    
    quiz_answers.includes(:quiz_question, :quiz_option).each do |answer|
      question = answer.quiz_question
      
      if question.multiple_choice? || question.true_false?
        if answer.quiz_option&.is_correct
          earned_points += question.points
        end
      elsif question.short_answer?
        # For short answer, a teacher needs to grade manually
        # For now, we'll give full points if there's an answer
        if answer.answer_text.present?
          earned_points += question.points * (answer.score_override || 0) / 100.0
        end
      end
    end
    
    self.score = earned_points
    self.score_percent = total_points > 0 ? (earned_points / total_points * 100).round : 0
  end
end