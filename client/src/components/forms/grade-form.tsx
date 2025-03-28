import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Grade, Assignment, Student, InsertGrade, insertGradeSchema } from "@shared/schema";
import { 
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { 
  Popover, PopoverContent, PopoverTrigger 
} from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";

interface GradeFormProps {
  grade?: Grade;
  assignmentId?: number;
  studentId?: number;
  onSuccess: () => void;
}

export function GradeForm({ grade, assignmentId, studentId, onSuccess }: GradeFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const isEditing = !!grade;

  // Fetch assignments based on selected class
  const { data: assignments, isLoading: isLoadingAssignments } = useQuery({
    queryKey: [selectedClassId ? `/api/classes/${selectedClassId}/assignments` : "/api/assignments"],
    enabled: !!user && (!!selectedClassId || !isEditing),
  });

  // Fetch classes
  const { data: classes, isLoading: isLoadingClasses } = useQuery({
    queryKey: ["/api/classes"],
    enabled: !!user,
  });

  // Fetch students based on selected class
  const { data: students, isLoading: isLoadingStudents } = useQuery({
    queryKey: [selectedClassId ? `/api/classes/${selectedClassId}/students` : "/api/students"],
    enabled: !!user && (!!selectedClassId || !isEditing),
  });

  // If editing, fetch the specific assignment and student
  const { data: specificAssignment } = useQuery({
    queryKey: [grade ? `/api/assignments/${grade.assignmentId}` : ""],
    enabled: !!grade,
  });

  const { data: specificStudent } = useQuery({
    queryKey: [grade ? `/api/students/${grade.studentId}` : ""],
    enabled: !!grade,
  });

  // Set up form with validation
  const form = useForm<z.infer<typeof insertGradeSchema>>({
    resolver: zodResolver(insertGradeSchema),
    defaultValues: {
      assignmentId: assignmentId || grade?.assignmentId || 0,
      studentId: studentId || grade?.studentId || 0,
      score: grade?.score || "",
      comments: grade?.comments || null,
      submittedAt: grade?.submittedAt ? new Date(grade.submittedAt) : null,
    },
  });

  // Create grade mutation
  const createGradeMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertGradeSchema>) => {
      return apiRequest("POST", "/api/grades", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grades"] });
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({
        title: "Success",
        description: "Grade was successfully created",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create grade",
        variant: "destructive",
      });
    },
  });

  // Update grade mutation
  const updateGradeMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertGradeSchema>) => {
      if (!grade) return;
      return apiRequest("PATCH", `/api/grades/${grade.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grades"] });
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      if (grade) {
        queryClient.invalidateQueries({ queryKey: [`/api/grades/${grade.id}`] });
      }
      toast({
        title: "Success",
        description: "Grade was successfully updated",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update grade",
        variant: "destructive",
      });
    },
  });

  // When selecting a class, update related data
  const handleClassChange = (classId: string) => {
    const parsedId = parseInt(classId);
    setSelectedClassId(parsedId);
    form.setValue("assignmentId", 0);
    form.setValue("studentId", 0);
  };

  // Handle form submission
  const onSubmit = (data: z.infer<typeof insertGradeSchema>) => {
    if (isEditing) {
      updateGradeMutation.mutate(data);
    } else {
      createGradeMutation.mutate(data);
    }
  };

  // Loading state for initial load
  const isLoading = 
    (isLoadingClasses && !classes) || 
    (isLoadingAssignments && !assignments) || 
    (isLoadingStudents && !students);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isPending = createGradeMutation.isPending || updateGradeMutation.isPending;

  // Filter assignments and students based on the current assignment/student when editing
  const availableAssignments = isEditing && specificAssignment 
    ? [specificAssignment]
    : assignments || [];

  const availableStudents = isEditing && specificStudent
    ? [specificStudent]
    : students || [];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {!isEditing && (
          <FormItem className="flex flex-col space-y-1.5">
            <FormLabel>Class</FormLabel>
            <Select
              onValueChange={handleClassChange}
              disabled={isEditing}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {classes?.map((c) => (
                  <SelectItem key={c.id} value={c.id.toString()}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormItem>
        )}

        <FormField
          control={form.control}
          name="assignmentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assignment</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(parseInt(value))}
                value={field.value ? field.value.toString() : ""}
                disabled={isEditing || !selectedClassId}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an assignment" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableAssignments.map((assignment) => (
                    <SelectItem key={assignment.id} value={assignment.id.toString()}>
                      {assignment.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="studentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Student</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(parseInt(value))}
                value={field.value ? field.value.toString() : ""}
                disabled={isEditing || !selectedClassId}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a student" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableStudents.map((student) => (
                    <SelectItem key={student.id} value={student.id.toString()}>
                      {student.lastName}, {student.firstName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="score"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Score</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  type="number" 
                  step="0.01"
                  placeholder="Enter score"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="submittedAt"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Submission Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value || undefined}
                    onSelect={field.onChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="comments"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Comments</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Add comments about this grade (optional)"
                  {...field}
                  value={field.value || ''}
                  onChange={e => field.onChange(e.target.value || null)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" type="button" onClick={onSuccess}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Update" : "Save"} Grade
          </Button>
        </div>
      </form>
    </Form>
  );
}