class Assignment < ApplicationRecord
  belongs_to :course, foreign_key: 'class_id'
  has_many :grades, dependent: :destroy
  
  # Validations
  validates :name, presence: true
  validates :class_id, presence: true
  validates :points_possible, numericality: { greater_than: 0 }, allow_nil: true
  
  # Scopes
  scope :upcoming, -> { where('due_date >= ?', Date.today).order(due_date: :asc) }
  scope :past_due, -> { where('due_date < ?', Date.today).order(due_date: :desc) }
  scope :recent, -> { order(created_at: :desc) }
  
  # Methods
  def average_score
    grades.average(:score)&.round(1)
  end
  
  def completion_rate
    total_students = course.students.count
    total_graded = grades.count
    
    total_students > 0 ? ((total_graded.to_f / total_students) * 100).round : 0
  end
  
  def submission_status_for(student_id)
    grade = grades.find_by(student_id: student_id)
    
    if grade
      {
        status: 'submitted',
        score: grade.score,
        letter_grade: grade.letter_grade,
        comments: grade.comment
      }
    else
      due = due_date.present? ? due_date < Date.today : false
      {
        status: due ? 'missing' : 'not_submitted',
        score: nil,
        letter_grade: nil,
        comments: nil
      }
    end
  end
  
  def highest_score
    grades.maximum(:score)
  end
  
  def lowest_score
    grades.minimum(:score)
  end
  
  def letter_grade_distribution
    grades.group(:letter_grade).count
  end
  
  def score_distribution
    # Group scores into 10% ranges
    distributions = {}
    
    grades.each do |grade|
      range = (grade.score / 10).floor * 10
      range_key = "#{range}-#{range + 9}"
      
      distributions[range_key] ||= 0
      distributions[range_key] += 1
    end
    
    distributions
  end
  
  def overdue?
    due_date.present? && due_date < Date.today
  end
  
  def due_soon?
    due_date.present? && due_date >= Date.today && due_date <= 3.days.from_now
  end
end