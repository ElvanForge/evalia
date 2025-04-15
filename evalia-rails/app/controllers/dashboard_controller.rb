class DashboardController < ApplicationController
  before_action :require_login
  
  def index
    # Basic stats for the dashboard
    @courses = Course.where(teacher_id: current_user.id).order(name: :asc)
    @students = Student.where(teacher_id: current_user.id).order(:first_name, :last_name)
    @assignments = Assignment.joins(:course).where(courses: { teacher_id: current_user.id }).order(created_at: :desc)
    @quizzes = Quiz.where(teacher_id: current_user.id).order(created_at: :desc)
    
    # Counts
    @course_count = @courses.count
    @student_count = @students.count
    @assignment_count = @assignments.count
    @quiz_count = @quizzes.count
    
    # Recent activity - get the 5 most recent grades
    @recent_grades = Grade.joins(:assignment)
                          .joins("JOIN courses ON assignments.class_id = courses.id")
                          .where(courses: { teacher_id: current_user.id })
                          .order(created_at: :desc)
                          .limit(5)
                          .includes(:student, :assignment)
    
    # Student alerts - students with at-risk grades
    @at_risk_students = @students.select(&:at_risk?)
    
    # Missing assignments
    @missing_assignments_count = Assignment.joins(:course)
                                            .where(courses: { teacher_id: current_user.id })
                                            .where('due_date < ?', Date.today)
                                            .joins("LEFT JOIN grades ON grades.assignment_id = assignments.id")
                                            .where(grades: { id: nil })
                                            .count
    
    # Get assignment stats for quick grade entry
    @recent_assignments = @assignments.limit(5)
    
    # Get upcoming assignments
    @upcoming_assignments = @assignments.where('due_date > ?', Date.today)
                                       .order(due_date: :asc)
                                       .limit(3)
    
    # Get grade distribution
    @grade_distribution = Grade.joins(:assignment)
                              .joins("JOIN courses ON assignments.class_id = courses.id")
                              .where(courses: { teacher_id: current_user.id })
                              .group(:letter_grade)
                              .count
  end
end