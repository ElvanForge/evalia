class Quiz < ApplicationRecord
  # Associations
  belongs_to :teacher
  has_many :quiz_courses, dependent: :destroy
  has_many :courses, through: :quiz_courses
  has_many :quiz_questions, dependent: :destroy
  has_many :quiz_submissions, dependent: :destroy
  
  # Active Storage for cover image
  has_one_attached :cover_image
  
  # Validations
  validates :title, presence: true, length: { maximum: 100 }
  validates :description, length: { maximum: 1000 }
  validates :time_limit, numericality: { greater_than: 0, allow_nil: true }
  validates :passing_score, numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 100, allow_nil: true }
  
  # Scopes
  scope :active, -> { where(active: true) }
  scope :published, -> { where(published: true) }
  scope :drafts, -> { where(published: false) }
  scope :recent, -> { order(created_at: :desc) }
  
  def question_count
    quiz_questions.count
  end
  
  def max_possible_score
    quiz_questions.sum(:points)
  end
  
  def submission_count
    quiz_submissions.count
  end
  
  def average_score
    quiz_submissions.average(:score).to_f.round(1)
  end
  
  def average_percent
    if max_possible_score > 0
      (average_score / max_possible_score * 100).round(1)
    else
      0
    end
  end
  
  def completion_rate
    total_students = courses.joins(:students).select('students.id').distinct.count
    if total_students > 0
      completed = quiz_submissions.select('student_id').distinct.count
      (completed.to_f / total_students * 100).round
    else
      0
    end
  end
  
  def passing_rate
    total_submissions = quiz_submissions.count
    if total_submissions > 0
      passing = quiz_submissions.where('score_percent >= ?', passing_score || 60).count
      (passing.to_f / total_submissions * 100).round
    else
      0
    end
  end
  
  def student_submitted?(student_id)
    quiz_submissions.where(student_id: student_id).exists?
  end
  
  def student_score(student_id)
    submission = quiz_submissions.find_by(student_id: student_id)
    submission&.score || 0
  end
  
  def student_passed?(student_id)
    submission = quiz_submissions.find_by(student_id: student_id)
    return false unless submission
    
    submission.score_percent >= (passing_score || 60)
  end
  
  def display_time_limit
    return 'No time limit' unless time_limit
    
    hours = time_limit / 60
    minutes = time_limit % 60
    
    if hours > 0
      "#{hours} hour#{'s' if hours > 1}#{' ' + minutes.to_s + ' minute' + ('s' if minutes > 1).to_s if minutes > 0}"
    else
      "#{minutes} minute#{'s' if minutes > 1}"
    end
  end
end