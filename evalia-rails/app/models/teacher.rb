class Teacher < ApplicationRecord
  belongs_to :school, optional: true
  
  has_many :courses, dependent: :destroy
  has_many :students, dependent: :nullify
  has_many :assignments, through: :courses
  has_many :quizzes, dependent: :destroy
  has_many :grade_scales, dependent: :destroy
  has_many :lesson_plans, dependent: :destroy
  
  has_secure_password
  
  # Validations
  validates :username, presence: true, uniqueness: true
  validates :email, presence: true, uniqueness: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :first_name, presence: true
  validates :last_name, presence: true
  validates :role, presence: true, inclusion: { in: %w(teacher admin manager) }
  
  # Callbacks
  before_validation :set_default_role, on: :create
  after_create :create_default_grade_scale
  
  # Scopes
  scope :teachers, -> { where(role: 'teacher') }
  scope :admins, -> { where(role: 'admin') }
  scope :managers, -> { where(role: 'manager') }
  scope :beta_testers, -> { where(is_beta_tester: true) }
  
  # Methods
  def full_name
    "#{first_name} #{last_name}"
  end
  
  def admin?
    role == 'admin'
  end
  
  def manager?
    role == 'manager'
  end
  
  def teacher?
    role == 'teacher'
  end
  
  def beta_tester?
    is_beta_tester
  end
  
  def has_subscription?
    stripe_subscription_id.present?
  end
  
  def default_grade_scale
    grade_scales.find_by(is_default: true)
  end
  
  private
  
  def set_default_role
    self.role ||= 'teacher'
  end
  
  def create_default_grade_scale
    return if grade_scales.exists?
    
    scale = grade_scales.create!(
      name: 'Standard Scale',
      description: 'Default grading scale',
      is_default: true
    )
    
    # Create standard grade scale entries
    scale.grade_scale_entries.create!([
      { min_score: 90, max_score: 100, letter_grade: 'A' },
      { min_score: 80, max_score: 89.99, letter_grade: 'B' },
      { min_score: 70, max_score: 79.99, letter_grade: 'C' },
      { min_score: 60, max_score: 69.99, letter_grade: 'D' },
      { min_score: 0, max_score: 59.99, letter_grade: 'F' }
    ])
  end
end