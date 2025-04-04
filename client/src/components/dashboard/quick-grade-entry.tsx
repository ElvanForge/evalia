import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Type definitions
interface Student {
  id: number;
  firstName: string;
  lastName?: string;
  studentNumber?: string;
  email?: string;
  gradeLevel?: string;
  schoolId?: number | null;
  createdAt: Date;
}

interface Assignment {
  id: number;
  name: string;
  type: string;
  maxScore: string;
  weight: string;
  description?: string | null;
  dueDate?: Date | null;
  classId: number;
  createdAt: Date;
}

interface Class {
  id: number;
  name: string;
  description?: string | null;
  gradeLevel?: string | null;
  teacherId: number;
  createdAt: Date;
}

export function QuickGradeEntry({ classes }: { classes: Class[] }) {
  const { toast } = useToast();
  
  // State for quick grade entry
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<number | null>(null);
  const [isGrading, setIsGrading] = useState(false);
  const [classAssignments, setClassAssignments] = useState<Assignment[]>([]);
  const [studentGrades, setStudentGrades] = useState<{ [key: number]: string }>({});

  // Fetch assignments for selected class
  useEffect(() => {
    if (!selectedClass) {
      setClassAssignments([]);
      setSelectedAssignment(null);
      return;
    }

    const fetchAssignments = async () => {
      try {
        const response = await fetch(`/api/assignments/class/${selectedClass}`);
        if (!response.ok) throw new Error('Failed to fetch class assignments');
        const data = await response.json();
        setClassAssignments(data);
      } catch (error) {
        console.error('Error fetching class assignments:', error);
        toast({
          title: "Error",
          description: "Failed to load assignments for this class",
          variant: "destructive",
        });
        setClassAssignments([]);
      }
    };

    fetchAssignments();
  }, [selectedClass, toast]);

  // Fetch students for selected assignment
  const { 
    data: students = [], 
    isLoading: isLoadingStudents,
    refetch: refetchStudents 
  } = useQuery({
    queryKey: ['/api/students/assignment', selectedAssignment],
    queryFn: async () => {
      if (!selectedAssignment) return [];
      const response = await fetch(`/api/students/assignment/${selectedAssignment}`);
      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }
      const data = await response.json();
      console.log('Fetched students:', data);
      return data || [];
    },
    enabled: false, // Don't auto-fetch, we'll trigger manually
  });

  // Handle starting the grading process
  const handleStartGrading = () => {
    if (!selectedClass || !selectedAssignment) {
      toast({
        title: "Selection required",
        description: "Please select both a class and an assignment",
        variant: "destructive",
      });
      return;
    }

    setIsGrading(true);
    setStudentGrades({});
    refetchStudents();
  };

  // Handle student grade input
  const handleGradeChange = (studentId: number, score: string) => {
    setStudentGrades(prev => ({
      ...prev,
      [studentId]: score
    }));
  };

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
      toast({
        title: "Error Saving Grades",
        description: error.message || "There was a problem saving the grades. Please try again.",
        variant: "destructive",
      });
    }
  });

  return (
    <>
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
          <p className="text-muted-foreground text-sm mb-4">Quickly enter grades for an assignment</p>
          
          <div className="space-y-3">
            <div>
              <Label htmlFor="classSelect">Class</Label>
              <Select 
                value={selectedClass?.toString() || ""} 
                onValueChange={(value) => setSelectedClass(parseInt(value))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a class" />
                </SelectTrigger>
                <SelectContent>
                  {classes?.map((cls: Class) => (
                    <SelectItem key={cls.id} value={cls.id.toString()}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="assignmentSelect">Assignment</Label>
              <Select 
                value={selectedAssignment?.toString() || ""} 
                onValueChange={(value) => setSelectedAssignment(parseInt(value))}
                disabled={!selectedClass || classAssignments.length === 0}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={classAssignments.length === 0 ? "No assignments" : "Select assignment"} />
                </SelectTrigger>
                <SelectContent>
                  {classAssignments.map((assignment: Assignment) => (
                    <SelectItem key={assignment.id} value={assignment.id.toString()}>
                      {assignment.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="mt-auto pt-4">
            <Button 
              className="w-full" 
              disabled={!selectedClass || !selectedAssignment}
              onClick={handleStartGrading}
            >
              Start Grading
            </Button>
          </div>
        </CardContent>
      </Card>

      {isGrading && (
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          {isLoadingStudents ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
            </div>
          ) : students && students.length > 0 ? (
            <>
              <div className="mb-4">
                <h4 className="text-lg font-medium">Enter Grades</h4>
                <p className="text-sm text-muted-foreground">Enter scores for each student</p>
              </div>
              
              <div className="space-y-3">
                {students.map((student: Student) => (
                  <div key={student.id} className="flex items-center space-x-4 p-3 bg-slate-50 dark:bg-slate-900 rounded-md">
                    <div className="flex-grow">
                      <p className="font-medium">{student.firstName} {student.lastName || ''}</p>
                      <p className="text-xs text-muted-foreground">ID: {student.studentNumber || student.id}</p>
                    </div>
                    <div className="w-24">
                      <Input 
                        type="text"
                        placeholder="Score"
                        value={studentGrades[student.id] || ''}
                        onChange={(e) => handleGradeChange(student.id, e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 flex justify-between">
                <Button variant="outline" onClick={() => setIsGrading(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => saveGrades()}
                  disabled={isSavingGrades || Object.keys(studentGrades).length === 0}
                >
                  {isSavingGrades ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    'Save Grades'
                  )}
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No students enrolled in this class or assignment.</p>
              <Button variant="outline" onClick={() => setIsGrading(false)}>
                Go Back
              </Button>
            </div>
          )}
        </div>
      )}
    </>
  );
}