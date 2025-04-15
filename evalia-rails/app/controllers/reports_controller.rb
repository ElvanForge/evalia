class ReportsController < ApplicationController
  before_action :require_login
  before_action :set_course, only: [:class_analytics, :grades_export]
  before_action :set_student, only: [:student_analytics]
  
  def index
    @courses = current_user.courses.active.order(:name)
  end
  
  def student_analytics
    @course = Course.find_by(id: params[:course_id]) if params[:course_id].present?
    
    respond_to do |format|
      format.html
      format.csv do
        send_data generate_student_csv, 
                  filename: "student_analytics_#{@student.id}_#{Date.today.strftime('%Y%m%d')}.csv",
                  type: 'text/csv'
      end
      format.pdf do
        pdf = StudentAnalyticsPdf.new(@student, @course)
        send_data pdf.render, 
                  filename: "student_analytics_#{@student.id}_#{Date.today.strftime('%Y%m%d')}.pdf",
                  type: 'application/pdf',
                  disposition: 'attachment'
      end
    end
  end
  
  def class_analytics
    @grade_distribution = calculate_grade_distribution
    
    respond_to do |format|
      format.html
      format.csv do
        send_data generate_class_csv, 
                  filename: "class_analytics_#{@course.id}_#{Date.today.strftime('%Y%m%d')}.csv",
                  type: 'text/csv'
      end
      format.pdf do
        pdf = ClassAnalyticsPdf.new(@course, @grade_distribution)
        send_data pdf.render, 
                  filename: "class_analytics_#{@course.id}_#{Date.today.strftime('%Y%m%d')}.pdf",
                  type: 'application/pdf',
                  disposition: 'attachment'
      end
    end
  end
  
  def grades_export
    @students = @course.students.order(:last_name, :first_name)
    @assignments = @course.assignments.order(:due_date)
    
    respond_to do |format|
      format.html
      format.csv do
        send_data generate_grades_csv, 
                  filename: "grades_export_#{@course.id}_#{Date.today.strftime('%Y%m%d')}.csv",
                  type: 'text/csv'
      end
      format.pdf do
        pdf = GradesExportPdf.new(@course, @students, @assignments)
        send_data pdf.render, 
                  filename: "grades_export_#{@course.id}_#{Date.today.strftime('%Y%m%d')}.pdf",
                  type: 'application/pdf',
                  disposition: 'attachment'
      end
      format.xml do
        send_data generate_grades_xml, 
                  filename: "grades_export_#{@course.id}_#{Date.today.strftime('%Y%m%d')}.xml",
                  type: 'application/xml'
      end
    end
  end
  
  private
  
  def set_course
    @course = current_user.courses.find_by(id: params[:course_id])
    
    unless @course
      flash[:alert] = "Course not found or you don't have permission to view it"
      redirect_to reports_path
    end
  end
  
  def set_student
    @student = Student.joins(:courses)
                     .where(courses: { teacher_id: current_user.id })
                     .find_by(id: params[:student_id])
    
    unless @student
      flash[:alert] = "Student not found or you don't have permission to view their data"
      redirect_to reports_path
    end
  end
  
  def calculate_grade_distribution
    distribution = { 'A' => 0, 'B' => 0, 'C' => 0, 'D' => 0, 'F' => 0 }
    
    # Get all grades for this course
    grades = Grade.joins(assignment: :course)
                 .where(assignments: { course_id: @course.id })
    
    grades.each do |grade|
      distribution[grade.letter_grade] ||= 0
      distribution[grade.letter_grade] += 1
    end
    
    distribution
  end
  
  def generate_student_csv
    require 'csv'
    
    CSV.generate do |csv|
      # Header row
      csv << ["Student Analytics: #{@student.full_name}", "Report Date: #{Date.today.strftime('%B %d, %Y')}"]
      csv << ["Student ID: #{@student.student_number}", "Teacher: #{current_user.full_name}"]
      csv << []
      
      # Overall performance
      csv << ["Overall Performance"]
      csv << ["Overall Average", "#{@student.average_grade.round}%"]
      csv << ["Completion Rate", "#{@student.completion_rate}%"]
      csv << []
      
      # Course performance
      csv << ["Course Performance"]
      csv << ["Course", "Average", "Letter Grade", "Completion"]
      
      @student.courses.each do |course|
        avg = @student.average_grade(course.id)
        letter = course.teacher.default_grade_scale.letter_for_percent(avg)
        completion = @student.completion_rate(course.id)
        
        csv << [course.name, "#{avg.round(1)}%", letter, "#{completion}%"]
      end
      
      csv << []
      
      # Course details
      if @course
        csv << ["#{@course.name} Details"]
        csv << ["Assignment", "Score", "Letter Grade", "Due Date", "Submitted Date", "Comments"]
        
        @student.grades_by_assignment(@course.id).each do |grade|
          csv << [
            grade.assignment.name,
            "#{grade.score.round(1)}%",
            grade.letter_grade,
            grade.assignment.due_date&.strftime('%m/%d/%Y') || "N/A",
            grade.created_at.strftime('%m/%d/%Y'),
            grade.comments || ""
          ]
        end
      end
    end
  end
  
  def generate_class_csv
    require 'csv'
    
    CSV.generate do |csv|
      # Header row
      csv << ["Class Analytics: #{@course.name}", "Report Date: #{Date.today.strftime('%B %d, %Y')}"]
      csv << ["Teacher: #{current_user.full_name}", "Subject: #{@course.subject || 'N/A'}", "Grade Level: #{@course.grade_level || 'N/A'}"]
      csv << []
      
      # Class overview
      csv << ["Class Overview"]
      csv << ["Students", @course.students.count]
      csv << ["Assignments", @course.assignments.count]
      csv << ["Class Average", "#{@course.average_grade.round}%"]
      csv << ["At-Risk Students", @course.at_risk_count]
      csv << []
      
      # Grade distribution
      csv << ["Grade Distribution"]
      csv << ["Grade", "Count", "Percentage"]
      
      total = @grade_distribution.values.sum
      @grade_distribution.each do |grade, count|
        percentage = total > 0 ? (count.to_f / total * 100).round : 0
        csv << [grade, count, "#{percentage}%"]
      end
      
      csv << []
      
      # Assignment performance
      csv << ["Assignment Performance"]
      csv << ["Assignment", "Average Score", "Letter Grade", "Completion Rate", "Due Date"]
      
      @course.assignments.order(due_date: :desc).each do |assignment|
        csv << [
          assignment.name,
          "#{assignment.average_score.round(1)}%",
          assignment.average_letter || "N/A",
          "#{assignment.graded_percentage}%",
          assignment.due_date&.strftime('%m/%d/%Y') || "N/A"
        ]
      end
      
      csv << []
      
      # Student performance
      csv << ["Student Performance"]
      csv << ["Student", "ID", "Average", "Letter Grade", "Completion Rate"]
      
      student_averages = @course.all_student_averages
      @course.students.order(:last_name, :first_name).each do |student|
        avg = student_averages[student.id] || 0
        letter = @course.teacher.default_grade_scale.letter_for_percent(avg)
        completion = student.completion_rate(@course.id)
        
        csv << [
          student.full_name,
          student.student_number || "N/A",
          "#{avg.round(1)}%",
          letter,
          "#{completion}%"
        ]
      end
    end
  end
  
  def generate_grades_csv
    require 'csv'
    
    CSV.generate do |csv|
      # Header row with assignment names
      header = ["Student", "ID"]
      @assignments.each do |assignment|
        header << assignment.name
      end
      header << "Average"
      
      csv << header
      
      # Data rows
      @students.each do |student|
        row = [student.full_name, student.student_number || ""]
        
        @assignments.each do |assignment|
          grade = assignment.grade_for_student(student.id)
          row << (grade ? "#{grade.score.round(1)}% (#{grade.letter_grade})" : "Not Graded")
        end
        
        # Add average
        avg = student.average_grade(@course.id)
        letter = @course.teacher.default_grade_scale.letter_for_percent(avg)
        row << "#{avg.round(1)}% (#{letter})"
        
        csv << row
      end
      
      # Class averages row
      averages_row = ["Class Average", ""]
      
      @assignments.each do |assignment|
        avg = assignment.average_score
        letter = assignment.average_letter
        averages_row << (avg > 0 ? "#{avg.round(1)}% (#{letter})" : "N/A")
      end
      
      # Add overall average
      course_avg = @course.average_grade
      course_letter = @course.teacher.default_grade_scale.letter_for_percent(course_avg)
      averages_row << "#{course_avg.round(1)}% (#{course_letter})"
      
      csv << averages_row
    end
  end
  
  def generate_grades_xml
    require 'builder'
    
    xml = Builder::XmlMarkup.new(indent: 2)
    xml.instruct!
    
    xml.GradeExport do
      xml.ReportInfo do
        xml.GeneratedDate(Time.current.iso8601)
        xml.Teacher(current_user.full_name)
        xml.Course do
          xml.Name(@course.name)
          xml.Subject(@course.subject) if @course.subject.present?
          xml.GradeLevel(@course.grade_level) if @course.grade_level.present?
        end
      end
      
      xml.Assignments do
        @assignments.each do |assignment|
          xml.Assignment do
            xml.AssignmentId(assignment.id)
            xml.Name(assignment.name)
            xml.Description(assignment.description) if assignment.description.present?
            xml.DueDate(assignment.due_date.iso8601) if assignment.due_date
            xml.MaxScore(assignment.max_score) if assignment.max_score
            xml.Weight(assignment.weight || 1.0)
            
            # Assignment statistics
            xml.Statistics do
              xml.AverageScore(assignment.average_score.round(1))
              xml.AverageLetterGrade(assignment.average_letter) if assignment.average_letter
              xml.CompletionRate(assignment.graded_percentage)
            end
          end
        end
      end
      
      xml.Students do
        @students.each do |student|
          xml.Student do
            xml.StudentId(student.id)
            xml.StudentNumber(student.student_number) if student.student_number.present?
            xml.FirstName(student.first_name)
            xml.LastName(student.last_name)
            
            # Student statistics
            avg = student.average_grade(@course.id)
            letter = @course.teacher.default_grade_scale.letter_for_percent(avg)
            
            xml.Statistics do
              xml.AverageScore(avg.round(1))
              xml.LetterGrade(letter)
              xml.CompletionRate(student.completion_rate(@course.id))
            end
            
            # Student grades
            xml.Grades do
              @assignments.each do |assignment|
                grade = assignment.grade_for_student(student.id)
                
                if grade
                  xml.Grade do
                    xml.AssignmentId(assignment.id)
                    xml.Score(grade.score.round(1))
                    xml.LetterGrade(grade.letter_grade)
                    xml.PointsEarned(grade.points_earned) if grade.points_earned
                    xml.Comments(grade.comments) if grade.comments.present?
                    xml.DateGraded(grade.created_at.iso8601)
                  end
                end
              end
            end
          end
        end
      end
      
      # Course statistics
      xml.Statistics do
        xml.ClassAverage(@course.average_grade.round(1))
        xml.ClassLetterGrade(@course.teacher.default_grade_scale.letter_for_percent(@course.average_grade))
        
        xml.GradeDistribution do
          @course.grade_distribution.each do |letter, count|
            xml.Grade do
              xml.Letter(letter)
              xml.Count(count)
              xml.Percentage((@course.grade_distribution_percentage(letter) * 100).round)
            end
          end
        end
      end
    end
    
    xml.target!
  end
  
  def require_login
    unless logged_in?
      flash[:alert] = "You must be logged in to access this section"
      redirect_to login_path
    end
  end
end