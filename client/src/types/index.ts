import {
  Class,
  Student,
  Assignment,
  Grade,
  Teacher,
  GradeDistribution
} from "@shared/schema";

export interface AuthContextType {
  currentUser: Teacher | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: Teacher | null;
}

export interface HeaderProps {
  onToggleSidebar: () => void;
  title: string;
}

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  change?: {
    value: string;
    type: 'increase' | 'decrease' | 'neutral';
  };
  iconBgClass: string;
  iconColorClass: string;
}

export interface GradeDistributionProps {
  distribution: GradeDistribution;
}

export interface RecentActivityProps {
  activities: {
    type: string;
    description: string;
    timestamp: string;
    icon: string;
    bgColorClass: string;
    iconColorClass: string;
  }[];
}

export interface GradeTableProps {
  assignments: Assignment[];
  onViewAssignment: (id: number) => void;
  onEditAssignment: (id: number) => void;
}

export interface GradeBadgeProps {
  grade: string;
  percentage?: number;
  showPercentage?: boolean;
}

export type AssignmentType = 'Homework' | 'Quiz' | 'Exam' | 'Lab' | 'Project';

export type GradeLevel = 'A' | 'B' | 'C' | 'D' | 'F';
