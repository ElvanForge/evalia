require_relative "boot"

require "rails/all"

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

module Evalia
  class Application < Rails::Application
    # Initialize configuration defaults for originally generated Rails version.
    config.load_defaults 7.0

    # Configuration for the application, engines, and railties goes here.
    #
    # These settings can be overridden in specific environments using the files
    # in config/environments, which are processed later.
    #
    config.time_zone = "UTC"
    # config.eager_load_paths << Rails.root.join("extras")
    
    # Set session store to use cookies
    config.session_store :cookie_store, key: '_evalia_session'
    
    # Use same database connection used in server/db.ts
    config.database_url = ENV['DATABASE_URL']
    
    # Set uploads directory to match the existing uploads folder
    config.uploads_dir = Rails.root.join('../uploads')
    
    # Make sure uploaded directories exist
    FileUtils.mkdir_p(config.uploads_dir.join('images'))
    
    # Configure Active Storage to use existing uploads directory
    config.active_storage.service = :local
    
    # Configure generators
    config.generators do |g|
      g.orm :active_record
      g.template_engine :erb
      g.test_framework :rspec, fixture: true
      g.fixture_replacement :factory_bot, dir: "spec/factories"
      g.assets false
      g.helper false
    end
    
    # Security settings
    config.action_controller.default_protect_from_forgery = true
    config.action_dispatch.default_headers = {
      'X-Frame-Options' => 'SAMEORIGIN',
      'X-XSS-Protection' => '1; mode=block',
      'X-Content-Type-Options' => 'nosniff'
    }
  end
end