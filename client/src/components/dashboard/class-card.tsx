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
    openAssignments: number;
    averageGrade: string;
  };
  onClick?: () => void;
  className?: string;
}

export function ClassCard({ class: classData, onClick, className }: ClassCardProps) {
  return (
    <Link href={`/classes/${classData.id}`}>
        <Card 
          className={cn(
            "overflow-hidden shadow-sm rounded-md border border-gray-200 hover:border-blue-500 cursor-pointer", 
            className
          )}
          onClick={onClick}
        >
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900">{classData.name}</h3>
            
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <Users className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
              <span>{classData.studentCount} students</span>
            </div>
            
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <FileText className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
              <span>{classData.openAssignments} open assignments</span>
            </div>
            
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <BarChart3 className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
              <span>Avg: {classData.averageGrade}</span>
            </div>
          </div>
        </Card>
    </Link>
  );
}
