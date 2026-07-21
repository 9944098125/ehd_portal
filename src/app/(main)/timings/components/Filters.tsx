import { useState, useEffect } from "react";
import { useTimingsStore } from "@/store/timingsStore";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Filters() {
  const { filters, setFilters, currentWeekStart, nextWeek, prevWeek, setWeek } = useTimingsStore();
  const [searchTerm, setSearchTerm] = useState(filters.search);

  useEffect(() => {
    const delay = setTimeout(() => {
      if (searchTerm !== filters.search) {
        setFilters({ search: searchTerm });
      }
    }, 500);
    return () => clearTimeout(delay);
  }, [searchTerm, filters.search, setFilters]);

  const endOfWeek = new Date(currentWeekStart);
  endOfWeek.setDate(endOfWeek.getDate() + 6);

  const formatWeek = () => {
    const startStr = currentWeekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const endStr = endOfWeek.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    return `${startStr} - ${endStr}`;
  };

  return (
    <div className="flex flex-col gap-4 bg-card p-4 rounded-xl border border-border">
      {/* Top row: Week Navigator */}
      <div className="flex items-center justify-between">
        <div className="font-semibold text-lg flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-primary" />
          <span>Timesheet</span>
        </div>
        
        <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-1 overflow-x-auto">
          <Button variant="ghost" size="icon" onClick={prevWeek} className="h-8 w-8 shrink-0">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium min-w-[150px] text-center whitespace-nowrap">{formatWeek()}</span>
          <Button variant="ghost" size="icon" onClick={nextWeek} className="h-8 w-8 shrink-0">
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setWeek(new Date())} className="ml-2 h-8 shrink-0">
            Today
          </Button>
        </div>
      </div>

      {/* Bottom row: Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search users..." 
            className="pl-9 bg-background"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Select value={(filters.role || "all") as string} onValueChange={(val) => setFilters({ role: val === "all" ? "" : (val as string) })}>
          <SelectTrigger className="bg-background">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="Employee">Employee</SelectItem>
            <SelectItem value="Admin">Admin</SelectItem>
            <SelectItem value="Super Admin">Super Admin</SelectItem>
          </SelectContent>
        </Select>

        <Select value={(filters.department || "all") as string} onValueChange={(val) => setFilters({ department: val === "all" ? "" : (val as string) })}>
          <SelectTrigger className="bg-background">
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            <SelectItem value="Human Resource">Human Resource</SelectItem>
            <SelectItem value="Information Technology">Information Technology</SelectItem>
            <SelectItem value="Finance">Finance</SelectItem>
            <SelectItem value="Administration">Administration</SelectItem>
            <SelectItem value="Research & Development">Research & Development</SelectItem>
            <SelectItem value="Legal">Legal</SelectItem>
            <SelectItem value="Security">Security</SelectItem>
          </SelectContent>
        </Select>

        <Input 
          placeholder="Project ID..." 
          className="bg-background"
          value={filters.project}
          onChange={(e) => setFilters({ project: e.target.value })}
        />
      </div>
    </div>
  );
}
