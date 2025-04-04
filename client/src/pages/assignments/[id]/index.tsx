import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import Layout from "@/components/Layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pencil, Trash2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AssignmentForm from "@/components/forms/AssignmentForm";
import { Assignment, Grade } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

export default function AssignmentDetail() {
  const [match, params] = useRoute<{ id: string }>("/assignments/:id");
  const [, navigate] = useLocation();
  const assignmentId = parseInt(params?.id || "0");
  const { toast } = useToast();
  const { user } = useAuth();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  
  // Fetch assignment details
  const { data: assignment, isLoading, isError } = useQuery<Assignment>({
    queryKey: ['/api/assignments', assignmentId],
    enabled: assignmentId > 0,
  });

  // Fetch class to get className
  const { data: classInfo } = useQuery({
    queryKey: ['/api/classes', assignment?.classId],
    enabled: !!assignment?.classId,
  });

  // Fetch grades for this assignment
  const { data: grades, isLoading: isLoadingGrades } = useQuery<Grade[]>({
    queryKey: ['/api/assignments', assignmentId, 'grades'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/assignments/${assignmentId}/grades`);
      return response.json();
    },
    enabled: assignmentId > 0,
  });

  // Delete assignment mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('DELETE', `/api/assignments/${assignmentId}`);
    },
    onSuccess: () => {
      toast({
        title: "Assignment deleted",
        description: "The assignment has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/assignments'] });
      navigate('/assignments');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete assignment. Please try again.",
        variant: "destructive",
      });
      console.error(error);
    }
  });

  const handleDelete = () => {
    deleteMutation.mutate();
    setShowDeleteDialog(false);
  };

  if (isLoading) {
    return (
      <Layout title="Assignment" currentUser={user}>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (isError || !assignment) {
    return (
      <Layout title="Assignment" currentUser={user}>
        <div className="text-center p-8">
          <h3 className="text-xl font-medium mb-2">Assignment not found</h3>
          <p className="text-muted-foreground mb-4">The assignment you're looking for doesn't exist or you don't have permission to view it.</p>
          <Button onClick={() => navigate('/assignments')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Assignments
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={assignment.name} currentUser={user}>
      <div className="mb-6">
        <Button variant="outline" onClick={() => navigate('/assignments')} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Assignments
        </Button>
        
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <h1 className="text-2xl font-bold">{assignment.name}</h1>
          
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={() => navigate(`/assignments/${assignmentId}/edit`)}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button variant="outline" onClick={() => setShowDeleteDialog(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 order-2 md:order-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Assignment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Class</p>
                <p className="font-medium">{classInfo?.name || 'Unknown Class'}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <p className="font-medium">{assignment.type || 'Not specified'}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Due Date</p>
                <p className="font-medium">
                  {assignment.dueDate 
                    ? format(new Date(assignment.dueDate), 'MMMM d, yyyy') 
                    : 'No due date'}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Weight</p>
                <p className="font-medium">{assignment.weight || 0}%</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Maximum Points</p>
                <p className="font-medium">{assignment.maxPoints || 100}</p>
              </div>
              
              <Separator className="my-4" />
              
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium">
                  {assignment.createdAt 
                    ? format(new Date(assignment.createdAt), 'MMMM d, yyyy') 
                    : 'Unknown'}
                </p>
              </div>
              
              {assignment.updatedAt && (
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="font-medium">
                    {format(new Date(assignment.updatedAt), 'MMMM d, yyyy')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {assignment.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">
                  {assignment.description}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
        
        <div className="col-span-1 md:col-span-2 order-1 md:order-2">
          <Tabs defaultValue="grades">
            <TabsList className="w-full">
              <TabsTrigger value="grades" className="flex-1">Grades</TabsTrigger>
              <TabsTrigger value="statistics" className="flex-1">Statistics</TabsTrigger>
            </TabsList>
            
            <TabsContent value="grades">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Student Grades</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingGrades ? (
                    <div className="flex justify-center p-6">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : grades && grades.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b text-left text-sm">
                            <th className="pb-2 font-medium">Student</th>
                            <th className="pb-2 font-medium">Score</th>
                            <th className="pb-2 font-medium">Letter Grade</th>
                            <th className="pb-2 font-medium">Submission Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {grades.map((grade) => (
                            <tr key={grade.id} className="border-b border-border">
                              <td className="py-3">{grade.studentName}</td>
                              <td className="py-3">{grade.score !== null ? grade.score : 'Not graded'}</td>
                              <td className="py-3">{grade.letterGrade || '-'}</td>
                              <td className="py-3">
                                {grade.submittedAt 
                                  ? format(new Date(grade.submittedAt), 'MMM d, yyyy') 
                                  : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center p-6 text-muted-foreground">
                      <p>No grades available for this assignment yet.</p>
                      <Button className="mt-4" onClick={() => navigate(`/classes/${assignment.classId}?assignment=${assignmentId}`)}>
                        Enter Grades
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="statistics">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Grade Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  {grades && grades.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-primary/10 p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">Class Average</p>
                        <p className="text-2xl font-bold text-primary">
                          {grades.filter(g => g.score !== null).length > 0 
                            ? (grades.reduce((acc, grade) => acc + (grade.score || 0), 0) / 
                              grades.filter(g => g.score !== null).length).toFixed(1)
                            : 'N/A'}
                        </p>
                      </div>
                      
                      <div className="bg-primary/10 p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">Highest Score</p>
                        <p className="text-2xl font-bold text-primary">
                          {grades.filter(g => g.score !== null).length > 0 
                            ? Math.max(...grades.map(g => g.score || 0))
                            : 'N/A'}
                        </p>
                      </div>
                      
                      <div className="bg-primary/10 p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">Lowest Score</p>
                        <p className="text-2xl font-bold text-primary">
                          {grades.filter(g => g.score !== null).length > 0 
                            ? Math.min(...grades.filter(g => g.score !== null).map(g => g.score || 0))
                            : 'N/A'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-6 text-muted-foreground">
                      <p>No statistics available. Add grades to see statistics.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Assignment</DialogTitle>
          </DialogHeader>
          <AssignmentForm 
            assignment={assignment} 
            onSuccess={() => {
              setShowEditDialog(false);
              queryClient.invalidateQueries({ queryKey: ['/api/assignments', assignmentId] });
            }}
          />
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the assignment "{assignment.name}" and all associated grades.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 text-white hover:bg-red-700">
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}