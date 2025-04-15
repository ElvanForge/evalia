Rails.application.routes.draw do
  # Root route
  root "dashboard#index"
  
  # Authentication routes
  get '/login', to: 'sessions#new'
  post '/login', to: 'sessions#create'
  delete '/logout', to: 'sessions#destroy'
  
  # Dashboard
  get '/dashboard', to: 'dashboard#index'
  
  # Profile routes
  get '/profile', to: 'teachers#show'
  get '/settings', to: 'settings#index'
  
  # Schools
  resources :schools do
    resources :teachers, shallow: true
    resources :students, shallow: true
  end
  
  # Teachers
  resources :teachers do
    collection do
      get 'manage', to: 'teachers#manage'
    end
  end
  
  # Courses (renamed from classes to avoid Ruby keyword)
  resources :courses do
    resources :students, only: [:index]
    resources :assignments, shallow: true
    resources :quizzes, only: [:index]
    
    member do
      post 'enroll_student'
      delete 'remove_student/:student_id', to: 'courses#remove_student', as: 'remove_student'
    end
  end
  
  # Students
  resources :students do
    resources :grades, only: [:index]
    
    collection do
      get 'import'
      post 'import', to: 'students#process_import'
    end
  end
  
  # Student alerts
  get '/student_alerts', to: 'students#alerts'
  
  # Assignments
  resources :assignments do
    resources :grades, shallow: true
    
    collection do
      get 'quick_grade', to: 'grades#quick_grade'
      post 'batch_update', to: 'grades#batch_update'
    end
  end
  
  # Grades
  resources :grades
  
  # Quizzes
  resources :quizzes do
    resources :quiz_questions, shallow: true
    
    member do
      get 'preview'
      get 'administer'
      post 'assign_to_classes'
      delete 'remove_from_class/:class_id', to: 'quizzes#remove_from_class', as: 'remove_from_class'
    end
    
    collection do
      get 'administered'
    end
  end
  
  # Quiz Questions
  resources :quiz_questions do
    resources :quiz_options, shallow: true
  end
  
  # Quiz Submissions (for students taking quizzes)
  resources :quiz_submissions, only: [:new, :create, :show] do
    collection do
      get 'take/:quiz_id', to: 'quiz_submissions#take', as: 'take'
      post 'submit_answer/:quiz_id', to: 'quiz_submissions#submit_answer', as: 'submit_answer'
      get 'results/:quiz_id', to: 'quiz_submissions#results', as: 'results'
    end
  end
  
  # Reports
  get '/reports', to: 'reports#index'
  get '/reports/student/:student_id', to: 'reports#student', as: 'student_report'
  get '/reports/class/:class_id', to: 'reports#class', as: 'class_report'
  get '/reports/assignment/:assignment_id', to: 'reports#assignment', as: 'assignment_report'
  get '/reports/export/csv/:class_id', to: 'reports#export_csv', as: 'export_csv'
  get '/reports/export/xml/:class_id', to: 'reports#export_xml', as: 'export_xml'
  
  # Lesson Plans
  resources :lesson_plans do
    resources :lesson_plan_materials, shallow: true
    resources :lesson_plan_generated_contents, shallow: true, path: 'generated_contents'
    
    member do
      get 'export/:format', to: 'lesson_plans#export', as: 'export', constraints: { format: /(docx|pdf)/ }
      post 'generate/:content_type', to: 'lesson_plans#generate_content', as: 'generate_content'
      patch 'apply_content/:content_id', to: 'lesson_plans#apply_content', as: 'apply_content'
    end
  end
  
  # Grade Scales
  resources :grade_scales do
    resources :grade_scale_entries, shallow: true
    
    member do
      post 'set_default'
    end
  end
  
  # API routes
  namespace :api do
    resources :students, only: [:index, :show, :create, :update, :destroy]
    resources :courses, only: [:index, :show]
    resources :assignments, only: [:index, :show, :create]
    resources :grades, only: [:index, :show, :create, :update]
    resources :quizzes, only: [:index, :show]
    
    # Batch operations
    post 'grades/batch', to: 'grades#batch_create_or_update'
    
    # Quiz administration
    get 'quizzes/:id/questions', to: 'quizzes#questions'
    post 'quizzes/:id/submit', to: 'quizzes#submit'
    
    # Reports
    get 'reports/student/:student_id', to: 'reports#student'
    get 'reports/class/:class_id', to: 'reports#class'
    get 'reports/export/csv/:class_id', to: 'reports#export_csv'
    get 'reports/export/xml/:class_id', to: 'reports#export_xml'
  end
  
  # Error routes
  match '/404', to: 'errors#not_found', via: :all
  match '/500', to: 'errors#internal_server_error', via: :all
end