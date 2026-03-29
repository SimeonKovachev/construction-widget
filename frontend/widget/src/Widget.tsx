import { useState, useEffect } from "react";
import ChatButton from "./components/ChatButton";
import ChatWindow from "./components/ChatWindow";
import ConversationList from "./components/ConversationList";
import { buildTheme, DEFAULT_THEME } from "./theme";
import type { WidgetTheme } from "./theme";
import {
  loadSessions,
  deleteSession,
} from "./storage/sessionStorage";
import type { StoredSession } from "./storage/sessionStorage";

interface WidgetConfig {
  tenantId: string;
  apiUrl: string;
}

interface TenantConfig {
  tenantId: string;
  tenantName: string;
  greeting: string;
}

type View = "list" | "chat";

export default function Widget({ config }: { config: WidgetConfig }) {
  const [isOpen, setIsOpen]             = useState(false);
  const [tenantConfig, setTenantConfig] = useState<TenantConfig | null>(null);
  const [theme, setTheme]               = useState<WidgetTheme>(DEFAULT_THEME);
  const [error, setError]               = useState<string | null>(null);

  // ── Conversation history state ───────────────────────────────────────────
  const [sessions, setSessions]           = useState<StoredSession[]>([]);
  const [view, setView]                   = useState<View>("chat");
  const [activeSession, setActiveSession] = useState<StoredSession | undefined>(undefined);
  const [isStreaming, setIsStreaming]     = useState(false);

  // ── Fetch tenant config once ─────────────────────────────────────────────
  useEffect(() => {
    fetch(`${config.apiUrl}/api/widget/config`, {
      headers: { "X-Tenant-ID": config.tenantId },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Widget configuration failed");
        return res.json();
      })
      .then((data) => {
        setTenantConfig({
          tenantId: data.tenantId,
          tenantName: data.tenantName,
          greeting: data.greeting,
        });
        setTheme(buildTheme(data));
      })
      .catch(() => setError("Widget unavailable"));
  }, [config.apiUrl, config.tenantId]);

  // ── Refresh session list whenever the widget opens ───────────────────────
  useEffect(() => {
    if (!isOpen || !tenantConfig) return;

    const saved = loadSessions(tenantConfig.tenantId);
    setSessions(saved);

    if (saved.length > 0) {
      setView("list");
    } else {
      setView("chat");
      setActiveSession(undefined);
    }
  }, [isOpen, tenantConfig]);

  // ── Event handlers ───────────────────────────────────────────────────────
  function handleResume(session: StoredSession) {
    setActiveSession(session);
    setView("chat");
  }

  function handleNewChat() {
    setActiveSession(undefined);
    setView("chat");
  }

  function handleBack() {
    // Refresh sessions from storage (new messages may have been saved)
    if (tenantConfig) {
      setSessions(loadSessions(tenantConfig.tenantId));
    }
    setView("list");
  }

  function handleDelete(sessionId: string) {
    if (!tenantConfig) return;
    deleteSession(tenantConfig.tenantId, sessionId);
    const updated = loadSessions(tenantConfig.tenantId);
    setSessions(updated);
    // If no sessions left, go straight to new chat on next open
    if (updated.length === 0) {
      setView("chat");
    }
  }

  function handleClose() {
    setIsOpen(false);
  }

  if (error || !tenantConfig) return null;

  const positionSide = theme.position === "bottom-left" ? "left" : "right";

  return (
    <>
      <ChatButton isOpen={isOpen} onClick={() => setIsOpen((o) => !o)} theme={theme} />

      {isOpen && (
        <div
          style={{
            position: "fixed",
            bottom: "90px",
            [positionSide]: "20px",
            width: "360px",
            height: "520px",
            backgroundColor: "#fff",
            borderRadius: "16px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.06)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            zIndex: 9999,
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          }}
        >
          {/* Shared header */}
          <WidgetHeader
            title={view === "list" ? "Your Conversations" : tenantConfig.tenantName}
            agentName={theme.agentName}
            agentAvatarUrl={theme.agentAvatarUrl}
            logoUrl={theme.logoUrl}
            primaryColor={theme.primaryColor}
            secondaryColor={theme.secondaryColor}
            isStreaming={false}
            showBack={view === "chat" && sessions.length > 0}
            onBack={handleBack}
            onClose={handleClose}
            showAgentInfo={view === "chat"}
          />

          {/* Body — list or chat */}
          {view === "list" ? (
            <ConversationList
              sessions={sessions}
              theme={theme}
              onResume={handleResume}
              onNewChat={handleNewChat}
              onDelete={handleDelete}
            />
          ) : (
            <ChatWindow
              tenantId={tenantConfig.tenantId}
              apiUrl={config.apiUrl}
              tenantName={tenantConfig.tenantName}
              greeting={tenantConfig.greeting}
              onClose={handleClose}
              onBack={sessions.length > 0 ? handleBack : undefined}
              theme={theme}
              initialSession={activeSession}
              onStreamingChange={setIsStreaming}
            />
          )}
        </div>
      )}
    </>
  );
}

