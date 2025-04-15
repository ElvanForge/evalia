module ApplicationHelper
  # Returns the appropriate CSS class for flash messages
  def flash_class(type)
    case type.to_sym
    when :notice, :success
      'flash-success'
    when :alert, :error
      'flash-error'
    when :info
      'flash-info'
    else
      'flash-info'
    end
  end
  
  # Checks if the user is logged in
  def logged_in?
    !!current_user
  end
  
  # Returns the current user
  def current_user
    @current_user ||= Teacher.find_by(id: session[:teacher_id]) if session[:teacher_id]
  end
  
  # Formats a date (e.g., "Mar 15, 2025")
  def format_date(date)
    date&.strftime("%b %d, %Y")
  end
  
  # Formats a datetime (e.g., "Mar 15, 2025 at 2:30 PM")
  def format_datetime(datetime)
    datetime&.strftime("%b %d, %Y at %I:%M %p")
  end
  
  # Returns active class if the path matches the current path
  def active_class(path)
    request.path.start_with?(path) ? 'active' : ''
  end
  
  # Generates a gravatar URL for a given email address
  def gravatar_url(email, size = 80)
    gravatar_id = Digest::MD5.hexdigest(email.to_s.downcase)
    "https://gravatar.com/avatar/#{gravatar_id}?s=#{size}&d=mp"
  end
  
  # Renders grade with appropriate color based on letter grade
  def grade_badge(letter)
    case letter
    when 'A'
      content_tag(:span, letter, class: "px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800")
    when 'B'
      content_tag(:span, letter, class: "px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800")
    when 'C'
      content_tag(:span, letter, class: "px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800")
    when 'D'
      content_tag(:span, letter, class: "px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800")
    when 'F'
      content_tag(:span, letter, class: "px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800")
    else
      content_tag(:span, letter, class: "px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800")
    end
  end
  
  # Returns text color class for a letter grade
  def grade_color(letter)
    case letter
    when 'A'
      'text-green-600'
    when 'B'
      'text-blue-600'
    when 'C'
      'text-yellow-600'
    when 'D'
      'text-orange-600'
    when 'F'
      'text-red-600'
    else
      'text-gray-600'
    end
  end
  
  # Returns background color class for a letter grade
  def grade_color_bg(letter)
    case letter
    when 'A'
      'bg-green-500'
    when 'B'
      'bg-blue-500'
    when 'C'
      'bg-yellow-500'
    when 'D'
      'bg-orange-500'
    when 'F'
      'bg-red-500'
    else
      'bg-gray-400'
    end
  end
  
  # Returns description label for a letter grade
  def grade_label(letter)
    case letter
    when 'A'
      'Excellent'
    when 'B'
      'Good'
    when 'C'
      'Satisfactory'
    when 'D'
      'Needs Improvement'
    when 'F'
      'Unsatisfactory'
    else
      'Not Graded'
    end
  end
  
  # Creates an icon with text
  def icon_with_text(icon_name, text, options = {})
    css_class = options.delete(:class) || ""
    content_tag(:div, class: "flex items-center #{css_class}") do
      content_tag(:i, "", data: { lucide: icon_name }, class: "h-4 w-4 mr-1.5") + text
    end
  end
end