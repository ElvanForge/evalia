class StudentCourse < ApplicationRecord
  belongs_to :student
  belongs_to :course, foreign_key: 'class_id'
  
  # Validations
  validates :student_id, presence: true
  validates :class_id, presence: true
  validates :student_id, uniqueness: { scope: :class_id, message: "is already enrolled in this course" }
  
  # Scopes
  scope :by_student, ->(student_id) { where(student_id: student_id) }
  scope :by_course, ->(course_id) { where(class_id: course_id) }
end