// ── Shared header extracted so both views use the same look ──────────────

interface WidgetHeaderProps {
  title: string;
  agentName: string;
  agentAvatarUrl: string | null;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  isStreaming: boolean;
  showBack: boolean;
  onBack: () => void;
  onClose: () => void;
  showAgentInfo: boolean;
}

function WidgetHeader({
  title,
  agentName,
  agentAvatarUrl,
  logoUrl,
  primaryColor,
  secondaryColor,
  isStreaming,
  showBack,
  onBack,
  onClose,
  showAgentInfo,
}: WidgetHeaderProps) {
  return (
    <div
      style={{
        background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {/* Back button */}
        {showBack && (
          <HeaderIconBtn onClick={onBack} title="Back">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
            </svg>
          </HeaderIconBtn>
        )}

        {/* Avatar (chat view only) */}
        {showAgentInfo && (
          agentAvatarUrl ? (
            <img
              src={agentAvatarUrl}
              alt={agentName}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                objectFit: "cover",
                border: "2px solid rgba(255,255,255,0.3)",
              }}
            />
          ) : (
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                backgroundColor: "rgba(255,255,255,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
            </div>
          )
        )}

        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <p style={{ color: "#fff", fontWeight: 600, fontSize: "14px", margin: 0 }}>
              {showAgentInfo ? agentName : title}
            </p>
            {showAgentInfo && logoUrl && (
              <img src={logoUrl} alt="" style={{ height: "18px", opacity: 0.9 }} />
            )}
          </div>
          {showAgentInfo && (
            <div style={{ display: "flex", alignItems: "center", gap: "5px", marginTop: "2px" }}>
              <span
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  backgroundColor: "#4ade80",
                  display: "inline-block",
                  animation: isStreaming ? "pulse 1s ease-in-out infinite" : "none",
                  flexShrink: 0,
                }}
              />
              <span style={{ color: "rgba(255,255,255,0.8)", fontSize: "11px" }}>
                {isStreaming ? "Typing…" : `${agentName} · Online`}
              </span>
            </div>
          )}
          {!showAgentInfo && (
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "11px", margin: "2px 0 0" }}>
              Select a conversation or start a new one
            </p>
          )}
        </div>
      </div>

      {/* Close button */}
      <HeaderIconBtn onClick={onClose} title="Close">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
        </svg>
      </HeaderIconBtn>
    </div>
  );
}

function HeaderIconBtn({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        background: "none",
        border: "none",
        color: "rgba(255,255,255,0.8)",
        cursor: "pointer",
        padding: "6px",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "background-color 0.15s, color 0.15s, transform 0.15s",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.2)";
        e.currentTarget.style.color = "#fff";
        e.currentTarget.style.transform = "scale(1.1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "transparent";
        e.currentTarget.style.color = "rgba(255,255,255,0.8)";
        e.currentTarget.style.transform = "scale(1)";
      }}
    >
      {children}
    </button>
  );
}
