"use client";

import React, { useEffect, useState } from "react";
import { KanbanBoard } from "@/components/tickets/kanban-board";
import { TicketModals } from "@/components/tickets/ticket-modals";
import { useTicketStore } from "@/store/ticketStore";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function TicketsPage() {
  const { fetchTickets, isLoading } = useTicketStore();
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    mode: "create" | "edit" | "view" | null;
    ticket?: any;
  }>({ isOpen: false, mode: null });

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleTicketClick = (ticket: any) => {
    setModalState({ isOpen: true, mode: "view", ticket });
  };

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Tickets</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your projects and tasks.</p>
        </div>
        <Button onClick={() => setModalState({ isOpen: true, mode: "create" })} className="shadow-md">
          <Plus className="mr-2 h-4 w-4" /> New Ticket
        </Button>
      </div>

      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-full w-full">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-muted/30 border border-border/30 rounded-xl p-4 flex flex-col h-full min-h-[500px]">
                <div className="flex items-center justify-between mb-6">
                  <div className="h-6 w-24 bg-muted animate-pulse rounded-md"></div>
                  <div className="h-6 w-6 bg-muted animate-pulse rounded-full"></div>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="h-32 bg-muted/50 animate-pulse rounded-xl"></div>
                  <div className="h-32 bg-muted/50 animate-pulse rounded-xl"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <KanbanBoard onTicketClick={handleTicketClick} />
        )}
      </div>

      <TicketModals
        isOpen={modalState.isOpen}
        mode={modalState.mode}
        ticket={modalState.ticket}
        onClose={() => setModalState({ isOpen: false, mode: null })}
        onEdit={() => setModalState(prev => ({ ...prev, mode: "edit" }))}
      />
    </div>
  );
}
