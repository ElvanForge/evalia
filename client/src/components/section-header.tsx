import React, { ReactNode } from "react";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  rightContent?: ReactNode;
  className?: string;
}

export default function SectionHeader({ 
  title, 
  subtitle, 
  rightContent,
  className = ""
}: SectionHeaderProps) {
  return (
    <div className={`w-full bg-[#ede8dd] p-6 rounded-lg mb-6 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        {rightContent && (
          <div className="flex-shrink-0">
            {rightContent}
          </div>
        )}
      </div>
    </div>
  );
}