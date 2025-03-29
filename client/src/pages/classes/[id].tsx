import { useEffect, useState } from "react";
import { useRoute, Link } from "wouter";
import Layout from "@/components/layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Class, Student, Assignment, Grade } from "@shared/schema";
import { DataTable } from "@/components/ui/data-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { GradeBadge } from "@/components/ui/grade-badge";
import { percentageToLetterGrade } from "@/lib/grade-utils";
import { PlusCircle, Pencil, Trash2, FileText, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { StudentForm } from "@/components/forms/student-form";
import { AssignmentForm } from "@/components/forms/assignment-form";
import { GradeForm } from "@/components/forms/grade-form";

export default function ClassDetail() {
  const [, params] = useRoute("/classes/:id");
  const classId = params ? parseInt(params.id) : 0;
  const { toast } = useToast();
  
  const [addStudentDialog, setAddStudentDialog] = useState(false);
  const [addAssignmentDialog, setAddAssignmentDialog] = useState(false);
  const [addGradeDialog, setAddGradeDialog] = useState(false);
  const [editAssignmentDialog, setEditAssignmentDialog] = useState(false);
  const [deleteAssignmentDialog, setDeleteAssignmentDialog] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Fetch class details
  const { data: classData, isLoading: isClassLoading } = useQuery<Class>({
    queryKey: [`/api/classes/${classId}`],
    enabled: !!classId,
  });

  // Fetch students in class
  const { data: students, isLoading: isStudentsLoading } = useQuery<Student[]>({
    queryKey: [`/api/classes/${classId}/students`],
    enabled: !!classId,
    onSuccess: (data) => {
      console.log("Students fetched successfully:", data);
    },
    onError: (error) => {
      console.error("Error fetching students:", error);
    }
  });

  // Fetch assignments for class
  const { data: assignments, isLoading: isAssignmentsLoading } = useQuery<Assignment[]>({
    queryKey: [`/api/assignments?classId=${classId}`],
    enabled: !!classId,
  });

  // Fetch grades for class
  const { data: grades, isLoading: isGradesLoading } = useQuery<Grade[]>({
    queryKey: [`/api/grades?classId=${classId}`],
    enabled: !!classId,
  });

  // Delete assignment mutation
  const deleteAssignmentMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/assignments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/assignments?classId=${classId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/grades?classId=${classId}`] });
      toast({
        title: "Success",
        description: "Assignment deleted successfully",
      });
      setDeleteAssignmentDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to delete assignment: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleDeleteAssignment = () => {
    if (selectedAssignment) {
      deleteAssignmentMutation.mutate(selectedAssignment.id);
    }
  };

  // Student columns for DataTable
  const studentColumns = [
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
      cell: (student: Student) => {
        return student.lastName || "—";
      }
    },
    {
      header: "Student #",
      accessorKey: "studentNumber",
      cell: (student: Student) => {
        return student.studentNumber || "—";
      }
    },
    {
      header: "Email",
      accessorKey: "email",
      cell: (student: Student) => {
        return student.email || "—";
      }
    },
    {
      header: "Grade Level",
      accessorKey: "gradeLevel",
      cell: (student: Student) => {
        return student.gradeLevel || "—";
      }
    },
  ];

  // Assignment columns for DataTable
  const assignmentColumns = [
    {
      header: "Name",
      accessorKey: "name",
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

  const assignmentActions = (assignment: Assignment) => (
    <div className="flex space-x-2 justify-end">
      <Button 
        variant="ghost" 
        size="icon"
        onClick={() => {
          setSelectedAssignment(assignment);
          setAddGradeDialog(true);
        }}
      >
        <FileText className="h-4 w-4" />
      </Button>
      <Button 
        variant="ghost" 
        size="icon"
        onClick={() => {
          setSelectedAssignment(assignment);
          setEditAssignmentDialog(true);
        }}
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <Button 
        variant="ghost" 
        size="icon"
        onClick={() => {
          setSelectedAssignment(assignment);
          setDeleteAssignmentDialog(true);
        }}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );

  // Grade columns for DataTable
  const gradeColumns = [
    {
      header: "Student",
      accessorKey: "studentId",
      cell: (grade: Grade) => {
        const student = students?.find(s => s.id === grade.studentId);
        return student ? `${student.firstName}${student.lastName ? ' ' + student.lastName : ''}` : `Student ID: ${grade.studentId}`;
      }
    },
    {
      header: "Assignment",
      accessorKey: "assignmentId",
      cell: (grade: Grade) => {
        const assignment = assignments?.find(a => a.id === grade.assignmentId);
        return assignment ? assignment.name : `Assignment ID: ${grade.assignmentId}`;
      }
    },
    {
      header: "Score",
      accessorKey: "score",
      cell: (grade: Grade) => {
        const assignment = assignments?.find(a => a.id === grade.assignmentId);
        return assignment ? `${grade.score}/${assignment.maxScore}` : grade.score;
      }
    },
    {
      header: "Grade",
      accessorKey: "letter",
      cell: (grade: Grade) => {
        const assignment = assignments?.find(a => a.id === grade.assignmentId);
        if (!assignment) return <span>N/A</span>;
        
        const percentage = (Number(grade.score) / Number(assignment.maxScore)) * 100;
        const letter = percentageToLetterGrade(percentage);
        return <GradeBadge grade={letter} percentage={percentage} />;
      }
    },
    {
      header: "Comments",
      accessorKey: "comments",
    },
    {
      header: "Graded At",
      accessorKey: "gradedAt",
      cell: (grade: Grade) => <span>{new Date(grade.gradedAt).toLocaleDateString()}</span>,
    },
  ];

  const gradeActions = (grade: Grade) => (
    <div className="flex space-x-2 justify-end">
      <Link href={`/grades/${grade.id}/edit`}>
        <a>
          <Button variant="ghost" size="icon">
            <Pencil className="h-4 w-4" />
          </Button>
        </a>
      </Link>
    </div>
  );

  const isLoading = isClassLoading || isStudentsLoading || isAssignmentsLoading || isGradesLoading;

  if (!classId) return <div>Invalid class ID</div>;

  return (
    <Layout title={classData?.name || 'Class Details'}>
      <div className="mt-6 space-y-6">
        {classData && (
          <Card>
            <CardHeader>
              <CardTitle>{classData.name}</CardTitle>
              <CardDescription>{classData.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <Users className="mr-2 h-5 w-5 text-gray-400" />
                    <span>{students?.length || 0} students</span>
                  </div>
                  <div className="flex items-center">
                    <FileText className="mr-2 h-5 w-5 text-gray-400" />
                    <span>{assignments?.length || 0} assignments</span>
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Created: {new Date(classData.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="students">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="grades">Grades</TabsTrigger>
          </TabsList>
          
          <TabsContent value="students" className="mt-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Class Students</h2>
              <Button onClick={() => setAddStudentDialog(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Student
              </Button>
            </div>
            
            <DataTable
              data={students || []}
              columns={studentColumns}
              searchKey="lastName"
              searchPlaceholder="Search students..."
            />
          </TabsContent>
          
          <TabsContent value="assignments" className="mt-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Class Assignments</h2>
              <Button onClick={() => setAddAssignmentDialog(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Assignment
              </Button>
            </div>
            
            <DataTable
              data={assignments || []}
              columns={assignmentColumns}
              actions={assignmentActions}
              searchKey="name"
              searchPlaceholder="Search assignments..."
            />
          </TabsContent>
          
          <TabsContent value="grades" className="mt-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Class Grades</h2>
              <Button onClick={() => setAddGradeDialog(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Enter New Grade
              </Button>
            </div>
            
            <DataTable
              data={grades || []}
              columns={gradeColumns}
              actions={gradeActions}
              searchPlaceholder="Search grades..."
            />
          </TabsContent>
        </Tabs>

        {/* Add Student Dialog */}
        <Dialog open={addStudentDialog} onOpenChange={setAddStudentDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Student to Class</DialogTitle>
            </DialogHeader>
            <StudentForm 
              classId={classId}
              onSuccess={() => {
                setAddStudentDialog(false);
                queryClient.invalidateQueries({ queryKey: [`/api/classes/${classId}/students`] });
              }} 
            />
          </DialogContent>
        </Dialog>

        {/* Add Assignment Dialog */}
        <Dialog open={addAssignmentDialog} onOpenChange={setAddAssignmentDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Assignment</DialogTitle>
            </DialogHeader>
            <AssignmentForm 
              classId={classId}
              onSuccess={() => {
                setAddAssignmentDialog(false);
                queryClient.invalidateQueries({ queryKey: [`/api/assignments?classId=${classId}`] });
              }} 
            />
          </DialogContent>
        </Dialog>

        {/* Edit Assignment Dialog */}
        <Dialog open={editAssignmentDialog} onOpenChange={setEditAssignmentDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Assignment</DialogTitle>
            </DialogHeader>
            {selectedAssignment && (
              <AssignmentForm 
                assignment={selectedAssignment}
                onSuccess={() => {
                  setEditAssignmentDialog(false);
                  queryClient.invalidateQueries({ queryKey: [`/api/assignments?classId=${classId}`] });
                }} 
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Add Grade Dialog */}
        <Dialog open={addGradeDialog} onOpenChange={setAddGradeDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enter Grade</DialogTitle>
            </DialogHeader>
            <GradeForm 
              classId={classId}
              preselectedAssignment={selectedAssignment}
              onSuccess={() => {
                setAddGradeDialog(false);
                queryClient.invalidateQueries({ queryKey: [`/api/grades?classId=${classId}`] });
              }} 
            />
          </DialogContent>
        </Dialog>

        {/* Delete Assignment Confirmation */}
        <AlertDialog open={deleteAssignmentDialog} onOpenChange={setDeleteAssignmentDialog}>
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
                onClick={handleDeleteAssignment}
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
