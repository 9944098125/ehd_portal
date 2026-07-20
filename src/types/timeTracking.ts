export interface TimeEntry {
  _id: string;
  ticket: any; // Populated ticket
  user: any; // Populated user
  project: any; // Populated project
  hours: number;
  description?: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimeEntryResponse {
  success: boolean;
  message: string;
  data: {
    entries: TimeEntry[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export interface CreateTimeEntryPayload {
  ticket: string;
  hours: number;
  description?: string;
  date?: string;
}

export interface UpdateTimeEntryPayload {
  hours?: number;
  description?: string;
}
