import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import StatCard from "./stats/StatCard";
import GradeDistribution from "./stats/GradeDistribution";
import RecentActivity from "./RecentActivity";
import GradeTable from "./GradeTable";
import { ClassCard } from "./dashboard/class-card";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Teacher, Class, Assignment, Student } from "@shared/schema";
import { 
  Users, 
  BookOpen, 
  GraduationCap, 
  Clock,
  Loader2
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface DashboardProps {
  currentUser: Teacher | null;
}

interface StudentGrade {
  studentId: number;
  studentName: string;
  score: string;
}

export default function Dashboard({ currentUser }: DashboardProps) {
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedAssignment, setSelectedAssignment] = useState<string>("");
  const [studentGrades, setStudentGrades] = useState<StudentGrade[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const { toast } = useToast();
  
  // Fetch dashboard data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['/api/dashboard', selectedClass !== 'all' ? selectedClass : undefined],
    enabled: true, // Ensure this query runs
  });

  // Fetch classes
  const { data: classes } = useQuery<Class[]>({
    queryKey: ['/api/classes'],
  });

  // Fetch recent assignments
  const { data: assignments } = useQuery<Assignment[]>({
    queryKey: ['/api/assignments/recent'],
  });

  // Fetch class students when assignment is selected
  useEffect(() => {
    if (selectedAssignment) {
      setIsLoadingStudents(true);
      const assignment = assignments?.find(a => a.id.toString() === selectedAssignment);
      
      if (assignment) {
        // Fetch students from the class
        fetch(`/api/classes/${assignment.classId}/students`)
          .then(res => res.json())
          .then((students: Student[]) => {
            // Fetch existing grades for this assignment
            fetch(`/api/grades?assignmentId=${assignment.id}`)
              .then(res => res.json())
              .then(grades => {
                // Map students to StudentGrade objects
                const studentGradesData = students.map(student => {
                  const existingGrade = grades.find((g: any) => g.studentId === student.id);
                  return {
                    studentId: student.id,
                    studentName: `${student.firstName} ${student.lastName}`.trim(),
                    score: existingGrade ? existingGrade.score.toString() : ""
                  };
                });
                setStudentGrades(studentGradesData);
              })
              .catch(err => {
                console.error("Error fetching grades:", err);
                // Still create student grades without existing grades
                const studentGradesData = students.map(student => ({
                  studentId: student.id,
                  studentName: `${student.firstName} ${student.lastName}`.trim(),
                  score: ""
                }));
                setStudentGrades(studentGradesData);
              })
              .finally(() => setIsLoadingStudents(false));
          })
          .catch(err => {
            console.error("Error fetching students:", err);
            setIsLoadingStudents(false);
            setStudentGrades([]);
          });
      }
    } else {
      setStudentGrades([]);
    }
  }, [selectedAssignment, assignments]);

  // Handle assignment selection
  const handleAssignmentChange = (value: string) => {
    setSelectedAssignment(value);
  };

  // Handle grade input change
  const handleGradeChange = (studentId: number, value: string) => {
    setStudentGrades(prev => 
      prev.map(sg => 
        sg.studentId === studentId ? { ...sg, score: value } : sg
      )
    );
  };

  // Save grades mutation
  const saveGradesMutation = useMutation({
    mutationFn: async (grades: { assignmentId: number, studentId: number, score: number }[]) => {
      const responses = await Promise.all(
        grades.map(grade => 
          apiRequest("POST", "/api/grades", grade)
            .then(res => res.json())
        )
      );
      return responses;
    },
    onSuccess: () => {
      toast({
        title: "Grades Saved",
        description: "The grades have been saved successfully.",
        variant: "default",
      });
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/grades'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error Saving Grades",
        description: error.message || "There was an error saving the grades.",
        variant: "destructive",
      });
    }
  });

  // Handle save grades
  const handleSaveGrades = () => {
    if (!selectedAssignment) {
      toast({
        title: "No Assignment Selected",
        description: "Please select an assignment to save grades for.",
        variant: "destructive",
      });
      return;
    }

    const assignmentId = parseInt(selectedAssignment);
    
    // Filter out grades with empty scores
    const validGrades = studentGrades
      .filter(sg => sg.score.trim() !== "")
      .map(sg => ({
        assignmentId,
        studentId: sg.studentId,
        score: parseFloat(sg.score)
      }));

    if (validGrades.length === 0) {
      toast({
        title: "No Grades to Save",
        description: "Please enter at least one grade to save.",
        variant: "destructive",
      });
      return;
    }

    saveGradesMutation.mutate(validGrades);
  };

  const handleViewAssignment = (id: number) => {
    // Find the assignment to get its classId
    const assignment = assignments?.find(a => a.id === id);
    if (assignment) {
      // Navigate to the class page with the assignment ID as a query parameter
      window.location.href = `/classes/${assignment.classId}?assignment=${id}`;
    }
  };

  const handleEditAssignment = (id: number) => {
    // Find the assignment to get its classId
    const assignment = assignments?.find(a => a.id === id);
    if (assignment) {
      // Navigate to the class page with the assignment ID as a query parameter for editing
      window.location.href = `/classes/${assignment.classId}?assignment=${id}&edit=true`;
    }
  };

  const currentDate = format(new Date(), "EEEE, MMMM d, yyyy");
  
  if (isLoading) {
    return <div className="p-8 flex justify-center">Loading dashboard data...</div>;
  }

  const stats = dashboardData?.stats || {
    students: { total: 0, change: 0 },
    classes: { total: 0, change: 0 },
    avgGrade: { value: "N/A", letter: "N/A", change: 0 },
    pendingGrades: { total: 0, dueToday: 0 }
  };

  const gradeDistribution = dashboardData?.gradeDistribution || {
    A: 0,
    B: 0,
    C: 0,
    D: 0,
    F: 0
  };

  const recentActivities = dashboardData?.recentActivities || [];
  
  const classCards = dashboardData?.classCards || [];

  return (
    <div>
      {/* Welcome Header */}
      <div className="mb-6 bg-gradient-to-r from-sky-100 to-blue-50 dark:from-sky-950 dark:to-blue-950 p-6 rounded-xl shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-primary mb-1">Hello, {currentUser?.firstName || 'Teacher'}!</h2>
            <p className="text-slate-600 dark:text-slate-300">{currentDate} • Welcome to Your Evalia Dashboard</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-[180px] bg-white dark:bg-gray-800">
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes?.map(cls => (
                  <SelectItem key={cls.id} value={cls.id.toString()}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New Class
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Class</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="className">Class Name</Label>
                    <Input id="className" placeholder="e.g. Biology 101" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="period">Period</Label>
                    <Input id="period" placeholder="e.g. 1st Period" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="room">Room</Label>
                    <Input id="room" placeholder="e.g. Room 123" />
                  </div>
                  <div className="pt-4 flex justify-end">
                    <Button>Create Class</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
      
      {/* At a Glance Section */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4 flex items-center text-gray-700 dark:text-gray-300">
          <span className="inline-block mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
          </span>
          At a Glance
        </h3>
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
      {classCards.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 flex items-center text-gray-700 dark:text-gray-300">
            <span className="inline-block mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M18 3v4c0 2-2 4-4 4s-4-2-4-4V3"/><path d="M10 21h4"/><path d="M14 3h4v4"/><path d="M6 3H2v4"/><path d="M2 7h4"/><path d="M22 7h-4"/><path d="M18 21h4v-4"/><path d="M6 21H2v-4"/><path d="M2 17h4"/><path d="M22 17h-4"/></svg>
            </span>
            Your Classes
            <Button variant="link" size="sm" onClick={() => window.location.href = '/classes'} className="ml-auto">
              View All
            </Button>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {classCards.map((classData) => (
              <ClassCard key={classData.id} class={classData} />
            ))}
          </div>
        </div>
      )}
      
      {/* Analytics & Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-1">
          <h3 className="text-xl font-semibold px-5 pt-4 flex items-center text-gray-700 dark:text-gray-300">
            <span className="inline-block mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
            </span>
            Grade Distribution
          </h3>
          <GradeDistribution distribution={gradeDistribution} />
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-1">
          <h3 className="text-xl font-semibold px-5 pt-4 flex items-center text-gray-700 dark:text-gray-300">
            <span className="inline-block mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M12 7.5v1.5"/><path d="M12 15v1.5"/><path d="M12 3v1.5"/><path d="M12 19.5V21"/><path d="M3.6 9H7.5"/><path d="M16.5 9h3.9"/><path d="M3.6 15H7.5"/><path d="M16.5 15h3.9"/><path d="M3 12c0-4.97 4.03-9 9-9s9 4.03 9 9-4.03 9-9 9-9-4.03-9-9z"/><path d="M15 12 A3 3 0 0 1 12 15 A3 3 0 0 1 9 12 A3 3 0 0 1 15 12 z"/></svg>
            </span>
            Recent Activity
          </h3>
          <RecentActivity activities={recentActivities} />
        </div>
      </div>
      
      {/* Recent Assignments Table */}
      <div className="mb-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
        <h3 className="text-xl font-semibold mb-4 flex items-center text-gray-700 dark:text-gray-300">
          <span className="inline-block mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
          </span>
          Recent Assignments
        </h3>
        <GradeTable 
          assignments={assignments || []} 
          onViewAssignment={handleViewAssignment} 
          onEditAssignment={handleEditAssignment} 
        />
      </div>
      
      {/* Tools Section */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4 flex items-center text-gray-700 dark:text-gray-300">
          <span className="inline-block mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
          </span>
          Quick Tools
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="flex flex-col bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl font-semibold flex items-center text-primary">
                <span className="inline-block mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </span>
                Quick Grade Entry
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-muted-foreground text-sm mb-4">Enter grades for your most recent assignments</p>
              
              <div className="mb-4">
                <Select value={selectedAssignment} onValueChange={handleAssignmentChange}>
                  <SelectTrigger className="w-full mb-3">
                    <SelectValue placeholder="Select an assignment" />
                  </SelectTrigger>
                  <SelectContent>
                    {assignments && assignments.length > 0 ? (
                      assignments.map(assignment => (
                        <SelectItem key={assignment.id} value={assignment.id.toString()}>
                          {assignment.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="" disabled>No assignments available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                
                {isLoadingStudents ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : selectedAssignment ? (
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3 text-sm">
                    {studentGrades.length > 0 ? (
                      <>
                        <p className="font-medium mb-2">
                          Students Pending Grades: {studentGrades.filter(sg => !sg.score).length}
                        </p>
                        <div className="flex justify-between items-center text-xs text-muted-foreground mb-1">
                          <span>Student</span>
                          <span>Grade</span>
                        </div>
                        <div className="border-t border-slate-200 dark:border-slate-700"></div>
                        
                        {studentGrades.map(student => (
                          <div key={student.studentId} className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-700">
                            <span>{student.studentName}</span>
                            <Input 
                              type="text" 
                              className="w-16" 
                              placeholder="0-100" 
                              value={student.score}
                              onChange={(e) => handleGradeChange(student.studentId, e.target.value)}
                            />
                          </div>
                        ))}
                      </>
                    ) : (
                      <p className="text-center py-6 text-muted-foreground">No students found for this assignment</p>
                    )}
                  </div>
                ) : (
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-6 text-center text-muted-foreground">
                    <p>Select an assignment to enter grades</p>
                  </div>
                )}
              </div>
              
              <div className="mt-auto flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    if (selectedAssignment) {
                      const assignment = assignments?.find(a => a.id.toString() === selectedAssignment);
                      if (assignment) {
                        // Navigate to the class page with the assignment ID as a query parameter
                        window.location.href = `/classes/${assignment.classId}?assignment=${selectedAssignment}`;
                      }
                    }
                  }}
                  disabled={!selectedAssignment}
                >
                  View Assignment
                </Button>
                <Button 
                  onClick={handleSaveGrades} 
                  disabled={!selectedAssignment || studentGrades.length === 0 || isLoadingStudents || saveGradesMutation.isPending}
                >
                  {saveGradesMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Grades'
                  )}
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
                  <Input id="assignmentTitle" placeholder="Assignment title" />
                </div>
                
                <div>
                  <Label htmlFor="assignmentClass">Class</Label>
                  <Select>
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
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input id="dueDate" type="date" />
                  </div>
                  
                  <div>
                    <Label htmlFor="weight">Weight (%)</Label>
                    <Input id="weight" type="number" placeholder="10" />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="assignmentType">Type</Label>
                  <Select>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="homework">Homework</SelectItem>
                      <SelectItem value="quiz">Quiz</SelectItem>
                      <SelectItem value="exam">Exam</SelectItem>
                      <SelectItem value="lab">Lab</SelectItem>
                      <SelectItem value="project">Project</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="mt-auto">
                <Button className="w-full">Create Assignment</Button>
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
              
              <div className="space-y-3 mb-4">
                <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded p-3">
                  <div className="flex justify-between">
                    <span className="font-medium">David Wilson</span>
                    <span className="text-sm text-muted-foreground">Biology 101</span>
                  </div>
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">Grade dropped below D (59%)</p>
                </div>
                
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 rounded p-3">
                  <div className="flex justify-between">
                    <span className="font-medium">Sophia Martinez</span>
                    <span className="text-sm text-muted-foreground">Physics 201</span>
                  </div>
                  <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">Missing 2 assignments</p>
                </div>
                
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 rounded p-3">
                  <div className="flex justify-between">
                    <span className="font-medium">James Taylor</span>
                    <span className="text-sm text-muted-foreground">Chemistry 101</span>
                  </div>
                  <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">Dropped 15% on last exam</p>
                </div>
                
                <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 rounded p-3">
                  <div className="flex justify-between">
                    <span className="font-medium">Emma Davis</span>
                    <span className="text-sm text-muted-foreground">Biology 101</span>
                  </div>
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">Improved by 12% this month</p>
                </div>
              </div>
              
              <div className="mt-auto">
                <Button variant="outline" className="w-full">View All Alerts</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
