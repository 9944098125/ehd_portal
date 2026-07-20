import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Ticket, BriefcaseBusiness, X } from "lucide-react";

import { useAuthStore } from "@/store/authStore";

interface AppSidebarProps {
  isMobileOpen: boolean;
  isDesktopExpanded: boolean;
  onMobileClose: () => void;
}

export default function AppSidebar({ isMobileOpen, isDesktopExpanded, onMobileClose }: AppSidebarProps) {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, visible: true },
    { name: "Projects", href: "/projects", icon: BriefcaseBusiness, visible: user?.role === "Admin" || user?.role === "Super Admin" },
  ].filter(item => item.visible);

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 bg-background/80 backdrop-blur-2xl border-r border-border transform transition-all duration-300 ease-out 
      ${isDesktopExpanded ? 'lg:w-72' : 'lg:w-20'} 
      ${isMobileOpen ? "translate-x-0 w-72 shadow-2xl shadow-primary/5" : "-translate-x-full w-72 lg:translate-x-0"}
      `}
    >
      <div className="flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className={`h-16 sm:h-20 flex items-center px-6 border-b border-border/50 transition-all duration-300 ${!isDesktopExpanded && !isMobileOpen ? 'justify-center px-0' : 'justify-between'}`}>
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md shadow-primary/20 group-hover:shadow-primary/40 transition-all duration-300">
              <span className="text-primary-foreground font-bold text-xl">E</span>
            </div>
            <span className={`text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground whitespace-nowrap transition-opacity duration-300 ${!isDesktopExpanded && !isMobileOpen ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
              EHDP
            </span>
          </Link>
          <button
            onClick={onMobileClose}
            className="lg:hidden p-2 rounded-xl text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-8 space-y-1.5 scrollbar-thin scrollbar-thumb-border hover:scrollbar-thumb-muted-foreground/30">
          <p className={`text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 transition-all duration-300 ${!isDesktopExpanded && !isMobileOpen ? 'text-center px-0 text-[10px]' : 'px-8'}`}>
            {(!isDesktopExpanded && !isMobileOpen) ? '...' : 'Menu'}
          </p>
          <div className="px-4">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href) || (pathname === '/dashboard' && item.href === '/dashboard');
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center rounded-2xl transition-all duration-200 group relative overflow-hidden mb-1.5 ${!isDesktopExpanded && !isMobileOpen ? 'justify-center p-3.5' : 'gap-3 px-4 py-3.5'} ${
                    isActive
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground font-medium"
                  }`}
                  title={(!isDesktopExpanded && !isMobileOpen) ? item.name : undefined}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 group-hover:scale-110 ${isActive ? "text-primary" : ""}`} />
                  <span className={`relative z-10 whitespace-nowrap transition-opacity duration-300 ${!isDesktopExpanded && !isMobileOpen ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
                    {item.name}
                  </span>
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 rounded-r-full bg-primary" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}
