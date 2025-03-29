import { Link, useLocation } from "wouter";
import { SidebarProps } from "@/types";

export default function Sidebar({ isOpen, onClose, currentUser }: SidebarProps) {
  const [location] = useLocation();

  const getInitials = (name: string) => {
    return name.split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className={`${isOpen ? 'block' : 'hidden'} md:block fixed md:relative w-64 h-full z-20`}>
      <div className="h-full flex flex-col bg-card shadow-md">
        <div className="p-4 border-b border-border flex justify-between items-center">
          <div className="flex items-center">
            <img src="/src/assets/evalia-logo.svg" alt="Evalia Logo" className="h-6 w-6 mr-2" />
            <h1 className="text-xl font-medium">Evalia</h1>
          </div>
          <button 
            onClick={onClose}
            className="md:hidden text-muted-foreground hover:text-foreground"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {currentUser && (
          <div className="p-4 border-b border-border">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center mr-3">
                <span>{getInitials(`${currentUser.firstName} ${currentUser.lastName}`)}</span>
              </div>
              <div>
                <p className="font-medium">{`${currentUser.firstName} ${currentUser.lastName}`}</p>
                <p className="text-sm text-muted-foreground">{currentUser.subject} Teacher</p>
              </div>
            </div>
          </div>
        )}
        
        <nav className="flex-grow overflow-y-auto">
          <ul className="p-2">
            <li>
              <Link href="/">
                <a className={`flex items-center p-3 rounded-lg ${location === "/" ? "text-primary bg-primary/10" : "hover:bg-muted"}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>Home</span>
                </a>
              </Link>
            </li>
            <li>
              <Link href="/dashboard">
                <a className={`flex items-center p-3 rounded-lg ${location === "/dashboard" ? "text-primary bg-primary/10" : "hover:bg-muted"}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span>Dashboard</span>
                </a>
              </Link>
            </li>
            <li>
              <Link href="/classes">
                <a className={`flex items-center p-3 rounded-lg ${location === "/classes" ? "text-primary bg-primary/10" : "hover:bg-muted"}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>Classes</span>
                </a>
              </Link>
            </li>
            <li>
              <Link href="/students">
                <a className={`flex items-center p-3 rounded-lg ${location === "/students" ? "text-primary bg-primary/10" : "hover:bg-muted"}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Students</span>
                </a>
              </Link>
            </li>
            <li>
              <Link href="/assignments">
                <a className={`flex items-center p-3 rounded-lg ${location === "/assignments" ? "text-primary bg-primary/10" : "hover:bg-muted"}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  <span>Assignments</span>
                </a>
              </Link>
            </li>
            <li>
              <Link href="/grades">
                <a className={`flex items-center p-3 rounded-lg ${location === "/grades" ? "text-primary bg-primary/10" : "hover:bg-muted"}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span>Grades</span>
                </a>
              </Link>
            </li>
            <li>
              <Link href="/reports">
                <a className={`flex items-center p-3 rounded-lg ${location === "/reports" ? "text-primary bg-primary/10" : "hover:bg-muted"}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Reports</span>
                </a>
              </Link>
            </li>
          </ul>
        </nav>
        
        <div className="p-4 border-t border-border">
          <Link href="/settings">
            <a className={`flex items-center p-2 rounded ${location === "/settings" ? "text-primary bg-primary/10" : "hover:bg-muted"} w-full`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Settings</span>
            </a>
          </Link>
          <Link href="/api/auth/logout">
            <a className="flex items-center p-2 rounded hover:bg-muted text-destructive w-full mt-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Logout</span>
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
}
