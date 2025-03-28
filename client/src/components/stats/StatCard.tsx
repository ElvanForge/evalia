import { StatCardProps } from "@/types";

export default function StatCard({ title, value, icon, change, iconBgClass, iconColorClass }: StatCardProps) {
  return (
    <div className="bg-card rounded-lg shadow-sm p-5">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-muted-foreground text-sm font-medium uppercase">{title}</p>
          <h3 className="text-2xl font-medium mt-1">{value}</h3>
          {change && (
            <p className={`text-sm mt-1 ${
              change.type === 'increase' ? 'text-green-600' : 
              change.type === 'decrease' ? 'text-red-600' : 
              'text-muted-foreground'
            }`}>
              {change.type === 'increase' && 
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              }
              {change.type === 'decrease' && 
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              }
              {change.value}
            </p>
          )}
        </div>
        <div className={`rounded-full p-2 ${iconBgClass}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${iconColorClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
          </svg>
        </div>
      </div>
    </div>
  );
}
