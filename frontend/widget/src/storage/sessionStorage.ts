// ── Types ──────────────────────────────────────────────────────────────────

export interface StoredMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  type?: "text" | "image";
  imageUrls?: string[];   // URL paths only — never binary data
}

export interface StoredSession {
  sessionId: string;
  messages: StoredMessage[];
  startedAt: string;      // ISO
  lastActivity: string;   // ISO — used for sorting and display
  preview: string;        // first user message, ≤80 chars
}

// ── Constants ──────────────────────────────────────────────────────────────

const MAX_SESSIONS = 3;
const MAX_MESSAGES = 20;   // ~5KB per session at 250 bytes/msg

const storageKey = (tenantId: string) => `cw_sessions_${tenantId}`;

// ── API ────────────────────────────────────────────────────────────────────

export function loadSessions(tenantId: string): StoredSession[] {
  try {
    const raw = localStorage.getItem(storageKey(tenantId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as StoredSession[];
  } catch {
    return [];
  }
}

export function saveSession(tenantId: string, session: StoredSession): void {
  try {
    const sessions = loadSessions(tenantId);

    // Trim to max message count (keep newest)
    const trimmedMessages = session.messages.slice(-MAX_MESSAGES);

    const updated: StoredSession = { ...session, messages: trimmedMessages };

    // Upsert by sessionId
    const idx = sessions.findIndex((s) => s.sessionId === session.sessionId);
    if (idx !== -1) {
      sessions[idx] = updated;
    } else {
      sessions.push(updated);
    }

    // Sort by lastActivity descending, keep newest MAX_SESSIONS
    sessions.sort(
      (a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
    );
    const trimmed = sessions.slice(0, MAX_SESSIONS);

    localStorage.setItem(storageKey(tenantId), JSON.stringify(trimmed));
  } catch {
    // Quota exceeded or private browsing — fail silently
  }
}

export function deleteSession(tenantId: string, sessionId: string): void {
  try {
    const sessions = loadSessions(tenantId).filter((s) => s.sessionId !== sessionId);
    localStorage.setItem(storageKey(tenantId), JSON.stringify(sessions));
  } catch {
    // fail silently
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);

  if (mins  <  1) return "Just now";
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  <  2) return "Yesterday";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
