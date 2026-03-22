import api from "@/lib/api";
import type { ChatPhoto } from "@/lib/types";

export const photoService = {
  getBySession: (sessionId: string) =>
    api.get<ChatPhoto[]>(`/api/admin/photos?sessionId=${encodeURIComponent(sessionId)}`).then((r) => r.data),
};
