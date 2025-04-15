class LessonPlan < ApplicationRecord
  # Associations
  belongs_to :teacher
  belongs_to :course, foreign_key: 'class_id', optional: true
  has_many :lesson_plan_materials, dependent: :destroy
  has_many :lesson_plan_generated_contents, dependent: :destroy
  
  # Active Storage
  has_one_attached :exported_file
  
  # Validations
  validates :title, presence: true, length: { maximum: 100 }
  validates :grade_level, length: { maximum: 20 }
  validates :subject, length: { maximum: 50 }
  validates :objective, length: { maximum: 1000 }
  validates :duration, numericality: { greater_than: 0, allow_nil: true }
  
  # Scopes
  scope :recent, -> { order(created_at: :desc) }
  scope :by_subject, -> { order(:subject) }
  scope :by_grade_level, -> { order(:grade_level) }
  
  def apply_generated_content(content_id)
    content = lesson_plan_generated_contents.find_by(id: content_id)
    return false unless content
    
    # Update the appropriate field based on content type
    case content.content_type
    when 'objectives'
      update(objective: content.content)
    when 'activities'
      update(activities: content.content)
    when 'materials'
      update(materials_list: content.content)
    when 'assessment'
      update(assessment: content.content)
    when 'homework'
      update(homework: content.content)
    when 'full_plan'
      # Parse and apply to all fields
      begin
        json_content = JSON.parse(content.content)
        update(
          objective: json_content['objective'],
          activities: json_content['activities'],
          materials_list: json_content['materials'],
          assessment: json_content['assessment'],
          homework: json_content['homework']
        )
      rescue
        return false
      end
    end
    
    # Mark content as applied
    content.update(is_applied: true)
    true
  end
  
  def generate_pdf
    require 'prawn'
    
    pdf = Prawn::Document.new
    
    # Add header
    pdf.font_size(18) { pdf.text title, style: :bold }
    pdf.move_down 10
    
    # Add metadata
    pdf.font_size(12) do
      metadata = []
      metadata << "Grade Level: #{grade_level}" if grade_level.present?
      metadata << "Subject: #{subject}" if subject.present?
      metadata << "Duration: #{duration_display}" if duration.present?
      pdf.text metadata.join(' | ')
    end
    
    pdf.move_down 20
    
    # Add sections
    add_section(pdf, 'Objectives', objective)
    add_section(pdf, 'Activities', activities)
    add_section(pdf, 'Materials', materials_list)
    add_section(pdf, 'Assessment', assessment)
    add_section(pdf, 'Homework', homework)
    add_section(pdf, 'Notes', notes)
    
    # Add footer with timestamp and teacher name
    pdf.number_pages "Generated on #{Time.current.strftime('%B %d, %Y')} by #{teacher.full_name}",
                    at: [pdf.bounds.left, 0],
                    align: :center,
                    size: 8
    
    pdf.render
  end
  
  def generate_docx
    require 'htmltoword'
    
    # Build HTML content
    html = <<-HTML
      <html>
        <head>
          <title>#{title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 1cm; }
            h1 { color: #0ba2b0; }
            h2 { color: #0ba2b0; margin-top: 20px; }
            .metadata { color: #666; margin-bottom: 20px; }
            .section { margin-bottom: 15px; }
          </style>
        </head>
        <body>
          <h1>#{title}</h1>
          <div class="metadata">
            #{grade_level.present? ? "Grade Level: #{grade_level}" : ""}
            #{subject.present? ? " | Subject: #{subject}" : ""}
            #{duration.present? ? " | Duration: #{duration_display}" : ""}
          </div>
          
          #{add_html_section('Objectives', objective)}
          #{add_html_section('Activities', activities)}
          #{add_html_section('Materials', materials_list)}
          #{add_html_section('Assessment', assessment)}
          #{add_html_section('Homework', homework)}
          #{add_html_section('Notes', notes)}
          
          <div style="margin-top: 30px; font-size: 8pt; color: #999; text-align: center;">
            Generated on #{Time.current.strftime('%B %d, %Y')} by #{teacher.full_name}
          </div>
        </body>
      </html>
    HTML
    
    Htmltoword::Document.create_and_save(html, nil)
  end
  
  def duration_display
    return 'Not specified' unless duration
    
    hours = duration / 60
    minutes = duration % 60
    
    if hours > 0
      "#{hours} hour#{'s' if hours > 1}#{' ' + minutes.to_s + ' minute' + ('s' if minutes > 1).to_s if minutes > 0}"
    else
      "#{minutes} minute#{'s' if minutes > 1}"
    end
  end
  
  private
  
  def add_section(pdf, title, content)
    return unless content.present?
    
    pdf.font_size(14) { pdf.text title, style: :bold }
    pdf.move_down 5
    pdf.text content
    pdf.move_down 15
  end
  
  def add_html_section(title, content)
    return '' unless content.present?
    
    <<-HTML
      <div class="section">
        <h2>#{title}</h2>
        <p>#{content.gsub("\n", "<br>")}</p>
      </div>
    HTML
  end
end