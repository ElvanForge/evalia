import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import StatCard from "./stats/StatCard";
import GradeDistribution from "./stats/GradeDistribution";
import RecentActivity from "./RecentActivity";
import GradeTable from "./GradeTable";
import { ClassCard } from "./dashboard/class-card";
import { QuickGradeEntry } from "./dashboard/quick-grade-entry";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Teacher, Class, Assignment, Student } from "@shared/schema";
import { 
  Users, 
  BookOpen, 
  ArrowUpRight, 
  ArrowDownRight, 
  GraduationCap, 
  Clock,
  Calendar,
  LineChart
} from "lucide-react";

interface DashboardProps {
  currentUser: Teacher | null;
}

interface StatChange {
  value: string;
  type: 'increase' | 'decrease' | 'neutral';
}

interface Stats {
  students: {
    total: number;
    change: number;
  };
  classes: {
    total: number;
    change: number;
  };
  avgGrade: {
    value: number;
    letter: string;
    change: number;
  };
  pendingGrades: {
    total: number;
    dueToday: number;
  };
}

export default function Dashboard({ currentUser }: DashboardProps) {
  const { toast } = useToast();
  const [quickGradeClass, setQuickGradeClass] = useState<number | null>(null);
  const [quickGradeClassAssignments, setQuickGradeClassAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<number | null>(null);
  const [studentGrades, setStudentGrades] = useState<{ [key: number]: string }>({});
  const [isGrading, setIsGrading] = useState(false);
  
  // Student alerts state
  const [studentAlerts, setStudentAlerts] = useState<any[]>([]);
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(false);
  
  // Quick assignment creation states
  const [newAssignment, setNewAssignment] = useState({
    name: '',
    classId: '',
    dueDate: '',
    weight: '',
    type: '',
    description: '',
    maxScore: '100'  // Default max score
  });
  const [isCreatingAssignment, setIsCreatingAssignment] = useState(false);

  const teacherId = currentUser?.id ?? 0;

  // Fetch dashboard data
  const { data: dashboardData = {} } = useQuery({
    queryKey: [`/api/dashboard/${teacherId}`], 
    queryFn: async ({ queryKey }) => {
      const response = await fetch(queryKey[0]);
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      return response.json();
    },
    enabled: !!teacherId,
  });

  // Extract the dashboard statistics from the response
  const stats: Stats = dashboardData.stats || {
    students: { total: 0, change: 0 },
    classes: { total: 0, change: 0 },
    avgGrade: { value: 0, letter: 'N/A', change: 0 },
    pendingGrades: { total: 0, dueToday: 0 }
  };

  // Get grade distribution for the chart
  const gradeDistribution = dashboardData.gradeDistribution || {
    A: 0, B: 0, C: 0, D: 0, F: 0
  };

  // Get recent activities
  const recentActivities = dashboardData.recentActivities || [];

  // Get class cards data
  const classCards = dashboardData.classCards || [];

  // Fetch assignments
  const { data: assignments, isLoading: isLoadingAssignments } = useQuery({
    queryKey: ['/api/assignments'],
    enabled: !!currentUser,
  });

  // Fetch classes
  const { data: classes, isLoading: isLoadingClasses } = useQuery({
    queryKey: ['/api/classes'],
    enabled: !!currentUser,
  });
  
  // Fetch student alerts
  useEffect(() => {
    const fetchAlerts = async () => {
      setIsLoadingAlerts(true);
      try {
        const response = await fetch('/api/students/alerts');
        if (response.ok) {
          const data = await response.json();
          setStudentAlerts(data || []);
        } else {
          // Handle error by setting example alerts
          setStudentAlerts([]);
        }
      } catch (error) {
        console.error('Error fetching student alerts:', error);
        setStudentAlerts([]);
      } finally {
        setIsLoadingAlerts(false);
      }
    };
    
    if (currentUser) {
      fetchAlerts();
    }
  }, [currentUser]);

  // Fetch assignment-specific students when an assignment is selected
  const { data: students = [], isLoading: isLoadingStudents, refetch: refetchStudents } = useQuery({
    queryKey: ['/api/students/assignment', selectedAssignment],
    queryFn: async ({ queryKey }) => {
      if (!selectedAssignment) return [];
      const response = await fetch(`/api/students/assignment/${selectedAssignment}`);
      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }
      const data = await response.json();
      console.log('Fetched students:', data); // Debug log
      return data;
    },
    enabled: !!selectedAssignment,
  });

  // Save grades mutation
  const { mutate: saveGrades, isPending: isSavingGrades } = useMutation({
    mutationFn: async () => {
      if (!selectedAssignment) throw new Error('No assignment selected');
      
      const gradesToSave = Object.entries(studentGrades).map(([studentId, score]) => ({
        studentId: parseInt(studentId),
        assignmentId: selectedAssignment,
        score: parseFloat(score)
      }));
      
      if (gradesToSave.length === 0) throw new Error('No grades to save');
      
      const response = await fetch('/api/grades/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(gradesToSave),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save grades');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Reset form state after successful save
      setIsGrading(false);
      setSelectedAssignment(null);
      setStudentGrades({});
      
      toast({
        title: "Grades Saved",
        description: "Student grades have been updated successfully.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      console.error('Error saving grades:', error);
      // Keep form state to allow user to retry
      toast({
        title: "Error Saving Grades",
        description: error.message || "There was a problem saving the grades. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Create assignment mutation
  const { mutate: createAssignment, isPending: isCreatingAssignmentSubmitting } = useMutation({
    mutationFn: async () => {
      // Validate required fields
      if (!newAssignment.name) throw new Error("Assignment name is required");
      if (!newAssignment.classId) throw new Error("Class is required");
      if (!newAssignment.type) throw new Error("Assignment type is required");
      if (!newAssignment.maxScore) throw new Error("Maximum score is required");
      
      // Convert string values to appropriate types as required by the schema
      // Schema requires decimal values for maxScore and weight as strings
      const maxScore = parseFloat(newAssignment.maxScore);
      if (isNaN(maxScore) || maxScore <= 0) {
        throw new Error("Max score must be a positive number");
      }
      
      const weight = parseFloat(newAssignment.weight || '10');
      if (isNaN(weight) || weight < 0) {
        throw new Error("Weight must be a non-negative number");
      }
      
      const assignmentData = {
        name: newAssignment.name,
        classId: parseInt(newAssignment.classId),
        type: newAssignment.type || 'homework',
        dueDate: newAssignment.dueDate ? newAssignment.dueDate : null,
        weight: String(weight), // Convert to string for API
        description: newAssignment.description || '',
        maxScore: String(maxScore) // Convert to string for API
      };
      
      // Use apiRequest to properly handle authentication
      const response = await apiRequest('POST', '/api/assignments', assignmentData);
      
      if (!response.ok) {
        // Try to parse JSON error response first
        try {
          const errorData = await response.json();
          if (errorData && errorData.message) {
            throw new Error(errorData.message);
          } else if (errorData && errorData.errors && errorData.errors.length > 0) {
            // Handle Zod validation errors
            const errorMessages = errorData.errors.map((err: any) => err.message).join(', ');
            throw new Error(`Validation error: ${errorMessages}`);
          }
        } catch (e) {
          // If not JSON, use text
          const error = await response.text();
          throw new Error(error || 'Failed to create assignment');
        }
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Reset form and show success message
      setNewAssignment({
        name: '',
        classId: '',
        dueDate: '',
        weight: '',
        type: '',
        description: '',
        maxScore: '100'
      });
      setIsCreatingAssignment(false);
      
      // Invalidate relevant queries to reflect the new assignment
      queryClient.invalidateQueries({ queryKey: [`/api/dashboard/${teacherId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/assignments'] });
      
      // Invalidate class-specific assignments
      if (newAssignment.classId) {
        queryClient.invalidateQueries({ queryKey: [`/api/assignments/class/${newAssignment.classId}`] });
        queryClient.invalidateQueries({ queryKey: [`/api/classes/${newAssignment.classId}`] });
      }
      
      toast({
        title: "Assignment Created",
        description: "Your assignment has been created successfully. The dashboard has been updated.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      console.error('Error creating assignment:', error);
      toast({
        title: "Error creating assignment",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Handle class selection for quick grading
  useEffect(() => {
    if (quickGradeClass === null) {
      setQuickGradeClassAssignments([]);
      setSelectedAssignment(null);
      return;
    }

    const fetchAssignments = async () => {
      try {
        const response = await fetch(`/api/assignments/class/${quickGradeClass}`);
        if (!response.ok) throw new Error('Failed to fetch class assignments');
        const data = await response.json();
        setQuickGradeClassAssignments(data);
      } catch (error) {
        console.error('Error fetching class assignments:', error);
        setQuickGradeClassAssignments([]);
      }
    };

    fetchAssignments();
  }, [quickGradeClass]);

  // Handle assignment selection
  useEffect(() => {
    if (selectedAssignment === null) {
      setIsGrading(false);
      setStudentGrades({});
      return;
    }

    // Don't automatically show grading UI when assignment is selected in dropdown
    // This is now handled by the Start Grading button
  }, [selectedAssignment]);

  // Handle student grade input
  const handleGradeChange = (studentId: number, score: string) => {
    setStudentGrades(prev => ({
      ...prev,
      [studentId]: score
    }));
  };

  // Handle viewing assignment details
  const handleViewAssignment = (assignmentId: number) => {
    window.location.href = `/assignments/${assignmentId}`;
  };

  // Handle editing assignment
  const handleEditAssignment = (assignmentId: number) => {
    window.location.href = `/assignments/${assignmentId}/edit`;
  };

  if (isLoadingAssignments || isLoadingClasses) {
    return <div className="p-8 flex justify-center">Loading dashboard data...</div>;
  }

  return (
    <div className="px-4 py-6 max-w-7xl mx-auto">
      {/* Welcome Card */}
      <div className="mb-8 rounded-xl bg-[#0ba2b0] p-6 text-white shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Welcome back, {currentUser?.firstName || 'Teacher'}</h2>
            <p className="mt-1 text-white/80">Here's an overview of your teaching dashboard</p>
          </div>
          <div className="hidden md:block">
            <div className="flex space-x-2">
              <Button
                variant="secondary"
                className="bg-white/20 hover:bg-white/30 text-white border-none"
                onClick={() => window.location.href = '/classes/new'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M18 3v4c0 2-2 4-4 4s-4-2-4-4V3"/><path d="M10 21h4"/><path d="M14 3h4v4"/><path d="M6 3H2v4"/><path d="M2 7h4"/><path d="M22 7h-4"/><path d="M18 21h4v-4"/><path d="M6 21H2v-4"/><path d="M2 17h4"/><path d="M22 17h-4"/></svg>
                New Class
              </Button>
              <Button
                variant="secondary"
                className="bg-white/20 hover:bg-white/30 text-white border-none"
                onClick={() => window.location.href = '/assignments/new'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
                New Assignment
              </Button>
              <Button
                variant="secondary"
                className="bg-white/20 hover:bg-white/30 text-white border-none"
                onClick={() => window.location.href = '/quizzes/new'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/><path d="M12 12h4"/><path d="M12 16h4"/><path d="M12 8h4"/></svg>
                New Quiz
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="mb-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-0">
        <div className="bg-[#0ba2b0] text-white font-medium p-3 rounded-t-lg">
          <h3 className="text-xl font-semibold flex items-center">
            <span className="inline-block mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M10.827 16.379a6.082 6.082 0 0 1-8.618-7.002l5.412 1.45a6.082 6.082 0 0 1 7.002-8.618l-1.45 5.412a6.082 6.082 0 0 1 8.618 7.002l-5.412-1.45a6.082 6.082 0 0 1-7.002 8.618l1.45-5.412Z"/><path d="M12 12v.01"/></svg>
            </span>
            At a Glance
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Total Students" 
            value={stats.students.total}
            icon={<Users className="h-8 w-8" />}
            change={stats.students.change > 0 ? { 
              value: `${stats.students.change}% from last semester`, 
              type: 'increase' 
            } : stats.students.change < 0 ? {
              value: `${Math.abs(stats.students.change)}% from last semester`,
              type: 'decrease'
            } : undefined}
            iconBgClass="bg-blue-100 dark:bg-blue-900/20"
            iconColorClass="text-blue-600 dark:text-blue-400"
          />
          
          <StatCard 
            title="Active Classes" 
            value={stats.classes.total}
            icon={<BookOpen className="h-8 w-8" />}
            change={stats.classes.change !== 0 ? {
              value: `${Math.abs(stats.classes.change)} from last semester`,
              type: stats.classes.change > 0 ? 'increase' : 'decrease'
            } : { value: 'No change from last semester', type: 'neutral' }}
            iconBgClass="bg-green-100 dark:bg-green-900/20"
            iconColorClass="text-green-600 dark:text-green-400"
          />
          
          <StatCard 
            title="Average Grade" 
            value={`${stats.avgGrade.letter} (${stats.avgGrade.value}%)`}
            icon={<GraduationCap className="h-8 w-8" />}
            change={stats.avgGrade.change !== 0 ? {
              value: `${Math.abs(stats.avgGrade.change)}% from last semester`,
              type: stats.avgGrade.change > 0 ? 'increase' : 'decrease'
            } : undefined}
            iconBgClass="bg-yellow-100 dark:bg-yellow-900/20"
            iconColorClass="text-yellow-600 dark:text-yellow-400"
          />
          
          <StatCard 
            title="Pending Grades" 
            value={stats.pendingGrades.total}
            icon={<Clock className="h-8 w-8" />}
            change={stats.pendingGrades.dueToday > 0 ? {
              value: `${stats.pendingGrades.dueToday} due today`,
              type: 'increase'
            } : undefined}
            iconBgClass="bg-red-100 dark:bg-red-900/20"
            iconColorClass="text-red-600 dark:text-red-400"
          />
        </div>
      </div>

      {/* Class Cards Section */}
      <div className="mb-8">
        <div className="bg-[#0ba2b0] text-white font-medium p-3 rounded-t-lg mb-4">
          <h3 className="text-xl font-semibold flex items-center">
            <span className="inline-block mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M18 3v4c0 2-2 4-4 4s-4-2-4-4V3"/><path d="M10 21h4"/><path d="M14 3h4v4"/><path d="M6 3H2v4"/><path d="M2 7h4"/><path d="M22 7h-4"/><path d="M18 21h4v-4"/><path d="M6 21H2v-4"/><path d="M2 17h4"/><path d="M22 17h-4"/></svg>
            </span>
            Your Classes
            <Button variant="link" size="sm" onClick={() => window.location.href = '/classes'} className="ml-auto text-white hover:text-slate-200">
              View All
            </Button>
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {classes && classes.length > 0 ? (
            classes.map((classItem) => (
              <ClassCard key={classItem.id} class={classItem} />
            ))
          ) : (
            <div className="col-span-full text-center p-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-muted-foreground">No classes available</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => window.location.href = '/classes/new'}
              >
                Create Your First Class
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Tools Section */}
      <div className="mb-8">
        <div className="bg-[#0ba2b0] text-white font-medium p-3 rounded-t-lg mb-4">
          <h3 className="text-xl font-semibold flex items-center">
            <span className="inline-block mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
            </span>
            Quick Tools
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="flex flex-col bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl font-semibold flex items-center text-primary">
                <span className="inline-block mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
                </span>
                View Assignments
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-muted-foreground text-sm mb-4">Quickly access recent assignments</p>
              
              <div className="space-y-3 mb-4">
                {assignments && assignments.length > 0 ? (
                  assignments.slice(0, 3).map(assignment => (
                    <div key={assignment.id} className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{assignment.name}</span>
                        <span className="text-xs text-muted-foreground">{assignment.type}</span>
                      </div>
                      <div className="flex mt-2">
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="px-0 text-primary" 
                          onClick={() => handleViewAssignment(assignment.id)}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-6 text-center text-muted-foreground">
                    <p>No recent assignments</p>
                  </div>
                )}
              </div>
              
              <div className="mt-auto">
                <Button className="w-full" onClick={() => window.location.href = '/assignments'}>
                  All Assignments
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="flex flex-col bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl font-semibold flex items-center text-primary">
                <span className="inline-block mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </span>
                Create Assignment
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-muted-foreground text-sm mb-4">Quickly create a new assignment for your class</p>
              
              <div className="space-y-3 mb-4">
                <div>
                  <Label htmlFor="assignmentTitle">Title</Label>
                  <Input 
                    id="assignmentTitle" 
                    placeholder="Assignment title" 
                    value={newAssignment.name}
                    onChange={(e) => setNewAssignment({...newAssignment, name: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="assignmentClass">Class</Label>
                  <Select
                    value={newAssignment.classId}
                    onValueChange={(value) => setNewAssignment({...newAssignment, classId: value})}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes?.map(classItem => (
                        <SelectItem key={classItem.id} value={classItem.id.toString()}>
                          {classItem.name}
                        </SelectItem>
                      )) || (
                        <SelectItem value="1">No classes available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="assignmentType">Type</Label>
                  <Select
                    value={newAssignment.type}
                    onValueChange={(value) => setNewAssignment({...newAssignment, type: value})}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="homework">Homework</SelectItem>
                      <SelectItem value="quiz">Quiz</SelectItem>
                      <SelectItem value="test">Test</SelectItem>
                      <SelectItem value="project">Project</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input 
                      id="dueDate" 
                      type="date" 
                      value={newAssignment.dueDate}
                      onChange={(e) => setNewAssignment({...newAssignment, dueDate: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="weight">Weight (%)</Label>
                    <Input 
                      id="weight" 
                      type="number" 
                      placeholder="10" 
                      value={newAssignment.weight}
                      onChange={(e) => setNewAssignment({...newAssignment, weight: e.target.value})}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="maxScore">Max Score</Label>
                  <Input 
                    id="maxScore" 
                    type="number" 
                    placeholder="100" 
                    value={newAssignment.maxScore}
                    onChange={(e) => setNewAssignment({...newAssignment, maxScore: e.target.value})}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Maximum possible points for this assignment</p>
                </div>
                
                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Add details about this assignment"
                    className="h-20"
                    value={newAssignment.description}
                    onChange={(e) => setNewAssignment({...newAssignment, description: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="mt-auto">
                <Button 
                  className="w-full" 
                  disabled={isCreatingAssignmentSubmitting || !newAssignment.name || !newAssignment.classId || !newAssignment.type}
                  onClick={() => createAssignment()}
                >
                  {isCreatingAssignmentSubmitting ? 'Creating...' : 'Create Assignment'}
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="flex flex-col bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl font-semibold flex items-center text-primary">
                <span className="inline-block mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.1 17H7a5 5 0 1 1 5-5"/><path d="M14.9 16.8L16 20l3.2-1.6L22 20l-1.8-5.8"/><path d="M14.9 7.2L16 4l3.2 1.6L22 4l-1.8 5.8"/><path d="m7 16-1.8-5.8L2 12l1.8-1.9L2 8.2l5.8 1.7L12 6"/></svg>
                </span>
                Student Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-muted-foreground text-sm mb-4">Students who need your attention</p>
              
              {isLoadingAlerts ? (
                <div className="py-8 flex justify-center">
                  <span className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"></span>
                </div>
              ) : studentAlerts && studentAlerts.length > 0 ? (
                <div className="space-y-3 mb-4">
                  {studentAlerts.slice(0, 3).map((alert, index) => (
                    <div 
                      key={index}
                      className={`${
                        alert.type === 'danger' 
                          ? 'bg-red-50 dark:bg-red-900/20 border-red-500' 
                          : alert.type === 'warning' 
                            ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500' 
                            : 'bg-green-50 dark:bg-green-900/20 border-green-500'
                      } border-l-4 rounded p-3`}
                    >
                      <div className="flex justify-between">
                        <span className="font-medium">{alert.studentName}</span>
                        <span className="text-sm text-muted-foreground">{alert.className}</span>
                      </div>
                      <p className={`text-sm mt-1 ${
                        alert.type === 'danger' 
                          ? 'text-red-600 dark:text-red-400' 
                          : alert.type === 'warning' 
                            ? 'text-yellow-600 dark:text-yellow-400' 
                            : 'text-green-600 dark:text-green-400'
                      }`}>
                        {alert.message}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3 mb-4">
                  <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded p-3">
                    <div className="flex justify-between">
                      <span className="font-medium">David Wilson</span>
                      <span className="text-sm text-muted-foreground">English 4.8</span>
                    </div>
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">Grade dropped below D (59%)</p>
                  </div>
                  
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 rounded p-3">
                    <div className="flex justify-between">
                      <span className="font-medium">Sophia Martinez</span>
                      <span className="text-sm text-muted-foreground">English 4.8</span>
                    </div>
                    <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">Missing 2 assignments</p>
                  </div>
                  
                  <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 rounded p-3">
                    <div className="flex justify-between">
                      <span className="font-medium">Emma Davis</span>
                      <span className="text-sm text-muted-foreground">Physics 101</span>
                    </div>
                    <p className="text-sm text-green-600 dark:text-green-400 mt-1">Improved by 12% this month</p>
                  </div>
                </div>
              )}
              
              <div className="mt-auto">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => window.location.href = '/students/alerts'}
                >
                  View All Alerts
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Quick Grade Entry Card */}
          <QuickGradeEntry classes={classes || []} />
        </div>
      </div>
      
      {/* Recent Assignments Table */}
      <div className="mb-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-0">
        <div className="bg-[#0ba2b0] text-white font-medium p-3 rounded-t-lg">
          <h3 className="text-xl font-semibold flex items-center">
            <span className="inline-block mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
            </span>
            Recent Assignments
          </h3>
        </div>
        <div className="p-4">
          <GradeTable 
            assignments={assignments || []} 
            onViewAssignment={handleViewAssignment} 
            onEditAssignment={handleEditAssignment} 
          />
        </div>
      </div>

      {/* Grade Distribution - Moved to the bottom of the page */}
      <div className="mb-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-0">
        <div className="bg-[#0ba2b0] text-white font-medium p-3 rounded-t-lg">
          <h3 className="text-xl font-semibold flex items-center">
            <span className="inline-block mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
            </span>
            Grade Distribution
          </h3>
        </div>
        <div className="p-6">
          <GradeDistribution distribution={gradeDistribution} />
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="mb-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-0">
        <div className="bg-[#0ba2b0] text-white font-medium p-3 rounded-t-lg">
          <h3 className="text-xl font-semibold flex items-center">
            <span className="inline-block mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M12 7.5v1.5"/><path d="M12 15v1.5"/><path d="M12 3v1.5"/><path d="M12 19.5V21"/><path d="M3.6 9H7.5"/><path d="M16.5 9h3.9"/><path d="M3.6 15H7.5"/><path d="M16.5 15h3.9"/><path d="M3 12c0-4.97 4.03-9 9-9s9 4.03 9 9-4.03 9-9 9-9-4.03-9-9z"/><path d="M15 12 A3 3 0 0 1 12 15 A3 3 0 0 1 9 12 A3 3 0 0 1 15 12 z"/></svg>
            </span>
            Recent Activity
          </h3>
        </div>
        <div className="p-4">
          <RecentActivity activities={recentActivities} />
        </div>
      </div>
    </div>
  );
}