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
import { useState, useEffect } from "react";
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
      studentNumber: student?.studentNumber || "",
      email: student?.email || "",
      gradeLevel: student?.gradeLevel || "",
    },
  });

  // Create form for student enrollment
  const enrollmentForm = useForm<{ studentId: number }>({
    defaultValues: {
      studentId: existingStudents && existingStudents.length > 0 ? existingStudents[0].id : 0,
    },
  });
  
  // Set default student when the data loads
  useEffect(() => {
    if (existingStudents && existingStudents.length > 0 && !enrollmentForm.getValues().studentId) {
      enrollmentForm.setValue('studentId', existingStudents[0].id);
    }
  }, [existingStudents, enrollmentForm]);

  // Create or update student mutation
  const studentMutation = useMutation({
    mutationFn: async (values: any) => {
      try {
        if (isEditing && student) {
          // Only send student schema fields
          const { classId, ...studentData } = values;
          
          // Use apiRequest helper for consistency
          return await apiRequest.post(`/api/students/${student.id}`, studentData, { responseType: 'json' });
        } else {
          // If classId is provided, add it to the request payload
          const classIdToUse = selectedClassId || classId;
          const dataToSend = classIdToUse 
            ? { 
                firstName: values.firstName,
                lastName: values.lastName || null,
                studentNumber: values.studentNumber || null,
                email: values.email || null,
                gradeLevel: values.gradeLevel || null,
                classId: classIdToUse
              } 
            : { 
                firstName: values.firstName,
                lastName: values.lastName || null,
                studentNumber: values.studentNumber || null,
                email: values.email || null,
                gradeLevel: values.gradeLevel || null
              };
              
          console.log("Submitting student data:", dataToSend);
          
          // Use direct fetch for better error handling
          const response = await fetch('/api/students', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSend),
            credentials: 'include'
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to create student: ${errorText}`);
          }
          
          const data = await response.json();
          console.log("Student creation response:", data);
          return data;
        }
      } catch (error) {
        console.error("Error in student mutation:", error);
        throw error;
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
      try {
        console.log("Submitting enrollment data:", values);
        
        const response = await fetch('/api/enrollments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
          credentials: 'include'
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to enroll student: ${errorText}`);
        }
        
        const data = await response.json();
        console.log("Enrollment response:", data);
        return data;
      } catch (error) {
        console.error("Error in enrollment mutation:", error);
        throw error;
      }
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
    // Add the selected class ID to the mutation data if it's selected
    if (selectedClassId) {
      studentMutation.mutate({
        ...values,
        classId: selectedClassId
      });
    } else {
      studentMutation.mutate(values);
    }
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
                    <FormLabel>Last Name (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter last name" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={newStudentForm.control}
                name="studentNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student Number (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter student number" 
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
                      value={field.value ? field.value.toString() : existingStudents && existingStudents.length > 0 ? existingStudents[0].id.toString() : undefined}
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

              <div className="space-y-4 pt-4">
                <div className="text-xs text-muted-foreground p-2 border rounded">
                  <p>Selected Student ID: {enrollmentForm.getValues().studentId || "None"}</p>
                  <p>Available Students: {existingStudents?.length || 0}</p>
                  <p>Class ID: {classId}</p>
                </div>
                
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    size="lg"
                    disabled={enrollmentMutation.isPending}
                    onClick={() => {
                      console.log("Enroll button clicked, form state:", enrollmentForm.formState);
                      console.log("Current studentId value:", enrollmentForm.getValues().studentId);
                      // The actual submission is handled by form.handleSubmit(onSubmitEnrollment)
                    }}
                  >
                    {enrollmentMutation.isPending
                      ? "Enrolling..."
                      : "Enroll Student"}
                  </Button>
                </div>
                
                <div className="flex justify-center pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      console.log("Manual enrollment button clicked");
                      if (existingStudents && existingStudents.length > 0) {
                        const studentId = existingStudents[0].id;
                        console.log("Manually enrolling student ID:", studentId);
                        enrollStudent({ studentId });
                      } else {
                        toast({
                          title: "Error",
                          description: "No students available to enroll",
                          variant: "destructive"
                        });
                      }
                    }}
                  >
                    Enroll First Student (Manual)
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        )}
      </div>
    );
  }

  // Fetch classes for the class selector
  const { data: classes } = useQuery<any[]>({
    queryKey: ["/api/classes"],
  });

  // State to track the selected class
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);

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
              <FormLabel>Last Name (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="Enter last name" {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={newStudentForm.control}
          name="studentNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Student Number (Optional)</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter student number" 
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

        {/* Class selector */}
        <div className="space-y-2">
          <FormLabel>Assign to Class (Optional)</FormLabel>
          <Select 
            onValueChange={(value) => setSelectedClassId(Number(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a class" />
            </SelectTrigger>
            <SelectContent>
              {classes?.map((class_) => (
                <SelectItem key={class_.id} value={class_.id.toString()}>
                  {class_.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            This will automatically enroll the student in the selected class.
          </p>
        </div>

        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            disabled={studentMutation.isPending}
            onClick={() => {
              // Do nothing here, we'll handle the classId in the mutation function
              // The field doesn't need to be in the form as it's not part of the schema
            }}
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
