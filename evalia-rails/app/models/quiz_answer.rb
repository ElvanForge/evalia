class QuizAnswer < ApplicationRecord
  # Associations
  belongs_to :quiz_submission
  belongs_to :quiz_question
  belongs_to :quiz_option, optional: true
  
  # Validations
  validates :quiz_submission_id, uniqueness: { scope: :quiz_question_id, message: "already has an answer for this question" }
  
  # Short answer validation is skipped for multiple choice questions
  validates :answer_text, presence: true, if: -> { quiz_question.short_answer? }
  
  # Option validation is skipped for short answer questions
  validates :quiz_option_id, presence: true, if: -> { quiz_question.multiple_choice? || quiz_question.true_false? }
  
  def correct?
    if quiz_question.multiple_choice? || quiz_question.true_false?
      quiz_option&.is_correct || false
    elsif quiz_question.short_answer?
      # For short answer, correctness depends on teacher's score override
      score_override&.>= 100 || false
    else
      false
    end
  end
  
  def score
    if quiz_question.multiple_choice? || quiz_question.true_false?
      correct? ? quiz_question.points : 0
    elsif quiz_question.short_answer?
      if score_override.present?
        (quiz_question.points * score_override / 100.0).round(2)
      else
        0
      end
    else
      0
    end
  end
  
  def color_class
    if correct?
      'text-green-600 bg-green-100'
    else
      'text-red-600 bg-red-100'
    end
  end
end