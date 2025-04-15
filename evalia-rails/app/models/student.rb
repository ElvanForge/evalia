class Student < ApplicationRecord
  belongs_to :teacher
  belongs_to :school, optional: true
  
  has_many :student_courses, dependent: :destroy
  has_many :courses, through: :student_courses
  has_many :grades, dependent: :destroy
  has_many :assignments, through: :grades
  has_many :quiz_submissions, dependent: :destroy
  
  # Validations
  validates :first_name, presence: true
  validates :teacher_id, presence: true
  # Last name is optional for Asian students who may only have a single name
  
  # Callbacks
  before_save :normalize_student_number
  
  # Scopes
  scope :by_teacher, ->(teacher_id) { where(teacher_id: teacher_id) }
  scope :by_school, ->(school_id) { where(school_id: school_id) }
  scope :order_by_name, -> { order(:first_name, :last_name) }
  
  # Methods
  def full_name
    last_name.present? ? "#{first_name} #{last_name}" : first_name
  end
  
  def average_grade
    grades.average(:score)&.round(1)
  end
  
  def average_grade_for_course(course_id)
    grades.joins(:assignment)
          .where(assignments: { class_id: course_id })
          .average(:score)
          &.round(1)
  end
  
  def letter_grade_for_course(course_id)
    avg = average_grade_for_course(course_id)
    return nil unless avg
    
    # Get the grade scale for the course's teacher
    course = Course.find(course_id)
    grade_scale = course.teacher.default_grade_scale
    
    # If no grade scale exists, use standard scale
    unless grade_scale
      return case avg
             when 90..100 then 'A'
             when 80...90 then 'B'
             when 70...80 then 'C'
             when 60...70 then 'D'
             else 'F'
             end
    end
    
    # Find the appropriate entry in the grade scale
    entry = grade_scale.grade_scale_entries.find do |e|
      avg >= e.min_score && avg <= e.max_score
    end
    
    entry&.letter_grade || 'F'
  end
  
  def at_risk?
    average = average_grade
    return false unless average
    
    average < 70
  end
  
  def missing_assignments
    enrolled_class_ids = courses.pluck(:id)
    all_assignments = Assignment.where(class_id: enrolled_class_ids)
    submitted_assignment_ids = grades.pluck(:assignment_id)
    
    all_assignments.where.not(id: submitted_assignment_ids)
  end
  
  def missing_assignment_count
    missing_assignments.count
  end
  
  def recent_grades(limit = 5)
    grades.order(created_at: :desc).limit(limit)
  end
  
  private
  
  def normalize_student_number
    # Strip any non-digit characters if present
    self.student_number = student_number.to_s.gsub(/\D/, '') if student_number.present?
  end
end