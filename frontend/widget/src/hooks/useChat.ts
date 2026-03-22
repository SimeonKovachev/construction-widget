import { useState, useCallback, useRef } from "react";
import { useSignalR } from "./useSignalR";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
  type?: "text" | "image";
  imageUrl?: string;
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

  const sendPhoto = useCallback(async (file: File) => {
    if (isStreaming) return;
    setIsStreaming(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("sessionId", sessionId.current);

      const res = await fetch(`${apiUrl}/api/widget/photos`, {
        method: "POST",
        headers: { "X-Tenant-ID": tenantId },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(err.error || "Upload failed");
      }

      const data = await res.json();

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: "📷 Photo uploaded",
        type: "image",
        imageUrl: data.imageUrl,
      };

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Thanks! I've received your photo. Our team will review it along with your inquiry.",
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: err instanceof Error ? err.message : "Failed to upload photo. Please try again.",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsStreaming(false);
    }
  }, [apiUrl, tenantId, isStreaming]);

  return { messages, sendMessage, sendPhoto, isStreaming };
}
