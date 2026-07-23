"use client";

import { useState, useRef, useEffect } from "react";
import { Menu, Search, Bell, LogOut, User as UserIcon } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { NotificationSheet } from "@/components/notifications/NotificationSheet";

interface AppNavbarProps {
  onMenuClick: () => void;
  onToggleSidebar?: () => void;
}

export default function AppNavbar({ onMenuClick, onToggleSidebar }: AppNavbarProps) {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  const handleMenuClick = () => {
    if (window.innerWidth < 1024) {
      onMenuClick();
    } else {
      onToggleSidebar?.();
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 sm:h-20 bg-background/80 backdrop-blur-xl border-b border-border transition-all duration-300">
      <div className="flex items-center justify-between h-full px-4 sm:px-6 lg:px-8">
        
        {/* Left Side */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleMenuClick}
            className="p-2 -ml-2 rounded-xl text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors block"
          >
            <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          
          <div className="hidden sm:flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <span>Dashboard</span>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-2 sm:gap-4">


          <NotificationSheet />

          <div className="h-6 w-px bg-border mx-1"></div>

          {/* Theme Toggle immediately before avatar */}
          <ThemeToggle />

          <div className="h-6 w-px bg-border mx-1 hidden sm:block"></div>

          {/* Profile */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3 p-1 rounded-full hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors sm:pr-4 group cursor-pointer"
            >
              <div className="relative">
                <img 
                  src={(user as any)?.profileImage || `https://ui-avatars.com/api/?name=${user?.firstName || 'A'}+${user?.lastName || 'U'}&background=6366f1&color=fff`}
                  alt="Profile" 
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover shadow-sm ring-2 ring-background group-hover:ring-primary/20 transition-all"
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-background"></span>
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold text-foreground leading-none mb-1">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs font-medium text-muted-foreground">{user?.role || 'User'}</p>
              </div>
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-popover text-popover-foreground rounded-xl shadow-lg border border-border py-1.5 animate-in fade-in slide-in-from-top-2 z-50">
                <div className="px-4 py-2.5 border-b border-border/50 mb-1">
                  <p className="text-sm font-semibold text-foreground">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{user?.email}</p>
                </div>
                <div className="px-1.5 py-1">
                  <button 
                    onClick={() => {
                      router.push('/profile');
                      setIsDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 text-sm font-medium rounded-lg text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <UserIcon className="w-4 h-4 text-muted-foreground" /> Profile
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 text-sm font-medium rounded-lg text-destructive hover:bg-destructive/10 transition-colors mt-1"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </header>
  );
}
