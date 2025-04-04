import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Assignment } from "@shared/schema";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

// Form schema for validation
const assignmentFormSchema = z.object({
  name: z.string().min(1, "Assignment name is required"),
  description: z.string().optional(),
  classId: z.coerce.number().min(1, "Class is required"),
  type: z.string().optional(),
  dueDate: z.string().optional(),
  weight: z.coerce.number().min(0).max(100).optional(),
  maxPoints: z.coerce.number().min(0).optional(),
});

type AssignmentFormValues = z.infer<typeof assignmentFormSchema>;

interface AssignmentFormProps {
  assignment?: Assignment;
  defaultClassId?: number;
  onSuccess?: () => void;
}

export default function AssignmentForm({ assignment, defaultClassId, onSuccess }: AssignmentFormProps) {
  const { toast } = useToast();
  
  // Fetch classes for the dropdown
  const { data: classes, isLoading: isLoadingClasses } = useQuery({
    queryKey: ['/api/classes'],
  });
  
  // Convert due date from ISO string to YYYY-MM-DD for the input
  const formatDateForInput = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    // Add timezone offset to get correct local date
    return new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
      .toISOString()
      .split('T')[0];
  };
  
  // Initialize form with default values or existing assignment data
  const form = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentFormSchema),
    defaultValues: {
      name: assignment?.name || '',
      description: assignment?.description || '',
      classId: assignment?.classId || defaultClassId || 0,
      type: assignment?.type || '',
      dueDate: formatDateForInput(assignment?.dueDate),
      weight: assignment?.weight || 0,
      maxPoints: assignment?.maxPoints || 100,
    },
  });
  
  // Update form when assignment or defaultClassId changes
  useEffect(() => {
    if (assignment) {
      form.reset({
        name: assignment.name,
        description: assignment.description || '',
        classId: assignment.classId,
        type: assignment.type || '',
        dueDate: formatDateForInput(assignment.dueDate),
        weight: assignment.weight || 0,
        maxPoints: assignment.maxPoints || 100,
      });
    } else if (defaultClassId) {
      form.setValue('classId', defaultClassId);
    }
  }, [assignment, defaultClassId, form]);
  
  // Create assignment mutation
  const createMutation = useMutation({
    mutationFn: async (data: AssignmentFormValues) => {
      const response = await apiRequest('POST', '/api/assignments', data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Assignment created",
        description: "The assignment has been successfully created.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/assignments'] });
      if (onSuccess) onSuccess();
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create assignment. Please try again.",
        variant: "destructive",
      });
      console.error(error);
    }
  });
  
  // Update assignment mutation
  const updateMutation = useMutation({
    mutationFn: async (data: AssignmentFormValues) => {
      if (!assignment) throw new Error("No assignment to update");
      const response = await apiRequest('PUT', `/api/assignments/${assignment.id}`, data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Assignment updated",
        description: "The assignment has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/assignments'] });
      if (assignment?.id) {
        queryClient.invalidateQueries({ queryKey: ['/api/assignments', assignment.id] });
      }
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update assignment. Please try again.",
        variant: "destructive",
      });
      console.error(error);
    }
  });
  
  // Handle form submission
  const onSubmit = (values: AssignmentFormValues) => {
    if (assignment) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  };
  
  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assignment Name*</FormLabel>
              <FormControl>
                <Input placeholder="Enter assignment name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="classId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Class*</FormLabel>
              <Select 
                onValueChange={(value) => field.onChange(parseInt(value))}
                value={field.value ? field.value.toString() : ''}
                disabled={isLoadingClasses || !!assignment}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a class" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {classes?.map((class_: any) => (
                    <SelectItem key={class_.id} value={class_.id.toString()}>
                      {class_.name}
                    </SelectItem>
                  )) || <SelectItem value="loading" disabled>Loading classes...</SelectItem>}
                </SelectContent>
              </Select>
              <FormDescription>
                {assignment ? "Class cannot be changed after creation" : "Select the class for this assignment"}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select 
                  onValueChange={field.onChange}
                  value={field.value || ''}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="homework">Homework</SelectItem>
                    <SelectItem value="quiz">Quiz</SelectItem>
                    <SelectItem value="exam">Exam</SelectItem>
                    <SelectItem value="project">Project</SelectItem>
                    <SelectItem value="lab">Lab</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Due Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="weight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Weight (%)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="0" 
                    max="100" 
                    placeholder="0" 
                    {...field} 
                    onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                  />
                </FormControl>
                <FormDescription>
                  The percentage weight this assignment has in the final grade
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="maxPoints"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Maximum Points</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="0" 
                    placeholder="100" 
                    {...field}
                    onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter assignment description" 
                  className="min-h-[100px]" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {assignment ? "Updating..." : "Creating..."}
              </>
            ) : (
              assignment ? "Update Assignment" : "Create Assignment"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}