import React, { useState } from "react";
import { Sidebar } from "@/components/ui/sidebar";
import { Search, Bell, Menu, ChevronLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth.tsx";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface QuizLayoutProps {
  children: React.ReactNode;
  title: string;
  requireAuth?: boolean;
  isFullscreen?: boolean; // New prop to toggle fullscreen mode
}

export default function QuizLayout({ 
  children, 
  title,
  requireAuth = true,
  isFullscreen = false
}: QuizLayoutProps) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [sidebarVisible, setSidebarVisible] = useState(!isFullscreen);

  useEffect(() => {
    if (requireAuth && !user && !isAuthLoading) {
      toast({
        title: "Authentication Required",
        description: "Please login to access this page",
        variant: "destructive",
      });
      navigate("/auth/login");
    }
  }, [user, isAuthLoading, requireAuth, navigate, toast]);

  // Set sidebar state when isFullscreen prop changes
  useEffect(() => {
    setSidebarVisible(!isFullscreen);
  }, [isFullscreen]);

  if (requireAuth && !user && !isAuthLoading) {
    return null;
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Sidebar with conditional rendering based on state */}
      <div className={cn(
        "transition-all duration-300 ease-in-out",
        sidebarVisible ? "w-64" : "w-0 overflow-hidden"
      )}>
        <Sidebar />
      </div>
      
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex items-center">
              {/* Toggle sidebar button */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="mr-4"
                onClick={() => setSidebarVisible(!sidebarVisible)}
              >
                {sidebarVisible ? <ChevronLeft className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
              
              {/* Page title when in fullscreen quiz mode */}
              {isFullscreen && (
                <h1 className="text-lg font-medium">{title}</h1>
              )}
              
              {/* Search only when not in fullscreen */}
              {!isFullscreen && (
                <div className="w-full max-w-lg lg:max-w-xs">
                  <label htmlFor="search" className="sr-only">Search</label>
                  <div className="relative text-gray-400 focus-within:text-gray-600">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5" />
                    </div>
                    <Input
                      id="search"
                      placeholder="Search for students, classes..."
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Exit fullscreen button when in fullscreen mode */}
            {isFullscreen ? (
              <Button 
                variant="ghost" 
                onClick={() => navigate(`/quizzes/${title.split(' ').pop()}`)} 
                className="flex items-center"
              >
                <X className="h-5 w-5 mr-2" />
                Exit
              </Button>
            ) : (
              <div className="ml-4 flex items-center md:ml-6">
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-500">
                  <Bell className="h-6 w-6" />
                </Button>
              </div>
            )}
          </div>
        </div>
        
        {/* Main content - adjusted padding when in fullscreen */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className={cn(
            "h-full",
            isFullscreen ? "py-0" : "py-6"
          )}>
            <div className={cn(
              "h-full mx-auto",
              isFullscreen ? "px-0" : "max-w-7xl px-4 sm:px-6 md:px-8"
            )}>
              {/* Content - full viewport when in quiz mode */}
              <div className={cn(
                "h-full",
                isFullscreen ? "" : "max-w-7xl mx-auto px-4 sm:px-6 md:px-8"
              )}>
                {children}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}