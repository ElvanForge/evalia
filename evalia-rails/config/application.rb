require_relative "boot"

require "rails/all"

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

module EvaliaRails
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
    
    # Use Vips for image processing
    config.active_storage.variant_processor = :vips
    
    # Custom configuration settings
    config.evalia = config_for(:evalia)
    
    # Use new asset pipeline
    config.assets.enabled = true
    config.assets.compile = true
    
    # Set default locale to English
    config.i18n.default_locale = :en
    config.i18n.fallbacks = true
    
    # Add custom paths for generators
    config.generators do |g|
      g.test_framework :rspec, 
                       fixtures: true,
                       view_specs: false,
                       helper_specs: false,
                       routing_specs: false,
                       controller_specs: true,
                       request_specs: true
      g.fixture_replacement :factory_bot, dir: "spec/factories"
    end
    
    # Configure session for cookie store
    config.session_store :cookie_store, key: '_evalia_session', expire_after: 12.hours
    
    # Set default queue adapter for Active Job
    config.active_job.queue_adapter = :sidekiq
    
    # Configure Active Storage for uploads
    config.active_storage.service = :local
    
    # Enable ORM error handling in forms
    config.action_view.field_error_proc = Proc.new { |html_tag, instance| 
      html_tag
    }
  end
end