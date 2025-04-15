class QuizOption < ApplicationRecord
  # Associations
  belongs_to :quiz_question
  has_many :quiz_answers, dependent: :destroy
  
  # Validations
  validates :option_text, presence: true
  validates :position, numericality: { greater_than_or_equal_to: 0 }
  
  # Scopes
  scope :ordered, -> { order(:position) }
  scope :correct, -> { where(is_correct: true) }
  
  # Callbacks
  before_validation :set_default_position, on: :create
  
  def correct?
    is_correct
  end
  
  private
  
  def set_default_position
    self.position ||= (quiz_question.quiz_options.maximum(:position) || 0) + 1
  end
end