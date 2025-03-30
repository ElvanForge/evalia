import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { BadgeCheck, ShieldAlert, UserX, Loader2, Users } from "lucide-react";

// Form schema for changing beta tester status
const betaTesterStatusSchema = z.object({
  teacherId: z.number(),
  isBetaTester: z.boolean(),
});

type BetaTesterStatusFormValues = z.infer<typeof betaTesterStatusSchema>;

export default function BetaTesters() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);

  // Redirect if not admin
  if (user && user.role !== 'admin') {
    setLocation('/');
    return null;
  }

  // Fetch all teachers
  const { data: teachers, isLoading } = useQuery({
    queryKey: ['/api/teachers'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/teachers');
      if (!res.ok) throw new Error('Failed to fetch teachers');
      return await res.json();
    },
  });

  // Update beta tester status
  const updateBetaStatus = useMutation({
    mutationFn: async (values: BetaTesterStatusFormValues) => {
      const { teacherId, isBetaTester } = values;
      const res = await apiRequest('POST', `/api/admin/beta-tester`, { 
        teacherId, 
        isBetaTester 
      });
      if (!res.ok) throw new Error('Failed to update beta tester status');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teachers'] });
      toast({
        title: "Status Updated",
        description: "Beta tester status has been updated successfully",
      });
      setOpenDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handler for toggling beta tester status
  const handleUpdateStatus = (teacher: any, newStatus: boolean) => {
    updateBetaStatus.mutate({
      teacherId: teacher.id,
      isBetaTester: newStatus
    });
  };

  // Open dialog with teacher details
  const handleViewDetails = (teacher: any) => {
    setSelectedTeacher(teacher);
    setOpenDialog(true);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Beta Testers Management
          </h1>
          <p className="text-muted-foreground">
            Manage beta testers and review applications
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <span className="font-medium">
            {teachers?.filter((t: any) => t.isBetaTester).length || 0} Beta Testers
          </span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Teachers</CardTitle>
          <CardDescription>
            Manage which teachers have beta tester status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableCaption>List of all teachers in the system</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Beta Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teachers?.map((teacher: any) => (
                <TableRow key={teacher.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {teacher.firstName} {teacher.lastName}
                      {teacher.isBetaTester && (
                        <BadgeCheck className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{teacher.email}</TableCell>
                  <TableCell>{teacher.subject || 'Not specified'}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={teacher.isBetaTester}
                        onCheckedChange={(checked) => handleUpdateStatus(teacher, checked)}
                        id={`beta-status-${teacher.id}`}
                      />
                      <Label htmlFor={`beta-status-${teacher.id}`}>
                        {teacher.isBetaTester ? 'Active' : 'Inactive'}
                      </Label>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(teacher)}
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Teacher details dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Teacher Details</DialogTitle>
            <DialogDescription>
              Detailed information about the teacher
            </DialogDescription>
          </DialogHeader>
          {selectedTeacher && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium">
                    {selectedTeacher.firstName} {selectedTeacher.lastName}
                  </h3>
                  <p className="text-sm text-muted-foreground">{selectedTeacher.email}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={selectedTeacher.isBetaTester}
                    onCheckedChange={(checked) => handleUpdateStatus(selectedTeacher, checked)}
                    id="dialog-beta-status"
                  />
                  <Label htmlFor="dialog-beta-status">Beta Access</Label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Username</Label>
                  <p>{selectedTeacher.username}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Subject</Label>
                  <p>{selectedTeacher.subject || 'Not specified'}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Role</Label>
                  <p className="capitalize">{selectedTeacher.role}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Subscription</Label>
                  <p className="capitalize">{selectedTeacher.subscriptionPlan || 'Free'}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="secondary" 
              onClick={() => setOpenDialog(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}