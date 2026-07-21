import { useRef, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useTimingsStore } from "@/store/timingsStore";
import TeamUserRow from "./TeamUserRow";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Users } from "lucide-react";

export default function TeamTimesheetGrid() {
  const { teamUsers, isTeamLoading, fetchNextTeamPage, teamHasMore, isFetchingNextTeamPage, currentWeekStart } = useTimingsStore();
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: teamHasMore ? teamUsers.length + 1 : teamUsers.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64,
    overscan: 5,
  });

  useEffect(() => {
    const [lastItem] = [...rowVirtualizer.getVirtualItems()].reverse();
    if (!lastItem) return;
    if (lastItem.index >= teamUsers.length - 1 && teamHasMore && !isFetchingNextTeamPage) {
      fetchNextTeamPage();
    }
  }, [teamHasMore, fetchNextTeamPage, teamUsers.length, isFetchingNextTeamPage, rowVirtualizer.getVirtualItems()]);

  const headerDates = [];
  
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
    });
  }

  if (isTeamLoading && teamUsers.length === 0) {
    return (
      <div className="p-6 space-y-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl bg-muted/20" />
        ))}
      </div>
    );
  }

  if (teamUsers.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-card rounded-xl border border-border mb-8">
        <EmptyState
          icon={Users}
          title="No team timing records found"
          description="Try adjusting your filters or select a different week."
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background border border-border rounded-xl shadow-sm overflow-hidden text-sm mb-8">
      {/* Header */}
      <div className="flex items-start border-b border-border bg-muted/30 text-muted-foreground sticky top-0 z-10 px-0">
        <div className="flex-1 min-w-[300px] flex items-center h-14 px-4 font-medium border-r border-border/50 text-[12px]">
          Team Timesheets
        </div>
        <div className="flex shrink-0">
          {headerDates.map((d, i) => (
            <div key={i} className={`w-20 md:w-28 px-3 py-2 flex flex-col border-r border-border/50 relative h-14 ${d.isWeekend ? 'bg-accent/5' : ''}`}>
              <span className="text-[11px] whitespace-nowrap">{d.name}, {d.dateStr}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Body */}
      <div ref={parentRef} className="flex-1 overflow-auto custom-scrollbar min-h-[300px]">
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const isLoaderRow = virtualRow.index > teamUsers.length - 1;
            const user = teamUsers[virtualRow.index];

            return (
              <div
                key={virtualRow.index}
                data-index={virtualRow.index}
                ref={rowVirtualizer.measureElement}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {isLoaderRow ? (
                  <div className="flex justify-center p-4">
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <TeamUserRow user={user} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
