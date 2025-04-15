# Configure Active Storage to use the existing uploads directory
Rails.application.config.to_prepare do
  # Set the service URL for Active Storage blob paths 
  ActiveStorage::Blob.service = ActiveStorage::Service::DiskService.new(
    root: Rails.application.config.uploads_dir
  )
  
  # Configure analyzers
  Rails.application.config.active_storage.analyzers = [
    ActiveStorage::Analyzer::ImageAnalyzer::Vips,
    ActiveStorage::Analyzer::VideoAnalyzer
  ]
  
  # Configure previewers
  Rails.application.config.active_storage.previewers = [
    ActiveStorage::Previewer::PopplerPDFPreviewer,
    ActiveStorage::Previewer::MuPDFPreviewer,
    ActiveStorage::Previewer::VideoPreviewer
  ]
  
  # Configure variable sizes for variants
  Rails.application.config.active_storage.variable_content_types = %w(
    image/png
    image/gif
    image/jpg
    image/jpeg
    image/webp
  )
end