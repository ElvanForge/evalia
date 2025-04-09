import { useState } from "react";
import Layout from "@/components/layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Class } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link } from "wouter";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PlusCircle, Pencil, Trash2, Eye } from "lucide-react";
import { ClassForm } from "@/components/forms/class-form";
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
import SectionHeader from "@/components/section-header";

export default function Classes() {
  const { toast } = useToast();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);

  // Fetch classes
  const { data: classes, isLoading } = useQuery<Class[]>({
    queryKey: ["/api/classes"],
  });

  // Delete class mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/classes/${id}`);
    },
    onSuccess: () => {
      // Invalidate multiple queries that could be affected
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/grades"] });
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      
      toast({
        title: "Class deleted",
        description: `${selectedClass?.name} has been deleted successfully.`,
      });
      setIsDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message === "Failed to fetch" 
          ? "Unable to connect to the server. Please try again."
          : `Failed to delete class: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleDeleteClick = (class_: Class) => {
    setSelectedClass(class_);
    setIsDeleteDialogOpen(true);
  };

  const handleEditClick = (class_: Class) => {
    setSelectedClass(class_);
    setIsEditDialogOpen(true);
  };

  const handleDelete = () => {
    if (selectedClass) {
      deleteMutation.mutate(selectedClass.id);
    }
  };

  const columns = [
    {
      header: "ID",
      accessorKey: "id",
    },
    {
      header: "Name",
      accessorKey: "name",
    },
    {
      header: "Description",
      accessorKey: "description",
    },
    {
      header: "Created",
      accessorKey: "createdAt",
      cell: (class_: Class) => (
        <span>{new Date(class_.createdAt).toLocaleDateString()}</span>
      ),
    },
  ];

  const actions = (class_: Class) => (
    <div className="flex space-x-2 justify-end">
      <Link href={`/classes/${class_.id}`}>
        <Button variant="ghost" size="icon">
          <Eye className="h-4 w-4" />
        </Button>
      </Link>
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => handleEditClick(class_)}
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => handleDeleteClick(class_)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );

  const addClass = (
    <Link href="/classes/new">
      <Button className="bg-[#0ba2b0] hover:bg-[#0ba2b0]/90">
        <PlusCircle className="mr-2 h-4 w-4" />
        Add Class
      </Button>
    </Link>
  );

  return (
    <Layout title="Classes">
      <div className="space-y-6">
        <SectionHeader 
          title="Classes" 
          subtitle="Manage your classroom sections"
          rightContent={addClass}
        />

        <DataTable
          data={classes || []}
          columns={columns}
          actions={actions}
          searchKey="name"
          searchPlaceholder="Search classes..."
        />

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Class</DialogTitle>
            </DialogHeader>
            {selectedClass && (
              <ClassForm
                class_={selectedClass}
                onSuccess={() => setIsEditDialogOpen(false)}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the class "{selectedClass?.name}".
                All associated assignments and grades will also be deleted.
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
}
