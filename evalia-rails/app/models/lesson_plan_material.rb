class LessonPlanMaterial < ApplicationRecord
  belongs_to :lesson_plan
  
  has_one_attached :file
  
  # Validations
  validates :lesson_plan_id, presence: true
  validates :file_path, presence: true, unless: -> { file.attached? }
  validates :file_type, presence: true
  
  # Scopes
  scope :pdfs, -> { where(file_type: 'pdf') }
  scope :images, -> { where(file_type: 'image') }
  scope :documents, -> { where(file_type: 'document') }
  
  # Methods
  def file_url
    if file.attached?
      Rails.application.routes.url_helpers.rails_blob_path(file, only_path: true)
    else
      file_path
    end
  end
  
  def filename
    if file.attached?
      file.filename.to_s
    else
      File.basename(file_path)
    end
  end
  
  def file_extension
    File.extname(filename).delete('.').downcase
  end
  
  def is_pdf?
    file_type == 'pdf' || file_extension == 'pdf'
  end
  
  def is_image?
    file_type == 'image' || %w(jpg jpeg png gif svg).include?(file_extension)
  end
  
  def is_document?
    file_type == 'document' || %w(doc docx txt rtf).include?(file_extension)
  end
  
  def text_content
    # This would normally extract text from the file
    # For PDFs, we'd use a gem like pdf-reader
    # For now, we'll return a placeholder
    "Text content extracted from #{filename}"
  end
end