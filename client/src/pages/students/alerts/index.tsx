import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/ui/page-header";

interface StudentAlert {
  studentId: number;
  studentName: string;
  className: string;
  type: 'danger' | 'warning' | 'success';
  message: string;
}

export default function StudentAlertsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<StudentAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'danger' | 'warning' | 'success'>('all');

  useEffect(() => {
    const fetchAlerts = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/students/alerts');
        if (response.ok) {
          const data = await response.json();
          setAlerts(data || []);
        } else {
          toast({
            title: "Error fetching alerts",
            description: "There was a problem loading student alerts.",
            variant: "destructive",
          });
          setAlerts([]);
        }
      } catch (error) {
        console.error('Error fetching student alerts:', error);
        toast({
          title: "Error fetching alerts",
          description: "There was a problem loading student alerts.",
          variant: "destructive",
        });
        setAlerts([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user) {
      fetchAlerts();
    }
  }, [user, toast]);

  const filteredAlerts = filter === 'all' 
    ? alerts 
    : alerts.filter(alert => alert.type === filter);

  function getBackgroundClass(type: string) {
    switch (type) {
      case 'danger':
        return 'bg-red-50 dark:bg-red-900/20 border-red-500';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500';
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-500';
      default:
        return 'bg-gray-50 dark:bg-gray-800/50 border-gray-300';
    }
  }

  function getTextClass(type: string) {
    switch (type) {
      case 'danger':
        return 'text-red-600 dark:text-red-400';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'success':
        return 'text-green-600 dark:text-green-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  }

  function getTypeLabel(type: string) {
    switch (type) {
      case 'danger':
        return 'High Priority';
      case 'warning':
        return 'Needs Attention';
      case 'success':
        return 'Good Progress';
      default:
        return 'Information';
    }
  }

  function getTypeIcon(type: string) {
    switch (type) {
      case 'danger':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
        );
      case 'warning':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-500"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        );
      case 'success':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        );
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="Student Alerts"
        description="Monitor students who need attention or are showing progress"
      />

      <div className="mb-6 flex flex-wrap gap-3">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
          className="mr-2"
        >
          All Alerts
        </Button>
        <Button
          variant={filter === 'danger' ? 'default' : 'outline'}
          onClick={() => setFilter('danger')}
          className="mr-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
          High Priority
        </Button>
        <Button
          variant={filter === 'warning' ? 'default' : 'outline'}
          onClick={() => setFilter('warning')}
          className="mr-2 text-yellow-600 border-yellow-200 hover:bg-yellow-50 hover:text-yellow-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          Needs Attention
        </Button>
        <Button
          variant={filter === 'success' ? 'default' : 'outline'}
          onClick={() => setFilter('success')}
          className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
          Good Progress
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : filteredAlerts.length === 0 ? (
        <Card>
          <CardContent className="py-10">
            <div className="text-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 text-muted-foreground"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
              <h3 className="text-lg font-medium mb-2">No Alerts Found</h3>
              <p className="text-muted-foreground">
                {filter === 'all' 
                  ? "There are currently no alerts for your students." 
                  : `There are no ${filter} alerts for your students.`}
              </p>
              {filter !== 'all' && (
                <Button 
                  variant="link" 
                  onClick={() => setFilter('all')}
                  className="mt-2"
                >
                  View all alerts
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAlerts.map((alert, index) => (
            <Card key={index} className={`overflow-hidden border-l-4 ${getBackgroundClass(alert.type)}`}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(alert.type)}
                    <CardTitle className="text-lg">{alert.studentName}</CardTitle>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${getBackgroundClass(alert.type)}`}>
                    {getTypeLabel(alert.type)}
                  </span>
                </div>
                <CardDescription>{alert.className}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className={`${getTextClass(alert.type)} font-medium`}>
                  {alert.message}
                </p>
                <div className="mt-4 flex justify-end">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => window.location.href = `/students/${alert.studentId}`}
                  >
                    View Student
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}