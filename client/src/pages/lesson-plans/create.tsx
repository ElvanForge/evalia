import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ChevronLeft, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import PageTitle from "@/components/page-title";

// Schema for creating a lesson plan
const lessonPlanSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  subject: z.string().min(1, { message: "Subject is required" }),
  gradeLevel: z.string().optional(),
  duration: z.string().optional(),
  classId: z.string().optional(),
});

type LessonPlanFormValues = z.infer<typeof lessonPlanSchema>;

export default function CreateLessonPlanPage() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  // Fetch classes for the dropdown
  const { data: classes } = useQuery({
    queryKey: ["/api/classes"],
    refetchOnWindowFocus: false,
  });

  // Form definition
  const form = useForm<LessonPlanFormValues>({
    resolver: zodResolver(lessonPlanSchema),
    defaultValues: {
      title: "",
      subject: "",
      gradeLevel: "",
      duration: "60 minutes",
      classId: "",
    },
  });

  // Create lesson plan mutation
  const createMutation = useMutation({
    mutationFn: async (data: LessonPlanFormValues) => {
      const cleanedData = {
        ...data,
        classId: data.classId ? parseInt(data.classId) : undefined,
      };
      
      const response = await apiRequest("POST", "/api/lesson-plans", cleanedData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Lesson plan created",
        description: "Your lesson plan has been created successfully.",
      });
      
      // Navigate to the edit page of the new lesson plan
      setLocation(`/lesson-plans/${data.id}/edit`);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create lesson plan",
        description: error.message || "An error occurred while creating the lesson plan.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LessonPlanFormValues) => {
    createMutation.mutate(data);
  };

  return (
    <div className="container py-8">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          className="mr-4"
          onClick={() => setLocation("/lesson-plans")}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <PageTitle title="Create Lesson Plan" subtitle="Set up your new lesson plan" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lesson Plan Details</CardTitle>
          <CardDescription>
            Enter the basic information for your lesson plan. You'll be able to add content and generate with AI in the next step.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Introduction to Photosynthesis" {...field} />
                    </FormControl>
                    <FormDescription>
                      Give your lesson plan a descriptive title.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                      <Input placeholder="Biology" {...field} />
                    </FormControl>
                    <FormDescription>
                      The academic subject for this lesson.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="gradeLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Grade Level</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select grade level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Elementary">Elementary</SelectItem>
                          <SelectItem value="Middle School">Middle School</SelectItem>
                          <SelectItem value="High School">High School</SelectItem>
                          <SelectItem value="College">College</SelectItem>
                          <SelectItem value="K-2">K-2</SelectItem>
                          <SelectItem value="3-5">3-5</SelectItem>
                          <SelectItem value="6-8">6-8</SelectItem>
                          <SelectItem value="9-12">9-12</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        The grade level for this lesson.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select duration" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="30 minutes">30 minutes</SelectItem>
                          <SelectItem value="45 minutes">45 minutes</SelectItem>
                          <SelectItem value="60 minutes">60 minutes</SelectItem>
                          <SelectItem value="90 minutes">90 minutes</SelectItem>
                          <SelectItem value="2 hours">2 hours</SelectItem>
                          <SelectItem value="Multiple days">Multiple days</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        How long this lesson will take.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="classId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class (Optional)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a class (optional)" />
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
                    <FormDescription>
                      Associate this lesson plan with a specific class (optional).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/lesson-plans")}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create & Continue"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}