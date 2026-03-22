import { useState, useCallback, useRef } from "react";
import { useSignalR } from "./useSignalR";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
  type?: "text" | "image";
  imageUrls?: string[];   // multiple images per message
}

export interface PendingImage {
  id: string;
  file: File;
  previewUrl: string;     // object URL for thumbnail preview
}

export function useChat(apiUrl: string, tenantId: string) {
  const sessionId = useRef(crypto.randomUUID());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const { getConnection } = useSignalR(apiUrl, tenantId);

  // ── Add images to the pending queue (preview before send) ──────────────
  const attachImages = useCallback((files: File[]) => {
    const newImages: PendingImage[] = files
      .filter((f) => f.size <= 5 * 1024 * 1024 && f.type.startsWith("image/"))
      .map((file) => ({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
      }));

    setPendingImages((prev) => [...prev, ...newImages]);
  }, []);

  const removeImage = useCallback((id: string) => {
    setPendingImages((prev) => {
      const img = prev.find((p) => p.id === id);
      if (img) URL.revokeObjectURL(img.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  }, []);

  const clearImages = useCallback(() => {
    setPendingImages((prev) => {
      prev.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      return [];
    });
  }, []);

  // ── Upload images to server, return URLs ───────────────────────────────
  const uploadImages = useCallback(async (images: PendingImage[]): Promise<string[]> => {
    const urls: string[] = [];

    for (const img of images) {
      const formData = new FormData();
      formData.append("file", img.file);
      formData.append("sessionId", sessionId.current);

      const res = await fetch(`${apiUrl}/api/widget/photos`, {
        method: "POST",
        headers: { "X-Tenant-ID": tenantId },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        urls.push(data.imageUrl);
      }
    }

    return urls;
  }, [apiUrl, tenantId]);

  // ── Send message (text + optional attached images) ─────────────────────
  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    const hasImages = pendingImages.length > 0;

    if (!trimmed && !hasImages) return;
    if (isStreaming) return;

    // Capture current pending images and clear immediately
    const imagesToSend = [...pendingImages];
    clearImages();
    setIsStreaming(true);

    try {
      // Upload images first if any
      let imageUrls: string[] = [];
      if (imagesToSend.length > 0) {
        imageUrls = await uploadImages(imagesToSend);
      }

      // Build user message for display
      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: trimmed || (imageUrls.length > 0 ? "" : ""),
        type: imageUrls.length > 0 ? "image" : "text",
        imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
      };

      const assistantMsgId = crypto.randomUUID();
      const assistantMsg: ChatMessage = {
        id: assistantMsgId,
        role: "assistant",
        content: "",
        streaming: true,
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);

      // Send via SignalR with image URLs
      const conn = await getConnection();
      const imageUrlsJson = imageUrls.length > 0 ? JSON.stringify(imageUrls) : null;
      const stream = conn.stream<string>(
        "SendMessage",
        sessionId.current,
        trimmed || "Please analyze the photo(s) I sent.",
        imageUrlsJson
      );

      await new Promise<void>((resolve, reject) => {
        stream.subscribe({
          next: (chunk: string) => {
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
      // Connection-level error
    } finally {
      setIsStreaming(false);
    }
  }, [isStreaming, pendingImages, clearImages, uploadImages, getConnection]);

  return { messages, sendMessage, isStreaming, pendingImages, attachImages, removeImage };
}
