class LessonPlanMaterial < ApplicationRecord
  # Associations
  belongs_to :lesson_plan
  
  # Active Storage for document attachments
  has_one_attached :file
  
  # Validations
  validates :file_type, presence: true, inclusion: { in: %w[pdf docx doc ppt pptx txt] }
  
  # Callbacks
  before_validation :set_file_type, on: :create
  
  # Scopes
  scope :pdfs, -> { where(file_type: 'pdf') }
  scope :docs, -> { where(file_type: ['doc', 'docx']) }
  scope :presentations, -> { where(file_type: ['ppt', 'pptx']) }
  
  def file_name
    file.attached? ? file.filename.to_s : 'No file attached'
  end
  
  def file_url
    file.attached? ? Rails.application.routes.url_helpers.rails_blob_path(file, only_path: true) : nil
  end
  
  def file_size
    return nil unless file.attached?
    
    size_in_bytes = file.blob.byte_size
    
    if size_in_bytes < 1024
      "#{size_in_bytes} B"
    elsif size_in_bytes < 1024 * 1024
      "#{(size_in_bytes / 1024.0).round(1)} KB"
    else
      "#{(size_in_bytes / (1024.0 * 1024.0)).round(1)} MB"
    end
  end
  
  def icon_class
    case file_type
    when 'pdf'
      'file-pdf'
    when 'doc', 'docx'
      'file-text'
    when 'ppt', 'pptx'
      'file-presentation'
    when 'txt'
      'file-text'
    else
      'file'
    end
  end
  
  def extract_text
    return nil unless file.attached?
    
    case file_type
    when 'pdf'
      extract_pdf_text
    when 'docx'
      extract_docx_text
    when 'txt'
      file.download.force_encoding('UTF-8')
    else
      nil
    end
  end
  
  private
  
  def set_file_type
    return unless file.attached?
    
    extension = file.filename.extension.downcase
    
    self.file_type = case extension
                     when 'pdf' then 'pdf'
                     when 'doc' then 'doc'
                     when 'docx' then 'docx'
                     when 'ppt' then 'ppt'
                     when 'pptx' then 'pptx'
                     when 'txt' then 'txt'
                     else 'unknown'
                     end
  end
  
  def extract_pdf_text
    require 'pdf-reader'
    
    result = ""
    file_path = ActiveStorage::Blob.service.send(:path_for, file.key)
    
    begin
      PDF::Reader.new(file_path).pages.each do |page|
        result << page.text
        result << "\n\n"
      end
    rescue => e
      Rails.logger.error "Error extracting PDF text: #{e.message}"
      return "Error extracting text: #{e.message}"
    end
    
    result
  end
  
  def extract_docx_text
    require 'docx'
    
    begin
      file_path = ActiveStorage::Blob.service.send(:path_for, file.key)
      doc = Docx::Document.open(file_path)
      doc.paragraphs.map(&:to_s).join("\n")
    rescue => e
      Rails.logger.error "Error extracting DOCX text: #{e.message}"
      return "Error extracting text: #{e.message}"
    end
  end
end