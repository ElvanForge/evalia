class SessionsController < ApplicationController
  before_action :redirect_if_logged_in, only: [:new, :create]
  
  # GET /login
  def new
  end
  
  # POST /login
  def create
    teacher = Teacher.find_by(username: params[:username])
    
    if teacher && teacher.authenticate(params[:password])
      session[:teacher_id] = teacher.id
      redirect_to root_path, notice: "Logged in successfully!"
    else
      flash.now[:alert] = "Invalid username or password"
      render :new
    end
  end
  
  # DELETE /logout
  def destroy
    session[:teacher_id] = nil
    redirect_to login_path, notice: "Logged out successfully!"
  end
end