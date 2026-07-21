import { useTimingsStore } from "@/store/timingsStore";
import TimesheetTaskRow from "./TimesheetTaskRow";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Clock } from "lucide-react";

export default function MyTimesheetGrid() {
  const { myTickets, isMyLoading, currentWeekStart } = useTimingsStore();

  const headerDates = [];
  
  const aggregateDaily = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };
  myTickets.forEach(t => {
    for (let i = 1; i <= 7; i++) {
      (aggregateDaily as any)[i] += t.dailyBreakdown[i] || 0;
    }
  });

  for (let i = 0; i < 7; i++) {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + i);
    const dayName = d.toLocaleDateString(undefined, { weekday: 'short' });
    const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const dayIndex = d.getDay() === 0 ? 7 : d.getDay();
    
    headerDates.push({
      name: dayName,
      dateStr: dateStr,
      isWeekend: d.getDay() === 0 || d.getDay() === 6,
      dayIndex: dayIndex,
      totalHrs: (aggregateDaily as any)[dayIndex]
    });
  }

  if (isMyLoading && myTickets.length === 0) {
    return (
      <div className="p-6 space-y-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl bg-muted/20" />
        ))}
      </div>
    );
  }

  if (myTickets.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-card rounded-xl border border-border mb-8">
        <EmptyState
          icon={Clock}
          title="No timing records found for you"
          description="Try adjusting your filters or select a different week."
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background border border-border rounded-xl shadow-sm overflow-hidden text-sm mb-8">
      {/* Header exactly mimicking ClickUp */}
      <div className="flex items-start border-b border-border bg-muted/30 text-muted-foreground sticky top-0 z-10 px-0">
        <div className="flex-1 min-w-[300px] flex items-center h-14 px-4 font-medium border-r border-border/50 text-[12px]">
          My Timesheet
        </div>
        <div className="flex shrink-0">
          {headerDates.map((d, i) => {
            const hrs = d.totalHrs;
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
              <div key={i} className={`w-20 md:w-28 px-3 py-2 flex flex-col border-r border-border/50 relative ${d.isWeekend ? 'bg-accent/5' : ''}`}>
                <span className="text-[11px] whitespace-nowrap">{d.name}, {d.dateStr}</span>
                <span className={`text-[13px] font-semibold mt-0.5 ${hrs > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {hrs > 0 ? `${hrs}h` : '0h'}
                </span>
                
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

      {/* Body */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        {myTickets.map((ticket) => (
          <TimesheetTaskRow key={ticket._id} ticket={ticket} />
        ))}
      </div>
    </div>
  );
}
