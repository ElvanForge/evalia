# Configure Active Storage for the application

# Allowed content types for uploads
Rails.application.config.active_storage.content_types_allowed_inline = [
  'image/png',
  'image/jpg',
  'image/jpeg',
  'image/gif',
  'image/svg+xml',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', # .docx
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', # .xlsx
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', # .pptx
  'text/plain'
]

# Configure for direct uploads
Rails.application.config.active_storage.direct_upload_routes = true

# Configure replace_on_assign_to_many
Rails.application.config.active_storage.replace_on_assign_to_many = true

# Configure maximum upload size (50MB)
Rails.application.config.active_storage.web_image_content_types = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif'
]

# Custom analyzers
Rails.application.config.active_storage.analyzers = [
  ActiveStorage::Analyzer::ImageAnalyzer::Vips,
  ActiveStorage::Analyzer::VideoAnalyzer,
  ActiveStorage::Analyzer::PdfAnalyzer
]

# Custom previewers
Rails.application.config.active_storage.previewers = [
  ActiveStorage::Previewer::PdfPreviewer,
  ActiveStorage::Previewer::VideoPreviewer
]

# Configure variable representation size limits
Rails.application.config.active_storage.variable_representation_size_limit = 50.megabytes

# Configure attachment path prefix for URLs
ActiveStorage::Blob.service_urls_expire_in = 1.hour

# Configure queue for Active Storage jobs
Rails.application.config.active_storage.queues = {
  analysis: :active_storage_analysis,
  purge: :active_storage_purge,
  mirror: :active_storage_mirror
}

# Configure Active Storage routes prefix
Rails.application.config.active_storage.routes_prefix = '/storage'