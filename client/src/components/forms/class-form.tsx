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

  // Create a custom schema without teacherId field
  const formSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional().nullable()
  });
  
  // Create form with custom schema
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: class_?.name || "",
      description: class_?.description || "",
    },
  });

  // Create or update class mutation
  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
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
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      console.log("Form submitted with values:", values);
      const result = await mutation.mutateAsync(values);
      console.log("Mutation result:", result);
      // We'll handle success in the mutation.onSuccess callback
    } catch (error) {
      console.error("Form submission error:", error);
      // Error is already handled in the mutation.onError callback
    }
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

        <div className="flex justify-end pt-4 space-x-4">
          <Button
            type="button"
            disabled={mutation.isPending}
            variant="outline"
            onClick={async () => {
              console.log("Manual submit button clicked");
              // Get current form values
              const values = form.getValues();
              console.log("Form values:", values);
              
              if (!values.name) {
                toast({
                  title: "Error",
                  description: "Class name is required",
                  variant: "destructive"
                });
                return;
              }
              
              // Manually submit
              try {
                await mutation.mutateAsync(values);
              } catch (error) {
                console.error("Manual submission error:", error);
              }
            }}
          >
            Create Class (Manual)
          </Button>
        
          <Button
            type="submit"
            disabled={mutation.isPending}
            onClick={() => {
              console.log("Button clicked, form state:", form.formState);
              // The actual submission is handled by form.handleSubmit(onSubmit)
            }}
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
        
        {/* Debug info - remove in production */}
        <div className="text-xs text-muted-foreground mt-4 p-2 border rounded">
          <p>Form state: {form.formState.isValid ? "Valid" : "Invalid"}</p>
          <p>Submitting: {form.formState.isSubmitting ? "Yes" : "No"}</p>
          <p>Errors: {Object.keys(form.formState.errors).length > 0 ? JSON.stringify(form.formState.errors) : "None"}</p>
        </div>
      </form>
    </Form>
  );
}
