import api from "@/lib/api";
import type { TenantInfo } from "@/lib/types";

export interface UpdateTenantRequest {
  notificationEmail?: string;
  smtpHost?:          string;
  smtpPort?:          number;
  smtpUser?:          string;
  smtpPassword?:      string;
}

export const tenantService = {
  getMe: () =>
    api.get<TenantInfo>("/api/admin/tenants/me").then(r => r.data),

  updateMe: (req: UpdateTenantRequest) =>
    api.put("/api/admin/tenants/me", req),
};
