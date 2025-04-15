class ApiController < ApplicationController
  # Prevent CSRF for API endpoints
  protect_from_forgery with: :null_session
  before_action :require_login
  
  # Get students for a specific course
  def students_by_course
    course = current_user.courses.find_by(id: params[:course_id])
    
    if course
      students = course.students.order(:last_name, :first_name)
      render json: students.map { |student| 
        { 
          id: student.id, 
          full_name: student.full_name,
          student_number: student.student_number 
        } 
      }
    else
      render json: { error: "Course not found" }, status: :not_found
    end
  end
  
  # Get at-risk students with grades below a certain threshold
  def student_alerts
    # Get students with D or F grades
    at_risk_students = []
    
    current_user.courses.each do |course|
      course.students.each do |student|
        avg = student.average_grade(course.id)
        letter = course.teacher.default_grade_scale.letter_for_percent(avg)
        
        if ['D', 'F'].include?(letter)
          at_risk_students << {
            id: student.id,
            name: student.full_name,
            course_id: course.id,
            course_name: course.name,
            average: avg.round(1),
            letter_grade: letter,
            completion_rate: student.completion_rate(course.id)
          }
        end
      end
    end
    
    render json: at_risk_students
  end
  
  private
  
  def require_login
    unless logged_in?
      render json: { error: "You must be logged in to access this section" }, status: :unauthorized
    end
  end
end