import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertClassSchema, Class } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ClassFormProps {
  class_?: Class;
  onSuccess?: (data: any) => void;
}

export function ClassForm({ class_, onSuccess }: ClassFormProps) {
  const { toast } = useToast();
  const isEditing = !!class_;

  // Create form
  const form = useForm<z.infer<typeof insertClassSchema>>({
    resolver: zodResolver(insertClassSchema),
    defaultValues: {
      name: class_?.name || "",
      description: class_?.description || "",
      teacherId: class_?.teacherId,
    },
  });

  // Create or update class mutation
  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof insertClassSchema>) => {
      // Simplified approach - just use a direct fetch request
      try {
        const dataToSubmit = {
          name: values.name,
          description: values.description || null
        };
        
        console.log("Submitting class data:", dataToSubmit);
        
        if (isEditing) {
          const response = await fetch(`/api/classes/${class_.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSubmit),
            credentials: 'include'
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to update class: ${errorText}`);
          }
          
          const data = await response.json();
          console.log("Class update response:", data);
          return data;
        } else {
          const response = await fetch('/api/classes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSubmit),
            credentials: 'include'
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to create class: ${errorText}`);
          }
          
          const data = await response.json();
          console.log("Class creation response:", data);
          return data;
        }
      } catch (error) {
        console.error("Error in class mutation:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      toast({
        title: `Class ${isEditing ? "updated" : "created"} successfully`,
        description: `The class "${data.name}" has been ${isEditing ? "updated" : "created"}.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      if (onSuccess) onSuccess(data);
    },
    onError: (error: any) => {
      toast({
        title: `Failed to ${isEditing ? "update" : "create"} class`,
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const onSubmit = (values: z.infer<typeof insertClassSchema>) => {
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
              <FormLabel>Class Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter class name" {...field} />
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
                  placeholder="Enter class description" 
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
            disabled={mutation.isPending}
          >
            {mutation.isPending
              ? isEditing
                ? "Updating..."
                : "Creating..."
              : isEditing
              ? "Update Class"
              : "Create Class"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
