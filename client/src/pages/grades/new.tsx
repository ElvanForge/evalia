import Layout from "@/components/layout";
import { GradeForm } from "@/components/forms/grade-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";

export default function NewGrade() {
  const [, navigate] = useLocation();

  return (
    <Layout title="Enter New Grade">
      <div className="max-w-2xl mx-auto mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Enter a New Grade</CardTitle>
          </CardHeader>
          <CardContent>
            <GradeForm 
              onSuccess={() => navigate("/")} 
            />
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
