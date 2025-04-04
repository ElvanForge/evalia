import { useState } from "react";
import Layout from "@/components/layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Student } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PlusCircle, Pencil, Trash2 } from "lucide-react";
import { StudentForm } from "@/components/forms/student-form";
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

export default function Students() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Fetch students
  const { data: students, isLoading } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  // Delete student mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/students/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({
        title: "Success",
        description: "Student deleted successfully",
      });
      setIsDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to delete student: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleDeleteClick = (student: Student) => {
    setSelectedStudent(student);
    setIsDeleteDialogOpen(true);
  };

  const handleEditClick = (student: Student) => {
    setSelectedStudent(student);
    setIsEditDialogOpen(true);
  };

  const handleDelete = () => {
    if (selectedStudent) {
      deleteMutation.mutate(selectedStudent.id);
    }
  };

  const columns = [
    {
      header: "ID",
      accessorKey: "id",
    },
    {
      header: "First Name",
      accessorKey: "firstName",
    },
    {
      header: "Last Name",
      accessorKey: "lastName",
    },
    {
      header: "Email",
      accessorKey: "email",
    },
    {
      header: "Grade Level",
      accessorKey: "gradeLevel",
    },
  ];

  const actions = (student: Student) => (
    <div className="flex space-x-2 justify-end">
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => handleEditClick(student)}
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => handleDeleteClick(student)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );

  const addButton = (
    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#0ba2b0] hover:bg-[#0ba2b0]/90">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Student
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Student</DialogTitle>
        </DialogHeader>
        <StudentForm onSuccess={() => setIsAddDialogOpen(false)} />
      </DialogContent>
    </Dialog>
  );

  return (
    <Layout title="Students">
      <div className="space-y-6">
        <SectionHeader 
          title="Students" 
          subtitle="Manage all your students"
          rightContent={addButton}
        />

        <DataTable
          data={students || []}
          columns={columns}
          actions={actions}
          searchKey="lastName"
          searchPlaceholder="Search students..."
        />

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Student</DialogTitle>
            </DialogHeader>
            {selectedStudent && (
              <StudentForm
                student={selectedStudent}
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
                This will permanently delete {selectedStudent?.firstName} {selectedStudent?.lastName}. 
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
