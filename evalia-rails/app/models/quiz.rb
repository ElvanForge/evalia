class Quiz < ApplicationRecord
  belongs_to :teacher
  
  has_many :quiz_questions, dependent: :destroy
  has_many :quiz_submissions, dependent: :destroy
  has_many :quiz_courses, foreign_key: 'quiz_id', dependent: :destroy
  has_many :courses, through: :quiz_courses, source: :course, foreign_key: 'class_id'
  
  # Validations
  validates :title, presence: true
  validates :teacher_id, presence: true
  validates :total_points, numericality: { greater_than: 0 }, allow_nil: true
  
  # Callbacks
  before_save :set_default_values
  
  # Scopes
  scope :published, -> { where(published: true) }
  scope :unpublished, -> { where(published: false) }
  scope :recent, -> { order(created_at: :desc) }
  
  # Methods
  def question_count
    quiz_questions.count
  end
  
  def total_submissions
    quiz_submissions.count
  end
  
  def average_score
    quiz_submissions.average(:score)&.round(1)
  end
  
  def completion_rate
    total_enrolled = courses.sum { |course| course.students.count }
    total_taken = total_submissions
    
    total_enrolled > 0 ? ((total_taken.to_f / total_enrolled) * 100).round : 0
  end
  
  def taken_by_student?(student_id)
    quiz_submissions.exists?(student_id: student_id)
  end
  
  def student_score(student_id)
    submission = quiz_submissions.find_by(student_id: student_id)
    submission&.score
  end
  
  def assign_to_course(course_id)
    courses << Course.find(course_id) unless courses.exists?(id: course_id)
  end
  
  def remove_from_course(course_id)
    courses.delete(Course.find(course_id))
  end
  
  private
  
  def set_default_values
    self.published ||= false
    self.total_points ||= quiz_questions.sum(:points)
  end
end