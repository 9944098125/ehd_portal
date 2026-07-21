import { useState } from "react";
import { UserTimingSummary, TicketTimingSummary, useTimingsStore } from "@/store/timingsStore";
import { ChevronDown, ChevronRight, User as UserIcon } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import TimesheetTaskRow from "./TimesheetTaskRow";

export default function TeamUserRow({ user }: { user: UserTimingSummary }) {
  const [expanded, setExpanded] = useState(false);
  const [tickets, setTickets] = useState<TicketTimingSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { currentWeekStart } = useTimingsStore();

  const handleExpand = async () => {
    if (!expanded && tickets.length === 0 && user.totalHours > 0) {
      setIsLoading(true);
      try {
        const endDate = new Date(currentWeekStart);
        endDate.setDate(endDate.getDate() + 6);

        const query = new URLSearchParams();
        query.append("userId", user._id);
        query.append("startDate", currentWeekStart.toISOString());
        query.append("endDate", endDate.toISOString());

        const token = useAuthStore.getState().accessToken;
        const response = await fetch(`/api/timings/team/tickets?${query.toString()}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok) {
          setTickets(data.data.tickets);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    setExpanded(!expanded);
  };

  const renderCell = (hours: number, isTotal = false) => {
    if (!hours) return <span className="text-muted-foreground/30">—</span>;
    return <span className={isTotal ? "font-semibold text-foreground" : "text-foreground"}>{hours}h</span>;
  };

  return (
    <div className="flex flex-col border-b border-border/50 group">
      <div 
        className="flex items-center hover:bg-accent/10 transition-colors cursor-pointer py-0 h-16"
        onClick={handleExpand}
      >
        <div className="flex-1 min-w-[300px] flex items-center gap-2 pl-4 border-r border-border/50 h-full">
          {user.totalHours > 0 ? (
            expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          ) : (
            <div className="w-4 h-4 shrink-0" />
          )}
          
          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0 overflow-hidden">
            {user.profileImage ? (
              <img src={user.profileImage} alt={user.firstName} className="w-full h-full object-cover" />
            ) : (
              <UserIcon className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
          <div className="flex flex-col ml-1 min-w-0 pr-4">
            <span className="text-[13px] font-medium truncate">{user.firstName} {user.lastName}</span>
            <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
              <span className="truncate">{user.role} • {user.department || "No Dept"}</span>
            </span>
          </div>
        </div>

        <div className="flex shrink-0 h-full relative">
          {[1, 2, 3, 4, 5, 6, 7].map(day => {
            const hrs = user.dailyBreakdown[day] || 0;
            let greenPct = 0;
            let extraPct = 0;
            
            if (hrs > 0) {
              if (hrs <= 8) {
                greenPct = (hrs / 8) * 100;
              } else {
                greenPct = (8 / hrs) * 100;
                extraPct = ((hrs - 8) / hrs) * 100;
              }
            }

            return (
              <div key={day} className="w-20 md:w-28 px-3 py-2 flex items-center justify-start border-r border-border/50 transition-colors text-[13px] relative">
                <span className="z-10">{renderCell(hrs)}</span>
                
                {/* Progress Bar Line */}
                <div className="absolute bottom-0 left-0 right-0 h-[2px] flex bg-transparent">
                  {hrs > 0 && (
                    <>
                      <div className="h-full bg-green-500" style={{ width: `${greenPct}%` }} />
                      {extraPct > 0 && (
                        <div className="h-full bg-red-500" style={{ width: `${extraPct}%` }} />
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {expanded && user.totalHours > 0 && (
        <div className="flex flex-col bg-muted/5 border-t border-border/30">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : tickets.length > 0 ? (
            <div className="pl-6 border-l-2 border-primary/20 ml-[34px]">
              {tickets.map(ticket => (
                <TimesheetTaskRow key={ticket._id} ticket={ticket} />
              ))}
            </div>
          ) : (
            <div className="py-4 text-center text-[12px] text-muted-foreground">No specific tasks found.</div>
          )}
        </div>
      )}
    </div>
  );
}
