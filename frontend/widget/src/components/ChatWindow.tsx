import { useChat } from "../hooks/useChat";
import MessageList from "./MessageList";
import InputBar from "./InputBar";
import type { WidgetTheme } from "../theme";
import { hexToRgba } from "../theme";

interface ChatWindowProps {
  tenantId: string;
  apiUrl: string;
  tenantName: string;
  greeting: string;
  onClose: () => void;
  theme: WidgetTheme;
}

export default function ChatWindow({ tenantId, apiUrl, tenantName, greeting, onClose, theme }: ChatWindowProps) {
  const { messages, sendMessage, isStreaming, pendingImages, attachImages, removeImage } = useChat(apiUrl, tenantId);
  const positionSide = theme.position === "bottom-left" ? "left" : "right";
  const greetingBg = hexToRgba(theme.primaryColor, 0.06);
  const greetingBorder = hexToRgba(theme.primaryColor, 0.2);
  const greetingText = hexToRgba(theme.primaryColor, 0.85);

  return (
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
      {/* Header */}
      <div
        style={{
          background: `linear-gradient(135deg, ${theme.primaryColor} 0%, ${theme.secondaryColor} 100%)`,
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Avatar: custom image or default icon */}
          {theme.agentAvatarUrl ? (
            <img
              src={theme.agentAvatarUrl}
              alt={theme.agentName}
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
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
            </div>
          )}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <p style={{ color: "#fff", fontWeight: 600, fontSize: "14px", margin: 0 }}>{theme.agentName}</p>
              {/* Logo next to agent name */}
              {theme.logoUrl && (
                <img
                  src={theme.logoUrl}
                  alt={tenantName}
                  style={{ height: "18px", opacity: 0.9 }}
                />
              )}
            </div>
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
                {isStreaming ? "Typing…" : `${theme.agentName} · Online`}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: "rgba(255,255,255,0.8)",
            cursor: "pointer",
            padding: "6px",
            borderRadius: "50%",
            transition: "background-color 0.15s, color 0.15s, transform 0.15s",
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
          onMouseDown={(e) => {
            e.currentTarget.style.transform = "scale(0.9)";
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = "scale(1.1)";
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>
      </div>

      {/* Greeting banner (only if no messages) */}
      {messages.length === 0 && (
        <div style={{ padding: "12px 16px", backgroundColor: greetingBg, borderBottom: `1px solid ${greetingBorder}` }}>
          <p style={{ fontSize: "13px", color: greetingText, margin: 0 }}>{greeting}</p>
        </div>
      )}

      {/* Messages */}
      <MessageList messages={messages} theme={theme} apiUrl={apiUrl} />

      {/* Input */}
      <InputBar
        onSend={sendMessage}
        onAttachImages={attachImages}
        onRemoveImage={removeImage}
        pendingImages={pendingImages}
        disabled={isStreaming}
        theme={theme}
      />
    </div>
  );
}
