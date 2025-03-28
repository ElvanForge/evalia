import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Students from "@/pages/students";
import Classes from "@/pages/classes";
import ClassDetail from "@/pages/classes/[id]";
import NewClass from "@/pages/classes/new";
import Assignments from "@/pages/assignments";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";
import NewGrade from "@/pages/grades/new";
import EditGrade from "@/pages/grades/[id]/edit";
import Quizzes from "@/pages/quizzes";
import NewQuiz from "@/pages/quizzes/new";
import QuizDetail from "@/pages/quizzes/[id]";
import QuizPreview from "@/pages/quizzes/[id]/preview";
import { AuthProvider } from "@/hooks/use-auth.tsx";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/students" component={Students} />
      <Route path="/classes" component={Classes} />
      <Route path="/classes/new" component={NewClass} />
      <Route path="/classes/:id" component={ClassDetail} />
      <Route path="/assignments" component={Assignments} />
      <Route path="/reports" component={Reports} />
      <Route path="/settings" component={Settings} />
      <Route path="/auth/login" component={Login} />
      <Route path="/auth/register" component={Register} />
      <Route path="/grades/new" component={NewGrade} />
      <Route path="/grades/:id/edit" component={EditGrade} />
      <Route path="/quizzes" component={Quizzes} />
      <Route path="/quizzes/new" component={NewQuiz} />
      <Route path="/quizzes/:id" component={QuizDetail} />
      <Route path="/quizzes/:id/preview" component={QuizPreview} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
