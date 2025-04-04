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
          {leftContent && (
            <div className="flex-shrink-0">
              {leftContent}
            </div>
          )}
          {rightContent && (
            <div className="flex-shrink-0">
              {rightContent}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}