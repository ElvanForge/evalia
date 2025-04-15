class GradesExportPdf < Prawn::Document
  def initialize(course, students, assignments)
    super(margin: 40, page_size: "LETTER", page_layout: :landscape)
    @course = course
    @students = students
    @assignments = assignments
    
    generate_pdf
  end
  
  private
  
  def generate_pdf
    # Header
    header
    
    # Grades matrix
    grades_matrix_section
    
    # Footer with page numbers
    page_numbers
  end
  
  def header
    # Title
    text "Grade Report: #{@course.name}", size: 18, style: :bold, align: :center
    move_down 5
    
    details = []
    details << "Teacher: #{@course.teacher.full_name}"
    details << "Subject: #{@course.subject}" if @course.subject.present?
    details << "Grade Level: #{@course.grade_level}" if @course.grade_level.present?
    details << "Report Date: #{Time.current.strftime('%B %d, %Y')}"
    
    text details.join(" | "), size: 10, align: :center
    
    # Horizontal line
    move_down 10
    stroke_horizontal_rule
    move_down 15
  end
  
  def grades_matrix_section
    if @students.empty? || @assignments.empty?
      text "No data available for grades export.", style: :italic
      return
    end
    
    # Calculate column widths
    student_width = 140
    avg_width = 60
    assignment_width = (@bounds.width - student_width - avg_width) / @assignments.count
    
    # Create table data
    data = []
    
    # Header row
    header_row = ["Student"]
    @assignments.each do |assignment|
      header_row << assignment.name.to_s
    end
    header_row << "Average"
    data << header_row
    
    # Student rows
    @students.each do |student|
      row = [student.full_name]
      
      # Add each assignment grade
      @assignments.each do |assignment|
        grade = assignment.grade_for_student(student.id)
        if grade
          row << "#{grade.score.round(1)}%\n(#{grade.letter_grade})"
        else
          row << "Not graded"
        end
      end
      
      # Add average
      avg = student.average_grade(@course.id)
      letter = @course.teacher.default_grade_scale.letter_for_percent(avg)
      row << "#{avg.round(1)}%\n(#{letter})"
      
      data << row
    end
    
    # Class averages row
    avg_row = ["Class Average"]
    
    @assignments.each do |assignment|
      avg = assignment.average_score
      letter = assignment.average_letter
      avg_row << (avg > 0 ? "#{avg.round(1)}%\n(#{letter})" : "N/A")
    end
    
    # Add overall average
    course_avg = @course.average_grade
    course_letter = @course.teacher.default_grade_scale.letter_for_percent(course_avg)
    avg_row << "#{course_avg.round(1)}%\n(#{course_letter})"
    
    data << avg_row
    
    # Create table
    table(data, width: bounds.width, cell_style: { inline_format: true }) do
      cells.padding = [5, 5, 5, 5]
      cells.size = 9
      
      # Header styling
      row(0).font_style = :bold
      row(0).background_color = "DDDDDD"
      row(0).align = :center
      self.header = true
      
      # Average row styling
      row(-1).font_style = :bold
      row(-1).background_color = "EEEEEE"
      
      # Column widths
      column(0).width = student_width
      column(-1).width = avg_width
      
      # Center grade columns
      (1..column_length-2).each do |i|
        column(i).align = :center
        column(i).width = assignment_width
      end
      
      # Right-align averages
      column(-1).align = :center
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