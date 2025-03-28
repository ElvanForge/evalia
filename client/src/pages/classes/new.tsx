import Layout from "@/components/layout";
import { ClassForm } from "@/components/forms/class-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";

export default function NewClass() {
  const [, navigate] = useLocation();

  return (
    <Layout title="Create New Class">
      <div className="max-w-2xl mx-auto mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Create a New Class</CardTitle>
          </CardHeader>
          <CardContent>
            <ClassForm 
              onSuccess={(data) => navigate(`/classes/${data.id}`)} 
            />
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
