class GradeScaleEntry < ApplicationRecord
  belongs_to :grade_scale
  
  # Validations
  validates :grade_scale_id, presence: true
  validates :letter_grade, presence: true
  validates :min_score, presence: true, numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 100 }
  validates :max_score, presence: true, numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 100 }
  validate :min_score_less_than_max_score
  validate :no_overlapping_ranges
  
  # Scopes
  scope :ordered, -> { order(min_score: :desc) }
  
  # Methods
  def score_range
    "#{min_score}-#{max_score}"
  end
  
  def contains_score?(score)
    score >= min_score && score <= max_score
  end
  
  private
  
  def min_score_less_than_max_score
    if min_score && max_score && min_score > max_score
      errors.add(:min_score, "must be less than or equal to max score")
    end
  end
  
  def no_overlapping_ranges
    return unless grade_scale && min_score && max_score
    
    overlapping_entries = grade_scale.grade_scale_entries
                                      .where.not(id: id)
                                      .where("(min_score <= ? AND max_score >= ?) OR (min_score <= ? AND max_score >= ?)", 
                                             max_score, max_score, min_score, min_score)
    
    if overlapping_entries.exists?
      errors.add(:base, "Score range overlaps with an existing entry")
    end
  end
end