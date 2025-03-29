import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/use-auth.tsx";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  FileText,
  BarChart3,
  Settings,
  Menu,
  X,
  LogOut,
  LogIn,
  BookText,
  ClipboardCheck,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

type SidebarLinkProps = {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
};

const SidebarLink = ({ href, icon, children, onClick }: SidebarLinkProps) => {
  const [location] = useLocation();
  const isActive = location === href;

  return (
    <Link href={href}>
      <div
        onClick={onClick}
        className={cn(
          "flex items-center px-4 py-2 text-sm font-medium rounded-md cursor-pointer",
          isActive
            ? "bg-white/15 text-white" // Lighter selection highlight
            : "text-white hover:bg-white/10 hover:text-white"
        )}
      >
        <span className={cn("mr-3 h-5 w-5", isActive ? "text-white" : "text-white")}>
          {icon}
        </span>
        {children}
      </div>
    </Link>
  );
};

export function Sidebar() {
  const { isMobile } = useMobile();
  const [isOpen, setIsOpen] = useState(false);
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);
  const { user, logout } = useAuth();
  const [location] = useLocation();

  // Close the sidebar when navigating on mobile
  useEffect(() => {
    if (isMobile) {
      setIsOpen(false);
    }
  }, [location, isMobile]);

  const sidebarContent = (
    <>
      <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4">
          <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <span className="ml-2 text-xl font-bold text-white">GradeTrack</span>
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto text-white hover:text-white/80"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-6 w-6" />
            </Button>
          )}
        </div>

        <nav className="mt-5 flex-1 px-2 space-y-1">
          <SidebarLink 
            href="/" 
            icon={<LayoutDashboard />}
            onClick={() => isMobile && setIsOpen(false)}
          >
            Dashboard
          </SidebarLink>
          
          <SidebarLink 
            href="/students" 
            icon={<Users />}
            onClick={() => isMobile && setIsOpen(false)}
          >
            Students
          </SidebarLink>
          
          <SidebarLink 
            href="/classes" 
            icon={<FolderKanban />}
            onClick={() => isMobile && setIsOpen(false)}
          >
            Classes
          </SidebarLink>
          
          <SidebarLink 
            href="/assignments" 
            icon={<FileText />}
            onClick={() => isMobile && setIsOpen(false)}
          >
            Assignments
          </SidebarLink>
          
          <SidebarLink 
            href="/quizzes" 
            icon={<BookText />}
            onClick={() => isMobile && setIsOpen(false)}
          >
            Quizzes
          </SidebarLink>
          
          <SidebarLink 
            href="/reports" 
            icon={<BarChart3 />}
            onClick={() => isMobile && setIsOpen(false)}
          >
            Reports
          </SidebarLink>
          
          <SidebarLink 
            href="/settings" 
            icon={<Settings />}
            onClick={() => isMobile && setIsOpen(false)}
          >
            Settings
          </SidebarLink>
          
          {user?.role === 'manager' && (
            <SidebarLink 
              href="/manager" 
              icon={<ClipboardCheck />}
              onClick={() => isMobile && setIsOpen(false)}
            >
              Manager Portal
            </SidebarLink>
          )}
        </nav>
      </div>

      {user ? (
        <div className="p-4 border-t border-white/20">
          <div className="flex items-center">
            <Avatar className="h-10 w-10">
              <AvatarImage src="" alt={`${user.firstName} ${user.lastName}`} />
              <AvatarFallback className="bg-[#0ba2b0] text-white">
                {user.firstName.charAt(0)}{user.lastName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">{user.firstName} {user.lastName}</p>
              <p className="text-xs font-medium text-white/80">{user.subject || (user.role === 'manager' ? "School Manager" : "Teacher")}</p>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="ml-auto text-white hover:text-white/80"
              onClick={logout}
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-4 border-t border-white/20">
          <Link href="/auth/login">
            <div className="flex items-center text-sm font-medium text-white cursor-pointer">
              <LogIn className="h-5 w-5 mr-2" />
              Login
            </div>
          </Link>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Mobile menu button */}
      {isMobile && (
        <button
          onClick={() => setIsOpen(true)}
          className="md:hidden px-4 text-[#0ba2b0] focus:outline-none hover:text-[#085a60]"
        >
          <Menu className="h-6 w-6" />
        </button>
      )}

      {/* Mobile sidebar */}
      {isMobile && isOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75"
            onClick={() => setIsOpen(false)}
          />

          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-gradient-to-r from-[#8dd9d2] to-[#0ba2b0]">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      {!isMobile && (
        <>
          {!isSidebarHidden ? (
            <div className="hidden md:flex md:flex-shrink-0 transition-all duration-300">
              <div className="flex flex-col w-64 relative">
                <div className="flex flex-col h-0 flex-1 bg-gradient-to-r from-[#8dd9d2] to-[#0ba2b0]">
                  {sidebarContent}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute -right-4 top-1/2 transform -translate-y-1/2 bg-white border border-gray-200 rounded-full p-1 shadow-md text-gray-600 hover:text-gray-900"
                    onClick={() => setIsSidebarHidden(true)}
                    title="Hide Sidebar"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="hidden md:flex md:flex-shrink-0 transition-all duration-300">
              <Button 
                variant="ghost" 
                size="icon" 
                className="fixed left-4 top-1/2 transform -translate-y-1/2 bg-white border border-gray-200 rounded-full p-1 shadow-md text-gray-600 hover:text-gray-900 z-10"
                onClick={() => setIsSidebarHidden(false)}
                title="Show Sidebar"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          )}
        </>
      )}
    </>
  );
}
