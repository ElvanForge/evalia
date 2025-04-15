class CoursesController < ApplicationController
  before_action :set_course, only: [:show, :edit, :update, :destroy, :students, :assignments, :quizzes, :reports]
  
  # GET /courses
  def index
    @courses = current_user.courses.includes(:students, :assignments)
                          .order(:name)
                          .paginate(page: params[:page], per_page: 12)
  end
  
  # GET /courses/1
  def show
    @students = @course.students.includes(:grades)
                      .order(:last_name, :first_name)
                      .paginate(page: params[:page], per_page: 20)
    
    @assignments = @course.assignments.includes(:grades)
                          .order(due_date: :desc)
                          .limit(5)
    
    @recent_grades = Grade.joins(assignment: :course)
                          .where(assignments: { course_id: @course.id })
                          .includes(:student, :assignment)
                          .order(created_at: :desc)
                          .limit(5)
    
    @grade_distribution = {}
    
    grades = Grade.joins(assignment: :course)
                  .where(assignments: { course_id: @course.id })
    
    grades.each do |grade|
      letter = grade.letter_grade
      @grade_distribution[letter] ||= 0
      @grade_distribution[letter] += 1
    end
    
    @at_risk_count = @course.students.joins(:grades)
                            .where(grades: { letter_grade: ['D', 'F'] })
                            .distinct.count
  end
  
  # GET /courses/new
  def new
    @course = Course.new
  end
  
  # GET /courses/1/edit
  def edit
  end
  
  # POST /courses
  def create
    @course = current_user.courses.new(course_params)
    
    if @course.save
      redirect_to @course, notice: 'Class was successfully created.'
    else
      render :new
    end
  end
  
  # PATCH/PUT /courses/1
  def update
    if @course.update(course_params)
      redirect_to @course, notice: 'Class was successfully updated.'
    else
      render :edit
    end
  end
  
  # DELETE /courses/1
  def destroy
    @course.destroy
    redirect_to courses_path, notice: 'Class was successfully deleted.'
  end
  
  # GET /courses/1/students
  def students
    @students = @course.students.includes(:grades)
                      .order(:last_name, :first_name)
                      .paginate(page: params[:page], per_page: 20)
    
    @available_students = if current_user.school_id
                            Student.where(school_id: current_user.school_id)
                                  .where.not(id: @course.students.pluck(:id))
                                  .order(:last_name, :first_name)
                                  .limit(10)
                          else
                            []
                          end
  end
  
  # GET /courses/1/assignments
  def assignments
    @assignments = @course.assignments.includes(:grades)
                          .order(due_date: :desc)
                          .paginate(page: params[:page], per_page: 10)
  end
  
  # GET /courses/1/quizzes
  def quizzes
    @quizzes = @course.quizzes.includes(:quiz_submissions)
                      .order(created_at: :desc)
                      .paginate(page: params[:page], per_page: 10)
    
    @available_quizzes = Quiz.where(teacher_id: current_user.id)
                            .where.not(id: @course.quizzes.pluck(:id))
                            .order(created_at: :desc)
                            .limit(10)
  end
  
  # GET /courses/1/reports
  def reports
    @grade_distribution = {}
    
    grades = Grade.joins(assignment: :course)
                  .where(assignments: { course_id: @course.id })
    
    grades.each do |grade|
      letter = grade.letter_grade
      @grade_distribution[letter] ||= 0
      @grade_distribution[letter] += 1
    end
    
    @assignment_averages = @course.assignments.map do |assignment|
      {
        name: assignment.name,
        average: assignment.average_score,
        max_score: assignment.max_score
      }
    end
    
    @student_averages = @course.students.map do |student|
      grades = Grade.joins(:assignment)
                    .where(student_id: student.id, assignments: { course_id: @course.id })
      
      total_score = grades.sum(:score)
      total_max = grades.joins(:assignment).sum('assignments.max_score')
      
      average = total_max > 0 ? (total_score / total_max.to_f * 100).round(1) : 0
      
      {
        name: student.full_name,
        average: average
      }
    end
  end
  
  private
  
  def set_course
    @course = current_user.courses.find(params[:id])
  end
  
  def course_params
    params.require(:course).permit(:name, :description, :subject, :grade_level, :period, :room, :school_year, :active)
  end
end