import { useState, KeyboardEvent, useRef, DragEvent, ClipboardEvent } from "react";
import type { WidgetTheme } from "../theme";
import { hexToRgba } from "../theme";
import type { PendingImage } from "../hooks/useChat";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

interface InputBarProps {
  onSend: (text: string) => void;
  onAttachImages: (files: File[]) => void;
  onRemoveImage: (id: string) => void;
  pendingImages: PendingImage[];
  disabled: boolean;
  theme: WidgetTheme;
}

export default function InputBar({
  onSend,
  onAttachImages,
  onRemoveImage,
  pendingImages,
  disabled,
  theme,
}: InputBarProps) {
  const [text, setText] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed && pendingImages.length === 0) return;
    if (disabled) return;
    onSend(trimmed);
    setText("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleInput() {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 100) + "px";
    }
  }

  // ── File input (camera button) ──────────────────────────────────────────
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    e.target.value = ""; // reset so same file can be selected again
    processFiles(files);
  }

  // ── Drag & Drop ────────────────────────────────────────────────────────
  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }

  function handleDragLeave(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith("image/")
    );

    // Also check for dragged image URLs (from browser)
    if (files.length === 0) {
      const html = e.dataTransfer.getData("text/html");
      const urlMatch = html?.match(/src="([^"]+)"/);
      if (urlMatch?.[1]) {
        fetchImageAsFile(urlMatch[1]).then((file) => {
          if (file) processFiles([file]);
        });
        return;
      }
    }

    processFiles(files);
  }

  // ── Clipboard paste (Ctrl+V) ───────────────────────────────────────────
  function handlePaste(e: ClipboardEvent) {
    const items = Array.from(e.clipboardData.items);
    const imageItems = items.filter((item) => item.type.startsWith("image/"));

    if (imageItems.length > 0) {
      e.preventDefault(); // prevent pasting image data as text
      const files = imageItems
        .map((item) => item.getAsFile())
        .filter((f): f is File => f !== null);
      processFiles(files);
    }
  }

  // ── Shared file processing ─────────────────────────────────────────────
  function processFiles(files: File[]) {
    const valid = files.filter((f) => {
      if (f.size > MAX_FILE_SIZE) {
        setFileError("File too large. Maximum size is 5 MB.");
        setTimeout(() => setFileError(null), 3000);
        return false;
      }
      if (!f.type.startsWith("image/")) return false;
      return true;
    });
    if (valid.length > 0) onAttachImages(valid);
  }

  // ── Fetch remote image as File (for drag from browser) ─────────────────
  async function fetchImageAsFile(url: string): Promise<File | null> {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      if (!blob.type.startsWith("image/")) return null;
      if (blob.size > MAX_FILE_SIZE) {
        setFileError("File too large. Maximum size is 5 MB.");
        setTimeout(() => setFileError(null), 3000);
        return null;
      }
      return new File([blob], `pasted-${Date.now()}.jpg`, { type: blob.type });
    } catch {
      return null;
    }
  }

  const canSend = !disabled && (text.trim() || pendingImages.length > 0);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        borderTop: "1px solid #e5e7eb",
        backgroundColor: isDragOver ? hexToRgba(theme.primaryColor, 0.05) : "#fff",
        transition: "background-color 0.15s",
        position: "relative",
      }}
    >
      {/* Drag overlay indicator */}
      {isDragOver && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            border: `2px dashed ${theme.primaryColor}`,
            borderRadius: "0 0 16px 16px",
            backgroundColor: hexToRgba(theme.primaryColor, 0.08),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
            pointerEvents: "none",
          }}
        >
          <span style={{ color: theme.primaryColor, fontWeight: 600, fontSize: "13px" }}>
            Drop image here
          </span>
        </div>
      )}

      {/* Pending image previews */}
      {pendingImages.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: "8px",
            padding: "10px 16px 0",
            overflowX: "auto",
            flexWrap: "nowrap",
          }}
        >
          {pendingImages.map((img) => (
            <div
              key={img.id}
              style={{
                position: "relative",
                flexShrink: 0,
                width: "60px",
                height: "60px",
                borderRadius: "10px",
                overflow: "hidden",
                border: `2px solid ${hexToRgba(theme.primaryColor, 0.3)}`,
              }}
            >
              <img
                src={img.previewUrl}
                alt="Attached"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
              {/* Remove button */}
              <button
                onClick={() => onRemoveImage(img.id)}
                style={{
                  position: "absolute",
                  top: "-2px",
                  right: "-2px",
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  backgroundColor: "#ef4444",
                  border: "2px solid #fff",
                  color: "#fff",
                  fontSize: "11px",
                  lineHeight: "1",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Inline file error */}
      {fileError && (
        <div
          style={{
            margin: "4px 16px 0",
            padding: "6px 10px",
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "8px",
            color: "#dc2626",
            fontSize: "12px",
          }}
        >
          {fileError}
        </div>
      )}

      {/* Input row */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: "6px",
          padding: "12px 16px",
        }}
      >
        {/* Photo upload button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          title="Upload a photo"
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            backgroundColor: "transparent",
            border: `1.5px solid ${disabled ? "#d1d5db" : theme.primaryColor}`,
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.5 : 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transition: "background-color 0.15s, transform 0.15s",
          }}
          onMouseEnter={(e) => {
            if (disabled) return;
            e.currentTarget.style.backgroundColor = hexToRgba(theme.primaryColor, 0.1);
            e.currentTarget.style.transform = "scale(1.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.transform = "scale(1)";
          }}
          onMouseDown={(e) => {
            if (disabled) return;
            e.currentTarget.style.transform = "scale(0.9)";
          }}
          onMouseUp={(e) => {
            if (disabled) return;
            e.currentTarget.style.transform = "scale(1.1)";
          }}
        >
          {/* Camera icon */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill={disabled ? "#d1d5db" : theme.primaryColor}>
            <path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4z" />
            <path d="M9 2 7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" />
          </svg>
        </button>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handleFileChange}
          style={{ display: "none" }}
        />

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          onPaste={handlePaste}
          placeholder={pendingImages.length > 0 ? "Add a message about the photo..." : "Ask about pricing..."}
          disabled={disabled}
          rows={1}
          style={{
            flex: 1,
            resize: "none",
            border: "1px solid #d1d5db",
            borderRadius: "12px",
            padding: "8px 12px",
            fontSize: "14px",
            fontFamily: "inherit",
            outline: "none",
            lineHeight: "1.5",
            maxHeight: "100px",
            overflowY: "auto",
            opacity: disabled ? 0.6 : 1,
            transition: "border-color 0.15s, box-shadow 0.15s",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = theme.primaryColor;
            e.currentTarget.style.boxShadow = `0 0 0 2px ${hexToRgba(theme.primaryColor, 0.15)}`;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "#d1d5db";
            e.currentTarget.style.boxShadow = "none";
          }}
        />

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!canSend}
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            backgroundColor: theme.primaryColor,
            border: "none",
            cursor: !canSend ? "not-allowed" : "pointer",
            opacity: !canSend ? 0.5 : 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transition: "opacity 0.15s, transform 0.15s, box-shadow 0.15s, background-color 0.15s",
          }}
          onMouseEnter={(e) => {
            if (!canSend) return;
            e.currentTarget.style.backgroundColor = theme.secondaryColor;
            e.currentTarget.style.transform = "scale(1.1)";
            e.currentTarget.style.boxShadow = `0 4px 12px ${hexToRgba(theme.primaryColor, 0.4)}`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = theme.primaryColor;
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "none";
          }}
          onMouseDown={(e) => {
            if (!canSend) return;
            e.currentTarget.style.transform = "scale(0.9)";
          }}
          onMouseUp={(e) => {
            if (!canSend) return;
            e.currentTarget.style.transform = "scale(1.1)";
          }}
        >
          {disabled ? (
            <div
              style={{
                width: "16px",
                height: "16px",
                border: "2px solid rgba(255,255,255,0.3)",
                borderTopColor: "white",
                borderRadius: "50%",
                animation: "spin 0.7s linear infinite",
              }}
            />
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
