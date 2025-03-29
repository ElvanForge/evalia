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
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      toast({
        title: "Success",
        description: "Class deleted successfully",
      });
      setIsDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to delete class: ${error.message}`,
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

  return (
    <Layout title="Classes">
      <div className="mt-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-medium">All Classes</h2>
          <Link href="/classes/new">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Class
            </Button>
          </Link>
        </div>

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
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}
