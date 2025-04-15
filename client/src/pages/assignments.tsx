import { useState } from "react";
import Layout from "@/components/layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Assignment, Class, Student, Grade } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { BulkGradeEntry } from "@/components/forms/bulk-grade-entry";
import { SimpleBulkEntry } from "@/components/forms/simple-bulk-entry";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PlusCircle, Pencil, Trash2, ClipboardCheck, AlertCircle, Loader2 } from "lucide-react";
import { AssignmentForm } from "@/components/forms/assignment-form";
import { GradeForm } from "@/components/forms/grade-form";
import SectionHeader from "@/components/section-header";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Assignments() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isGradeDialogOpen, setIsGradeDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string>("all");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [currentTab, setCurrentTab] = useState<string>("students");
  const [hideGradedStudents, setHideGradedStudents] = useState<boolean>(true);

  // Fetch classes
  const { data: classes, isLoading: isClassesLoading } = useQuery<Class[]>({
    queryKey: ["/api/classes"],
  });

  // Fetch assignments
  const { data: assignments, isLoading: isAssignmentsLoading } = useQuery<Assignment[]>({
    queryKey: [selectedClassId === "all" ? "/api/assignments" : `/api/assignments?classId=${selectedClassId}`],
    enabled: !isClassesLoading,
  });
  
  // For grading dialog - fetch all classes first when dialog opens
  const [gradingClassId, setGradingClassId] = useState<number | null>(null);
  
  // Fetch students for the selected class (for grading)
  const { data: students, isLoading: isStudentsLoading } = useQuery<Student[]>({
    queryKey: [gradingClassId ? `/api/classes/${gradingClassId}/students` : ''],
    enabled: !!gradingClassId && isGradeDialogOpen,
  });
  
  // Fetch existing grades for this assignment
  const { data: existingGrades, isLoading: isGradesLoading } = useQuery<Grade[]>({
    queryKey: [selectedAssignment ? `/api/assignments/${selectedAssignment.id}/grades` : ''],
    enabled: !!selectedAssignment && isGradeDialogOpen,
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

  // Reset state when the grade dialog closes
  const handleGradeDialogClose = () => {
    setSelectedStudent(null);
    setGradingClassId(null);
    setHideGradedStudents(true); // Reset the filter to default (hide graded students)
    setIsGradeDialogOpen(false);
  };
  
  // Handle opening the grade dialog
  const handleGradeClick = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    // Initialize with the assignment's class
    setGradingClassId(assignment.classId);
    setIsGradeDialogOpen(true);
  };
  
  const actions = (assignment: Assignment) => (
    <div className="flex space-x-2 justify-end">
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => handleGradeClick(assignment)}
        title="Enter Grades"
      >
        <ClipboardCheck className="h-4 w-4" />
      </Button>
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => handleEditClick(assignment)}
        title="Edit Assignment"
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => handleDeleteClick(assignment)}
        title="Delete Assignment"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );

  const isLoading = isClassesLoading || isAssignmentsLoading;

  const classFilter = (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium">Filter by class:</span>
      <Select 
        value={selectedClassId} 
        onValueChange={setSelectedClassId}
      >
        <SelectTrigger className="w-[200px]">
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
  );

  const addAssignment = (
    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#0ba2b0] hover:bg-[#0ba2b0]/90">
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
  );

  return (
    <Layout title="Assignments">
      <div className="space-y-6">
        <SectionHeader
          title="Assignments"
          subtitle="Manage homework, projects, and other graded work"
          rightContent={addAssignment}
          leftContent={classFilter}
        />

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
        
        {/* Grade Entry Dialog */}
        <Dialog open={isGradeDialogOpen} onOpenChange={handleGradeDialogClose}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <ClipboardCheck className="mr-2 h-5 w-5 text-primary" />
                Enter Grades for {selectedAssignment?.name}
              </DialogTitle>
              <DialogDescription>
                Add or update grades for this assignment
              </DialogDescription>
            </DialogHeader>
            
            {selectedAssignment && (
              <div>
                {/* Class Selection UI */}
                <div className="mb-6">
                  <Label htmlFor="class-select" className="text-sm font-medium mb-2 block">
                    Select Class
                  </Label>
                  <Select 
                    value={gradingClassId?.toString() || ''} 
                    onValueChange={(value) => setGradingClassId(parseInt(value))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a class..." />
                    </SelectTrigger>
                    <SelectContent>
                      {classes?.map((class_) => (
                        <SelectItem key={class_.id} value={class_.id.toString()}>
                          {class_.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {gradingClassId && (
                  <Tabs defaultValue="students" className="w-full">
                    <TabsList className="mb-4">
                      <TabsTrigger value="students" onClick={() => setCurrentTab("students")}>
                        Individual Student
                      </TabsTrigger>
                      <TabsTrigger value="bulk" onClick={() => setCurrentTab("bulk")}>
                        Bulk Entry
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="students" className="space-y-4">
                      {currentTab === "students" && (
                        <>
                          {isStudentsLoading ? (
                            <div className="flex justify-center py-8">
                              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                          ) : students && students.length > 0 ? (
                            selectedStudent ? (
                              // Show the grade form once a student is selected
                              <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-4">
                                    <div className="bg-primary/10 p-2 rounded-full">
                                      <span className="text-lg font-semibold text-primary">
                                        {selectedStudent.firstName.charAt(0)}
                                        {selectedStudent.lastName?.charAt(0) || ''}
                                      </span>
                                    </div>
                                    <div>
                                      <h3 className="text-lg font-medium">
                                        {selectedStudent.lastName ? `${selectedStudent.lastName}, ${selectedStudent.firstName}` : selectedStudent.firstName}
                                      </h3>
                                      {selectedStudent.studentNumber && (
                                        <p className="text-sm text-muted-foreground">
                                          Student ID: {selectedStudent.studentNumber}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => setSelectedStudent(null)}
                                  >
                                    Change Student
                                  </Button>
                                </div>
                                
                                <GradeForm 
                                  assignmentId={selectedAssignment.id}
                                  studentId={selectedStudent.id}
                                  selectedClassId={gradingClassId}
                                  onSuccess={() => {
                                    // Invalidate the grades query to refresh the data
                                    queryClient.invalidateQueries({
                                      queryKey: [`/api/assignments/${selectedAssignment.id}/grades`]
                                    });
                                    setSelectedStudent(null);
                                    toast({
                                      title: "Grade saved",
                                      description: "The grade has been successfully saved.",
                                    });
                                  }}
                                />
                              </div>
                            ) : (
                              // Student selection view with students filtered by existing grades
                              <div className="space-y-4">
                                <div className="bg-muted/50 p-4 rounded-md flex items-center">
                                  <AlertCircle className="h-5 w-5 text-primary mr-2" />
                                  <p className="text-sm">
                                    Select a student to enter or edit their grade for this assignment. 
                                    {existingGrades && existingGrades.length > 0 && 
                                      " Students who already have grades are marked."}
                                  </p>
                                </div>
                                
                                {/* Filter controls for showing graded students */}
                                <div className="flex items-center justify-between mb-3">
                                  <div className="text-sm text-muted-foreground">
                                    {students?.length || 0} students in this class
                                    {hideGradedStudents && existingGrades && existingGrades.length > 0 && (
                                      <span className="ml-1 text-primary">
                                        ({students.filter(student => 
                                          !existingGrades.some(grade => grade.studentId === student.id)
                                        ).length} without grades)
                                      </span>
                                    )}
                                  </div>
                                  
                                  <div className="flex items-center">
                                    <Switch 
                                      id="show-graded"
                                      checked={!hideGradedStudents}
                                      onCheckedChange={(checked) => setHideGradedStudents(!checked)}
                                      className="mr-2"
                                    />
                                    <Label htmlFor="show-graded" className="text-sm">
                                      Show students with existing grades
                                    </Label>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                                  {students
                                    .filter(student => {
                                      // If filter is disabled, show all students
                                      if (!hideGradedStudents) return true;
                                      
                                      // Otherwise, only show students without grades
                                      const hasGrade = existingGrades?.some(
                                        grade => grade.studentId === student.id
                                      );
                                      return !hasGrade;
                                    })
                                    .map(student => {
                                      // Check if student already has a grade for this assignment
                                      const hasExistingGrade = existingGrades?.some(
                                        grade => grade.studentId === student.id
                                      );
                                      
                                      return (
                                        <Button
                                          key={student.id}
                                          variant="outline"
                                          className={`justify-start h-auto py-3 px-4 ${
                                            hasExistingGrade ? "border-primary/30 bg-primary/5" : ""
                                          }`}
                                          onClick={() => setSelectedStudent(student)}
                                        >
                                          <div className="flex items-center w-full">
                                            <div className={`p-2 rounded-full mr-3 ${
                                              hasExistingGrade ? "bg-primary/20" : "bg-primary/10"
                                            }`}>
                                              <span className="text-sm font-semibold text-primary">
                                                {student.firstName.charAt(0)}
                                                {student.lastName?.charAt(0) || ''}
                                              </span>
                                            </div>
                                            <div className="text-left flex-grow">
                                              <p className="font-medium">
                                                {student.lastName ? 
                                                  `${student.lastName}, ${student.firstName}` : 
                                                  student.firstName}
                                              </p>
                                              {student.studentNumber && (
                                                <p className="text-xs text-muted-foreground">
                                                  ID: {student.studentNumber}
                                                </p>
                                              )}
                                            </div>
                                            {hasExistingGrade && (
                                              <div className="flex items-center ml-2 px-2 py-1 rounded-full bg-primary/10 text-xs text-primary">
                                                Graded
                                              </div>
                                            )}
                                          </div>
                                        </Button>
                                      );
                                    })}
                                </div>
                              </div>
                            )
                          ) : (
                            <div className="text-center py-8">
                              <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
                              <h3 className="text-lg font-medium mb-2">No students found</h3>
                              <p className="text-muted-foreground">
                                There are no students enrolled in this class yet.
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="bulk" className="space-y-4">
                      {currentTab === "bulk" && (
                        <div className="space-y-4">
                          <div className="bg-muted/50 p-4 rounded-md flex items-center">
                            <AlertCircle className="h-5 w-5 text-amber-600 mr-2" />
                            <p className="text-sm">
                              Enter grades for multiple students at once. Click save when you're done to save all grades.
                            </p>
                          </div>
                          
                          {/* Debug information */}
                          <div className="bg-muted/20 p-2 mb-4 text-xs rounded overflow-auto">
                            <pre>
                              Students Loading: {isStudentsLoading ? 'yes' : 'no'}<br/>
                              Grades Loading: {isGradesLoading ? 'yes' : 'no'}<br/>
                              Student Count: {students?.length || 0}<br/>
                              Assignment ID: {selectedAssignment?.id}<br/>
                              Max Score: {selectedAssignment?.maxScore}<br/>
                              {students && students.length > 0 && 
                                `First Student: ${JSON.stringify(students[0], null, 2)}`
                              }
                            </pre>
                          </div>
                          
                          {isStudentsLoading || isGradesLoading ? (
                            <div className="flex justify-center py-8">
                              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                          ) : students && Array.isArray(students) && students.length > 0 ? (
                            // Using SimpleBulkEntry instead of BulkGradeEntry
                            <SimpleBulkEntry 
                              students={students}
                              existingGrades={existingGrades || []}
                              assignmentId={selectedAssignment.id}
                              maxScore={Number(selectedAssignment.maxScore)}
                              onSuccess={() => {
                                // Invalidate the grades query to refresh the data
                                queryClient.invalidateQueries({
                                  queryKey: [`/api/assignments/${selectedAssignment.id}/grades`]
                                });
                                toast({
                                  title: "Grades saved",
                                  description: "All grades have been successfully saved.",
                                });
                              }}
                            />
                          ) : (
                            <div className="text-center py-8">
                              <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
                              <h3 className="text-lg font-medium mb-2">No students found</h3>
                              <p className="text-muted-foreground">
                                There are no students enrolled in this class yet.
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
