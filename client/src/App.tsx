import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import StudentsPage from "@/pages/StudentsPage";
import ClassesPage from "@/pages/ClassesPage";
import AssignmentsPage from "@/pages/AssignmentsPage";
import GradesPage from "@/pages/GradesPage";
import ReportsPage from "@/pages/ReportsPage";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Teacher } from "@shared/schema";

function Router() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const { data: currentUser } = useQuery<Teacher | null>({
    queryKey: ['/api/auth/me'],
    onSuccess: (data) => {
      setIsAuthenticated(!!data);
    },
    onError: () => {
      setIsAuthenticated(false);
    },
  });

  // Show loading state while checking authentication
  if (isAuthenticated === null) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <Switch>
      {!isAuthenticated && <Route path="/" component={LoginPage} />}
      {isAuthenticated && (
        <>
          <Route path="/" component={DashboardPage} />
          <Route path="/students" component={StudentsPage} />
          <Route path="/classes" component={ClassesPage} />
          <Route path="/assignments" component={AssignmentsPage} />
          <Route path="/grades" component={GradesPage} />
          <Route path="/reports" component={ReportsPage} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
