import { useEffect, useRef } from "react";
import { ChatMessage } from "../hooks/useChat";
import type { WidgetTheme } from "../theme";

interface MessageListProps {
  messages: ChatMessage[];
  theme: WidgetTheme;
  apiUrl: string;
}

export default function MessageList({ messages, theme, apiUrl }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
      {messages.map((msg) => (
        <div
          key={msg.id}
          style={{
            display: "flex",
            justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
          }}
        >
          {/* Image message */}
          {msg.type === "image" && msg.imageUrl ? (
            <a
              href={apiUrl + msg.imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ maxWidth: "80%", display: "block" }}
            >
              <img
                src={apiUrl + msg.imageUrl}
                alt="Uploaded photo"
                style={{
                  maxWidth: "200px",
                  maxHeight: "200px",
                  borderRadius: "12px",
                  objectFit: "cover",
                  cursor: "pointer",
                  border: `2px solid ${msg.role === "user" ? theme.primaryColor : "#e5e7eb"}`,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  transition: "transform 0.15s, box-shadow 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.03)";
                  e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
                }}
              />
            </a>
          ) : (
            /* Text message */
            <div
              style={{
                maxWidth: "80%",
                padding: "10px 14px",
                borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                backgroundColor: msg.role === "user" ? theme.primaryColor : "#f3f4f6",
                color: msg.role === "user" ? "#fff" : "#111827",
                fontSize: "14px",
                lineHeight: "1.5",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                minHeight: "40px",
                display: "flex",
                alignItems: "center",
              }}
            >
              {msg.content && <span>{msg.content}</span>}

              {/* While streaming with no content yet: show 3 bouncing dots */}
              {msg.streaming && msg.content === "" && (
                <span style={{ display: "inline-flex", gap: "5px", alignItems: "center", padding: "2px 0" }}>
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        backgroundColor: "#94a3b8",
                        display: "inline-block",
                        animation: `bounce 1.2s ease-in-out ${i * 0.15}s infinite`,
                      }}
                    />
                  ))}
                </span>
              )}

              {/* While streaming with content: show a blinking cursor */}
              {msg.streaming && msg.content !== "" && (
                <span
                  style={{
                    display: "inline-block",
                    width: "2px",
                    height: "1em",
                    backgroundColor: "#374151",
                    marginLeft: "2px",
                    verticalAlign: "text-bottom",
                    animation: "blink 0.8s step-end infinite",
                  }}
                />
              )}
            </div>
          )}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
