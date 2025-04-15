class QuizCourse < ApplicationRecord
  # Use original table name
  self.table_name = 'quiz_classes'
  
  # Associations
  belongs_to :quiz
  belongs_to :course, foreign_key: 'class_id'
  
  # Validations
  validates :quiz_id, uniqueness: { scope: :class_id, message: "is already assigned to this course" }
  
  # Scopes
  scope :active, -> { where(active: true) }
  
  # Assign date with default
  before_create :set_assign_date
  
  private
  
  def set_assign_date
    self.assigned_at ||= Time.current
  end
end