import { RecentActivityProps } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length > 0 ? (
            activities.map((activity, index) => (
              <div key={index} className="flex">
                <div className={`rounded-full w-8 h-8 ${activity.bgColorClass} flex items-center justify-center mr-3`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${activity.iconColorClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={activity.icon} />
                  </svg>
                </div>
                <div>
                  <p className="text-sm" dangerouslySetInnerHTML={{ __html: activity.description }}></p>
                  <p className="text-xs text-muted-foreground mt-1">{activity.timestamp}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground">No recent activities found</p>
            </div>
          )}
        </div>
        
        <Button variant="link" className="w-full mt-4">
          View All Activity
        </Button>
      </CardContent>
    </Card>
  );
}
