import { Assignment } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Edit, Eye } from "lucide-react";

interface GradeTableProps {
  assignments: Assignment[];
  onViewAssignment: (id: number) => void;
  onEditAssignment: (id: number) => void;
}

export default function GradeTable({ assignments, onViewAssignment, onEditAssignment }: GradeTableProps) {
  if (assignments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Assignments</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-6">
          <p className="text-muted-foreground mb-4">No recent assignments found</p>
          <Button onClick={() => window.location.href = '/assignments/new'}>
            Create New Assignment
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Assignments</CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => window.location.href = '/assignments'}
        >
          View All
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left font-medium p-2">Name</th>
                <th className="text-left font-medium p-2">Class</th>
                <th className="text-left font-medium p-2">Due Date</th>
                <th className="text-left font-medium p-2">Status</th>
                <th className="text-right font-medium p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((assignment) => {
                const dueDate = assignment.dueDate ? new Date(assignment.dueDate) : null;
                const isPastDue = dueDate ? dueDate < new Date() : false;
                const isDueToday = dueDate ? 
                  format(dueDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') : false;
                
                let statusColor = "bg-gray-100 text-gray-800";
                let statusText = "Not Started";
                
                if (isPastDue) {
                  statusColor = "bg-red-100 text-red-800";
                  statusText = "Past Due";
                } else if (isDueToday) {
                  statusColor = "bg-yellow-100 text-yellow-800";
                  statusText = "Due Today";
                } else if (dueDate) {
                  statusColor = "bg-blue-100 text-blue-800";
                  statusText = "Upcoming";
                }
                
                return (
                  <tr key={assignment.id} className="border-b hover:bg-muted/50">
                    <td className="p-2">{assignment.name}</td>
                    <td className="p-2">Class {assignment.classId}</td>
                    <td className="p-2">
                      {dueDate ? format(dueDate, 'MMM d, yyyy') : 'No due date'}
                    </td>
                    <td className="p-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                        {statusText}
                      </span>
                    </td>
                    <td className="p-2 text-right">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => onViewAssignment(assignment.id)}
                        title="View Assignment"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => onEditAssignment(assignment.id)}
                        title="Edit Assignment"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}