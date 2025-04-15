class StudentAnalyticsPdf < Prawn::Document
  def initialize(student, course = nil)
    super(margin: 50)
    @student = student
    @course = course
    
    generate_pdf
  end
  
  private
  
  def generate_pdf
    # Header
    header
    
    # Overview
    overview_section
    
    # Course performance
    course_performance_section
    
    # Course details (if a specific course is selected)
    course_details_section if @course
    
    # Footer with page numbers
    page_numbers
  end
  
  def header
    # Title
    text "Student Analytics Report", size: 24, style: :bold, align: :center
    move_down 10
    text "Generated on #{Time.current.strftime('%B %d, %Y')}", align: :center
    
    # Student information
    move_down 20
    text "Student: #{@student.full_name}", size: 16, style: :bold
    
    if @student.student_number.present?
      text "Student ID: #{@student.student_number}"
    end
    
    # Horizontal line
    move_down 10
    stroke_horizontal_rule
    move_down 20
  end
  
  def overview_section
    text "Performance Overview", size: 14, style: :bold
    move_down 10
    
    # Create a table with overall stats
    data = [
      ["Overall Average", "#{@student.average_grade.round}%"],
      ["Completion Rate", "#{@student.completion_rate}%"],
      ["Enrolled Courses", @student.courses.count.to_s]
    ]
    
    table(data, width: bounds.width) do
      cells.padding = [5, 10, 5, 10]
      cells.borders = [:bottom]
      row(0).font_style = :bold
      column(0).width = bounds.width * 0.7
      column(1).align = :right
    end
    
    move_down 20
  end
  
  def course_performance_section
    text "Course Performance", size: 14, style: :bold
    move_down 10
    
    if @student.courses.any?
      # Table header
      course_data = [["Course", "Average", "Letter Grade", "Completion"]]
      
      # Table data
      @student.courses.each do |course|
        avg = @student.average_grade(course.id)
        letter = course.teacher.default_grade_scale.letter_for_percent(avg)
        completion = @student.completion_rate(course.id)
        
        row = [
          course.name,
          "#{avg.round(1)}%",
          letter,
          "#{completion}%"
        ]
        
        # Highlight the selected course
        if @course && course.id == @course.id
          row = row.map { |cell| "<b>#{cell}</b>" }
        end
        
        course_data << row
      end
      
      # Create table
      table(course_data, width: bounds.width, cell_style: { inline_format: true }) do
        cells.padding = [5, 10, 5, 10]
        row(0).font_style = :bold
        row(0).background_color = "DDDDDD"
        self.header = true
      end
    else
      text "No courses found for this student.", style: :italic
    end
    
    move_down 30
  end
  
  def course_details_section
    start_new_page
    
    text "#{@course.name} - Grade Details", size: 14, style: :bold
    move_down 5
    text "Teacher: #{@course.teacher.full_name}", size: 10
    move_down 15
    
    grades = @student.grades_by_assignment(@course.id)
    
    if grades.any?
      # Table header
      details_data = [["Assignment", "Score", "Letter Grade", "Due Date", "Comments"]]
      
      # Table data
      grades.each do |grade|
        details_data << [
          grade.assignment.name,
          "#{grade.score.round(1)}%",
          grade.letter_grade,
          grade.assignment.due_date&.strftime('%m/%d/%Y') || "N/A",
          grade.comments || ""
        ]
      end
      
      # Create table
      table(details_data, width: bounds.width) do
        cells.padding = [5, 10, 5, 10]
        row(0).font_style = :bold
        row(0).background_color = "DDDDDD"
        self.header = true
        column(0).width = bounds.width * 0.3
        column(4).width = bounds.width * 0.25
      end
      
      # Add a chart showing grade progression
      if grades.count > 1
        move_down 30
        text "Grade Progression", size: 14, style: :bold
        move_down 10
        
        # Simple text-based visualization
        grades.each_with_index do |grade, index|
          text "#{index + 1}. #{grade.assignment.name}: #{grade.score.round}% (#{grade.letter_grade})"
        end
      end
    else
      text "No grades found for this course.", style: :italic
    end
  end
  
  def page_numbers
    # Add page numbers at the bottom
    string = "Page <page> of <total>"
    options = { at: [bounds.right - 150, 0],
                width: 150,
                align: :right }
    number_pages string, options
  end
end