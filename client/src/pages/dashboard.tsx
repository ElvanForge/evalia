import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth.tsx";
import { Sidebar } from "@/components/ui/sidebar";
import Dashboard from "@/components/Dashboard";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Teacher } from "@shared/schema";

export default function DashboardPage() {
  const { user, isLoading: isAuthLoading } = useAuth();

  useEffect(() => {
    // Set page title
    document.title = "Evalia Dashboard";
  }, []);

  // If user is not logged in, show a login screen
  if (!user && !isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <img src="/src/assets/evalia-logo.svg" alt="Evalia Logo" className="mx-auto h-16 w-16" />
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Evalia Teacher Dashboard
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Track student grades, manage classes, and administer quizzes
            </p>
          </div>
          <div className="mt-8 space-y-6">
            <div className="flex flex-col justify-center space-y-4">
              <Link href="/auth/login">
                <Button className="w-full py-6 text-lg">
                  Login to Dashboard
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button variant="outline" className="w-full py-6 text-lg">
                  Register New Account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      <Sidebar />
      
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Main content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none p-6">
          <div className="max-w-7xl mx-auto">
            <Dashboard currentUser={user as Teacher} />
          </div>
        </main>
      </div>
    </div>
  );
}
