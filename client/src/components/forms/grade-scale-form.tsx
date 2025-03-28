import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { GradeScale, GradeScaleEntry } from "@shared/schema";
import { 
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, Trash2 } from "lucide-react";

// Form schema for the grade scale
const gradeScaleSchema = z.object({
  name: z.string().min(1, "Name is required"),
  isDefault: z.boolean().default(false),
  entries: z.array(z.object({
    letter: z.string().min(1, "Letter grade is required"),
    minScore: z.coerce.number().min(0, "Minimum score must be at least 0"),
    maxScore: z.coerce.number().max(100, "Maximum score cannot exceed 100"),
  })).min(1, "At least one grade entry is required"),
});

// Type for the form data
type GradeScaleFormData = z.infer<typeof gradeScaleSchema>;

interface GradeScaleFormProps {
  gradeScale?: GradeScale;
  onSuccess: () => void;
}

export function GradeScaleForm({ gradeScale, onSuccess }: GradeScaleFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const isEditing = !!gradeScale;

  // Fetch grade scale entries if editing
  const { data: entries, isLoading: isEntriesLoading } = useQuery<GradeScaleEntry[]>({
    queryKey: [`/api/grade-scales/${gradeScale?.id}/entries`],
    enabled: isEditing,
  });

  // Set up form
  const form = useForm<GradeScaleFormData>({
    resolver: zodResolver(gradeScaleSchema),
    defaultValues: {
      name: gradeScale?.name || "",
      isDefault: gradeScale?.isDefault || false,
      entries: [{ letter: "A", minScore: 90, maxScore: 100 }],
    },
  });

  // Update form when entries are loaded
  useState(() => {
    if (entries && entries.length > 0) {
      form.setValue("entries", entries.map(entry => ({
        letter: entry.letter,
        minScore: parseFloat(entry.minScore),
        maxScore: parseFloat(entry.maxScore),
      })));
    }
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: GradeScaleFormData) => {
      // Create grade scale
      const scale = await apiRequest("POST", "/api/grade-scales", {
        name: data.name,
        isDefault: data.isDefault,
      });

      // Create entries
      const entryPromises = data.entries.map(entry => 
        apiRequest("POST", `/api/grade-scales/${scale.id}/entries`, {
          letter: entry.letter,
          minScore: entry.minScore.toString(),
          maxScore: entry.maxScore.toString(),
        })
      );

      await Promise.all(entryPromises);
      return scale;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grade-scales"] });
      toast({
        title: "Success",
        description: "Grade scale created successfully",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create grade scale",
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: GradeScaleFormData) => {
      if (!gradeScale) return;

      // Update grade scale
      await apiRequest("PATCH", `/api/grade-scales/${gradeScale.id}`, {
        name: data.name,
        isDefault: data.isDefault,
      });

      // Delete existing entries and create new ones
      await apiRequest("DELETE", `/api/grade-scales/${gradeScale.id}/entries`);

      const entryPromises = data.entries.map(entry => 
        apiRequest("POST", `/api/grade-scales/${gradeScale.id}/entries`, {
          letter: entry.letter,
          minScore: entry.minScore.toString(),
          maxScore: entry.maxScore.toString(),
        })
      );

      await Promise.all(entryPromises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grade-scales"] });
      if (gradeScale) {
        queryClient.invalidateQueries({ queryKey: [`/api/grade-scales/${gradeScale.id}/entries`] });
      }
      toast({
        title: "Success",
        description: "Grade scale updated successfully",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update grade scale",
        variant: "destructive",
      });
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  // Handle form submission
  const onSubmit = (data: GradeScaleFormData) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  // Validate that entries don't overlap
  const validateEntries = () => {
    const entries = form.getValues().entries;
    const sortedEntries = [...entries].sort((a, b) => a.minScore - b.minScore);
    
    for (let i = 0; i < sortedEntries.length - 1; i++) {
      if (sortedEntries[i].maxScore > sortedEntries[i + 1].minScore) {
        form.setError("entries", {
          type: "manual",
          message: "Grade ranges cannot overlap",
        });
        return false;
      }
    }
    
    return true;
  };

  // Add a new entry
  const addEntry = () => {
    const entries = form.getValues().entries;
    form.setValue("entries", [...entries, { letter: "", minScore: 0, maxScore: 0 }]);
  };

  // Remove an entry
  const removeEntry = (index: number) => {
    const entries = form.getValues().entries;
    if (entries.length > 1) {
      form.setValue("entries", entries.filter((_, i) => i !== index));
    }
  };

  if (isEditing && isEntriesLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Scale Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g., Standard Grading" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isDefault"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between space-x-2 rounded-md border p-4">
              <div className="space-y-0.5">
                <FormLabel>Default Scale</FormLabel>
                <div className="text-sm text-muted-foreground">
                  Set as your default grading scale
                </div>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-base font-medium">Grade Scale Entries</h3>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={addEntry}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Grade
            </Button>
          </div>

          <div className="space-y-3">
            {form.watch("entries").map((entry, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-start">
                <div className="col-span-3">
                  <FormField
                    control={form.control}
                    name={`entries.${index}.letter`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Letter</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="col-span-4">
                  <FormField
                    control={form.control}
                    name={`entries.${index}.minScore`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Min Score</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} min={0} max={100} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="col-span-4">
                  <FormField
                    control={form.control}
                    name={`entries.${index}.maxScore`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Max Score</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} min={0} max={100} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="col-span-1 pt-7">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeEntry(index)}
                    disabled={form.watch("entries").length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          {form.formState.errors.entries?.message && (
            <p className="text-sm font-medium text-destructive mt-2">
              {form.formState.errors.entries.message}
            </p>
          )}
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onSuccess}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isPending}
            onClick={() => validateEntries()}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Update" : "Create"} Grade Scale
          </Button>
        </div>
      </form>
    </Form>
  );
}