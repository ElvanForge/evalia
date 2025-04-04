import { ReactNode } from "react";

interface PageHeaderProps {
  heading: string;
  text?: string;
  children?: ReactNode;
}

export function PageHeader({
  heading,
  text,
  children,
}: PageHeaderProps) {
  return (
    <div className="mb-10">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">{heading}</h1>
        {text && <p className="text-muted-foreground">{text}</p>}
      </div>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}