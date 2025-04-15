class QuizAnswer < ApplicationRecord
  belongs_to :quiz_submission, foreign_key: 'submission_id'
  belongs_to :quiz_question, foreign_key: 'question_id'
  belongs_to :selected_option, class_name: 'QuizOption', optional: true
  
  # Validations
  validates :submission_id, presence: true
  validates :question_id, presence: true
  validates :question_id, uniqueness: { scope: :submission_id, message: "has already been answered in this submission" }
  
  # Methods
  def correct?
    selected_option&.is_correct
  end
  
  def points_earned
    if correct?
      quiz_question.points
    else
      0
    end
  end
end