class CoursesController < ApplicationController
  before_action :require_login
  before_action :set_course, only: [:show, :edit, :update, :destroy, :enroll_student, :remove_student]
  
  def index
    @courses = Course.where(teacher_id: current_user.id).order(name: :asc)
  end
  
  def show
    @students = @course.students.order(:first_name, :last_name)
    @assignments = @course.assignments.order(created_at: :desc)
    @quizzes = @course.quizzes.order(created_at: :desc)
    
    # Basic statistics for the course
    @student_count = @students.count
    @assignment_count = @assignments.count
    @quiz_count = @quizzes.count
    
    # Grade distribution for this course
    @grade_distribution = Grade.joins(:assignment)
                             .where(assignments: { class_id: @course.id })
                             .group(:letter_grade)
                             .count
  end
  
  def new
    @course = Course.new
  end
  
  def create
    @course = Course.new(course_params)
    @course.teacher = current_user
    @course.school_id = current_user.school_id
    
    if @course.save
      flash[:notice] = "Class '#{@course.name}' was successfully created."
      redirect_to @course
    else
      render :new
    end
  end
  
  def edit
  end
  
  def update
    if @course.update(course_params)
      flash[:notice] = "Class '#{@course.name}' was successfully updated."
      redirect_to @course
    else
      render :edit
    end
  end
  
  def destroy
    name = @course.name
    
    if @course.destroy
      flash[:notice] = "Class '#{name}' was successfully deleted."
      redirect_to courses_path
    else
      flash[:alert] = "Failed to delete class. Please try again."
      redirect_to @course
    end
  end
  
  def enroll_student
    student = Student.find(params[:student_id])
    
    # Check if student is already enrolled
    if @course.students.include?(student)
      flash[:alert] = "#{student.full_name} is already enrolled in this class."
    else
      @course.students << student
      flash[:notice] = "#{student.full_name} was successfully enrolled in #{@course.name}."
    end
    
    redirect_to @course
  end
  
  def remove_student
    student = Student.find(params[:student_id])
    
    if @course.students.include?(student)
      @course.students.delete(student)
      flash[:notice] = "#{student.full_name} was removed from #{@course.name}."
    else
      flash[:alert] = "#{student.full_name} is not enrolled in this class."
    end
    
    redirect_to @course
  end
  
  private
  
  def set_course
    @course = Course.find(params[:id])
    
    # Security check: ensure the course belongs to the current user
    unless @course.teacher_id == current_user.id || current_user.admin? || current_user.manager?
      flash[:alert] = "You don't have permission to access this class."
      redirect_to courses_path
    end
  end
  
  def course_params
    params.require(:course).permit(:name, :description, :subject, :grade_level, :period)
  end
end