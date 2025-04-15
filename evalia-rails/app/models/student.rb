class Student < ApplicationRecord
  has_many :student_courses, dependent: :destroy
  has_many :courses, through: :student_courses
  
  has_many :grades, dependent: :destroy
  has_many :quiz_submissions, dependent: :destroy
  
  validates :first_name, presence: true
  # last_name is optional for Asian students who may have only a single name
  
  # Returns the full name of the student
  def full_name
    if last_name.present?
      "#{first_name} #{last_name}"
    else
      first_name
    end
  end
  
  # Get all grades for a student in a specific course
  def grades_by_course(course_id)
    grades.joins(assignment: :course)
           .where(assignments: { course_id: course_id })
  end
  
  # Get all grades for a student organized by assignment for a specific course
  def grades_by_assignment(course_id)
    grades.joins(:assignment)
         .where(assignments: { course_id: course_id })
         .includes(:assignment)
         .order('assignments.due_date ASC')
  end
  
  # Calculate average grade for all courses or a specific course
  def average_grade(course_id = nil)
    if course_id
      grades = grades_by_course(course_id)
    else
      grades = self.grades
    end
    
    return 0 if grades.empty?
    
    total = 0
    grades.each do |grade|
      total += grade.score
    end
    
    total / grades.count
  end
  
  # Calculate completion rate (percentage of assigned work that has been completed)
  def completion_rate(course_id = nil)
    if course_id
      total_assignments = Assignment.where(course_id: course_id).count
      completed_assignments = grades_by_course(course_id).count
    else
      total_assignments = courses.sum { |course| course.assignments.count }
      completed_assignments = grades.count
    end
    
    return 100 if total_assignments.zero?
    
    (completed_assignments.to_f / total_assignments * 100).round
  end
  
  # Count how many assignments the student has completed for a course
  def assignment_completed_count(course_id)
    grades_by_course(course_id).count
  end
  
  # Get student's letter grade for a course
  def letter_grade(course_id)
    course = Course.find_by(id: course_id)
    return nil unless course
    
    avg = average_grade(course_id)
    course.teacher.default_grade_scale.letter_for_percent(avg)
  end
end