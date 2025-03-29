import { Card, CardContent } from "@/components/ui/card";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: string;
  change?: {
    value: string;
    type: "increase" | "decrease" | "neutral";
  };
  iconBgClass?: string;
  iconColorClass?: string;
}

export default function StatCard({
  title,
  value,
  icon,
  change,
  iconBgClass = "bg-primary/20",
  iconColorClass = "text-primary"
}: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <h3 className="text-2xl font-bold">{value}</h3>
            
            {change && (
              <div className="flex items-center mt-1">
                {change.type === "increase" ? (
                  <ArrowUp className="h-4 w-4 text-green-600 mr-1" />
                ) : change.type === "decrease" ? (
                  <ArrowDown className="h-4 w-4 text-red-600 mr-1" />
                ) : (
                  <Minus className="h-4 w-4 text-gray-500 mr-1" />
                )}
                <span 
                  className={
                    change.type === "increase" 
                      ? "text-sm text-green-600" 
                      : change.type === "decrease" 
                        ? "text-sm text-red-600" 
                        : "text-sm text-gray-500"
                  }
                >
                  {change.value}
                </span>
              </div>
            )}
          </div>
          
          <div className={`p-2 rounded-full ${iconBgClass}`}>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={`h-5 w-5 ${iconColorClass}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
            </svg>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}