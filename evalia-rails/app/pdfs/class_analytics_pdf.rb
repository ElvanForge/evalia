class ClassAnalyticsPdf < Prawn::Document
  def initialize(course, grade_distribution)
    super(margin: 50)
    @course = course
    @grade_distribution = grade_distribution
    
    generate_pdf
  end
  
  private
  
  def generate_pdf
    # Header
    header
    
    # Overview
    overview_section
    
    # Grade distribution
    grade_distribution_section
    
    # Assignment performance
    start_new_page
    assignment_performance_section
    
    # Student performance
    start_new_page
    student_performance_section
    
    # Footer with page numbers
    page_numbers
  end
  
  def header
    # Title
    text "Class Analytics Report", size: 24, style: :bold, align: :center
    move_down 10
    text "Generated on #{Time.current.strftime('%B %d, %Y')}", align: :center
    
    # Course information
    move_down 20
    text "Course: #{@course.name}", size: 16, style: :bold
    
    details = []
    details << "Teacher: #{@course.teacher.full_name}"
    details << "Subject: #{@course.subject}" if @course.subject.present?
    details << "Grade Level: #{@course.grade_level}" if @course.grade_level.present?
    
    text details.join(" | "), size: 10
    
    # Horizontal line
    move_down 10
    stroke_horizontal_rule
    move_down 20
  end
  
  def overview_section
    text "Class Overview", size: 14, style: :bold
    move_down 10
    
    # Create a table with overall stats
    data = [
      ["Students", @course.students.count.to_s],
      ["Assignments", @course.assignments.count.to_s],
      ["Class Average", "#{@course.average_grade.round}%"],
      ["At-Risk Students", @course.at_risk_count.to_s]
    ]
    
    table(data, width: bounds.width) do
      cells.padding = [5, 10, 5, 10]
      cells.borders = [:bottom]
      row(0).font_style = :bold
      column(0).width = bounds.width * 0.7
      column(1).align = :right
    end
    
    move_down 30
  end
  
  def grade_distribution_section
    text "Grade Distribution", size: 14, style: :bold
    move_down 10
    
    if @grade_distribution.values.sum > 0
      # Define the order for letter grades
      grade_order = ['A', 'B', 'C', 'D', 'F']
      
      # Calculate total for percentages
      total = @grade_distribution.values.sum
      
      # Table header
      distribution_data = [["Letter Grade", "Description", "Count", "Percentage"]]
      
      # Table data
      grade_order.each do |grade|
        count = @grade_distribution[grade] || 0
        next if count == 0
        
        percentage = (count.to_f / total * 100).round
        
        distribution_data << [
          grade,
          grade_description(grade),
          count.to_s,
          "#{percentage}%"
        ]
      end
      
      # Create table
      table(distribution_data, width: bounds.width) do
        cells.padding = [5, 10, 5, 10]
        row(0).font_style = :bold
        row(0).background_color = "DDDDDD"
        self.header = true
      end
      
      # Add a visual bar chart
      move_down 20
      text "Grade Distribution Chart", size: 12, style: :bold
      move_down 10
      
      # Create a simple ASCII bar chart
      grade_order.each do |grade|
        count = @grade_distribution[grade] || 0
        next if count == 0
        
        percentage = (count.to_f / total * 100).round
        bar = "▌" * (percentage / 2) # Scale to a reasonable width
        
        text "#{grade} (#{percentage}%): #{bar}"
      end
    else
      text "No grades have been recorded for this class yet.", style: :italic
    end
    
    move_down 20
  end
  
  def assignment_performance_section
    text "Assignment Performance", size: 14, style: :bold
    move_down 10
    
    if @course.assignments.any?
      # Table header
      assignment_data = [["Assignment", "Due Date", "Avg. Score", "Letter Grade", "Completion"]]
      
      # Table data
      @course.assignments.order(due_date: :desc).each do |assignment|
        assignment_data << [
          assignment.name,
          assignment.due_date&.strftime('%m/%d/%Y') || "N/A",
          "#{assignment.average_score.round(1)}%",
          assignment.average_letter || "N/A",
          "#{assignment.graded_percentage}%"
        ]
      end
      
      # Create table
      table(assignment_data, width: bounds.width) do
        cells.padding = [5, 10, 5, 10]
        row(0).font_style = :bold
        row(0).background_color = "DDDDDD"
        self.header = true
      end
    else
      text "No assignments have been created for this class yet.", style: :italic
    end
  end
  
  def student_performance_section
    text "Student Performance", size: 14, style: :bold
    move_down 10
    
    if @course.students.any?
      # Get all student averages
      student_averages = @course.all_student_averages
      
      # Table header
      student_data = [["Student", "ID", "Average", "Letter Grade", "Completion Rate"]]
      
      # Table data
      @course.students.order(:last_name, :first_name).each do |student|
        avg = student_averages[student.id] || 0
        letter = @course.teacher.default_grade_scale.letter_for_percent(avg)
        completion = student.completion_rate(@course.id)
        
        student_data << [
          student.full_name,
          student.student_number || "N/A",
          "#{avg.round(1)}%",
          letter,
          "#{completion}%"
        ]
      end
      
      # Create table
      table(student_data, width: bounds.width) do
        cells.padding = [5, 10, 5, 10]
        row(0).font_style = :bold
        row(0).background_color = "DDDDDD"
        self.header = true
      end
    else
      text "No students are enrolled in this class yet.", style: :italic
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
  
  def grade_description(letter)
    case letter
    when 'A'
      "Excellent"
    when 'B'
      "Good"
    when 'C'
      "Satisfactory"
    when 'D'
      "Needs Improvement"
    when 'F'
      "Unsatisfactory"
    else
      "Not Graded"
    end
  end
end