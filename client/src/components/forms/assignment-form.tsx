import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertAssignmentSchema, Assignment, Class } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface AssignmentFormProps {
  assignment?: Assignment;
  classId?: number;
  defaultClassId?: number;
  onSuccess?: (data: any) => void;
}

export function AssignmentForm({ assignment, classId, defaultClassId, onSuccess }: AssignmentFormProps) {
  const { toast } = useToast();
  const isEditing = !!assignment;

  // Extended schema with validation
  const extendedSchema = insertAssignmentSchema.extend({
    maxScore: z.coerce.number().min(0, "Max score must be a positive number"),
    weight: z.coerce.number().min(0, "Weight must be a positive number").max(100, "Weight cannot exceed 100%"),
  });

  // Fetch classes for dropdown
  const { data: classes } = useQuery<Class[]>({
    queryKey: ["/api/classes"],
    enabled: !classId && !isEditing, // Only fetch if classId is not provided and not editing
  });

  // Format due date
  const formatDueDate = (dueDate: string | Date | null | undefined) => {
    if (!dueDate) return undefined;
    return new Date(dueDate);
  };

  // Create form
  const form = useForm<z.infer<typeof extendedSchema>>({
    resolver: zodResolver(extendedSchema),
    defaultValues: {
      name: assignment?.name || "",
      description: assignment?.description || "",
      type: assignment?.type || "",
      maxScore: assignment?.maxScore ? Number(assignment.maxScore) : 100,
      weight: assignment?.weight ? Number(assignment.weight) : 10,
      classId: assignment?.classId || classId || defaultClassId || undefined,
      dueDate: formatDueDate(assignment?.dueDate),
    },
  });

  // Create or update assignment mutation
  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof extendedSchema>) => {
      if (isEditing) {
        const res = await apiRequest("PUT", `/api/assignments/${assignment.id}`, values);
        return res.json();
      } else {
        const res = await apiRequest("POST", "/api/assignments", values);
        return res.json();
      }
    },
    onSuccess: (data) => {
      toast({
        title: `Assignment ${isEditing ? "updated" : "created"} successfully`,
        description: `The assignment "${data.name}" has been ${isEditing ? "updated" : "created"}.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
      if (onSuccess) onSuccess(data);
    },
    onError: (error: any) => {
      toast({
        title: `Failed to ${isEditing ? "update" : "create"} assignment`,
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const onSubmit = (values: z.infer<typeof extendedSchema>) => {
    mutation.mutate(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assignment Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter assignment name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter assignment description" 
                  {...field} 
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Quiz">Quiz</SelectItem>
                    <SelectItem value="Test">Test</SelectItem>
                    <SelectItem value="Homework">Homework</SelectItem>
                    <SelectItem value="Project">Project</SelectItem>
                    <SelectItem value="Essay">Essay</SelectItem>
                    <SelectItem value="Lab">Lab</SelectItem>
                    <SelectItem value="Participation">Participation</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
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
              <FormItem className="flex flex-col">
                <FormLabel>Due Date (Optional)</FormLabel>
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
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="maxScore"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Maximum Score</FormLabel>
                <FormControl>
                  <Input type="number" min="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="weight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Weight (%)</FormLabel>
                <FormControl>
                  <Input type="number" min="0" max="100" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {!classId && !isEditing && (
          <FormField
            control={form.control}
            name="classId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Class</FormLabel>
                <Select 
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  defaultValue={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {classes?.map((class_) => (
                      <SelectItem key={class_.id} value={class_.id.toString()}>
                        {class_.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            disabled={mutation.isPending}
          >
            {mutation.isPending
              ? isEditing
                ? "Updating..."
                : "Creating..."
              : isEditing
              ? "Update Assignment"
              : "Create Assignment"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
