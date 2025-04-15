class QuizQuestion < ApplicationRecord
  belongs_to :quiz
  
  has_many :quiz_options, foreign_key: 'question_id', dependent: :destroy
  has_many :quiz_answers, foreign_key: 'question_id', dependent: :destroy
  
  has_one_attached :image
  
  # Validations
  validates :quiz_id, presence: true
  validates :text, presence: true
  validates :points, numericality: { greater_than: 0 }
  
  # Callbacks
  after_save :update_quiz_total_points
  
  # Scopes
  scope :ordered, -> { order(position: :asc) }
  scope :with_image, -> { where.not(image_path: nil) }
  
  # Methods
  def correct_option
    quiz_options.find_by(is_correct: true)
  end
  
  def has_image?
    image.attached? || image_path.present?
  end
  
  def image_url
    if image.attached?
      Rails.application.routes.url_helpers.rails_blob_path(image, only_path: true)
    else
      image_path
    end
  end
  
  def correct_answer_rate
    total_answers = quiz_answers.count
    correct_answers = quiz_answers.joins(:selected_option).where(quiz_options: { is_correct: true }).count
    
    total_answers > 0 ? ((correct_answers.to_f / total_answers) * 100).round : 0
  end
  
  private
  
  def update_quiz_total_points
    quiz.update(total_points: quiz.quiz_questions.sum(:points))
  end
end