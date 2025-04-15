class DashboardController < ApplicationController
  def index
    # Get active classes
    @courses = current_user.courses.active.includes(:students, :assignments)
                          .order(:name)
                          .limit(6)
    
    # Get recent grades
    @recent_grades = Grade.joins(:assignment)
                          .where(assignments: { course_id: current_user.courses.pluck(:id) })
                          .includes(:student, assignment: :course)
                          .order(created_at: :desc)
                          .limit(5)
    
    # Get upcoming assignments
    @upcoming_assignments = current_user.courses.flat_map do |course|
      course.assignments.where('due_date > ?', Time.current)
                       .order(:due_date)
                       .limit(5)
    end.sort_by(&:due_date).first(5)
    
    # Get at-risk students
    @at_risk_students = Student.joins(:grades)
                              .joins(courses: :teacher)
                              .where(teachers: { id: current_user.id })
                              .where(grades: { letter_grade: ['D', 'F'] })
                              .distinct
                              .limit(5)
    
    # Get stats
    @total_students = current_user.courses.sum { |course| course.students.count }
    @total_assignments = current_user.courses.sum { |course| course.assignments.count }
    @grading_completion = calculate_grading_completion
    
    # Get grade distribution
    @grade_distribution = calculate_grade_distribution
  end
  
  private
  
  def calculate_grading_completion
    total_possible = current_user.courses.sum do |course|
      course.assignments.count * course.students.count
    end
    
    return 100 if total_possible == 0
    
    total_graded = Grade.joins(:assignment)
                        .where(assignments: { course_id: current_user.courses.pluck(:id) })
                        .count
    
    (total_graded.to_f / total_possible * 100).round
  end
  
  def calculate_grade_distribution
    distribution = { 'A' => 0, 'B' => 0, 'C' => 0, 'D' => 0, 'F' => 0 }
    
    grades = Grade.joins(:assignment)
                  .where(assignments: { course_id: current_user.courses.pluck(:id) })
    
    grades.each do |grade|
      distribution[grade.letter_grade] ||= 0
      distribution[grade.letter_grade] += 1
    end
    
    distribution
  end
end