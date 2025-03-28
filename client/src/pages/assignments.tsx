import { useState } from "react";
import Layout from "@/components/layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Assignment, Class } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PlusCircle, Pencil, Trash2 } from "lucide-react";
import { AssignmentForm } from "@/components/forms/assignment-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Assignments() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string>("all");

  // Fetch classes
  const { data: classes, isLoading: isClassesLoading } = useQuery<Class[]>({
    queryKey: ["/api/classes"],
  });

  // Fetch assignments
  const { data: assignments, isLoading: isAssignmentsLoading } = useQuery<Assignment[]>({
    queryKey: [selectedClassId === "all" ? "/api/assignments" : `/api/assignments?classId=${selectedClassId}`],
    enabled: !isClassesLoading,
  });

  // Delete assignment mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/assignments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
      toast({
        title: "Success",
        description: "Assignment deleted successfully",
      });
      setIsDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to delete assignment: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleDeleteClick = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setIsDeleteDialogOpen(true);
  };

  const handleEditClick = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setIsEditDialogOpen(true);
  };

  const handleDelete = () => {
    if (selectedAssignment) {
      deleteMutation.mutate(selectedAssignment.id);
    }
  };

  const columns = [
    {
      header: "Name",
      accessorKey: "name",
    },
    {
      header: "Class",
      accessorKey: "classId",
      cell: (assignment: Assignment) => {
        const class_ = classes?.find(c => c.id === assignment.classId);
        return class_ ? class_.name : `Class ID: ${assignment.classId}`;
      }
    },
    {
      header: "Type",
      accessorKey: "type",
    },
    {
      header: "Max Score",
      accessorKey: "maxScore",
    },
    {
      header: "Weight",
      accessorKey: "weight",
      cell: (assignment: Assignment) => <span>{assignment.weight}%</span>,
    },
    {
      header: "Due Date",
      accessorKey: "dueDate",
      cell: (assignment: Assignment) => assignment.dueDate ? (
        <span>{new Date(assignment.dueDate).toLocaleDateString()}</span>
      ) : (
        <span>N/A</span>
      ),
    },
  ];

  const actions = (assignment: Assignment) => (
    <div className="flex space-x-2 justify-end">
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => handleEditClick(assignment)}
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => handleDeleteClick(assignment)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );

  const isLoading = isClassesLoading || isAssignmentsLoading;

  return (
    <Layout title="Assignments">
      <div className="mt-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="w-full sm:w-auto">
            <Select 
              value={selectedClassId} 
              onValueChange={setSelectedClassId}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes?.map((class_) => (
                  <SelectItem key={class_.id} value={class_.id.toString()}>
                    {class_.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Assignment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Assignment</DialogTitle>
              </DialogHeader>
              <AssignmentForm 
                onSuccess={() => setIsAddDialogOpen(false)}
                defaultClassId={selectedClassId !== "all" ? parseInt(selectedClassId) : undefined}
              />
            </DialogContent>
          </Dialog>
        </div>

        <DataTable
          data={assignments || []}
          columns={columns}
          actions={actions}
          searchKey="name"
          searchPlaceholder="Search assignments..."
        />

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Assignment</DialogTitle>
            </DialogHeader>
            {selectedAssignment && (
              <AssignmentForm
                assignment={selectedAssignment}
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
                This will permanently delete the assignment "{selectedAssignment?.name}".
                All associated grades will also be deleted.
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
