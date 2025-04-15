class LessonPlanGeneratedContent < ApplicationRecord
  # Associations
  belongs_to :lesson_plan
  
  # Validations
  validates :content_type, presence: true, inclusion: {
    in: %w[objectives activities materials assessment homework full_plan]
  }
  
  validates :content, presence: true
  validates :is_applied, inclusion: { in: [true, false] }
  
  # Scopes
  scope :applied, -> { where(is_applied: true) }
  scope :not_applied, -> { where(is_applied: false) }
  scope :recent, -> { order(created_at: :desc) }
  scope :by_type, ->(type) { where(content_type: type) }
  
  # Content types
  TYPES = {
    'objectives' => 'Learning Objectives',
    'activities' => 'Learning Activities',
    'materials' => 'Materials List',
    'assessment' => 'Assessment Methods',
    'homework' => 'Homework',
    'full_plan' => 'Complete Lesson Plan'
  }.freeze
  
  def type_label
    TYPES[content_type] || content_type.titleize
  end
  
  def apply_to_lesson_plan
    lesson_plan.apply_generated_content(id)
  end
  
  def truncated_content(length = 100)
    return '' unless content
    
    if content.length > length
      "#{content[0...length]}..."
    else
      content
    end
  end
  
  def formatted_content
    content.gsub("\n", "<br>").html_safe
  end
  
  def applied?
    is_applied
  end
  
  def icon_class
    case content_type
    when 'objectives'
      'target'
    when 'activities'
      'activity'
    when 'materials'
      'list'
    when 'assessment'
      'check-square'
    when 'homework'
      'book'
    when 'full_plan'
      'file-text'
    else
      'file'
    end
  end
  
  def color_class
    applied? ? 'text-green-600 bg-green-100' : 'text-blue-600 bg-blue-100'
  end
end