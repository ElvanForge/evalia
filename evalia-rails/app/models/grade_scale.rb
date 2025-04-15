class GradeScale < ApplicationRecord
  belongs_to :teacher
  
  has_many :grade_scale_entries, dependent: :destroy
  
  validates :name, presence: true
  
  # Find the appropriate letter grade for a percentage score
  def letter_for_percent(percent)
    return 'N/A' if percent.nil?
    
    # Sort entries by min_percent in descending order
    entries = grade_scale_entries.order(min_percent: :desc)
    
    # Find the first entry that has a min_percent less than or equal to the score
    entries.each do |entry|
      return entry.letter if percent >= entry.min_percent
    end
    
    # If we didn't find anything, return F
    'F'
  end
  
  # Create a standard grade scale with default entries
  def self.create_standard(teacher, name = 'Standard')
    scale = GradeScale.create!(name: name, teacher: teacher, is_default: true)
    
    # Create standard grade entries
    scale.grade_scale_entries.create!(letter: 'A', min_percent: 90.0, description: 'Excellent')
    scale.grade_scale_entries.create!(letter: 'B', min_percent: 80.0, description: 'Good')
    scale.grade_scale_entries.create!(letter: 'C', min_percent: 70.0, description: 'Satisfactory')
    scale.grade_scale_entries.create!(letter: 'D', min_percent: 60.0, description: 'Needs Improvement')
    scale.grade_scale_entries.create!(letter: 'F', min_percent: 0.0, description: 'Unsatisfactory')
    
    scale
  end
end