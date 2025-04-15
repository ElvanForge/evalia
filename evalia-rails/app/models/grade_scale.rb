class GradeScale < ApplicationRecord
  belongs_to :teacher
  
  has_many :grade_scale_entries, dependent: :destroy
  
  # Validations
  validates :teacher_id, presence: true
  validates :name, presence: true
  
  # Callbacks
  after_save :ensure_only_one_default
  
  # Methods
  def set_as_default
    update(is_default: true)
  end
  
  def entry_for_score(score)
    grade_scale_entries.find do |entry|
      score >= entry.min_score && score <= entry.max_score
    end
  end
  
  def letter_grade_for_score(score)
    entry = entry_for_score(score)
    entry ? entry.letter_grade : 'F'
  end
  
  private
  
  def ensure_only_one_default
    if is_default_changed? && is_default
      # If this grade scale is being set as default, make all other grade scales for this teacher not default
      teacher.grade_scales.where.not(id: id).update_all(is_default: false)
    end
  end
end