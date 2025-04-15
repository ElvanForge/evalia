class GradeScaleEntry < ApplicationRecord
  belongs_to :grade_scale
  
  validates :letter, presence: true
  validates :min_percent, presence: true, 
                         numericality: { greater_than_or_equal_to: 0, 
                                        less_than_or_equal_to: 100 }
  
  # Get all entries from a grade scale in descending order by min_percent
  scope :ordered, -> { order(min_percent: :desc) }
end