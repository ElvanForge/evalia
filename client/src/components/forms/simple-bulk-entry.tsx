import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Grade, Student } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
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

export function SimpleBulkEntry({
  assignmentId,
  students,
  existingGrades = [],
  onSuccess,
  maxScore = 100
}: BulkGradeEntryProps) {
  console.log("Rendering SimpleBulkEntry with:", {
    studentsLength: students?.length,
    assignmentId,
    maxScore
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [scores, setScores] = useState<Record<number, string>>({});

  const handleChange = (studentId: number, value: string) => {
    setScores(prev => ({
      ...prev,
      [studentId]: value
    }));
  };

  const createGradeMutation = useMutation({
    mutationFn: (data: { assignmentId: number; studentId: number; score: number }) => {
      return apiRequest('POST', '/api/grades', {
        ...data,
        submittedAt: new Date(),
        comments: null
      });
    }
  });

  const updateGradeMutation = useMutation({
    mutationFn: ({ id, score }: { id: number; score: number }) => {
      return apiRequest('PATCH', `/api/grades/${id}`, { score });
    }
  });

  const handleSave = async () => {
    try {
      const promises: Promise<any>[] = [];
      
      Object.entries(scores).forEach(([studentIdStr, scoreStr]) => {
        if (!scoreStr) return;
        
        const studentId = parseInt(studentIdStr);
        const score = parseFloat(scoreStr);
        const existingGrade = existingGrades.find(g => g.studentId === studentId);
        
        if (isNaN(score)) return;
        
        if (existingGrade) {
          promises.push(updateGradeMutation.mutateAsync({ 
            id: existingGrade.id, 
            score 
          }));
        } else {
          promises.push(createGradeMutation.mutateAsync({ 
            assignmentId, 
            studentId, 
            score 
          }));
        }
      });
      
      if (promises.length === 0) {
        toast({
          title: "No changes",
          description: "No grades to save"
        });
        return;
      }
      
      await Promise.all(promises);
      queryClient.invalidateQueries({ queryKey: [`/api/assignments/${assignmentId}/grades`] });
      
      toast({
        title: "Success",
        description: `Saved ${promises.length} grades`
      });
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error saving grades:", error);
      toast({
        title: "Error",
        description: "Failed to save grades",
        variant: "destructive"
      });
    }
  };

  const isLoading = createGradeMutation.isPending || updateGradeMutation.isPending;

  return (
    <div className="space-y-4">
      <div className="bg-muted/50 p-4 rounded-md mb-4">
        <h3 className="font-medium mb-2">Bulk Grade Entry</h3>
        <p className="text-sm text-muted-foreground">
          Enter grades for all students at once. Maximum score: {maxScore}
        </p>
      </div>
      
      {!Array.isArray(students) || students.length === 0 ? (
        <div className="p-6 text-center">
          <p className="text-muted-foreground">No students found for this class.</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-[400px] overflow-y-auto p-1">
          {students.map(student => {
            if (!student || !student.id) return null;
            
            const existingGrade = existingGrades.find(g => g.studentId === student.id);
            const initialValue = existingGrade ? existingGrade.score.toString() : '';
            
            return (
              <div 
                key={student.id} 
                className="p-4 border rounded-md flex justify-between items-center"
              >
                <div>
                  <p className="font-medium">
                    {student.lastName ? `${student.lastName}, ${student.firstName}` : student.firstName}
                  </p>
                  {student.studentNumber && (
                    <p className="text-xs text-muted-foreground">
                      ID: {student.studentNumber}
                    </p>
                  )}
                </div>
                
                <div className="w-24">
                  <Label htmlFor={`score-${student.id}`} className="sr-only">Score</Label>
                  <Input
                    id={`score-${student.id}`}
                    type="text"
                    placeholder={`/${maxScore}`}
                    defaultValue={initialValue}
                    onChange={(e) => handleChange(student.id, e.target.value)}
                    className="text-right"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      <div className="flex justify-end pt-4">
        <Button 
          onClick={handleSave} 
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