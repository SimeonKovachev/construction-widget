import api from "@/lib/api";
import type { AnalyticsData, AnalyticsRange } from "@/lib/types";

export const analyticsService = {
  get: (range: AnalyticsRange = "30d") =>
    api.get<AnalyticsData>(`/api/admin/analytics?range=${range}`).then((r) => r.data),
};
