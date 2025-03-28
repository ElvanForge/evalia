import React, { createContext, useContext, ReactNode } from "react";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Teacher, TeacherLogin } from "@shared/schema";

interface AuthContextType {
  user: Teacher | null;
  login: (credentials: TeacherLogin) => Promise<void>;
  logout: () => Promise<void>;
  register: (teacherData: any) => Promise<void>;
  isLoading: boolean;
  isRegistering: boolean;
  isLoggingIn: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => {},
  logout: async () => {},
  register: async () => {},
  isLoading: false,
  isRegistering: false,
  isLoggingIn: false,
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Get current authenticated user
  const {
    data: user,
    isLoading,
  } = useQuery<Teacher | null>({
    queryKey: ["/api/auth/me"],
    queryFn: async ({ queryKey }) => {
      try {
        const res = await fetch(queryKey[0] as string, {
          credentials: "include",
        });
        
        if (res.status === 401) {
          return null;
        }
        
        if (!res.ok) {
          throw new Error("Failed to fetch user");
        }
        
        return await res.json();
      } catch (error) {
        console.error("Error fetching current user:", error);
        return null;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: TeacherLogin) => {
      const res = await apiRequest("POST", "/api/auth/login", credentials);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Success",
        description: "You have been logged in",
      });
      navigate("/");
    },
    onError: (error: any) => {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid username or password",
        variant: "destructive",
      });
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (teacherData: any) => {
      const res = await apiRequest("POST", "/api/auth/register", teacherData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Account Created",
        description: "Your account has been created successfully",
      });
      navigate("/");
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Could not create your account",
        variant: "destructive",
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/logout", {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.clear();
      toast({
        title: "Logged Out",
        description: "You have been logged out successfully",
      });
      navigate("/auth/login");
    },
    onError: (error: any) => {
      toast({
        title: "Logout Failed",
        description: error.message || "Could not log out",
        variant: "destructive",
      });
    },
  });

  // Auth functions
  const login = async (credentials: TeacherLogin) => {
    await loginMutation.mutateAsync(credentials);
  };

  const register = async (teacherData: any) => {
    await registerMutation.mutateAsync(teacherData);
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  const value = {
    user,
    login,
    logout,
    register,
    isLoading,
    isRegistering: registerMutation.isPending,
    isLoggingIn: loginMutation.isPending,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);