class QuizOption < ApplicationRecord
  belongs_to :quiz_question, foreign_key: 'question_id'
  
  has_many :quiz_answers, foreign_key: 'selected_option_id', dependent: :nullify
  
  # Validations
  validates :question_id, presence: true
  validates :text, presence: true
  
  # Callbacks
  before_save :ensure_only_one_correct_option
  
  # Scopes
  scope :ordered, -> { order(position: :asc) }
  scope :correct, -> { where(is_correct: true) }
  
  # Methods
  def selection_rate
    question = quiz_question
    total_answers = question.quiz_answers.count
    selected_count = quiz_answers.count
    
    total_answers > 0 ? ((selected_count.to_f / total_answers) * 100).round : 0
  end
  
  private
  
  def ensure_only_one_correct_option
    if is_correct_changed? && is_correct
      # If this option is being set as correct, make all other options for this question not correct
      quiz_question.quiz_options.where.not(id: id).update_all(is_correct: false)
    end
  end
end