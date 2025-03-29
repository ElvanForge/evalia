import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { teacherLoginSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
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
import { ClipboardCheck } from "lucide-react";

export default function Login() {
  const { login, isLoggingIn } = useAuth();
  const [, navigate] = useLocation();
  
  // Set page title
  useEffect(() => {
    document.title = "Evalia - Teacher Dashboard";
  }, []);

  // Create form
  const form = useForm<z.infer<typeof teacherLoginSchema>>({
    resolver: zodResolver(teacherLoginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Form submission handler
  const onSubmit = async (data: z.infer<typeof teacherLoginSchema>) => {
    try {
      await login(data);
      navigate("/");
    } catch (error) {
      // Error handling is done in the auth provider
      console.error("Login failed:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <img src="/src/assets/evalia-logo.svg" alt="Evalia Logo" className="h-16 w-16" />
          </div>
          <CardTitle className="text-2xl font-bold">Evalia</CardTitle>
          <CardDescription>
            Enter your credentials to sign in to your Evalia teacher account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your username" {...field} />
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
                      <Input type="password" placeholder="Enter your password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoggingIn}
              >
                {isLoggingIn ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-center text-gray-500">
            Don't have an account?{" "}
            <Link href="/auth/register">
              <span className="text-blue-600 hover:underline cursor-pointer">Register</span>
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
