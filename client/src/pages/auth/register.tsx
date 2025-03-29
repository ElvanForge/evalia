import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { extendedTeacherSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ClipboardCheck, AlertCircle, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Create schema to include plan information
const registerFormSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  subject: z.string().optional(),
  plan: z.enum(["free", "pro", "school", "beta"]).default("free"),
  betaCode: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerFormSchema>;

export default function Register() {
  const { register, isRegistering } = useAuth();
  const [location, navigate] = useLocation();
  const [plan, setPlan] = useState("free");
  const { toast } = useToast();
  
  // Set page title
  useEffect(() => {
    document.title = "Evalia - Register";
    
    // Parse the plan from the URL when the component loads
    const searchParams = new URLSearchParams(location.split('?')[1]);
    const planFromUrl = searchParams.get('plan');
    if (planFromUrl && ["free", "pro", "school", "beta"].includes(planFromUrl)) {
      setPlan(planFromUrl);
      form.setValue("plan", planFromUrl as any);
    }
  }, [location]);

  // Create form
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      email: "",
      subject: "",
      plan: "free",
      betaCode: "",
    },
  });

  // Form submission handler
  const onSubmit = async (data: RegisterFormValues) => {
    try {
      // If using a paid plan, redirect to checkout after registration
      if (data.plan === "pro" || data.plan === "school") {
        // Register user first
        await register(data);
        // Navigate to checkout
        navigate(`/checkout?plan=${data.plan}`);
        return;
      }
      
      // If beta tester, go to application form
      if (data.plan === "beta") {
        // Register the user
        await register(data);
        // Navigate to beta application
        navigate("/beta-application");
        return;
      }
      
      // Normal registration flow for free accounts
      await register(data);
      
      toast({
        title: "Registration Successful",
        description: "Welcome to Evalia! You are now logged in.",
      });
      
      navigate("/dashboard");
    } catch (error) {
      // Error handling is done in the auth provider
      console.error("Registration failed:", error);
    }
  };

  // Determine plan display information
  const planInfo = {
    free: {
      title: "Free Plan",
      description: "Create your free account to get started with basic features.",
      badge: "FREE",
      badgeColor: "bg-gray-200 text-gray-800",
    },
    pro: {
      title: "Professional Plan",
      description: "Create your account and set up your subscription for unlimited access.",
      badge: "PRO",
      badgeColor: "bg-teal-500 text-white",
    },
    school: {
      title: "School Plan",
      description: "Create your account for school-wide access and management features.",
      badge: "SCHOOL",
      badgeColor: "bg-blue-500 text-white",
    },
    beta: {
      title: "Beta Tester Program",
      description: "Create your account to apply for our beta testing program with premium features.",
      badge: "BETA",
      badgeColor: "bg-purple-500 text-white",
    },
  };

  const currentPlan = planInfo[plan as keyof typeof planInfo];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <img src="/src/assets/evalia-logo.svg" alt="Evalia Logo" className="h-16 w-16" />
          </div>
          <div className="flex items-center justify-center gap-2">
            <CardTitle className="text-2xl font-bold">Evalia</CardTitle>
            <Badge className={`${currentPlan.badgeColor}`}>{currentPlan.badge}</Badge>
          </div>
          <CardDescription>
            {currentPlan.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {plan === "beta" && (
            <Alert className="mb-4 bg-teal-50 border-teal-200">
              <Info className="h-4 w-4 text-teal-600" />
              <AlertDescription className="text-teal-700">
                After registration, you'll be asked to complete a short application for the beta program.
              </AlertDescription>
            </Alert>
          )}
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john.doe@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="johndoe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Mathematics" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Hidden plan field */}
              <input type="hidden" {...form.register("plan")} />
              
              {/* Beta code field - only shown if user has a beta code */}
              {plan === "beta" && (
                <FormField
                  control={form.control}
                  name="betaCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Beta Invitation Code (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter code if you have one" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isRegistering}
              >
                {isRegistering 
                  ? "Creating Account..." 
                  : plan === "pro" || plan === "school" 
                    ? "Continue to Payment" 
                    : plan === "beta" 
                      ? "Continue to Application" 
                      : "Create Account"
                }
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-center text-gray-500">
            Already have an account?{" "}
            <Link href="/auth/login">
              <a className="text-blue-600 hover:underline">Sign In</a>
            </Link>
          </div>
          {plan !== "free" && (
            <div className="text-sm text-center text-gray-500">
              Want a free account instead?{" "}
              <Link href="/auth/register?plan=free">
                <a className="text-blue-600 hover:underline">Sign up for free</a>
              </Link>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
