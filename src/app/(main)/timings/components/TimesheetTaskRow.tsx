import { TicketTimingSummary } from "@/store/timingsStore";
import { PlayCircle } from "lucide-react";

export default function TimesheetTaskRow({ ticket }: { ticket: TicketTimingSummary }) {
  const renderCell = (hours: number, isTotal = false) => {
    if (!hours) return <span className="text-muted-foreground/30">—</span>;
    return <span className={isTotal ? "font-semibold text-foreground" : "text-foreground"}>{hours}h</span>;
  };

  return (
    <div className="flex flex-col border-b border-border/50 group">
      <div className="flex items-center hover:bg-accent/10 transition-colors py-0 h-16">
        <div className="flex-1 min-w-[300px] flex items-center gap-2 pl-6 border-r border-border/50 h-full">
          <PlayCircle className="w-4 h-4 text-muted-foreground opacity-50 shrink-0" />
          <div className="flex flex-col ml-1 min-w-0 pr-4">
            <span className="text-[13px] font-medium truncate" title={ticket.title}>{ticket.title}</span>
            <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
              <span className="truncate">{ticket.status} • {ticket.projectTitle}</span>
            </span>
          </div>
        </div>

        <div className="flex shrink-0 h-full">
          {[1, 2, 3, 4, 5, 6, 7].map(day => (
            <div key={day} className="w-20 md:w-28 px-3 py-2 flex items-center justify-start border-r border-border/50 transition-colors text-[13px]">
              {renderCell(ticket.dailyBreakdown[day])}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
