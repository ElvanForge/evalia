import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Plus, Loader2, BookText, Edit, Play, PlusCircle, Clock, Users, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Layout from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { Quiz } from "@shared/schema";
import SectionHeader from "@/components/section-header";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
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

const QuizzesPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);

  const {
    data: quizzes,
    isLoading,
    error,
  } = useQuery<Quiz[]>({
    queryKey: ["/api/quizzes"],
    enabled: !!user,
  });
  
  // Delete quiz mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/quizzes/${id}`);
    },
    onSuccess: () => {
      // Invalidate multiple queries that could be affected
      queryClient.invalidateQueries({ queryKey: ["/api/quizzes"] });
      
      toast({
        title: "Quiz deleted",
        description: `${selectedQuiz?.title} has been deleted successfully.`,
      });
      setIsDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message === "Failed to fetch" 
          ? "Unable to connect to the server. Please try again."
          : `Failed to delete quiz: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const handleDeleteClick = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setIsDeleteDialogOpen(true);
  };
  
  const handleDelete = () => {
    if (selectedQuiz) {
      deleteMutation.mutate(selectedQuiz.id);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Layout title="Quizzes">
      <div className="space-y-6">
        <SectionHeader
          title="Quizzes"
          subtitle="Create and manage your quizzes"
          rightContent={
            <Button 
              className="bg-[#0ba2b0] hover:bg-[#0ba2b0]/90 text-white" 
              onClick={() => setLocation("/quizzes/new")}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Quiz
            </Button>
          }
        />

        {isLoading ? (
          <div className="flex justify-center my-12">
            <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-destructive">Failed to load quizzes</div>
        ) : !quizzes?.length ? (
          <Card className="border-dashed">
            <CardContent className="pt-6 text-center">
              <div className="flex flex-col items-center justify-center py-8">
                <BookText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No quizzes yet</h3>
                <p className="text-muted-foreground mt-1 mb-4">Get started by creating your first quiz</p>
                <Button onClick={() => setLocation("/quizzes/new")}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Quiz
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {quizzes.map((quiz) => (
              <Card key={quiz.id} className="overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <CardTitle className="line-clamp-1">{quiz.title}</CardTitle>
                    <Badge variant={quiz.isActive ? "secondary" : "outline"}>
                      {quiz.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {quiz.description || "No description provided"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="flex gap-3 text-sm text-muted-foreground">
                    {quiz.timeLimit && (
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {quiz.timeLimit} min
                      </div>
                    )}
                    {quiz.classId && (
                      <div className="flex items-center">
                        <BookText className="h-4 w-4 mr-1" />
                        Class assigned
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-2 pt-0">
                  <div className="flex gap-2 w-full">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                      onClick={() => setLocation(`/quizzes/${quiz.id}`)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => setLocation(`/quizzes/${quiz.id}/preview`)}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                  </div>
                  <div className="flex gap-2 w-full">
                    <Button
                      variant="outline"
                      size="sm" 
                      className="flex-1"
                      onClick={() => setLocation(`/quizzes/${quiz.id}/preview?admin=true`)}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Administer Quiz
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-none text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteClick(quiz)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
        
        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the quiz "{selectedQuiz?.title}".
                All associated questions, options, and student submissions will also be deleted.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <>
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-t-transparent border-current"></div>
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default QuizzesPage;