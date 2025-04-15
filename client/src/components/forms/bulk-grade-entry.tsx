import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Grade, Student } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertTriangle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";

interface BulkGradeEntryProps {
  assignmentId: number;
  students: Student[];
  existingGrades?: Grade[];
  onSuccess?: () => void;
  maxScore?: number;
}

export function BulkGradeEntry({
  assignmentId,
  students = [],
  existingGrades = [],
  onSuccess,
  maxScore = 100
}: BulkGradeEntryProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Debug output for troubleshooting
  console.log("Rendering BulkGradeEntry with:", {
    studentsCount: students?.length || 0,
    existingGradesCount: existingGrades?.length || 0,
    assignmentId
  });

  // Track score inputs for each student
  const [grades, setGrades] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);
  
  // Initialize grades when students or existingGrades change
  useEffect(() => {
    try {
      const initialGrades: Record<number, string> = {};
      
      if (Array.isArray(students)) {
        students.forEach(student => {
          if (student && typeof student.id === 'number') {
            const existingGrade = Array.isArray(existingGrades)
              ? existingGrades.find(g => g && g.studentId === student.id)
              : undefined;
              
            if (existingGrade && existingGrade.score !== undefined && existingGrade.score !== null) {
              initialGrades[student.id] = existingGrade.score.toString();
            } else {
              initialGrades[student.id] = '';
            }
          }
        });
      }
      
      setGrades(initialGrades);
      setError(null);
    } catch (err) {
      console.error("Error initializing grades:", err);
      setError("Failed to initialize grade data");
    }
  }, [students, existingGrades]);

  // Handle score changes
  const handleScoreChange = (studentId: number, value: string) => {
    try {
      // Only allow numeric input and empty string
      if (value === '' || /^\d*\.?\d*$/.test(value)) {
        // Safe parsing with validation
        const numValue = value === '' ? 0 : parseFloat(value);
        
        // Check if value exceeds max score and is a valid number
        if (value !== '' && !isNaN(numValue) && numValue > maxScore) {
          toast({
            title: "Invalid score",
            description: `Score cannot exceed the maximum of ${maxScore}`,
            variant: "destructive",
          });
          return;
        }
        
        setGrades(prev => ({
          ...prev,
          [studentId]: value
        }));
      }
    } catch (err) {
      console.error("Error in handleScoreChange:", err);
      toast({
        title: "Input Error",
        description: "There was a problem processing your input",
        variant: "destructive"
      });
    }
  };

  // Create grade mutation
  const createGradeMutation = useMutation({
    mutationFn: async (data: { assignmentId: number; studentId: number; score: number }) => {
      return apiRequest('POST', '/api/grades', {
        ...data,
        submittedAt: new Date(),
        comments: null
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to save grade",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    }
  });

  // Update grade mutation
  const updateGradeMutation = useMutation({
    mutationFn: async ({ id, score }: { id: number; score: number }) => {
      return apiRequest('PATCH', `/api/grades/${id}`, { score });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update grade",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    }
  });

  // Save all grades
  const saveAllGrades = async () => {
    try {
      const promises: Promise<any>[] = [];
      
      // Process each grade
      Object.entries(grades).forEach(([studentIdStr, scoreStr]) => {
        try {
          const studentId = parseInt(studentIdStr);
          
          // Skip empty scores
          if (!scoreStr || !scoreStr.trim()) return;
          
          const score = parseFloat(scoreStr);
          const existingGrade = existingGrades.find(g => g && g.studentId === studentId);
          
          // Safety check for NaN
          if (isNaN(score)) return;
          
          if (existingGrade) {
            // Update existing grade if the score changed
            const existingScore = typeof existingGrade.score === 'string' 
              ? parseFloat(existingGrade.score) 
              : Number(existingGrade.score);
              
            if (existingScore !== score) {
              promises.push(updateGradeMutation.mutateAsync({ id: existingGrade.id, score }));
            }
          } else {
            // Create a new grade
            promises.push(createGradeMutation.mutateAsync({ assignmentId, studentId, score }));
          }
        } catch (err) {
          console.error("Error processing grade:", err);
        }
      });
      
      if (promises.length === 0) {
        toast({
          title: "No changes to save",
          description: "Make some changes before saving.",
        });
        return;
      }
      
      await Promise.all(promises);
      
      // Invalidate the grades query to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/assignments/${assignmentId}/grades`] });
      
      toast({
        title: "Grades saved",
        description: `Successfully saved ${promises.length} grade(s).`
      });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error saving grades:", error);
      toast({
        title: "Failed to save grades",
        description: "An unexpected error occurred while saving grades.",
        variant: "destructive"
      });
    }
  };

  const isLoading = createGradeMutation.isPending || updateGradeMutation.isPending;
  
  // Calculate completion stats with safety checks
  const totalStudents = Array.isArray(students) ? students.length : 0;
  const gradedStudents = Object.values(grades).filter(
    score => score && typeof score === 'string' && score.trim && score.trim() !== ''
  ).length;
  const completionPercentage = totalStudents > 0 ? Math.round((gradedStudents / totalStudents) * 100) : 0;

  // If there's an error, show an error state
  if (error) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-medium">Error Loading Grade Entry</h3>
        <p className="text-muted-foreground mt-2">{error}</p>
        <Button 
          className="mt-4" 
          variant="outline"
          onClick={() => window.location.reload()}
        >
          Reload Page
        </Button>
      </div>
    );
  }

  // Render the component
  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-lg font-medium">Bulk Grade Entry</CardTitle>
      </CardHeader>
      
      <CardContent className="px-0 space-y-6">
        {/* Progress indicator */}
        <div className="bg-muted/50 p-4 rounded-md">
          <div className="flex flex-wrap justify-between items-center mb-2 gap-2">
            <h3 className="font-medium">Grade Entry Progress</h3>
            <span className="text-sm bg-primary/10 text-primary px-2 py-1 rounded-full whitespace-nowrap">
              {gradedStudents} of {totalStudents} students ({completionPercentage}%)
            </span>
          </div>
          
          <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
            <div 
              className="bg-primary h-full rounded-full" 
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
        
        {/* Student list with inputs */}
        <ScrollArea className="max-h-[400px] overflow-y-auto rounded-md border">
          {totalStudents > 0 ? (
            <div className="space-y-2 p-4">
              {students.map(student => {
                if (!student || typeof student.id !== 'number') return null;
                
                const existingGrade = existingGrades.find(g => g && g.studentId === student.id);
                const studentId = student.id;
                
                return (
                  <div 
                    key={studentId} 
                    className={`p-3 border rounded-md ${existingGrade ? 'border-primary/30 bg-primary/5' : ''}`}
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <div className={`p-2 rounded-full ${existingGrade ? 'bg-primary/20' : 'bg-primary/10'}`}>
                          <span className="text-sm font-semibold text-primary">
                            {student.firstName?.charAt(0) || '?'}
                            {student.lastName?.charAt(0) || ''}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">
                            {student.lastName ? 
                              `${student.lastName}, ${student.firstName}` : 
                              student.firstName || 'Unnamed Student'}
                          </p>
                          {student.studentNumber && (
                            <p className="text-xs text-muted-foreground">
                              ID: {student.studentNumber}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="w-24 flex-shrink-0">
                        <Label htmlFor={`score-${studentId}`} className="sr-only">Score</Label>
                        <Input
                          id={`score-${studentId}`}
                          type="text"
                          value={grades[studentId] || ''}
                          onChange={(e) => handleScoreChange(studentId, e.target.value)}
                          placeholder={`/${maxScore}`}
                          className="text-right"
                          aria-label={`Score for ${student.firstName || 'student'}`}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6 text-center text-muted-foreground">
              <p>No students found for this class.</p>
              <p className="text-sm mt-2">Try selecting a different class.</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
      
      <CardFooter className="px-0 pt-2 pb-0 flex justify-end">
        <Button 
          onClick={saveAllGrades} 
          disabled={isLoading || totalStudents === 0}
          className="bg-primary hover:bg-primary/90"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save All Grades
        </Button>
      </CardFooter>
    </Card>
  );
}