import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { School, Teacher, Student, Quiz, Grade } from "@shared/schema";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { useAuth } from "@/hooks/use-auth";
import Layout from "@/components/layout";
import { Download } from "lucide-react";

// Define extended types for data from API
interface SchoolTeacher extends Teacher {}

interface SchoolStudent extends Student {}

interface SchoolQuiz extends Quiz {
  teacherName: string;
  className: string;
}

interface SchoolGrade extends Grade {
  studentName: string;
  className: string;
  assignmentName: string;
  assignmentType: string;
  teacherName: string;
}

// Helper for exporting to XML
const downloadXML = async (schoolId: number) => {
  try {
    const response = await apiRequest.post('/api/export/school-grades', { 
      schoolId, 
      format: 'xml' 
    }, { 
      responseType: 'blob' 
    });
    
    // Handle response as a blob for download
    if (response instanceof Response) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `school_${schoolId}_grades.xml`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  } catch (error) {
    console.error("Error downloading XML:", error);
  }
};

const ManagerDashboard = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedSchool, setSelectedSchool] = useState<number | null>(null);
  
  // Get schools (should only be one for the manager)
  const { data: schools = [] } = useQuery<School[]>({
    queryKey: ['/api/schools'],
    enabled: !!user && user.role === "manager",
  });
  
  // Set the first school as selected by default
  useEffect(() => {
    if (schools && schools.length > 0 && !selectedSchool) {
      setSelectedSchool(schools[0].id);
    }
  }, [schools, selectedSchool]);
  
  // Get teachers in the selected school
  const { data: teachers = [] } = useQuery<SchoolTeacher[]>({
    queryKey: ['/api/schools', selectedSchool, 'teachers'],
    enabled: !!selectedSchool,
  });
  
  // Get students in the selected school
  const { data: students = [] } = useQuery<SchoolStudent[]>({
    queryKey: ['/api/schools', selectedSchool, 'students'],
    enabled: !!selectedSchool,
  });
  
  // Get quizzes in the selected school
  const { data: quizzes = [] } = useQuery<SchoolQuiz[]>({
    queryKey: ['/api/schools', selectedSchool, 'quizzes'],
    enabled: !!selectedSchool,
  });
  
  // Get all grades in the selected school
  const { data: grades = [] } = useQuery<SchoolGrade[]>({
    queryKey: ['/api/schools', selectedSchool, 'all-grades'],
    enabled: !!selectedSchool,
  });
  
  if (!user || user.role !== "manager") {
    return (
      <Layout title="Access Denied">
        <div className="container py-10">
          <Card>
            <CardHeader>
              <CardTitle>Access Denied</CardTitle>
              <CardDescription>
                You need manager privileges to access this page.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout title="School Management">
      <div className="container py-10">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">School Management Dashboard</CardTitle>
            <CardDescription>
              View and manage school data as a manager
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Select School:</label>
                  <Select 
                    value={selectedSchool?.toString() || ""} 
                    onValueChange={(value) => setSelectedSchool(Number(value))}
                  >
                    <SelectTrigger className="w-[250px]">
                      <SelectValue placeholder="Select a school" />
                    </SelectTrigger>
                    <SelectContent>
                      {schools?.map((school: School) => (
                        <SelectItem key={school.id} value={school.id.toString()}>
                          {school.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedSchool && (
                  <Button 
                    variant="outline" 
                    className="mt-6"
                    onClick={() => downloadXML(selectedSchool)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export All Grades (XML)
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {selectedSchool && (
          <Tabs defaultValue="teachers">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="teachers">Teachers</TabsTrigger>
              <TabsTrigger value="students">Students</TabsTrigger>
              <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
              <TabsTrigger value="grades">Grades</TabsTrigger>
            </TabsList>
            
            <TabsContent value="teachers">
              <Card>
                <CardHeader>
                  <CardTitle>School Teachers</CardTitle>
                  <CardDescription>
                    Teachers currently working at this school
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableCaption>List of teachers at this school</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Username</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Role</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teachers?.map((teacher: Teacher) => (
                        <TableRow key={teacher.id}>
                          <TableCell>{teacher.firstName} {teacher.lastName}</TableCell>
                          <TableCell>{teacher.username}</TableCell>
                          <TableCell>{teacher.email}</TableCell>
                          <TableCell>{teacher.subject || 'N/A'}</TableCell>
                          <TableCell>{teacher.role || 'teacher'}</TableCell>
                        </TableRow>
                      ))}
                      {!teachers?.length && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center">
                            No teachers found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="students">
              <Card>
                <CardHeader>
                  <CardTitle>School Students</CardTitle>
                  <CardDescription>
                    Students currently enrolled at this school
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableCaption>List of students at this school</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Grade Level</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students?.map((student: Student) => (
                        <TableRow key={student.id}>
                          <TableCell>{student.firstName} {student.lastName}</TableCell>
                          <TableCell>{student.email || 'N/A'}</TableCell>
                          <TableCell>{student.gradeLevel || 'N/A'}</TableCell>
                        </TableRow>
                      ))}
                      {!students?.length && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center">
                            No students found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="quizzes">
              <Card>
                <CardHeader>
                  <CardTitle>School Quizzes</CardTitle>
                  <CardDescription>
                    All quizzes created by teachers at this school
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableCaption>List of quizzes at this school</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Created By</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Time Limit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {quizzes?.map((quiz: SchoolQuiz) => (
                        <TableRow key={quiz.id}>
                          <TableCell>{quiz.title}</TableCell>
                          <TableCell>{quiz.teacherName}</TableCell>
                          <TableCell>{quiz.className}</TableCell>
                          <TableCell>{quiz.isActive ? 'Active' : 'Inactive'}</TableCell>
                          <TableCell>{quiz.timeLimit ? `${quiz.timeLimit} min` : 'No limit'}</TableCell>
                        </TableRow>
                      ))}
                      {!quizzes?.length && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center">
                            No quizzes found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="grades">
              <Card>
                <CardHeader>
                  <CardTitle>School Grades</CardTitle>
                  <CardDescription>
                    All grades for students at this school
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableCaption>List of grades at this school</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Assignment</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Teacher</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {grades?.map((grade: SchoolGrade) => (
                        <TableRow key={grade.id}>
                          <TableCell>{grade.studentName}</TableCell>
                          <TableCell>{grade.className}</TableCell>
                          <TableCell>{grade.assignmentName}</TableCell>
                          <TableCell>{grade.assignmentType}</TableCell>
                          <TableCell>{grade.score}</TableCell>
                          <TableCell>{grade.teacherName}</TableCell>
                          <TableCell>{new Date(grade.gradedAt).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                      {!grades?.length && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center">
                            No grades found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </Layout>
  );
};

export default ManagerDashboard;