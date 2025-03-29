import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface GradeDistributionProps {
  distribution: {
    A: number;
    B: number;
    C: number;
    D: number;
    F: number;
  };
}

export default function GradeDistribution({ distribution }: GradeDistributionProps) {
  const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
  
  // If no grades, show empty state
  if (total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Grade Distribution</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-10">
          <p className="text-muted-foreground">No grade data available</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate percentages for each grade
  const getPercentage = (count: number) => {
    return total > 0 ? Math.round((count / total) * 100) : 0;
  };

  // Get class name for grade bar based on grade letter
  const getGradeBarClass = (grade: string) => {
    switch (grade) {
      case 'A': return 'bg-green-500';
      case 'B': return 'bg-blue-500';
      case 'C': return 'bg-yellow-500';
      case 'D': return 'bg-orange-500';
      case 'F': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Grade Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(distribution).map(([grade, count]) => {
            const percentage = getPercentage(count);
            return (
              <div key={grade} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{grade}</span>
                  <span className="text-sm text-muted-foreground">{count} students ({percentage}%)</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${getGradeBarClass(grade)}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}