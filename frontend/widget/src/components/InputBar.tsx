import { useState, KeyboardEvent, useRef, useEffect } from "react";
import type { WidgetTheme } from "../theme";
import { hexToRgba } from "../theme";

interface InputBarProps {
  onSend: (text: string) => void;
  disabled: boolean;
  theme: WidgetTheme;
}

export default function InputBar({ onSend, disabled, theme }: InputBarProps) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
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

  const isDisabled = disabled || !text.trim();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: "8px",
        padding: "12px 16px",
        borderTop: "1px solid #e5e7eb",
        backgroundColor: "#fff",
      }}
    >
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        placeholder="Ask about pricing..."
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
      <button
        onClick={handleSend}
        disabled={isDisabled}
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "50%",
          backgroundColor: theme.primaryColor,
          border: "none",
          cursor: isDisabled ? "not-allowed" : "pointer",
          opacity: isDisabled ? 0.5 : 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          transition: "opacity 0.15s, transform 0.15s, box-shadow 0.15s, background-color 0.15s",
        }}
        onMouseEnter={(e) => {
          if (isDisabled) return;
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
          if (isDisabled) return;
          e.currentTarget.style.transform = "scale(0.9)";
        }}
        onMouseUp={(e) => {
          if (isDisabled) return;
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
  );
}
