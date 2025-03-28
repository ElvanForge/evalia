import { GradeDistributionProps } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useRef } from "react";
import { 
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  Legend,
  Tooltip
} from "chart.js";
import GradeBadge from "../ui/grade-badge";

Chart.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Legend,
  Tooltip
);

export default function GradeDistribution({ distribution }: GradeDistributionProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // Destroy previous chart instance if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    const grades = ['A', 'B', 'C', 'D', 'F'];
    const percentages = grades.map(grade => distribution[grade as keyof typeof distribution] || 0);

    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: grades,
        datasets: [{
          label: 'Grade Distribution',
          data: percentages,
          backgroundColor: [
            'rgba(76, 175, 80, 0.7)',   // A - Green
            'rgba(139, 195, 74, 0.7)',  // B - Light Green
            'rgba(255, 235, 59, 0.7)',  // C - Yellow
            'rgba(255, 152, 0, 0.7)',   // D - Orange
            'rgba(244, 67, 54, 0.7)',   // F - Red
          ],
          borderColor: [
            'rgba(76, 175, 80, 1)',
            'rgba(139, 195, 74, 1)',
            'rgba(255, 235, 59, 1)',
            'rgba(255, 152, 0, 1)',
            'rgba(244, 67, 54, 1)',
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              callback: function(value) {
                return value + '%';
              }
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return context.parsed.y + '%';
              }
            }
          }
        }
      }
    });

    // Clean up on component unmount
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [distribution]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between">
          <CardTitle className="text-lg font-medium">Class Performance</CardTitle>
          <div className="flex mt-2 sm:mt-0">
            <button className="bg-muted px-3 py-1 rounded-md text-sm mr-2">
              This Semester
            </button>
            <button className="text-muted-foreground px-2 py-1 rounded-md text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
              </svg>
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64 mb-4">
          <canvas ref={chartRef}></canvas>
        </div>
        
        <div className="grid grid-cols-5 gap-2 mt-4">
          <div className="text-center">
            <GradeBadge grade="A" />
            <p className="text-sm mt-1">{distribution.A}%</p>
          </div>
          <div className="text-center">
            <GradeBadge grade="B" />
            <p className="text-sm mt-1">{distribution.B}%</p>
          </div>
          <div className="text-center">
            <GradeBadge grade="C" />
            <p className="text-sm mt-1">{distribution.C}%</p>
          </div>
          <div className="text-center">
            <GradeBadge grade="D" />
            <p className="text-sm mt-1">{distribution.D}%</p>
          </div>
          <div className="text-center">
            <GradeBadge grade="F" />
            <p className="text-sm mt-1">{distribution.F}%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
