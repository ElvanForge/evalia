import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth.tsx";
import { useToast } from "@/hooks/use-toast";
import { Sidebar } from "@/components/ui/sidebar";
import { StatsCard } from "@/components/dashboard/stats-card";
import { ClassCard } from "@/components/dashboard/class-card";
import { DataTable } from "@/components/ui/data-table";
import { GradeBadge } from "@/components/ui/grade-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  FolderKanban, 
  FileText, 
  BarChart3,
  Search,
  Bell,
  Plus
} from "lucide-react";
import { formatDate, percentageToLetterGrade } from "@/lib/grade-utils";
import { Class } from "@shared/schema";
import { Link } from "wouter";

export default function Dashboard() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();

  // Fetch dashboard stats
  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    enabled: !!user,
  });

  // Fetch classes
  const { data: classes, isLoading: isClassesLoading } = useQuery<Class[]>({
    queryKey: ["/api/classes"],
    enabled: !!user,
  });

  // Fetch recent grades
  const { data: recentGrades, isLoading: isGradesLoading } = useQuery({
    queryKey: ["/api/grades?limit=5"],
    enabled: !!user,
  });

  useEffect(() => {
    if (!user && !isAuthLoading) {
      toast({
        title: "Authentication Required",
        description: "Please login to access the dashboard",
        variant: "destructive",
      });
    }
  }, [user, isAuthLoading, toast]);

  // Convert classes to format needed by ClassCard
  const classCardData = classes?.map(class_ => ({
    id: class_.id,
    name: class_.name,
    studentCount: 0, // This would come from additional API data
    openAssignments: 0, // This would come from additional API data
    averageGrade: "B (85%)" // This would come from additional API data
  })) || [];

  const isLoading = isAuthLoading || isStatsLoading || isClassesLoading || isGradesLoading;

  const gradeColumns = [
    {
      header: "Student",
      accessorKey: "studentName",
    },
    {
      header: "Class",
      accessorKey: "className",
    },
    {
      header: "Assignment",
      accessorKey: "assignmentName",
    },
    {
      header: "Score",
      accessorKey: "score",
      cell: (grade: any) => <span>{grade.score}/{grade.maxScore || 100}</span>,
    },
    {
      header: "Grade",
      accessorKey: "letter",
      cell: (grade: any) => {
        const percentage = (grade.score / (grade.maxScore || 100)) * 100;
        const letter = percentageToLetterGrade(percentage);
        return <GradeBadge grade={letter} percentage={percentage} />;
      },
    },
    {
      header: "Date Entered",
      accessorKey: "gradedAt",
      cell: (grade: any) => <span>{formatDate(new Date(grade.gradedAt))}</span>,
    },
  ];

  const gradeActions = (grade: any) => (
    <Link href={`/grades/${grade.id}/edit`}>
      <a className="text-blue-600 hover:text-blue-900">Edit</a>
    </Link>
  );

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
        {/* Header */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex items-center">
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
            </div>
            
            <div className="ml-4 flex items-center md:ml-6">
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-500">
                <Bell className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Main content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
            </div>
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {/* Stats cards */}
              <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                  title="Total Students"
                  value={stats?.totalStudents || 0}
                  icon={<Users className="h-6 w-6 text-white" />}
                  iconColor="bg-blue-500"
                  link={{ href: "/students", label: "View all" }}
                />
                
                <StatsCard
                  title="Active Classes"
                  value={stats?.activeClasses || 0}
                  icon={<FolderKanban className="h-6 w-6 text-white" />}
                  iconColor="bg-green-500"
                  link={{ href: "/classes", label: "View all" }}
                />
                
                <StatsCard
                  title="Open Assignments"
                  value={stats?.openAssignments || 0}
                  icon={<FileText className="h-6 w-6 text-white" />}
                  iconColor="bg-purple-500"
                  link={{ href: "/assignments", label: "View all" }}
                />
                
                <StatsCard
                  title="Average Grade"
                  value={stats?.averageGrade ? `${percentageToLetterGrade(stats.averageGrade)} (${stats.averageGrade.toFixed(1)}%)` : "N/A"}
                  icon={<BarChart3 className="h-6 w-6 text-white" />}
                  iconColor="bg-yellow-500"
                  link={{ href: "/reports", label: "View details" }}
                />
              </div>
              
              {/* Class selection */}
              <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">Select a class to manage</h3>
                      <p className="mt-1 max-w-2xl text-sm text-gray-500">Choose a class to view students and assignments</p>
                    </div>
                    <div className="mt-4 md:mt-0 md:ml-4">
                      <Link href="/classes/new">
                        <Button>
                          <Plus className="-ml-1 mr-2 h-5 w-5" />
                          Add New Class
                        </Button>
                      </Link>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                      {classCardData.map((classData) => (
                        <ClassCard key={classData.id} class={classData} />
                      ))}

                      {classCardData.length === 0 && !isLoading && (
                        <div className="col-span-full text-center py-8">
                          <p className="text-gray-500">No classes found. Create your first class to get started!</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Recent grade entries */}
              <div className="mt-8">
                <div className="sm:flex sm:items-center">
                  <div className="sm:flex-auto">
                    <h2 className="text-xl font-semibold text-gray-900">Recent Grade Entries</h2>
                    <p className="mt-2 text-sm text-gray-700">A list of the most recent grades entered for all classes.</p>
                  </div>
                  <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                    <Link href="/grades/new">
                      <Button>
                        Enter New Grades
                      </Button>
                    </Link>
                  </div>
                </div>
                
                <div className="mt-4">
                  <DataTable
                    data={recentGrades || []}
                    columns={gradeColumns}
                    actions={gradeActions}
                    pageSize={5}
                  />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
