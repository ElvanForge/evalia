class LessonPlanGeneratedContent < ApplicationRecord
  belongs_to :lesson_plan
  
  # Validations
  validates :lesson_plan_id, presence: true
  validates :content_type, presence: true
  validates :content, presence: true
  validates :status, presence: true
  
  # Scopes
  scope :applied, -> { where(is_applied: true) }
  scope :not_applied, -> { where(is_applied: false) }
  scope :generated, -> { where(status: 'generated') }
  scope :failed, -> { where(status: 'failed') }
  scope :by_type, ->(content_type) { where(content_type: content_type) }
  
  # Methods
  def apply_to_lesson_plan
    lesson_plan.apply_generated_content(id)
  end
  
  def type_name
    case content_type
    when 'learning_objectives'
      'Learning Objectives'
    when 'activities'
      'Classroom Activities'
    when 'assessment'
      'Assessment Plan'
    when 'resources'
      'Resources'
    when 'full_plan'
      'Complete Lesson Plan'
    else
      content_type.titleize
    end
  end
end