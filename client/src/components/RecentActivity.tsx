import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

interface Activity {
  type: string;
  date: string | Date;
  description: string;
  details?: string;
}

interface RecentActivityProps {
  activities: Activity[];
}

export default function RecentActivity({ activities }: RecentActivityProps) {
  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-10">
          <p className="text-muted-foreground">No recent activity</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {activities.map((activity, index) => {
            let formattedDate = "Recent";
            try {
              const activityDate = typeof activity.date === 'string' 
                ? new Date(activity.date) 
                : activity.date;
                
              // Verify it's a valid date before formatting
              if (activityDate instanceof Date && !isNaN(activityDate.getTime())) {
                formattedDate = format(activityDate, 'MMM d, h:mm a');
              }
            } catch (e) {
              console.error("Error formatting date:", e);
            }
            
            return (
              <div key={index} className="relative pl-6 pb-6 border-l border-border last:border-0 last:pb-0">
                <div className="absolute left-0 top-0 transform -translate-x-1/2 bg-primary h-3 w-3 rounded-full" />
                <div className="text-sm">
                  <div className="flex justify-between">
                    <p className="font-medium">{activity.description}</p>
                    <p className="text-muted-foreground">{formattedDate}</p>
                  </div>
                  {activity.details && (
                    <p className="text-muted-foreground mt-1">{activity.details}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}