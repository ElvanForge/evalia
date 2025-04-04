import React, { useState } from "react";
import { Sidebar } from "@/components/ui/sidebar";
import { Search, Bell, Menu, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth.tsx";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
  title: string;
  requireAuth?: boolean;
}

export default function Layout({ 
  children, 
  title,
  requireAuth = true 
}: LayoutProps) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

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

  if (requireAuth && !user && !isAuthLoading) {
    return null;
  }

  return (
    <div className="h-screen flex overflow-hidden bg-white">
      <Sidebar />
      
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Main content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
