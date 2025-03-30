import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Image, X, Loader2, Plus } from "lucide-react";
import { getImageProps } from "@/lib/image-utils";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { InsertQuizQuestion, QuizQuestion, insertQuizQuestionSchema } from "@shared/schema";

interface QuestionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quizId: number;
  questionToEdit?: QuizQuestion | null;
}

// Create a schema for our form that extends the insert schema
// but with the additional questionOptions field which is not in the database schema
const QuestionFormSchema = z.object({
  quizId: z.number({
    required_error: "Quiz ID is required",
    invalid_type_error: "Quiz ID must be a number"
  }),
  question: z.string().min(1, "Question text is required"),
  type: z.string().default("multiple_choice"),
  imageUrl: z.string().nullable().optional(),
  order: z.number().optional().nullable(),
  questionOptions: z.array(
    z.object({
      text: z.string().min(1, "Option text is required"),
      isCorrect: z.boolean().default(false),
    })
  ).min(2, "At least 2 options are required"),
});

type FormValues = z.infer<typeof QuestionFormSchema> & {
  imageFile?: FileList;
};

export function QuestionFormDialog({
  open,
  onOpenChange,
  quizId,
  questionToEdit = null,
}: QuestionFormDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Log when dialog is opened or quiz ID changes
  useEffect(() => {
    console.log(`QuestionFormDialog: ${open ? 'opened' : 'closed'} with quiz ID:`, quizId);
    if (isNaN(quizId)) {
      console.error("CRITICAL: Invalid quiz ID passed to QuestionFormDialog:", quizId);
    }
  }, [open, quizId]);
  
  // Set the image preview when the question changes
  useEffect(() => {
    if (questionToEdit?.imageUrl) {
      console.log("Setting image preview from questionToEdit.imageUrl:", questionToEdit.imageUrl);
      setImagePreview(questionToEdit.imageUrl);
    } else {
      console.log("No image URL in questionToEdit, clearing preview");
      setImagePreview(null);
    }
  }, [questionToEdit?.id, questionToEdit?.imageUrl]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [options, setOptions] = useState<Array<{ text: string, isCorrect: boolean }>>([]);

  // Ensure quiz ID is a valid number right from component initialization
  const numericQuizId = parseInt(String(quizId), 10);
  
  if (isNaN(numericQuizId)) {
    console.error("Invalid quiz ID in component initialization:", quizId);
  }
  
  const form = useForm<FormValues>({
    resolver: zodResolver(QuestionFormSchema),
    defaultValues: {
      quizId: isNaN(numericQuizId) ? undefined : numericQuizId, // Avoid setting NaN
      question: questionToEdit?.question || "",
      type: questionToEdit?.type || "multiple_choice",
      imageUrl: questionToEdit?.imageUrl || null,
      questionOptions: [
        { text: "", isCorrect: true },
        { text: "", isCorrect: false },
      ],
    },
  });

  // Fetch options for the question when editing
  useEffect(() => {
    const fetchOptions = async () => {
      if (questionToEdit) {
        try {
          console.log(`Fetching options for question ${questionToEdit.id} in quiz ${quizId}`);

          // First try the newer endpoint format
          const response = await fetch(`/api/quiz-questions/${questionToEdit.id}/options`);

          if (response.ok) {
            const data = await response.json();
            console.log(`Received options for question ${questionToEdit.id}:`, data);

            const formattedOptions = data.map((option: any) => ({
              text: option.text,
              isCorrect: option.isCorrect
            }));

            if (formattedOptions.length > 0) {
              console.log(`Setting ${formattedOptions.length} options from API`);
              setOptions(formattedOptions);
              form.setValue("questionOptions", formattedOptions);
            } else {
              console.log("No options found for the question, keeping defaults");
            }
          } else {
            console.error("Error fetching question options:", await response.text());
          }
        } catch (error) {
          console.error("Error fetching question options:", error);
        }
      }
    };

    fetchOptions();
  }, [questionToEdit?.id, form, quizId]);

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    let imageUrl = data.imageUrl;

    try {
      console.log("Form data:", data);

      // If an image file was uploaded, we need to handle it
      if (data.imageFile && data.imageFile.length > 0) {
        const file = data.imageFile[0];
        // Log file details for debugging
        console.log("Uploading image file:", {
          name: file.name,
          type: file.type,
          size: file.size,
          lastModified: new Date(file.lastModified).toString()
        });

        // Create a new FormData instance
        const formData = new FormData();
        formData.append("image", file);

        // Log FormData for debugging (but avoid iteration that causes TypeScript error)
        try {
          console.log("FormData ready for submission with file:", file.name);
          // Don't iterate through entries as this causes TypeScript downlevelIteration errors
          // Just log the basic info we care about
          console.log(`Image file: ${file.name}, ${file.type}, ${file.size} bytes`);
        } catch (e) {
          console.log("Could not log FormData info:", e);
        }

        try {
          // Upload the image
          console.log("Sending image upload request to /api/upload/image");
          const uploadResponse = await fetch("/api/upload/image", {
            method: "POST",
            // Let browser set the correct Content-Type with boundary
            body: formData,
          });

          console.log("Image upload response status:", uploadResponse.status);

          if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            console.error("Image upload failed:", errorText);
            // Don't throw, just show a toast and continue without the image
            toast({
              title: "Image Upload Failed",
              description: "Could not upload the image, but will continue with the question.",
              variant: "destructive",
            });
            imageUrl = null;
          } else {
            const uploadResult = await uploadResponse.json();
            console.log("Image upload success! Result:", uploadResult);

            // The server now returns multiple URL formats to handle different scenarios
            // Use the standard imageUrl format which includes a leading slash
            if (uploadResult.imageUrl) {
              imageUrl = uploadResult.imageUrl;
              console.log(`Using server-provided imageUrl: ${imageUrl}`);
            } 
            // Fallback to other URL formats if needed
            else if (uploadResult.relativeUrl) {
              imageUrl = `/${uploadResult.relativeUrl}`;
              console.log(`Using normalized relativeUrl: ${imageUrl}`);
            }
            else if (uploadResult.filename) {
              // Construct a path if only filename was provided
              imageUrl = `/uploads/images/${uploadResult.filename}`;
              console.log(`Constructed URL from filename: ${imageUrl}`);
            }

            // Final validation: ensure URL has leading slash and is properly formatted 
            if (imageUrl) {
              // 1. Ensure it starts with a slash for relative URLs
              if (!imageUrl.startsWith('/')) {
                imageUrl = '/' + imageUrl;
              }

              // 2. Replace any double slashes (except in http://)
              imageUrl = imageUrl.replace(/([^:])\/\//g, '$1/');

              // 3. Make sure there aren't any spaces or bad characters
              imageUrl = imageUrl.trim();

              console.log(`Final normalized image URL: ${imageUrl}`);

              // 4. Add a cache-busting query parameter to prevent browser caching
              // This helps ensure the image is always fetched fresh from the server
              const cacheBust = Date.now();
              imageUrl = `${imageUrl}?v=${cacheBust}`;
              
              // Update the image preview state to show the image
              setImagePreview(imageUrl);
              
              // Update the form's imageUrl field
              form.setValue('imageUrl', imageUrl);

              // Show success toast with image preview
              toast({
                title: "Image Uploaded Successfully",
                description: "The image has been added to your question.",
              });
            }
          }
        } catch (uploadError) {
          console.error("Error during image upload:", uploadError);
          // Don't throw, just show a toast and continue without the image
          toast({
            title: "Image Upload Error",
            description: "Could not upload the image, but will continue with the question.",
            variant: "destructive",
          });
          imageUrl = null;
        }
      } else if (imagePreview) {
        if (imagePreview.startsWith('data:')) {
          // If we have a data URL preview from a file that was selected but not uploaded yet
          console.log("Using image file that was selected but needs to be uploaded");
          // We'll upload this file in the next submit attempt
          // No changes needed, just don't set imageUrl to null
          return;
        } else if (imagePreview.startsWith('/uploads/') || imagePreview.startsWith('/api/') || imagePreview.startsWith('http')) {
          // If we still have an image preview that's an actual file path (not a data URL)
          console.log("Keeping existing image URL from previous upload:", imagePreview);

          // Apply same normalization to existing URLs
          let normalizedUrl = imagePreview;

          // Remove any existing cache busting or query parameters
          if (normalizedUrl.includes('?')) {
            normalizedUrl = normalizedUrl.split('?')[0];
          }

          // Add fresh cache busting parameter
          const cacheBust = Date.now();
          imageUrl = `${normalizedUrl}?v=${cacheBust}`;
          
          // Make sure to update the form value too
          form.setValue('imageUrl', imageUrl);

          console.log("Normalized existing image URL:", imageUrl);
        }
      } else if (questionToEdit?.imageUrl) {
        // If editing a question that already has an image URL
        console.log("Keeping existing image URL from question:", questionToEdit.imageUrl);

        // Normalize and add cache busting to existing URL too
        let normalizedUrl = questionToEdit.imageUrl;

        // Remove any existing cache busting
        if (normalizedUrl.includes('?')) {
          normalizedUrl = normalizedUrl.split('?')[0];
        }

        // Add fresh cache busting parameter
        const cacheBust = Date.now();
        imageUrl = `${normalizedUrl}?v=${cacheBust}`;
        
        // Make sure to update the form value too
        form.setValue('imageUrl', imageUrl);

        console.log("Normalized existing question image URL:", imageUrl);
      } else {
        // No image preview and no file uploaded, set to null
        console.log("No image to use");
        imageUrl = null;
        // Make sure the form value is set to null too
        form.setValue('imageUrl', null);
      }

      // Ensure quiz ID is a valid number
      const numericQuizId = parseInt(String(quizId), 10);
      
      if (isNaN(numericQuizId)) {
        console.error("Invalid quiz ID:", quizId);
        toast({
          title: "Error",
          description: "Invalid quiz ID. Please try refreshing the page.",
          variant: "destructive",
        });
        throw new Error("Invalid quiz ID. Please try refreshing the page.");
      }
      
      console.log("Using quiz ID for new question:", numericQuizId);
      
      // Prepare the question data - exclude questionOptions as they'll be handled separately
      const questionData: InsertQuizQuestion = {
        quizId: numericQuizId,
        question: data.question,
        type: data.type,
        imageUrl: imageUrl
        // Options will be handled separately after creating the question
      };

      // Create or update the question
      const response = await fetch(
        questionToEdit 
          ? `/api/quiz-questions/${questionToEdit.id}` 
          : `/api/quizzes/${quizId}/questions`,
        {
          method: questionToEdit ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(questionData),
        }
      );

      if (!response.ok) {
        throw new Error(questionToEdit ? "Failed to update question" : "Failed to create question");
      }

      const question = await response.json();

      // Now handle the options for the question
      if (data.questionOptions && data.questionOptions.length > 0) {
        // For editing questions, first delete all existing options
        if (questionToEdit) {
          try {
            // Define a type for quiz options
            type QuizOption = {
              id: number;
              questionId: number;
              text: string;
              isCorrect: boolean;
              order: number;
            };
            
            // Try to fetch existing options using the newer endpoint
            let existingOptions: QuizOption[] = [];
            const optionsResponse = await fetch(`/api/quiz-questions/${question.id}/options`);

            if (optionsResponse.ok) {
              existingOptions = await optionsResponse.json();
              console.log("Existing options from API:", existingOptions);

              if (existingOptions.length > 0) {
                console.log(`Deleting ${existingOptions.length} existing options for question ${question.id}`);

                // Instead of deleting all existing options and creating new ones, we'll be smarter:
                // 1. Keep a map of existing options by ID
                const existingOptionsMap = new Map(existingOptions.map(opt => [opt.id, opt]));
                console.log("Existing options map:", existingOptionsMap);

                // 2. Only delete options that are no longer needed
                for (const option of existingOptions) {
                  // When editing, we're creating all new options, so delete all existing ones
                  console.log(`Deleting option ${option.id}: ${option.text}`);
                  try {
                    const deleteResponse = await fetch(`/api/quiz-options/${option.id}`, {
                      method: "DELETE",
                      headers: {
                        "Content-Type": "application/json"
                      }
                    });

                    if (!deleteResponse.ok) {
                      const errorText = await deleteResponse.text();
                      console.error(`Failed to delete option ${option.id}:`, errorText);
                    } else {
                      console.log(`Successfully deleted option ${option.id}`);
                    }
                  } catch (deleteError) {
                    console.error(`Error while deleting option ${option.id}:`, deleteError);
                  }
                }
              } else {
                console.log("No existing options to delete");
              }
            } else {
              console.error("Failed to fetch existing options:", await optionsResponse.text());
            }
          } catch (error) {
            console.error("Error while managing existing options:", error);
          }
        }

        console.log("Creating options:", data.questionOptions);

        // Now create all new options
        for (const option of data.questionOptions) {
          // Skip empty options
          if (!option.text.trim()) {
            console.log("Skipping empty option");
            continue;
          }

          // Try the newer endpoint format
          const endpoint = `/api/quiz-questions/${question.id}/options`;
          console.log(`Creating option for question ${question.id} using endpoint: ${endpoint}`);

          const optionData = {
            questionId: question.id,
            text: option.text,
            isCorrect: option.isCorrect,
          };
          console.log("Option data:", optionData);

          const response = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(optionData),
          });

          if (!response.ok) {
            console.error("Failed to create option:", await response.text());

            // Try fallback to the older endpoint format
            console.log("Trying fallback endpoint");
            const fallbackResponse = await fetch(`/api/quizzes/${quizId}/questions/${question.id}/options`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(optionData),
            });

            if (!fallbackResponse.ok) {
              console.error("Fallback also failed:", await fallbackResponse.text());
            } else {
              console.log("Successfully created option using fallback endpoint:", option.text);
            }
          } else {
            console.log("Successfully created option:", option.text);
          }
        }
      }

      // Success
      toast({
        title: questionToEdit ? "Question Updated" : "Question Added",
        description: questionToEdit 
          ? "The question has been updated successfully."
          : "The question has been added to the quiz.",
      });

      // Invalidate all quiz-related queries
      queryClient.invalidateQueries({ queryKey: [`/api/quizzes/${quizId}/questions`] });
      queryClient.invalidateQueries({ queryKey: [`/api/quizzes/${quizId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/quiz-questions`] });

      // Explicitly invalidate the options for this question
      if (question && question.id) {
        console.log(`Invalidating cache for question options: ${question.id}`);
        queryClient.invalidateQueries({ queryKey: [`/api/quiz-questions/${question.id}/options`] });
      }

      // Close the dialog
      onOpenChange(false);
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: `Failed to ${questionToEdit ? "update" : "add"} question. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setImagePreview(dataUrl);
        // We don't set imageUrl field here yet because we need to upload the file first
        // The actual URL will be set after successful upload in the onSubmit handler
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    form.setValue("imageUrl", null);
    form.setValue("imageFile", undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    console.log("Image removed, form values:", form.getValues());
  };

  // Reset form when dialog is closed
  useEffect(() => {
    if (!open) {
      // Ensure quiz ID is a valid number
      const numericQuizId = parseInt(String(quizId), 10);
      
      if (isNaN(numericQuizId)) {
        console.error("Invalid quiz ID for form reset:", quizId);
        return; // Don't reset the form with an invalid ID
      }
      
      form.reset({
        quizId: numericQuizId,
        question: "",
        type: "multiple_choice",
        imageUrl: null,
        questionOptions: [
          { text: "", isCorrect: true },
          { text: "", isCorrect: false },
        ]
      });
    }
  }, [open, form, quizId]);

  return (
    <Dialog 
      open={open} 
      onOpenChange={(openState) => {
        // Only allow closing if we're not submitting
        if (!isSubmitting) {
          onOpenChange(openState);
        }
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{questionToEdit ? "Edit Question" : "Add New Question"}</DialogTitle>
          <DialogDescription>
            {questionToEdit 
              ? "Update the question details and options."
              : "Create a new question for your quiz."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="question"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question Text</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter the question"
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value as string || "multiple_choice"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select question type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                      <SelectItem value="true_false">True/False</SelectItem>
                      <SelectItem value="speaking">Speaking/Pronunciation</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="imageFile"
              render={({ field: { onChange, value, ...fieldProps } }) => (
                <FormItem>
                  <FormLabel>Question Image (Optional)</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      {imagePreview ? (
                        <div className="relative w-full rounded-md overflow-hidden border border-border">
                          <img
                            src={imagePreview && imagePreview.startsWith('data:') 
                              ? imagePreview // Keep data URLs as is (for newly selected files)
                              : `${window.location.origin}/api/images/${imagePreview?.split('/').pop()?.split('?')[0]}?t=${Date.now()}`}
                            alt="Question preview"
                            className="w-full h-auto max-h-[200px] object-contain"
                            onLoad={() => console.log(`Question image preview loaded from direct API: ${imagePreview}`)}
                            onError={(e) => {
                              console.log(`Failed to load from API, trying fallback: ${imagePreview}`);
                              const target = e.target as HTMLImageElement;
                              if (imagePreview && !imagePreview.startsWith('data:')) {
                                const filename = imagePreview.split('/').pop()?.split('?')[0];
                                // Try static route as backup
                                target.src = `${window.location.origin}/uploads/images/${filename}?direct=1&t=${Date.now()}`;
                              }
                            }}
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-6 w-6"
                            onClick={removeImage}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Direct file input approach */}
                          <div className="border border-dashed border-border rounded-md p-4">
                            <div className="flex items-center justify-center flex-col">
                              <Image className="h-8 w-8 text-muted-foreground mb-2" />
                              <div className="text-sm text-muted-foreground mb-3">
                                PNG, JPG or GIF up to 5MB
                              </div>

                              {/* Standard file input with styling */}
                              <Input
                                type="file"
                                accept="image/*"
                                ref={fileInputRef}
                                className="max-w-[250px] cursor-pointer file:cursor-pointer file:mr-2 
                                          file:rounded-md file:border-0 file:bg-primary 
                                          file:px-3 file:py-2 file:text-sm 
                                          file:font-medium file:text-primary-foreground
                                          hover:file:bg-primary/90 focus:outline-none"
                                onChange={(e) => {
                                  console.log("Direct file selected:", e.target.files);
                                  handleImageChange(e);
                                  onChange(e.target.files);
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Answer Options</FormLabel>
              {form.getValues("questionOptions").map((_, index) => (
                <div key={index} className="flex space-x-2">
                  <FormField
                    control={form.control}
                    name={`questionOptions.${index}.text`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input placeholder={`Option ${index + 1}`} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`questionOptions.${index}.isCorrect`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Button
                            type="button"
                            variant={field.value ? "default" : "outline"}
                            className="min-w-[80px]"
                            onClick={() => {
                              // Uncheck all other options first for single-answer questions
                              if (!field.value) {
                                const options = form.getValues("questionOptions");
                                options.forEach((_, i) => {
                                  if (i !== index) {
                                    form.setValue(`questionOptions.${i}.isCorrect`, false);
                                  }
                                });
                              }
                              field.onChange(!field.value);
                            }}
                          >
                            {field.value ? "Correct" : "Wrong"}
                          </Button>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              ))}

              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    const options = form.getValues("questionOptions");
                    form.setValue("questionOptions", [
                      ...options,
                      { text: "", isCorrect: false },
                    ], {
                      shouldDirty: true,
                      shouldTouch: true,
                      shouldValidate: true
                    });
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Option
                </Button>
                {form.getValues("questionOptions").length > 2 && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      const options = form.getValues("questionOptions");
                      // Make sure we don't overwrite other form values
                      form.setValue("questionOptions", options.slice(0, -1), {
                        shouldDirty: true,
                        shouldTouch: true,
                        shouldValidate: true
                      });
                    }}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Remove Last
                  </Button>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {questionToEdit ? "Update" : "Add"} Question
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}