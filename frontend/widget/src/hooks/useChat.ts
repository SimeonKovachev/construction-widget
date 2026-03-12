import { useState, useCallback, useRef } from "react";
import { useSignalR } from "./useSignalR";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

export function useChat(apiUrl: string, tenantId: string) {
  const sessionId = useRef(crypto.randomUUID());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const { getConnection } = useSignalR(apiUrl, tenantId);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };

    const assistantMsgId = crypto.randomUUID();
    const assistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      streaming: true,
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setIsStreaming(true);

    try {
      const conn = await getConnection();
      const stream = conn.stream<string>("SendMessage", sessionId.current, text);

      await new Promise<void>((resolve, reject) => {
        stream.subscribe({
          next: (chunk: string) => {
            // Filter out tool indicator lines
            if (chunk.startsWith("\n\n[Tool:")) return;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId
                  ? { ...m, content: m.content + chunk }
                  : m
              )
            );
          },
          complete: () => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId ? { ...m, streaming: false } : m
              )
            );
            resolve();
          },
          error: (err: unknown) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId
                  ? { ...m, content: m.content || "Sorry, something went wrong. Please try again.", streaming: false }
                  : m
              )
            );
            reject(err);
          },
        });
      });
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? { ...m, content: "Connection error. Please try again.", streaming: false }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
    }
  }, [isStreaming, getConnection]);

  return { messages, sendMessage, isStreaming };
}
