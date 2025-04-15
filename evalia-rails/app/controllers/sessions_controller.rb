class SessionsController < ApplicationController
  def new
    # If already logged in, redirect to dashboard
    redirect_to root_path if logged_in?
  end
  
  def create
    teacher = Teacher.find_by(username: params[:username])
    
    if teacher&.authenticate(params[:password])
      # Set session
      session[:user_id] = teacher.id
      
      # Set flash message
      flash[:notice] = "Welcome back, #{teacher.first_name}!"
      
      # Redirect to dashboard
      redirect_to root_path
    else
      # Login failed
      flash.now[:alert] = "Invalid username or password"
      render :new
    end
  end
  
  def destroy
    # Clear session
    session.delete(:user_id)
    
    # Set flash message
    flash[:notice] = "You have been logged out successfully"
    
    # Redirect to login page
    redirect_to login_path
  end
end