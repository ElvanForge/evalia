source "https://rubygems.org"

ruby "3.2.2"

# Rails and application-specific gems
gem "rails", "~> 7.1.0"
gem "pg", "~> 1.1"
gem "puma", "~> 6.0"
gem "bcrypt", "~> 3.1.7"

# Asset management
gem "sprockets-rails"
gem "importmap-rails"
gem "turbo-rails"
gem "stimulus-rails"
gem "tailwindcss-rails"
gem "jbuilder"

# PDF generation
gem "prawn"
gem "prawn-table"

# XML builder
gem "builder"

# File upload
gem "active_storage_validations"
gem "image_processing", "~> 1.2"

# Payment processing
gem "stripe"

# Set up project structure
gem "bootsnap", require: false

group :development, :test do
  gem "debug", platforms: %i[ mri windows ]
  gem "pry-rails"
  gem "rspec-rails"
  gem "factory_bot_rails"
  gem "faker"
end

group :development do
  gem "web-console"
  gem "annotate"
  gem "rails-erd"
  gem "database_cleaner"
  gem "rubocop", require: false
  gem "rubocop-rails", require: false
end

group :test do
  gem "capybara"
  gem "selenium-webdriver"
  gem "webdrivers"
  gem "simplecov", require: false
end