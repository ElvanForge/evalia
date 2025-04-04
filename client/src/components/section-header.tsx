import React, { ReactNode } from "react";

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  rightContent?: ReactNode;
  leftContent?: ReactNode;
  className?: string;
}

export default function SectionHeader({ 
  title, 
  subtitle, 
  rightContent,
  leftContent,
  className = ""
}: SectionHeaderProps) {
  // Apply styling to any buttons in rightContent or leftContent
  const styleButtons = (content: ReactNode): ReactNode => {
    if (!content) return content;
    
    if (React.isValidElement(content)) {
      // Check if it's a button element
      if (content.type === 'button' || 
          (content.props && 
           typeof content.props.className === 'string' && 
           content.props.className.includes('Button'))) {
        // Add border and shadow to make buttons stand out
        return React.cloneElement(content, {
          ...content.props,
          className: `${content.props.className || ''} border-2 border-white font-medium shadow-md hover:shadow-lg`
        });
      }
      
      // Recursively process children elements
      if (content.props && content.props.children) {
        return React.cloneElement(content, {
          ...content.props,
          children: React.Children.map(content.props.children, (child: ReactNode) => styleButtons(child))
        });
      }
    }
    return content;
  };

  const styledLeftContent = leftContent ? styleButtons(leftContent) : null;
  const styledRightContent = rightContent ? styleButtons(rightContent) : null;

  return (
    <div className={`w-full bg-[#0ba2b0] p-6 rounded-lg mb-6 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
          {subtitle && (
            <p className="text-white/80 mt-1">{subtitle}</p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {styledLeftContent && (
            <div className="flex-shrink-0">
              {styledLeftContent}
            </div>
          )}
          {styledRightContent && (
            <div className="flex-shrink-0">
              {styledRightContent}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}