"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import { Paperclip, MoreVertical, Clock } from "lucide-react";

export const formatHours = (val: number) => {
  const hours = Math.floor(val);
  const mins = Math.round((val - hours) * 60);
  let label = "";
  if (hours > 0) label += `${hours}hr${hours > 1 ? 's' : ''}`;
  if (hours > 0 && mins > 0) label += ` `;
  if (mins > 0) label += `${mins}mins`;
  return label || "0mins";
};

interface TicketCardProps {
  ticket: any;
  onClick: (ticket: any) => void;
}

export const TicketCard: React.FC<TicketCardProps> = ({ ticket, onClick }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: ticket._id,
    data: {
      type: "Ticket",
      ticket,
    },
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT": return "bg-destructive text-destructive-foreground hover:bg-destructive/90";
      case "HIGH": return "bg-orange-500 hover:bg-orange-600 text-white";
      case "MEDIUM": return "bg-blue-500 hover:bg-blue-600 text-white";
      case "LOW": return "bg-zinc-500 hover:bg-zinc-600 text-white";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getRandomColor = (id: string) => {
    const colors = [
      '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', 
      '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', 
      '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'
    ];
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    borderBottomColor: ticket._id ? getRandomColor(ticket._id.toString()) : '#3b82f6',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-card text-card-foreground border border-border border-b-4 rounded-xl p-4 shadow-sm cursor-grab ${isDragging ? "opacity-50 ring-2 ring-primary" : ""} hover:shadow-md hover:border-primary/30 transition-all duration-200`}
      onClick={() => onClick(ticket)}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-sm truncate pr-2 tracking-tight" title={ticket.title}>
          {ticket.title}
        </h3>
        <button className="text-muted-foreground hover:text-foreground transition-colors" onClick={(e) => e.stopPropagation()}>
          <MoreVertical size={16} />
        </button>
      </div>

      {ticket.images && ticket.images.length > 1 ? (
        <div className="w-full h-32 mb-3 flex overflow-x-auto snap-x snap-mandatory rounded-md gap-1 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {ticket.images.map((img: string, idx: number) => (
            <img key={idx} src={img} alt={`Ticket ${idx}`} className="w-full h-full object-cover flex-shrink-0 snap-center rounded-md" />
          ))}
        </div>
      ) : ticket.images && ticket.images.length === 1 ? (
        <div className="w-full h-32 mb-3 rounded-md overflow-hidden">
          <img src={ticket.images[0]} alt="Ticket" className="w-full h-full object-cover" />
        </div>
      ) : null}

      <div className="mb-3">
        <p className="text-xs text-muted-foreground line-clamp-2 mb-2 leading-relaxed">
          {ticket.content}
        </p>
        <span className="text-[10px] text-muted-foreground bg-muted px-2 py-1 rounded-md font-medium">
          {ticket.projectId?.name || "Unknown Project"}
        </span>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
          <Badge className={`text-[10px] uppercase font-bold px-1.5 shadow-sm border-none ${getPriorityColor(ticket.priority)}`}>
            {ticket.priority || "MEDIUM"}
          </Badge>
          {(ticket.totalTime !== undefined && ticket.totalTime > 0) && (
            <Badge variant="outline" className="text-[10px] uppercase font-bold px-1.5 shadow-sm bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatHours(ticket.totalTime)}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center space-x-3 text-muted-foreground">
          {ticket.images && ticket.images.length > 0 && (
            <div className="flex items-center space-x-1 text-xs">
              <Paperclip size={14} />
              <span>{ticket.images.length}</span>
            </div>
          )}
          
          <div className="flex -space-x-2 overflow-hidden">
            {/* Show up to 3 assignees, or fallback to owner if no assignees */}
            {ticket.assignees && ticket.assignees.length > 0 ? (
              <>
                {ticket.assignees.slice(0, 3).map((assignee: any) => (
                  assignee.profileImage ? (
                    <img
                      key={assignee._id}
                      className="inline-block h-6 w-6 rounded-full ring-2 ring-background object-cover"
                      src={assignee.profileImage}
                      alt={assignee.firstName}
                      title={`${assignee.firstName} ${assignee.lastName}`}
                    />
                  ) : (
                    <div 
                      key={assignee._id} 
                      className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-[10px] font-medium ring-2 ring-background"
                      title={`${assignee.firstName} ${assignee.lastName}`}
                    >
                      {assignee.firstName?.[0] || "?"}
                    </div>
                  )
                ))}
                {ticket.assignees.length > 3 && (
                  <div className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-muted text-muted-foreground text-[10px] font-medium ring-2 ring-background">
                    +{ticket.assignees.length - 3}
                  </div>
                )}
              </>
            ) : (
              ticket.owner?.profileImage ? (
                <img
                  className="inline-block h-6 w-6 rounded-full ring-2 ring-background object-cover"
                  src={ticket.owner.profileImage}
                  alt={ticket.owner.firstName}
                  title={`Creator: ${ticket.owner.firstName} ${ticket.owner.lastName}`}
                />
              ) : (
                <div 
                  className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-[10px] font-medium ring-2 ring-background"
                  title={`Creator: ${ticket.owner?.firstName} ${ticket.owner?.lastName}`}
                >
                  {ticket.owner?.firstName?.[0] || "?"}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
