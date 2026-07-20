"use client";

import { useState, useEffect } from "react";
import AppSidebar from "./app-sidebar";
import AppNavbar from "./app-navbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopExpanded, setIsDesktopExpanded] = useState(true);

  // Prevent scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const toggleSidebar = () => {
    setIsDesktopExpanded(!isDesktopExpanded);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex font-sans selection:bg-indigo-500/30">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-zinc-950/60 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <AppSidebar 
        isMobileOpen={isMobileMenuOpen}
        isDesktopExpanded={isDesktopExpanded}
        onMobileClose={() => setIsMobileMenuOpen(false)} 
      />

      {/* Main Content */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-out ${isDesktopExpanded ? 'lg:ml-72' : 'lg:ml-20'}`}>
        <AppNavbar 
          onMenuClick={() => setIsMobileMenuOpen(true)} 
          onToggleSidebar={toggleSidebar} 
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
          <div className="mx-auto w-full h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
