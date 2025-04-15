class School < ApplicationRecord
  has_many :teachers, dependent: :nullify
  has_many :courses, through: :teachers
  has_many :students, through: :courses
  
  validates :name, presence: true
  
  # Check if school has an active subscription
  def subscribed?
    stripe_subscription_id.present? && stripe_subscription_status == 'active'
  end
  
  # Count teachers in this school
  def teacher_count
    teachers.count
  end
  
  # Count students in this school
  def student_count
    students.distinct.count
  end
  
  # Count courses in this school
  def course_count
    courses.count
  end
  
  # Get all courses for this school
  def all_courses
    Course.where(teacher_id: teachers.pluck(:id))
  end
end