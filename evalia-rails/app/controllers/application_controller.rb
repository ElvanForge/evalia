class ApplicationController < ActionController::Base
  protect_from_forgery with: :exception
  helper_method :current_user, :logged_in?
  
  # 404 handler
  def not_found
    render file: "#{Rails.root}/public/404.html", status: :not_found, layout: false
  end
  
  private
  
  # Returns the current logged-in user
  def current_user
    @current_user ||= Teacher.find_by(id: session[:teacher_id]) if session[:teacher_id]
  end
  
  # Checks if user is logged in
  def logged_in?
    !!current_user
  end
  
  # Redirect to login page if not logged in
  def require_login
    unless logged_in?
      flash[:alert] = "You must be logged in to access this section"
      redirect_to login_path
    end
  end
  
  # Redirect to homepage if already logged in
  def redirect_if_logged_in
    if logged_in?
      redirect_to root_path
    end
  end
  
  # Redirect if user doesn't have premium access
  def require_premium
    unless current_user.premium?
      flash[:alert] = "This feature requires a premium subscription"
      redirect_to root_path
    end
  end
end