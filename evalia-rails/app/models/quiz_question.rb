class QuizQuestion < ApplicationRecord
  # Associations
  belongs_to :quiz
  has_many :quiz_options, dependent: :destroy
  has_many :quiz_answers, dependent: :destroy
  
  # Active Storage for question image
  has_one_attached :image
  
  # Validations
  validates :question_text, presence: true
  validates :question_type, presence: true, inclusion: { in: %w[multiple_choice true_false short_answer matching] }
  validates :points, numericality: { greater_than_or_equal_to: 0 }
  validates :position, numericality: { greater_than_or_equal_to: 0 }
  
  # Scopes
  scope :ordered, -> { order(:position) }
  scope :multiple_choice, -> { where(question_type: 'multiple_choice') }
  scope :true_false, -> { where(question_type: 'true_false') }
  scope :short_answer, -> { where(question_type: 'short_answer') }
  
  # Callbacks
  before_validation :set_default_position, on: :create
  after_create :create_default_options_for_true_false
  
  # Question types
  TYPES = ['multiple_choice', 'true_false', 'short_answer', 'matching'].freeze
  
  def correct_option
    quiz_options.find_by(is_correct: true)
  end
  
  def correct_option_id
    correct_option&.id
  end
  
  def multiple_choice?
    question_type == 'multiple_choice'
  end
  
  def true_false?
    question_type == 'true_false'
  end
  
  def short_answer?
    question_type == 'short_answer'
  end
  
  def matching?
    question_type == 'matching'
  end
  
  def has_image?
    image.attached?
  end
  
  private
  
  def set_default_position
    self.position ||= (quiz.quiz_questions.maximum(:position) || 0) + 1
  end
  
  def create_default_options_for_true_false
    if true_false?
      quiz_options.create!(
        option_text: 'True',
        is_correct: is_true.present? ? is_true : false,
        position: 1
      )
      
      quiz_options.create!(
        option_text: 'False',
        is_correct: is_true.present? ? !is_true : true,
        position: 2
      )
    end
  end
end