"use client";

import React, { useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable
} from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { TicketCard } from "./ticket-card";
import { useTicketStore } from "@/store/ticketStore";

interface KanbanBoardProps {
  onTicketClick: (ticket: any) => void;
}

const COLUMNS = [
  { id: "IN_PROGRESS", title: "In Progress" },
  { id: "IN_REVIEW", title: "In Review" },
  { id: "COMPLETED", title: "Completed" },
  { id: "CLOSED", title: "Closed" },
];

interface DroppableColumnProps {
  id: string;
  title: string;
  count: number;
  children: React.ReactNode;
}

const DroppableColumn: React.FC<DroppableColumnProps> = ({ id, title, count, children }) => {
  const { setNodeRef } = useDroppable({
    id,
    data: {
      type: "Column",
      columnId: id,
    },
  });

  return (
    <div className="bg-muted/50 border border-border/50 rounded-xl p-4 flex flex-col h-full min-h-[500px]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-foreground tracking-tight">{title}</h2>
        <div className="bg-background text-muted-foreground text-xs font-medium rounded-full h-6 w-6 flex items-center justify-center shadow-sm">
          {count}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        <div ref={setNodeRef} className="flex flex-col gap-3 min-h-[10px] h-full" id={id}>
          {children}
        </div>
      </div>
    </div>
  );
};

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ onTicketClick }) => {
  const { tickets, updateTicketStatusOptimistic, editTicket } = useTicketStore();
  const [activeId, setActiveId] = React.useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const activeTicket = useMemo(
    () => tickets.find((t) => t._id === activeId),
    [activeId, tickets]
  );

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event: any) => {
  };

  const handleDragEnd = async (event: any) => {
    setActiveId(null);
    const { active, over } = event;

    if (!over) return;

    const ticketId = active.id;
    const overId = over.id;

    let newStatus = "";
    
    // Check if dropping on a column
    if (over.data.current?.type === "Column") {
      newStatus = over.data.current.columnId;
    } 
    // Check if dropping on another ticket
    else if (over.data.current?.type === "Ticket") {
      newStatus = over.data.current.ticket.status;
    } else {
      // Fallback
      if (COLUMNS.find((c) => c.id === overId)) {
        newStatus = overId;
      } else {
        const overTicket = tickets.find((t) => t._id === overId);
        if (overTicket) {
          newStatus = overTicket.status;
        }
      }
    }

    const currentTicket = tickets.find((t) => t._id === ticketId);

    if (newStatus && currentTicket && currentTicket.status !== newStatus) {
      updateTicketStatusOptimistic(ticketId, newStatus);
      try {
        await editTicket(ticketId, { status: newStatus });
      } catch (error) {
        updateTicketStatusOptimistic(ticketId, currentTicket.status);
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-full w-full overflow-x-auto pb-4">
        {COLUMNS.map((col) => {
          const colTickets = tickets.filter((t) => t.status === col.id);
          
          return (
            <DroppableColumn key={col.id} id={col.id} title={col.title} count={colTickets.length}>
              <SortableContext items={colTickets.map(t => t._id)}>
                {colTickets.map((ticket) => (
                  <TicketCard key={ticket._id} ticket={ticket} onClick={onTicketClick} />
                ))}
              </SortableContext>
            </DroppableColumn>
          );
        })}
      </div>

      <DragOverlay>
        {activeTicket ? (
          <div className="opacity-80 rotate-2 cursor-grabbing">
            <TicketCard ticket={activeTicket} onClick={() => {}} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
