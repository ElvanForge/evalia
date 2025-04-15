import React from 'react';

// Simple layout wrapper for components that still depend on it
interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}