import { useEffect } from "react";
import { useChat } from "../hooks/useChat";
import MessageList from "./MessageList";
import InputBar from "./InputBar";
import type { WidgetTheme } from "../theme";
import { hexToRgba } from "../theme";
import type { StoredSession } from "../storage/sessionStorage";

interface ChatWindowProps {
  tenantId: string;
  apiUrl: string;
  tenantName: string;
  greeting: string;
  onClose: () => void;
  onBack?: () => void;
  theme: WidgetTheme;
  initialSession?: StoredSession;
  onStreamingChange?: (streaming: boolean) => void;
}

export default function ChatWindow({
  tenantId,
  apiUrl,
  greeting,
  onClose,
  theme,
  initialSession,
  onStreamingChange,
}: ChatWindowProps) {
  const { messages, sendMessage, isStreaming, pendingImages, attachImages, removeImage } =
    useChat(apiUrl, tenantId, initialSession);

  // Bubble streaming state up to Widget.tsx for header indicator
  useEffect(() => {
    onStreamingChange?.(isStreaming);
  }, [isStreaming, onStreamingChange]);

  const greetingBg     = hexToRgba(theme.primaryColor, 0.06);
  const greetingBorder = hexToRgba(theme.primaryColor, 0.2);
  const greetingText   = hexToRgba(theme.primaryColor, 0.85);

  // Suppress unused warning — onClose is used by parent Widget.tsx header
  void onClose;

  return (
    <>
      {/* Greeting banner (only when no messages yet) */}
      {messages.length === 0 && (
        <div
          style={{
            padding: "12px 16px",
            backgroundColor: greetingBg,
            borderBottom: `1px solid ${greetingBorder}`,
            flexShrink: 0,
          }}
        >
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
    </>
  );
}
