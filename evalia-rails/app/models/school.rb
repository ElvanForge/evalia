class School < ApplicationRecord
  has_many :teachers, dependent: :nullify
  has_many :students, dependent: :nullify
  has_many :courses, dependent: :nullify
  
  # Validations
  validates :name, presence: true
  validates :subscription_status, inclusion: { in: %w(active canceled trial pending), allow_nil: true }
  
  # Scopes
  scope :active, -> { where(subscription_status: 'active') }
  scope :trial, -> { where(subscription_status: 'trial') }
  
  # Methods
  def active?
    subscription_status == 'active'
  end
  
  def in_trial?
    subscription_status == 'trial'
  end
  
  def student_count
    students.count
  end
  
  def teacher_count
    teachers.count
  end
  
  def course_count
    courses.count
  end
  
  def managers
    teachers.where(role: 'manager')
  end
end