import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import AssignmentForm from "@/components/forms/AssignmentForm";
import { Assignment } from "@shared/schema";

export default function EditAssignment() {
  const [match, params] = useRoute<{ id: string }>("/assignments/:id/edit");
  const [, navigate] = useLocation();
  const assignmentId = parseInt(params?.id || "0");
  
  // Fetch assignment details
  const { data: assignment, isLoading, isError } = useQuery<Assignment>({
    queryKey: ['/api/assignments', assignmentId],
    enabled: assignmentId > 0,
  });

  if (isLoading) {
    return (
      <Layout title="Edit Assignment">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (isError || !assignment) {
    return (
      <Layout title="Edit Assignment">
        <div className="text-center p-8">
          <h3 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">Assignment not found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">The assignment you're trying to edit doesn't exist or you don't have permission to edit it.</p>
          <Button onClick={() => navigate('/assignments')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Assignments
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`Edit ${assignment.name}`}>
      <div className="mb-6">
        <Button 
          variant="outline" 
          onClick={() => navigate(`/assignments/${assignmentId}`)} 
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Assignment
        </Button>
        
        <h1 className="text-2xl font-bold text-primary">Edit Assignment</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Assignment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <AssignmentForm 
            assignment={assignment} 
            onSuccess={() => navigate(`/assignments/${assignmentId}`)}
          />
        </CardContent>
      </Card>
    </Layout>
  );
}