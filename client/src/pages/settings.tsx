import { useState } from "react";
import Layout from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { GradeScale, GradeScaleEntry } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import SectionHeader from "@/components/section-header";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PlusCircle, Pencil, Trash2, CreditCard, Check, AlertCircle, Settings as SettingsIcon } from "lucide-react";
import { GradeScaleForm } from "@/components/forms/grade-scale-form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAddGradeScaleOpen, setIsAddGradeScaleOpen] = useState(false);
  const [isEditGradeScaleOpen, setIsEditGradeScaleOpen] = useState(false);
  const [isDeleteGradeScaleOpen, setIsDeleteGradeScaleOpen] = useState(false);
  const [selectedGradeScale, setSelectedGradeScale] = useState<GradeScale | null>(null);

  // Profile update form schema
  const profileFormSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email address"),
    subject: z.string().optional(),
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "Password must be at least 6 characters").optional(),
    confirmPassword: z.string().optional(),
  }).refine(data => !data.newPassword || data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

  // Fetch teacher profile
  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ["/api/auth/me"],
  });

  // Profile form
  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: profile?.firstName || "",
      lastName: profile?.lastName || "",
      email: profile?.email || "",
      subject: profile?.subject || "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Update profile when data is loaded
  useState(() => {
    if (profile) {
      profileForm.reset({
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        subject: profile.subject || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    }
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: z.infer<typeof profileFormSchema>) => {
      const payload = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        subject: data.subject,
        password: data.newPassword || undefined,
      };
      
      await apiRequest("PUT", `/api/teachers/${profile.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
      profileForm.reset({
        ...profileForm.getValues(),
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const onProfileSubmit = (data: z.infer<typeof profileFormSchema>) => {
    updateProfileMutation.mutateAsync(data);
  };

  // Fetch grade scales
  const { data: gradeScales, isLoading: isGradeScalesLoading } = useQuery<GradeScale[]>({
    queryKey: ["/api/grade-scales"],
  });

  // Delete grade scale mutation
  const deleteGradeScaleMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/grade-scales/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grade-scales"] });
      toast({
        title: "Success",
        description: "Grade scale deleted successfully",
      });
      setIsDeleteGradeScaleOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to delete grade scale: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleDeleteGradeScale = () => {
    if (selectedGradeScale) {
      deleteGradeScaleMutation.mutate(selectedGradeScale.id);
    }
  };

  // Grade scale columns
  const gradeScaleColumns = [
    {
      header: "Name",
      accessorKey: "name",
    },
    {
      header: "Default",
      accessorKey: "isDefault",
      cell: (scale: GradeScale) => (
        <span>{scale.isDefault ? "Yes" : "No"}</span>
      ),
    },
  ];

  const gradeScaleActions = (scale: GradeScale) => (
    <div className="flex space-x-2 justify-end">
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => {
          setSelectedGradeScale(scale);
          setIsEditGradeScaleOpen(true);
        }}
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => {
          setSelectedGradeScale(scale);
          setIsDeleteGradeScaleOpen(true);
        }}
        disabled={scale.isDefault}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );

  // Fetch grade scale entries
  const { data: gradeScaleEntries, isLoading: isEntriesLoading } = useQuery<GradeScaleEntry[]>({
    queryKey: [`/api/grade-scales/${selectedGradeScale?.id}/entries`],
    enabled: !!selectedGradeScale,
  });

  return (
    <Layout title="Settings">
      <div className="space-y-6">
        <SectionHeader
          title="Settings"
          subtitle="Manage your account settings and preferences"
          rightContent={
            <Button 
              className="bg-[#0ba2b0] hover:bg-[#0ba2b0]/90 text-white"
              onClick={() => {
                const activeTab = document.querySelector('[role="tab"][data-state="active"]');
                if (activeTab) {
                  toast({
                    title: "Settings",
                    description: `Current section: ${activeTab.textContent}`,
                  });
                }
              }}
            >
              <SettingsIcon className="mr-2 h-4 w-4" />
              Help
            </Button>
          }
        />
        <Tabs defaultValue="profile">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
            <TabsTrigger value="grading">Grading Scales</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Your Profile</CardTitle>
                <CardDescription>Update your personal information and password</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={profileForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={profileForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={profileForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subject</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="pt-4 border-t">
                      <h3 className="text-lg font-medium mb-4">Change Password</h3>
                      
                      <FormField
                        control={profileForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Password</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <FormField
                          control={profileForm.control}
                          name="newPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>New Password</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={profileForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirm New Password</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end mt-6">
                      <Button 
                        type="submit" 
                        disabled={updateProfileMutation.isPending}
                      >
                        {updateProfileMutation.isPending ? "Updating..." : "Update Profile"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="subscription" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Subscription Management</CardTitle>
                <CardDescription>View and manage your subscription plan</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Current Plan</h3>
                    
                    <div className="flex items-center p-4 border rounded-lg">
                      <div className="mr-4">
                        {user?.subscriptionStatus === 'active' ? (
                          <Check className="h-8 w-8 text-green-500" />
                        ) : user?.isBetaTester ? (
                          <Check className="h-8 w-8 text-blue-500" />
                        ) : (
                          <AlertCircle className="h-8 w-8 text-amber-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-base font-semibold">
                            {user?.subscriptionPlan === 'free' && 'Free Plan'}
                            {user?.subscriptionPlan === 'pro' && 'Pro Plan'}
                            {user?.subscriptionPlan === 'school' && 'School Plan'}
                            {!user?.subscriptionPlan && 'No Plan'}
                          </h4>
                          <Badge 
                            className={`${
                              user?.subscriptionStatus === 'active' ? 'bg-green-600' : 
                              user?.isBetaTester ? 'bg-blue-600' : 'bg-amber-600'
                            }`}
                          >
                            {user?.subscriptionStatus === 'active' ? 'Active' : 
                             user?.isBetaTester ? 'Beta Tester' : 'Inactive'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {user?.isBetaTester && "You have free access as a beta tester."}
                          {user?.subscriptionStatus === 'active' && !user?.isBetaTester && "Your subscription is active and will renew automatically."}
                          {user?.subscriptionStatus !== 'active' && !user?.isBetaTester && "Your subscription is not active. Subscribe to access premium features."}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h3 className="text-lg font-medium mb-4">Available Plans</h3>
                    
                    <div className="grid gap-4 md:grid-cols-3">
                      {/* Free Plan */}
                      <Card className="border-2 hover:border-primary/50">
                        <CardHeader>
                          <CardTitle>Free</CardTitle>
                          <CardDescription>Basic features for individual teachers</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold mb-2">$0</div>
                          <ul className="space-y-2 mb-6">
                            <li className="flex items-center">
                              <Check className="h-4 w-4 mr-2 text-green-500" />
                              <span className="text-sm">Up to 2 classes</span>
                            </li>
                            <li className="flex items-center">
                              <Check className="h-4 w-4 mr-2 text-green-500" />
                              <span className="text-sm">Up to 30 students</span>
                            </li>
                            <li className="flex items-center">
                              <Check className="h-4 w-4 mr-2 text-green-500" />
                              <span className="text-sm">Basic grade tracking</span>
                            </li>
                          </ul>
                          {user?.subscriptionPlan === 'free' ? (
                            <Button disabled className="w-full">Current Plan</Button>
                          ) : (
                            <Button variant="outline" className="w-full" asChild>
                              <Link to="/subscribe/free">Select</Link>
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                      
                      {/* Pro Plan */}
                      <Card className="border-2 border-primary">
                        <CardHeader className="bg-primary/5">
                          <CardTitle>Pro</CardTitle>
                          <CardDescription>Advanced features for power users</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold mb-2">$9.99<span className="text-sm font-normal">/month</span></div>
                          <ul className="space-y-2 mb-6">
                            <li className="flex items-center">
                              <Check className="h-4 w-4 mr-2 text-green-500" />
                              <span className="text-sm">Unlimited classes</span>
                            </li>
                            <li className="flex items-center">
                              <Check className="h-4 w-4 mr-2 text-green-500" />
                              <span className="text-sm">Up to 300 students</span>
                            </li>
                            <li className="flex items-center">
                              <Check className="h-4 w-4 mr-2 text-green-500" />
                              <span className="text-sm">Advanced analytics</span>
                            </li>
                            <li className="flex items-center">
                              <Check className="h-4 w-4 mr-2 text-green-500" />
                              <span className="text-sm">Quiz creation</span>
                            </li>
                          </ul>
                          {user?.subscriptionPlan === 'pro' ? (
                            <Button disabled className="w-full">Current Plan</Button>
                          ) : (
                            <Button className="w-full" asChild>
                              <Link to="/subscribe/pro">Subscribe</Link>
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                      
                      {/* School Plan */}
                      <Card className="border-2 hover:border-primary/50">
                        <CardHeader>
                          <CardTitle>School</CardTitle>
                          <CardDescription>For educational institutions</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold mb-2">$49.99<span className="text-sm font-normal">/month</span></div>
                          <ul className="space-y-2 mb-6">
                            <li className="flex items-center">
                              <Check className="h-4 w-4 mr-2 text-green-500" />
                              <span className="text-sm">Unlimited classes and students</span>
                            </li>
                            <li className="flex items-center">
                              <Check className="h-4 w-4 mr-2 text-green-500" />
                              <span className="text-sm">School management dashboard</span>
                            </li>
                            <li className="flex items-center">
                              <Check className="h-4 w-4 mr-2 text-green-500" />
                              <span className="text-sm">Administrative tools</span>
                            </li>
                            <li className="flex items-center">
                              <Check className="h-4 w-4 mr-2 text-green-500" />
                              <span className="text-sm">Priority support</span>
                            </li>
                          </ul>
                          {user?.subscriptionPlan === 'school' ? (
                            <Button disabled className="w-full">Current Plan</Button>
                          ) : (
                            <Button variant="outline" className="w-full" asChild>
                              <Link to="/subscribe/school">Subscribe</Link>
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                  
                  {user?.subscriptionStatus === 'active' && (
                    <div className="flex justify-end border-t pt-4">
                      <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                        Cancel Subscription
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="grading" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Grade Scales</CardTitle>
                <CardDescription>Manage your grading scales for letter grade conversion</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Your Grade Scales</h3>
                  <Dialog open={isAddGradeScaleOpen} onOpenChange={setIsAddGradeScaleOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Grade Scale
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Grade Scale</DialogTitle>
                      </DialogHeader>
                      <GradeScaleForm onSuccess={() => setIsAddGradeScaleOpen(false)} />
                    </DialogContent>
                  </Dialog>
                </div>

                <DataTable
                  data={gradeScales || []}
                  columns={gradeScaleColumns}
                  actions={gradeScaleActions}
                  searchKey="name"
                  searchPlaceholder="Search grade scales..."
                />

                {/* Edit Grade Scale Dialog */}
                <Dialog open={isEditGradeScaleOpen} onOpenChange={setIsEditGradeScaleOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Grade Scale</DialogTitle>
                    </DialogHeader>
                    {selectedGradeScale && (
                      <GradeScaleForm 
                        gradeScale={selectedGradeScale} 
                        onSuccess={() => setIsEditGradeScaleOpen(false)} 
                      />
                    )}
                  </DialogContent>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <AlertDialog open={isDeleteGradeScaleOpen} onOpenChange={setIsDeleteGradeScaleOpen}>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete the grade scale "{selectedGradeScale?.name}".
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteGradeScale}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
