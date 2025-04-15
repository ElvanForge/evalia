class Teacher < ApplicationRecord
  has_many :courses, dependent: :destroy
  has_many :grade_scales, dependent: :destroy
  has_many :quizzes, dependent: :destroy
  has_many :lesson_plans, dependent: :destroy
  belongs_to :school, optional: true
  
  validates :username, presence: true, uniqueness: true
  validates :password, presence: true, if: :password_required?
  validates :first_name, presence: true
  
  # Returns the full name of the teacher
  def full_name
    if last_name.present?
      "#{first_name} #{last_name}"
    else
      first_name
    end
  end
  
  # Get all students for this teacher
  def all_students
    Student.joins(:courses).where(courses: { teacher_id: id }).distinct
  end
  
  # Find the default grade scale for this teacher
  def default_grade_scale
    # Try to find an explicitly marked default scale
    default = grade_scales.find_by(is_default: true)
    
    # If none is marked as default, use the first scale
    default ||= grade_scales.first
    
    # If no scales exist, create a standard one
    if default.nil?
      default = GradeScale.create_standard(self)
    end
    
    default
  end
  
  # Check if this teacher is a beta tester
  def beta_tester?
    is_beta_tester
  end
  
  # Check if teacher has an active Stripe subscription
  def subscribed?
    stripe_subscription_id.present? && stripe_subscription_status == 'active'
  end
  
  # Subscription plan logic
  def subscription_plan
    if subscribed?
      'pro'
    elsif school&.subscribed?
      'school'
    elsif beta_tester?
      'beta'
    else
      'free'
    end
  end
  
  # Check if teacher can use premium features
  def premium?
    %w[pro school beta].include?(subscription_plan)
  end
  
  private
  
  def password_required?
    password_digest.blank? || !password.blank?
  end
end