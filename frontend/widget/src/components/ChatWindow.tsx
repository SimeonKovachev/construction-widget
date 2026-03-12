import { useChat } from "../hooks/useChat";
import MessageList from "./MessageList";
import InputBar from "./InputBar";

interface ChatWindowProps {
  tenantId: string;
  apiUrl: string;
  tenantName: string;
  greeting: string;
  onClose: () => void;
}

export default function ChatWindow({ tenantId, apiUrl, tenantName, greeting, onClose }: ChatWindowProps) {
  const { messages, sendMessage, isStreaming } = useChat(apiUrl, tenantId);

  return (
    <div
      style={{
        position: "fixed",
        bottom: "90px",
        right: "20px",
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
          background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
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
          <div>
            <p style={{ color: "#fff", fontWeight: 600, fontSize: "14px", margin: 0 }}>{tenantName}</p>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "12px", margin: 0 }}>Sales Assistant · Online</p>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: "rgba(255,255,255,0.8)",
            cursor: "pointer",
            padding: "4px",
            borderRadius: "50%",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>
      </div>

      {/* Greeting banner (only if no messages) */}
      {messages.length === 0 && (
        <div style={{ padding: "12px 16px", backgroundColor: "#f0f9ff", borderBottom: "1px solid #bae6fd" }}>
          <p style={{ fontSize: "13px", color: "#0369a1", margin: 0 }}>{greeting}</p>
        </div>
      )}

      {/* Messages */}
      <MessageList messages={messages} />

      {/* Input */}
      <InputBar onSend={sendMessage} disabled={isStreaming} />
    </div>
  );
}
