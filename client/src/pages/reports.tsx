import { useState } from "react";
import Layout from "@/components/layout";
import { useQuery } from "@tanstack/react-query";
import { Class, Student, Assignment, Grade } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PieChart, Pie, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { GradeBadge } from "@/components/ui/grade-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { percentageToLetterGrade, createGradeDistribution, calculateWeightedAverage } from "@/lib/grade-utils";

// Colors for charts
const GRADE_COLORS = {
  "A+": "#22c55e", // green-500
  "A": "#22c55e",
  "A-": "#22c55e",
  "B+": "#84cc16", // lime-500
  "B": "#84cc16",
  "B-": "#84cc16",
  "C+": "#eab308", // yellow-500
  "C": "#eab308",
  "C-": "#eab308",
  "D+": "#f97316", // orange-500
  "D": "#f97316",
  "D-": "#f97316",
  "F": "#ef4444", // red-500
};

export default function Reports() {
  const [selectedClassId, setSelectedClassId] = useState<string>("all");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("all");
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>("all");

  // Fetch classes
  const { data: classes, isLoading: isClassesLoading } = useQuery<Class[]>({
    queryKey: ["/api/classes"],
  });

  // Fetch students
  const { data: students, isLoading: isStudentsLoading } = useQuery<Student[]>({
    queryKey: [selectedClassId === "all" ? "/api/students" : `/api/classes/${selectedClassId}/students`],
    enabled: !isClassesLoading,
  });

  // Fetch assignments
  const { data: assignments, isLoading: isAssignmentsLoading } = useQuery<Assignment[]>({
    queryKey: [selectedClassId === "all" ? "/api/assignments" : `/api/assignments?classId=${selectedClassId}`],
    enabled: !isClassesLoading && selectedClassId !== "all",
  });

  // Fetch grades
  const { data: grades, isLoading: isGradesLoading } = useQuery<Grade[]>({
    queryKey: [
      selectedClassId === "all" 
        ? "/api/grades?limit=1000" 
        : selectedStudentId === "all"
          ? `/api/grades?classId=${selectedClassId}`
          : `/api/grades?classId=${selectedClassId}&studentId=${selectedStudentId}`
    ],
    enabled: !isClassesLoading && !isStudentsLoading,
  });

  const isLoading = isClassesLoading || isStudentsLoading || isAssignmentsLoading || isGradesLoading;

  // Process data for grade distribution
  const generateGradeDistributionData = () => {
    if (!grades || !assignments) return [];

    const gradePercentages = grades.map(grade => {
      const assignment = assignments.find(a => a.id === grade.assignmentId);
      if (!assignment) return 0;
      return (Number(grade.score) / Number(assignment.maxScore)) * 100;
    });

    const distribution = createGradeDistribution(gradePercentages);
    return Object.entries(distribution).map(([letter, count]) => ({
      letter,
      count,
      color: GRADE_COLORS[letter as keyof typeof GRADE_COLORS] || "#6b7280", // gray-500 as fallback
    }));
  };

  // Process data for student performance
  const generateStudentPerformanceData = () => {
    if (!grades || !assignments || !students) return [];

    // Group grades by student
    const studentGrades: Record<number, { scores: Array<{ score: number; maxScore: number; weight: number }>, name: string }> = {};
    
    students.forEach(student => {
      studentGrades[student.id] = { scores: [], name: `${student.firstName} ${student.lastName}` };
    });

    grades.forEach(grade => {
      const assignment = assignments.find(a => a.id === grade.assignmentId);
      if (!assignment || !studentGrades[grade.studentId]) return;
      
      studentGrades[grade.studentId].scores.push({
        score: Number(grade.score),
        maxScore: Number(assignment.maxScore),
        weight: Number(assignment.weight)
      });
    });

    // Calculate average for each student
    return Object.entries(studentGrades).map(([studentId, data]) => {
      const average = calculateWeightedAverage(data.scores);
      return {
        studentId: Number(studentId),
        name: data.name,
        average,
        letter: percentageToLetterGrade(average),
        color: GRADE_COLORS[percentageToLetterGrade(average) as keyof typeof GRADE_COLORS] || "#6b7280"
      };
    }).sort((a, b) => b.average - a.average);
  };

  // Process data for assignment performance
  const generateAssignmentPerformanceData = () => {
    if (!grades || !assignments) return [];

    // Group grades by assignment
    const assignmentGrades: Record<number, { scores: number[], name: string, maxScore: number }> = {};
    
    assignments.forEach(assignment => {
      assignmentGrades[assignment.id] = { 
        scores: [], 
        name: assignment.name,
        maxScore: Number(assignment.maxScore)
      };
    });

    grades.forEach(grade => {
      if (!assignmentGrades[grade.assignmentId]) return;
      assignmentGrades[grade.assignmentId].scores.push(Number(grade.score));
    });

    // Calculate average for each assignment
    return Object.entries(assignmentGrades).map(([assignmentId, data]) => {
      if (data.scores.length === 0) return null;
      
      const total = data.scores.reduce((sum, score) => sum + score, 0);
      const average = total / data.scores.length;
      const percentage = (average / data.maxScore) * 100;
      
      return {
        assignmentId: Number(assignmentId),
        name: data.name,
        average,
        percentage,
        maxScore: data.maxScore,
        studentCount: data.scores.length
      };
    }).filter(Boolean).sort((a, b) => a!.percentage - b!.percentage) as any[];
  };

  const gradeDistributionData = generateGradeDistributionData();
  const studentPerformanceData = generateStudentPerformanceData();
  const assignmentPerformanceData = generateAssignmentPerformanceData();

  // Calculate overall stats
  const calculateOverallStats = () => {
    if (!grades || !assignments) return { averageGrade: 0, letterGrade: "N/A", totalAssignments: 0, totalStudents: 0 };
    
    const scores: Array<{ score: number; maxScore: number; weight: number }> = [];
    
    grades.forEach(grade => {
      const assignment = assignments.find(a => a.id === grade.assignmentId);
      if (!assignment) return;
      
      scores.push({
        score: Number(grade.score),
        maxScore: Number(assignment.maxScore),
        weight: Number(assignment.weight)
      });
    });
    
    const averageGrade = calculateWeightedAverage(scores);
    const letterGrade = percentageToLetterGrade(averageGrade);
    
    // Count unique students
    const uniqueStudentIds = new Set(grades.map(g => g.studentId));
    
    return {
      averageGrade,
      letterGrade,
      totalAssignments: assignments.length,
      totalStudents: uniqueStudentIds.size
    };
  };

  const stats = calculateOverallStats();

  return (
    <Layout title="Reports">
      <div className="mt-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Class Filter</CardTitle>
            </CardHeader>
            <CardContent>
              <Select 
                value={selectedClassId} 
                onValueChange={(value) => {
                  setSelectedClassId(value);
                  setSelectedStudentId("all");
                  setSelectedAssignmentId("all");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Student Filter</CardTitle>
            </CardHeader>
            <CardContent>
              <Select 
                value={selectedStudentId} 
                onValueChange={setSelectedStudentId}
                disabled={selectedClassId === "all"}
              >
                <SelectTrigger>
                  <SelectValue placeholder={selectedClassId === "all" ? "Select a class first" : "Select student"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Students</SelectItem>
                  {students?.map((student) => (
                    <SelectItem key={student.id} value={student.id.toString()}>
                      {student.firstName} {student.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Assignment Filter</CardTitle>
            </CardHeader>
            <CardContent>
              <Select 
                value={selectedAssignmentId} 
                onValueChange={setSelectedAssignmentId}
                disabled={selectedClassId === "all"}
              >
                <SelectTrigger>
                  <SelectValue placeholder={selectedClassId === "all" ? "Select a class first" : "Select assignment"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assignments</SelectItem>
                  {assignments?.map((assignment) => (
                    <SelectItem key={assignment.id} value={assignment.id.toString()}>
                      {assignment.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Average Grade</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.averageGrade > 0 ? (
                  <div className="flex items-center">
                    <GradeBadge 
                      grade={stats.letterGrade} 
                      percentage={stats.averageGrade} 
                      className="text-base"
                    />
                  </div>
                ) : (
                  "N/A"
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAssignments}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Grades</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{grades?.length || 0}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="distribution">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="distribution">Grade Distribution</TabsTrigger>
            <TabsTrigger value="students">Student Performance</TabsTrigger>
            <TabsTrigger value="assignments">Assignment Performance</TabsTrigger>
          </TabsList>
          
          <TabsContent value="distribution" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Grade Distribution</CardTitle>
              </CardHeader>
              <CardContent className="h-[400px]">
                {gradeDistributionData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={gradeDistributionData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        outerRadius={150}
                        fill="#8884d8"
                        dataKey="count"
                        nameKey="letter"
                        label={({ letter, percent }) => `${letter}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {gradeDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value, name, props) => [`${value} student(s)`, `Grade: ${props.payload.letter}`]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-500">
                    No grade data available for the selected criteria
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="students" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Student Performance</CardTitle>
              </CardHeader>
              <CardContent className="h-[400px]">
                {studentPerformanceData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={studentPerformanceData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 100,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45}
                        textAnchor="end"
                        interval={0}
                        height={100}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        label={{ value: 'Average Score (%)', angle: -90, position: 'insideLeft' }}
                        domain={[0, 100]}
                      />
                      <Tooltip
                        formatter={(value, name, props) => [`${value.toFixed(1)}%`, `Average Score`]}
                        labelFormatter={(label, props) => props[0].payload.name}
                      />
                      <Bar dataKey="average" name="Average Score">
                        {studentPerformanceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-500">
                    No student performance data available for the selected criteria
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="assignments" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Assignment Performance</CardTitle>
              </CardHeader>
              <CardContent className="h-[400px]">
                {assignmentPerformanceData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={assignmentPerformanceData}
                      layout="vertical"
                      margin={{
                        top: 5,
                        right: 30,
                        left: 100,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 100]} />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        width={100}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip
                        formatter={(value, name, props) => [
                          `${value.toFixed(1)}%`, 
                          `Avg: ${props.payload.average.toFixed(1)}/${props.payload.maxScore} (${props.payload.studentCount} students)`
                        ]}
                      />
                      <Bar dataKey="percentage" name="Average Score (%)" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-500">
                    No assignment performance data available for the selected criteria
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
