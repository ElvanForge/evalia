import { useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import Layout from "@/components/layout";
import { GradeForm } from "@/components/forms/grade-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Grade } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditGrade() {
  const [, params] = useRoute("/grades/:id/edit");
  const [, navigate] = useLocation();
  const gradeId = params ? parseInt(params.id) : 0;

  // Fetch grade
  const { data: grade, isLoading } = useQuery<Grade>({
    queryKey: [`/api/grades/${gradeId}`],
    enabled: !!gradeId,
  });

  if (!gradeId) {
    return <div>Invalid grade ID</div>;
  }

  return (
    <Layout title="Edit Grade">
      <div className="max-w-2xl mx-auto mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Edit Grade</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-1/2" />
              </div>
            ) : grade ? (
              <GradeForm 
                grade={grade}
                onSuccess={() => navigate("/")} 
              />
            ) : (
              <div className="p-4 text-center text-gray-500">
                Grade not found. It may have been deleted.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
