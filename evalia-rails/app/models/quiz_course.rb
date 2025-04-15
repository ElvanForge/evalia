class QuizCourse < ApplicationRecord
  belongs_to :quiz
  belongs_to :course, foreign_key: 'class_id'
  
  # Validations
  validates :quiz_id, presence: true
  validates :class_id, presence: true
  validates :quiz_id, uniqueness: { scope: :class_id, message: "is already assigned to this class" }
  
  # Scopes
  scope :by_quiz, ->(quiz_id) { where(quiz_id: quiz_id) }
  scope :by_course, ->(course_id) { where(class_id: course_id) }
end