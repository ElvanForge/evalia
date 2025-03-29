import { Class } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Users, FileText, BarChart3 } from "lucide-react";
import { Link } from "wouter";

interface ClassCardProps {
  class: {
    id: number;
    name: string;
    studentCount: number;
    assignmentCount?: number;
    averageGrade?: number | string;
  };
  onClick?: () => void;
  className?: string;
}

export function ClassCard({ class: classData, onClick, className }: ClassCardProps) {
  // Format average grade value
  const avgGrade = 
    typeof classData.averageGrade === 'number' 
      ? `${classData.averageGrade.toFixed(1)}%` 
      : classData.averageGrade || 'N/A';
      
  return (
    <Link href={`/classes/${classData.id}`}>
        <Card 
          className={cn(
            "overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 rounded-md border border-muted hover:border-primary cursor-pointer", 
            className
          )}
          onClick={onClick}
        >
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium">{classData.name}</h3>
            
            <div className="mt-2 flex items-center text-sm text-muted-foreground">
              <Users className="flex-shrink-0 mr-1.5 h-5 w-5 text-muted-foreground" />
              <span>{classData.studentCount} students</span>
            </div>
            
            <div className="mt-2 flex items-center text-sm text-muted-foreground">
              <FileText className="flex-shrink-0 mr-1.5 h-5 w-5 text-muted-foreground" />
              <span>{classData.assignmentCount || 0} assignments</span>
            </div>
            
            <div className="mt-2 flex items-center text-sm text-muted-foreground">
              <BarChart3 className="flex-shrink-0 mr-1.5 h-5 w-5 text-muted-foreground" />
              <span>Avg: {avgGrade}</span>
            </div>
          </div>
        </Card>
    </Link>
  );
}
