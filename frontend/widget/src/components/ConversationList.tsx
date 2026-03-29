import type { StoredSession } from "../storage/sessionStorage";
import { timeAgo } from "../storage/sessionStorage";
import type { WidgetTheme } from "../theme";
import { hexToRgba } from "../theme";

interface ConversationListProps {
  sessions: StoredSession[];
  theme: WidgetTheme;
  onResume: (session: StoredSession) => void;
  onNewChat: () => void;
  onDelete: (sessionId: string) => void;
}

export default function ConversationList({
  sessions,
  theme,
  onResume,
  onNewChat,
  onDelete,
}: ConversationListProps) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
        padding: "16px",
        gap: "10px",
      }}
    >
      {/* Section label */}
      <p
        style={{
          fontSize: "11px",
          fontWeight: 600,
          color: "#94a3b8",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          margin: "4px 0 2px",
        }}
      >
        Recent conversations
      </p>

      {/* Session cards */}
      {sessions.map((session) => (
        <div
          key={session.sessionId}
          style={{
            position: "relative",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
            backgroundColor: "#fff",
            cursor: "pointer",
            overflow: "hidden",
            transition: "box-shadow 0.15s, border-color 0.15s",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
            e.currentTarget.style.borderColor = hexToRgba(theme.primaryColor, 0.4);
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)";
            e.currentTarget.style.borderColor = "#e5e7eb";
          }}
          onClick={() => onResume(session)}
        >
          {/* Theme accent bar */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "3px",
              height: "100%",
              backgroundColor: theme.primaryColor,
              borderRadius: "12px 0 0 12px",
            }}
          />

          <div style={{ padding: "12px 12px 12px 18px" }}>
            {/* Preview text */}
            <p
              style={{
                fontSize: "13px",
                fontWeight: 500,
                color: "#111827",
                margin: "0 0 4px",
                lineHeight: 1.4,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                paddingRight: "24px", // space for delete button
              }}
            >
              {session.preview || "Conversation"}
            </p>

            {/* Meta row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                {timeAgo(session.lastActivity)}
              </span>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 600,
                  color: theme.primaryColor,
                  backgroundColor: hexToRgba(theme.primaryColor, 0.1),
                  padding: "1px 6px",
                  borderRadius: "999px",
                }}
              >
                {session.messages.length} msgs
              </span>
            </div>
          </div>

          {/* Delete button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(session.sessionId);
            }}
            title="Delete conversation"
            style={{
              position: "absolute",
              top: "10px",
              right: "10px",
              width: "22px",
              height: "22px",
              borderRadius: "50%",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#cbd5e1",
              fontSize: "14px",
              lineHeight: 1,
              transition: "color 0.15s, background-color 0.15s",
              padding: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#ef4444";
              e.currentTarget.style.backgroundColor = "#fee2e2";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#cbd5e1";
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            ✕
          </button>
        </div>
      ))}

      {/* New chat button */}
      <button
        onClick={onNewChat}
        style={{
          marginTop: "4px",
          padding: "11px 16px",
          borderRadius: "12px",
          border: `1.5px dashed ${hexToRgba(theme.primaryColor, 0.4)}`,
          backgroundColor: hexToRgba(theme.primaryColor, 0.04),
          color: theme.primaryColor,
          fontSize: "13px",
          fontWeight: 600,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px",
          transition: "background-color 0.15s, border-color 0.15s",
          width: "100%",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = hexToRgba(theme.primaryColor, 0.1);
          e.currentTarget.style.borderColor = theme.primaryColor;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = hexToRgba(theme.primaryColor, 0.04);
          e.currentTarget.style.borderColor = hexToRgba(theme.primaryColor, 0.4);
        }}
      >
        {/* Plus icon */}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 13H13v6h-2v-6H5v-2h6V5h2v6h6v2z" />
        </svg>
        Start new conversation
      </button>
    </div>
  );
}
