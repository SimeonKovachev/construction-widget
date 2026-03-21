import api from "@/lib/api";
import type { ConversationSummary, ConversationDetail } from "@/lib/types";

export interface ConversationFilters {
  from?: string;
  to?: string;
  flagged?: boolean;
  search?: string;
}

export const conversationService = {
  getAll: (filters?: ConversationFilters) => {
    const params = new URLSearchParams();
    if (filters?.from)    params.set("from", filters.from);
    if (filters?.to)      params.set("to", filters.to);
    if (filters?.flagged) params.set("flagged", "true");
    if (filters?.search)  params.set("search", filters.search);
    const qs = params.toString();
    return api.get<ConversationSummary[]>(`/api/admin/conversations${qs ? `?${qs}` : ""}`).then(r => r.data);
  },

  getById: (id: string) =>
    api.get<ConversationDetail>(`/api/admin/conversations/${id}`).then(r => r.data),

  setFlag: (id: string, isFlagged: boolean) =>
    api.patch(`/api/admin/conversations/${id}/flag`, { isFlagged }).then(r => r.data),
};
