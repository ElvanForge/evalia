import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Grade, Student } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";

interface BulkGradeEntryProps {
  assignmentId: number;
  students: Student[];
  existingGrades?: Grade[];
  onSuccess?: () => void;
  maxScore?: number;
}

export function BulkGradeEntry({
  assignmentId,
  students,
  existingGrades = [],
  onSuccess,
  maxScore = 100
}: BulkGradeEntryProps) {
  const { toast } = useToast();
  const [grades, setGrades] = useState<Record<number, string>>(() => {
    // Initialize with existing grades if available
    const initialGrades: Record<number, string> = {};
    students.forEach(student => {
      const existingGrade = existingGrades.find(g => g.studentId === student.id);
      if (existingGrade) {
        initialGrades[student.id] = existingGrade.score.toString();
      } else {
        initialGrades[student.id] = '';
      }
    });
    return initialGrades;
  });

  const handleScoreChange = (studentId: number, value: string) => {
    // Only allow numeric input and empty string
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      const numValue = parseFloat(value);
      
      // Check if value exceeds max score
      if (value !== '' && numValue > maxScore) {
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
  };

  const createGradeMutation = useMutation({
    mutationFn: async (data: { assignmentId: number; studentId: number; score: number }) => {
      // Include submittedAt date to satisfy validation
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

  const saveAllGrades = async () => {
    const promises: Promise<any>[] = [];
    
    // Process each grade
    Object.entries(grades).forEach(([studentIdStr, scoreStr]) => {
      const studentId = parseInt(studentIdStr);
      
      // Skip empty scores
      if (!scoreStr.trim()) return;
      
      const score = parseFloat(scoreStr);
      const existingGrade = existingGrades.find(g => g.studentId === studentId);
      
      if (existingGrade) {
        // Update existing grade if the score changed
        if (parseFloat(existingGrade.score.toString()) !== score) {
          promises.push(updateGradeMutation.mutateAsync({ id: existingGrade.id, score }));
        }
      } else {
        // Create a new grade
        promises.push(createGradeMutation.mutateAsync({ assignmentId, studentId, score }));
      }
    });
    
    if (promises.length === 0) {
      toast({
        title: "No changes to save",
        description: "Make some changes before saving.",
      });
      return;
    }
    
    try {
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
      // Individual mutations handle their own errors
      console.error("Error while saving grades:", error);
    }
  };

  const isLoading = createGradeMutation.isPending || updateGradeMutation.isPending;
  
  // Calculate completion stats
  const totalStudents = students.length;
  const gradedStudents = Object.values(grades).filter(score => score.trim() !== '').length;
  const completionPercentage = totalStudents > 0 ? Math.round((gradedStudents / totalStudents) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="bg-muted/50 p-4 rounded-md">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium">Grade Entry Progress</h3>
          <span className="text-sm bg-primary/10 text-primary px-2 py-1 rounded-full">
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
      
      <div className="space-y-4 max-h-[400px] overflow-y-auto p-1">
        {students.map(student => {
          const existingGrade = existingGrades.find(g => g.studentId === student.id);
          return (
            <div 
              key={student.id} 
              className={`p-3 border rounded-md ${existingGrade ? 'border-primary/30 bg-primary/5' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${existingGrade ? 'bg-primary/20' : 'bg-primary/10'}`}>
                    <span className="text-sm font-semibold text-primary">
                      {student.firstName.charAt(0)}
                      {student.lastName?.charAt(0) || ''}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">
                      {student.lastName ? 
                        `${student.lastName}, ${student.firstName}` : 
                        student.firstName}
                    </p>
                    {student.studentNumber && (
                      <p className="text-xs text-muted-foreground">
                        ID: {student.studentNumber}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="w-24">
                  <Label htmlFor={`score-${student.id}`} className="sr-only">Score</Label>
                  <Input
                    id={`score-${student.id}`}
                    type="text"
                    value={grades[student.id] || ''}
                    onChange={(e) => handleScoreChange(student.id, e.target.value)}
                    placeholder={`/${maxScore}`}
                    className="text-right"
                    aria-label={`Score for ${student.firstName}`}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="flex justify-end">
        <Button 
          onClick={saveAllGrades} 
          disabled={isLoading}
          className="bg-primary hover:bg-primary/90"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save All Grades
        </Button>
      </div>
    </div>
  );
}