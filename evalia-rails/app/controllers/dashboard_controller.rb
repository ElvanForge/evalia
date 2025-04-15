class DashboardController < ApplicationController
  before_action :authenticate_teacher!
  
  def index
    @classes = current_teacher.courses.includes(:students)
    @upcoming_assignments = Assignment.where(course: current_teacher.courses)
                                      .where('due_date >= ?', Date.today)
                                      .order(due_date: :asc)
                                      .limit(5)
    @recent_grades = Grade.joins(assignment: :course)
                          .where(assignment: { course: { teacher_id: current_teacher.id } })
                          .order(created_at: :desc)
                          .includes(assignment: :course, student: {})
                          .limit(5)
    @student_alerts = get_student_alerts
  end
  
  private
  
  def get_student_alerts
    # Students with low grades (below 70%)
    low_grade_threshold = 70
    low_performing_students = Grade.joins(assignment: :course)
                                  .where(assignment: { course: { teacher_id: current_teacher.id } })
                                  .where('score < ?', low_grade_threshold)
                                  .group(:student_id)
                                  .includes(:student)
                                  .limit(5)
                                  
    # Format alerts
    low_performing_students.map do |grade|
      {
        id: grade.student.id,
        name: "#{grade.student.first_name} #{grade.student.last_name}",
        alert_type: 'grade',
        message: "Low grade performance (below #{low_grade_threshold}%)",
        created_at: grade.created_at
      }
    end
  end
end