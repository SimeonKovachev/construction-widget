import api from "@/lib/api";
import type { Lead, UpdateLeadRequest } from "@/lib/types";

export const leadsService = {
  getAll: () =>
    api.get<Lead[]>("/api/admin/leads").then(r => r.data),

  getById: (id: string) =>
    api.get<Lead>(`/api/admin/leads/${id}`).then(r => r.data),

  update: (id: string, req: UpdateLeadRequest) =>
    api.patch<Lead>(`/api/admin/leads/${id}`, req).then(r => r.data),

  delete: (id: string) =>
    api.delete(`/api/admin/leads/${id}`),
};
