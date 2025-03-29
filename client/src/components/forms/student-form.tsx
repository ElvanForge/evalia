import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertStudentSchema, insertStudentClassSchema, Student } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface StudentFormProps {
  student?: Student;
  classId?: number;
  onSuccess?: (data: any) => void;
}

export function StudentForm({ student, classId, onSuccess }: StudentFormProps) {
  const { toast } = useToast();
  const isEditing = !!student;
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isNewStudent, setIsNewStudent] = useState(true);

  // Fetch existing students for enrollment option
  const { data: existingStudents } = useQuery<Student[]>({
    queryKey: ["/api/students"],
    enabled: !!classId, // Only fetch if we're adding to a class
  });

  // Create form for new student
  const newStudentForm = useForm<z.infer<typeof insertStudentSchema>>({
    resolver: zodResolver(insertStudentSchema),
    defaultValues: {
      firstName: student?.firstName || "",
      lastName: student?.lastName || "",
      email: student?.email || "",
      gradeLevel: student?.gradeLevel || "",
    },
  });

  // Create form for student enrollment
  const enrollmentForm = useForm<{ studentId: number }>({
    defaultValues: {
      studentId: 0,
    },
  });

  // Create or update student mutation
  const studentMutation = useMutation({
    mutationFn: async (values: z.infer<typeof insertStudentSchema>) => {
      if (isEditing) {
        const res = await apiRequest("PUT", `/api/students/${student.id}`, values);
        return res.json();
      } else {
        // If classId is provided, add it to the request payload
        const dataToSend = classId ? { ...values, classId } : values;
        const res = await apiRequest("POST", "/api/students", dataToSend);
        return res.json();
      }
    },
    onSuccess: (data) => {
      toast({
        title: `Student ${isEditing ? "updated" : "created"} successfully`,
        description: `${data.firstName} ${data.lastName} has been ${isEditing ? "updated" : "created"}.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      
      // Also invalidate the class students if a classId was provided
      if (classId) {
        queryClient.invalidateQueries({ queryKey: [`/api/classes/${classId}/students`] });
      }
      
      if (onSuccess) {
        onSuccess(data);
      }
    },
    onError: (error: any) => {
      toast({
        title: `Failed to ${isEditing ? "update" : "create"} student`,
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  // Enroll student mutation
  const enrollmentMutation = useMutation({
    mutationFn: async (values: z.infer<typeof insertStudentClassSchema>) => {
      const res = await apiRequest("POST", "/api/enrollments", values);
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Student enrolled successfully",
        description: "The student has been added to the class.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/classes/${classId}/students`] });
      if (onSuccess) onSuccess(data);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to enroll student",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  // Form submission handlers
  const onSubmitNewStudent = (values: z.infer<typeof insertStudentSchema>) => {
    studentMutation.mutate(values);
  };

  const onSubmitEnrollment = (values: { studentId: number }) => {
    enrollStudent(values);
  };

  const enrollStudent = (values: { studentId: number, classId?: number }) => {
    if (!classId) {
      toast({
        title: "Error",
        description: "Class ID is required for enrollment",
        variant: "destructive",
      });
      return;
    }
    
    enrollmentMutation.mutate({
      studentId: values.studentId,
      classId,
    });
  };

  if (classId) {
    // If adding to a class, show option to create new or select existing
    return (
      <div className="space-y-4">
        <div className="flex space-x-2">
          <Button
            type="button"
            variant={isNewStudent ? "default" : "outline"}
            onClick={() => setIsNewStudent(true)}
          >
            Create New Student
          </Button>
          <Button
            type="button"
            variant={!isNewStudent ? "default" : "outline"}
            onClick={() => setIsNewStudent(false)}
          >
            Select Existing Student
          </Button>
        </div>

        {isNewStudent ? (
          <Form {...newStudentForm}>
            <form onSubmit={newStudentForm.handleSubmit(onSubmitNewStudent)} className="space-y-4">
              <FormField
                control={newStudentForm.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter first name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={newStudentForm.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter last name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={newStudentForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="Enter email" 
                        {...field} 
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={newStudentForm.control}
                name="gradeLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grade Level (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter grade level" 
                        {...field} 
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  disabled={studentMutation.isPending}
                >
                  {studentMutation.isPending
                    ? "Creating..."
                    : "Create and Enroll"}
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <Form {...enrollmentForm}>
            <form onSubmit={enrollmentForm.handleSubmit(onSubmitEnrollment)} className="space-y-4">
              <FormField
                control={enrollmentForm.control}
                name="studentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Student</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a student" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {existingStudents?.map((student) => (
                          <SelectItem key={student.id} value={student.id.toString()}>
                            {student.firstName} {student.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  disabled={enrollmentMutation.isPending || !enrollmentForm.getValues().studentId}
                >
                  {enrollmentMutation.isPending
                    ? "Enrolling..."
                    : "Enroll Student"}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </div>
    );
  }

  // Regular student form (not for enrollment)
  return (
    <Form {...newStudentForm}>
      <form onSubmit={newStudentForm.handleSubmit(onSubmitNewStudent)} className="space-y-4">
        <FormField
          control={newStudentForm.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>First Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter first name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={newStudentForm.control}
          name="lastName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Last Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter last name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={newStudentForm.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email (Optional)</FormLabel>
              <FormControl>
                <Input 
                  type="email" 
                  placeholder="Enter email" 
                  {...field} 
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={newStudentForm.control}
          name="gradeLevel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Grade Level (Optional)</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter grade level" 
                  {...field} 
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            disabled={studentMutation.isPending}
          >
            {studentMutation.isPending
              ? isEditing
                ? "Updating..."
                : "Creating..."
              : isEditing
              ? "Update Student"
              : "Create Student"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
