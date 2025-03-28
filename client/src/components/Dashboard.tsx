import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import StatCard from "./stats/StatCard";
import GradeDistribution from "./stats/GradeDistribution";
import RecentActivity from "./RecentActivity";
import GradeTable from "./GradeTable";
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
import { Teacher, Class, Assignment } from "@shared/schema";

interface DashboardProps {
  currentUser: Teacher | null;
}

export default function Dashboard({ currentUser }: DashboardProps) {
  const [selectedClass, setSelectedClass] = useState<string>("all");
  
  // Fetch dashboard data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['/api/dashboard', selectedClass],
  });

  // Fetch classes
  const { data: classes } = useQuery<Class[]>({
    queryKey: ['/api/classes'],
  });

  // Fetch recent assignments
  const { data: assignments } = useQuery<Assignment[]>({
    queryKey: ['/api/assignments/recent'],
  });

  const handleViewAssignment = (id: number) => {
    // Navigate to assignment details page
    window.location.href = `/assignments/${id}`;
  };

  const handleEditAssignment = (id: number) => {
    // Navigate to edit assignment page
    window.location.href = `/assignments/${id}/edit`;
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

  return (
    <div>
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-medium">Welcome back, {currentUser?.name.split(' ')[0] || 'Teacher'}!</h2>
            <p className="text-muted-foreground">{currentDate}</p>
          </div>
          
          <div className="flex items-center">
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-[180px] mr-3">
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Total Students" 
          value={stats.students.total}
          icon="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
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
          icon="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
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
          icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
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
          icon="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          change={stats.pendingGrades.dueToday > 0 ? {
            value: `${stats.pendingGrades.dueToday} due today`,
            type: 'increase'
          } : undefined}
          iconBgClass="bg-red-100 dark:bg-red-900/20"
          iconColorClass="text-red-600 dark:text-red-400"
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <GradeDistribution distribution={gradeDistribution} />
        </div>
        
        <RecentActivity activities={recentActivities} />
      </div>
      
      <div className="mb-8">
        <GradeTable 
          assignments={assignments || []} 
          onViewAssignment={handleViewAssignment} 
          onEditAssignment={handleEditAssignment} 
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-start justify-between">
              <CardTitle className="text-lg font-medium">Quick Grade Entry</CardTitle>
              <Button variant="ghost" size="icon" className="text-muted-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-muted-foreground text-sm mb-4">Enter grades for your most recent assignments</p>
            
            <div className="mb-4">
              <Select>
                <SelectTrigger className="w-full mb-3">
                  <SelectValue placeholder="Select an assignment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Biology 101 - Midterm Exam</SelectItem>
                  <SelectItem value="2">Physics 201 - Lab Report #3</SelectItem>
                  <SelectItem value="3">Chemistry 101 - Quiz #3</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="bg-muted rounded p-3 text-sm">
                <p className="font-medium mb-2">Students Pending Grades: 3</p>
                <div className="flex justify-between items-center text-xs text-muted-foreground mb-1">
                  <span>Student</span>
                  <span>Grade</span>
                </div>
                <div className="border-t border-border"></div>
                
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span>Emily Johnson</span>
                  <Input type="text" className="w-16" placeholder="0-100" />
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span>Michael Smith</span>
                  <Input type="text" className="w-16" placeholder="0-100" />
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span>Jessica Lee</span>
                  <Input type="text" className="w-16" placeholder="0-100" />
                </div>
              </div>
            </div>
            
            <div className="mt-auto flex justify-between">
              <Button variant="link">View All Students</Button>
              <Button>Save Grades</Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-start justify-between">
              <CardTitle className="text-lg font-medium">Create Assignment</CardTitle>
              <Button variant="ghost" size="icon" className="text-muted-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </Button>
            </div>
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
                    <SelectItem value="1">Biology 101</SelectItem>
                    <SelectItem value="2">Physics 201</SelectItem>
                    <SelectItem value="3">Chemistry 101</SelectItem>
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
        
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-start justify-between">
              <CardTitle className="text-lg font-medium">Student Alerts</CardTitle>
              <Button variant="ghost" size="icon" className="text-muted-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-muted-foreground text-sm mb-4">Students who need attention</p>
            
            <div className="space-y-3 mb-4">
              <div className="bg-red-100 dark:bg-red-900/20 border-l-4 border-red-600 rounded p-3">
                <div className="flex justify-between">
                  <span className="font-medium">David Wilson</span>
                  <span className="text-sm text-muted-foreground">Biology 101</span>
                </div>
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">Grade dropped below D (59%)</p>
              </div>
              
              <div className="bg-yellow-100 dark:bg-yellow-900/20 border-l-4 border-yellow-600 rounded p-3">
                <div className="flex justify-between">
                  <span className="font-medium">Sophia Martinez</span>
                  <span className="text-sm text-muted-foreground">Physics 201</span>
                </div>
                <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">Missing 2 assignments</p>
              </div>
              
              <div className="bg-yellow-100 dark:bg-yellow-900/20 border-l-4 border-yellow-600 rounded p-3">
                <div className="flex justify-between">
                  <span className="font-medium">James Taylor</span>
                  <span className="text-sm text-muted-foreground">Chemistry 101</span>
                </div>
                <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">Dropped 15% on last exam</p>
              </div>
              
              <div className="bg-green-100 dark:bg-green-900/20 border-l-4 border-green-600 rounded p-3">
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
  );
}
