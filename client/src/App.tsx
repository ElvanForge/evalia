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
import QuizDemo from "@/pages/quiz-demo";
import Manager from "@/pages/manager";
import Landing from "@/pages/landing";
import Checkout from "@/pages/checkout";
import Subscribe from "@/pages/subscribe";
import BetaApplication from "@/pages/beta-application";
import ImageTest from "@/pages/image-test";
import ImageDebug from "@/pages/image-debug";
import DebugPage from "@/pages/debug-page";
import { AuthProvider } from "@/hooks/use-auth.tsx";

// Import our new assignment pages
import AssignmentDetail from "@/pages/assignments/[id]";
import EditAssignment from "@/pages/assignments/[id]/edit";

// Import the student alerts page
import StudentAlerts from "@/pages/students/alerts";

// Import lesson plan pages
import LessonPlans from "@/pages/lesson-plans";
import CreateLessonPlan from "@/pages/lesson-plans/create";
import LessonPlanDetail from "@/pages/lesson-plans/[id]";
import EditLessonPlan from "@/pages/lesson-plans/[id]/edit";
import ExportLessonPlan from "@/pages/lesson-plans/[id]/export";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/students" component={Students} />
      <Route path="/students/alerts" component={StudentAlerts} />
      <Route path="/classes" component={Classes} />
      <Route path="/classes/new" component={NewClass} />
      <Route path="/classes/:id" component={ClassDetail} />
      <Route path="/assignments" component={Assignments} />
      <Route path="/assignments/:id" component={AssignmentDetail} />
      <Route path="/assignments/:id/edit" component={EditAssignment} />
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
      <Route path="/quiz-demo" component={QuizDemo} />
      <Route path="/manager" component={Manager} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/subscribe" component={Subscribe} />
      <Route path="/subscribe/:planId" component={Subscribe} />
      <Route path="/beta-application" component={BetaApplication} />
      <Route path="/image-test" component={ImageTest} />
      <Route path="/image-debug" component={ImageDebug} />
      <Route path="/lesson-plans" component={LessonPlans} />
      <Route path="/lesson-plans/create" component={CreateLessonPlan} />
      <Route path="/lesson-plans/:id" component={LessonPlanDetail} />
      <Route path="/lesson-plans/:id/edit" component={EditLessonPlan} />
      <Route path="/lesson-plans/:id/export" component={ExportLessonPlan} />
      <Route path="/debug" component={DebugPage} />
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
