class ApplicationController < ActionController::Base
  protect_from_forgery with: :exception
  
  before_action :set_active_storage_host
  helper_method :current_user, :logged_in?, :require_login
  
  private
  
  def current_user
    @current_user ||= Teacher.find_by(id: session[:user_id]) if session[:user_id]
  end
  
  def logged_in?
    !!current_user
  end
  
  def require_login
    unless logged_in?
      flash[:alert] = "You must be logged in to access this page"
      redirect_to login_path
    end
  end
  
  def require_admin
    unless current_user&.admin?
      flash[:alert] = "You must be an administrator to access this page"
      redirect_to root_path
    end
  end
  
  def require_manager_or_admin
    unless current_user&.admin? || current_user&.manager?
      flash[:alert] = "You don't have permission to access this page"
      redirect_to root_path
    end
  end
  
  # Set Active Storage host for development environment
  def set_active_storage_host
    if Rails.env.development?
      ActiveStorage::Current.host = request.base_url
    end
  end
end