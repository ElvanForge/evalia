import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Image, X, Loader2, Plus } from "lucide-react";
import { getImageProps } from "@/lib/image-utils";
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

const QuestionFormSchema = insertQuizQuestionSchema.extend({
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
  
  const form = useForm<FormValues>({
    resolver: zodResolver(QuestionFormSchema),
    defaultValues: {
      quizId,
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
      // If an image file was uploaded, we need to handle it
      if (data.imageFile && data.imageFile.length > 0) {
        const file = data.imageFile[0];
        const formData = new FormData();
        formData.append("image", file);

        console.log("Uploading image file:", file.name, file.type, file.size);
        
        try {
          // Upload the image
          const uploadResponse = await fetch("/api/upload/image", {
            method: "POST",
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
            console.log("Image upload result:", uploadResult);
            imageUrl = uploadResult.imageUrl;
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
      } else if (imagePreview && imagePreview.startsWith('/uploads/')) {
        // If we still have an image preview that's an actual file path and not a data URL
        // (from a previously uploaded file), keep it
        console.log("Keeping existing image URL from uploads:", imagePreview);
        imageUrl = imagePreview;
      } else if (questionToEdit?.imageUrl) {
        // If editing a question that already has an image URL
        console.log("Keeping existing image URL from question:", questionToEdit.imageUrl);
        imageUrl = questionToEdit.imageUrl;
      } else {
        // No image preview and no file uploaded, set to null
        console.log("No image to use");
        imageUrl = null;
      }

      // Prepare the question data
      const questionData: InsertQuizQuestion = {
        quizId: data.quizId,
        question: data.question,
        type: data.type,
        imageUrl: imageUrl,
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
            // Try to fetch existing options using the newer endpoint
            let existingOptions = [];
            const optionsResponse = await fetch(`/api/quiz-questions/${question.id}/options`);
            
            if (optionsResponse.ok) {
              existingOptions = await optionsResponse.json();
              console.log("Existing options from API:", existingOptions);
              
              if (existingOptions.length > 0) {
                console.log(`Deleting ${existingOptions.length} existing options for question ${question.id}`);
                
                // Delete each existing option
                for (const option of existingOptions) {
                  console.log(`Deleting option ${option.id}: ${option.text}`);
                  const deleteResponse = await fetch(`/api/quiz-options/${option.id}`, {
                    method: "DELETE",
                  });
                  
                  if (!deleteResponse.ok) {
                    console.error(`Failed to delete option ${option.id}:`, await deleteResponse.text());
                  } else {
                    console.log(`Successfully deleted option ${option.id}`);
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
        setImagePreview(e.target?.result as string);
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
      form.reset({
        quizId,
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
                            {...getImageProps({
                              src: imagePreview || '',
                              alt: "Question preview",
                              className: "w-full h-auto max-h-[200px] object-contain"
                            })}
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
                        <div className="border border-dashed border-border rounded-md p-4 text-center">
                          <Image className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                          <div className="text-sm text-muted-foreground mb-2">
                            PNG, JPG or GIF up to 5MB
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Select Image
                          </Button>
                          <Input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={(e) => {
                              handleImageChange(e);
                              onChange(e.target.files);
                            }}
                          />
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