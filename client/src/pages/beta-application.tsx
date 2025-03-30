import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useLocation } from "wouter";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Beaker, CheckCircle, Loader2 } from "lucide-react";

// Define the schema for the beta application form
const betaApplicationSchema = z.object({
  school: z.string().min(2, "School name must be at least 2 characters"),
  role: z.string().min(2, "Role must be at least 2 characters"),
  yearsTeaching: z.string().refine(
    (val) => !isNaN(Number(val)) && Number(val) >= 0,
    { message: "Years teaching must be a valid number" }
  ),
  reasonForInterest: z
    .string()
    .min(10, "Please provide more details about your interest"),
  howHeard: z.string().min(2, "Please tell us how you heard about us"),
  agreedToTerms: z.boolean().refine((val) => val === true, {
    message: "You must agree to the terms to continue",
  }),
});

type BetaApplicationFormValues = z.infer<typeof betaApplicationSchema>;

export default function BetaApplication() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);

  // Initialize form with default values
  const form = useForm<BetaApplicationFormValues>({
    resolver: zodResolver(betaApplicationSchema),
    defaultValues: {
      school: "",
      role: "",
      yearsTeaching: "",
      reasonForInterest: "",
      howHeard: "",
      agreedToTerms: false,
    },
  });

  // Define the mutation
  const submitBetaApplication = useMutation({
    mutationFn: async (values: BetaApplicationFormValues) => {
      const response = await apiRequest(
        "POST",
        "/api/beta-application",
        values
      );
      if (!response.ok) {
        throw new Error("Failed to submit application");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Application Submitted",
        description: "Your beta application has been received. We'll be in touch soon!",
      });
      setSubmitted(true);
    },
    onError: (error: Error) => {
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function onSubmit(values: BetaApplicationFormValues) {
    submitBetaApplication.mutate(values);
  }

  // Redirect if user is not logged in
  if (user === null) {
    setLocation("/auth");
    return null;
  }

  if (submitted) {
    return (
      <div className="container max-w-3xl py-12">
        <Card>
          <CardHeader className="text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-primary mb-4" />
            <CardTitle className="text-3xl">Application Submitted!</CardTitle>
            <CardDescription className="text-lg">
              Thank you for your interest in the Evalia beta program
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p>
              We've received your application and our team will review it shortly.
              If selected, we'll upgrade your account to beta tester status which
              gives you free access to premium features.
            </p>
            <p>
              While you wait, you can continue to use Evalia's free features.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => setLocation("/dashboard")}>
              Return to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-12">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Apply for Evalia Beta Program
              </CardTitle>
              <CardDescription className="text-lg">
                Get free access to premium features by becoming a beta tester
              </CardDescription>
            </div>
            <Beaker className="h-10 w-10 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6"
            >
              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="school"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>School Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your school's name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role/Position</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Science Teacher, Principal" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="yearsTeaching"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Years Teaching</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" placeholder="e.g. 5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reasonForInterest"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Why are you interested in Evalia?</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Please share why you're interested in being a beta tester..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="howHeard"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>How did you hear about us?</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Search engine, colleague, social media" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="agreedToTerms"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        I agree to provide feedback and report issues
                      </FormLabel>
                      <FormDescription>
                        As a beta tester, you'll get free access to premium features in exchange for your feedback.
                      </FormDescription>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={submitBetaApplication.isPending}
                >
                  {submitBetaApplication.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Application"
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