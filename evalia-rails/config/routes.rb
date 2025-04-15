Rails.application.routes.draw do
  # Root path
  root 'dashboard#index'
  
  # Authentication routes
  get '/login', to: 'sessions#new'
  post '/login', to: 'sessions#create'
  delete '/logout', to: 'sessions#destroy'
  
  # Dashboard
  get '/dashboard', to: 'dashboard#index'
  
  # Courses (Classes)
  resources :courses do
    resources :assignments, shallow: true
    resources :students, shallow: true
  end
  
  # Quizzes
  resources :quizzes do
    resources :quiz_questions, shallow: true
    member do
      get :preview
      get :administer
      post :assign_classes
      delete :remove_class
    end
  end
  
  # Quiz submissions
  resources :quiz_submissions, only: [:create, :show, :update]
  
  # Lesson Plans
  resources :lesson_plans do
    resources :lesson_plan_materials, only: [:create, :destroy], shallow: true
    resources :lesson_plan_generated_contents, only: [:create, :update, :destroy], shallow: true
    member do
      post :generate
      get :export
    end
  end
  
  # Grades
  resources :grades, only: [:create, :update, :destroy]
  post '/grades/batch', to: 'grades#batch_update'
  
  # Reports
  resources :reports, only: [:index] do
    collection do
      get :student_analytics
      get :class_analytics
      get :grades_export
    end
  end
  
  # Settings
  resources :settings, only: [:index, :update]
  resources :grade_scales
  
  # API Routes
  namespace :api do
    resources :students, only: [:index]
    resources :courses, only: [] do
      resources :students, only: [:index]
    end
    resources :assignments, only: [] do
      resources :grades, only: [:index]
    end
  end
  
  # Direct API endpoints
  get '/api/courses/:course_id/students', to: 'api#students_by_course'
  get '/api/student_alerts', to: 'api#student_alerts'
  
  # Subscription
  resources :subscriptions, only: [:new, :create, :show, :destroy] do
    collection do
      get :success
      get :cancel
    end
  end
  post '/webhooks/stripe', to: 'webhooks#stripe'
  
  # Catch-all
  match '*path', to: 'application#not_found', via: :all
end