# Add the app/pdfs directory to the autoload paths
Rails.application.config.to_prepare do
  # Make sure prawn is loaded
  require 'prawn'
  require 'prawn/table'
  
  # Add the pdfs directory to the autoload paths
  Rails.application.config.eager_load_paths << Rails.root.join('app', 'pdfs')
end