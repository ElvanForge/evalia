import { cn } from "@/lib/utils";

interface GradeBadgeProps {
  grade: string;
  percentage?: number;
  className?: string;
}

export function GradeBadge({ grade, percentage, className }: GradeBadgeProps) {
  const getBadgeColor = (grade: string): string => {
    // First letter determines color scheme
    const firstChar = grade.charAt(0).toUpperCase();
    
    switch (firstChar) {
      case 'A':
        return "bg-green-100 text-green-800";
      case 'B':
        return "bg-green-100 text-green-800";
      case 'C':
        return "bg-yellow-100 text-yellow-800";
      case 'D':
        return "bg-orange-100 text-orange-800";
      case 'F':
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const displayText = percentage 
    ? `${grade} (${percentage.toFixed(1)}%)` 
    : grade;

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 text-xs font-semibold leading-5",
        getBadgeColor(grade),
        className
      )}
    >
      {displayText}
    </span>
  );
}
