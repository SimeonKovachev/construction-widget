"use client";
import { X, Flag, User, Bot, Image as ImageIcon } from "lucide-react";
import type { ConversationDetail } from "@/lib/types";
import IconButton from "@/components/ui/IconButton";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5032";

interface TranscriptDrawerProps {
  conversation: ConversationDetail;
  onClose: () => void;
  onToggleFlag: (id: string, isFlagged: boolean) => void;
}

const STATUS_COLORS: Record<string, string> = {
  new:       "bg-blue-50 text-blue-700 border-blue-200",
  contacted: "bg-amber-50 text-amber-700 border-amber-200",
  quoted:    "bg-purple-50 text-purple-700 border-purple-200",
  converted: "bg-emerald-50 text-emerald-700 border-emerald-200",
  lost:      "bg-red-50 text-red-700 border-red-200",
};

export default function TranscriptDrawer({ conversation, onClose, onToggleFlag }: TranscriptDrawerProps) {
  const c = conversation;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="relative w-full max-w-lg bg-white shadow-2xl flex flex-col animate-in slide-in-from-right">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 flex-shrink-0">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              {c.customerName ?? `Session ${c.sessionId.slice(0, 8)}…`}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {new Date(c.createdAt).toLocaleDateString("en-US", {
                month: "short", day: "numeric", year: "numeric",
                hour: "2-digit", minute: "2-digit",
              })}
              {" · "}
              {c.messages.length} messages
            </p>
          </div>
          <div className="flex items-center gap-1">
            {/* Flag toggle */}
            <IconButton
              onClick={() => onToggleFlag(c.id, !c.isFlagged)}
              title={c.isFlagged ? "Unflag" : "Flag"}
            >
              <Flag
                className={`w-4 h-4 ${c.isFlagged ? "text-amber-500 fill-amber-500" : "text-slate-400"}`}
              />
            </IconButton>
            {/* Close */}
            <IconButton onClick={onClose}>
              <X className="w-4 h-4" />
            </IconButton>
          </div>
        </div>

        {/* Meta badges */}
        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2 flex-shrink-0">
          {c.hasLead ? (
            <>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${STATUS_COLORS[c.leadStatus ?? "new"]}`}>
                Lead: {c.leadStatus}
              </span>
              {c.customerName && (
                <span className="text-xs text-slate-500">{c.customerName}</span>
              )}
            </>
          ) : (
            <span className="text-xs text-slate-400">No lead captured</span>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {c.messages.map((msg, i) => (
            <div key={i} className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role !== "user" && (
                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5 text-blue-600" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-br-md"
                    : "bg-slate-100 text-slate-800 rounded-bl-md"
                }`}
              >
                {/* Image(s) — supports both single imageUrl and imageUrls array */}
                {msg.type === "image" && (msg.imageUrl || msg.imageUrls) ? (
                  <div>
                    <div className="flex flex-wrap gap-2">
                      {(msg.imageUrls ?? (msg.imageUrl ? [msg.imageUrl] : [])).map((url, j) => (
                        <a
                          key={j}
                          href={API_URL + url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <img
                            src={API_URL + url}
                            alt={`Photo ${j + 1}`}
                            className="max-w-[200px] rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                          />
                        </a>
                      ))}
                    </div>
                    {msg.content && msg.content !== "📷 Photo uploaded" && (
                      <p className="whitespace-pre-wrap break-words mt-2">{msg.content}</p>
                    )}
                    <span className="flex items-center gap-1 mt-1 text-xs opacity-70">
                      <ImageIcon className="w-3 h-3" />
                      {(msg.imageUrls ?? [msg.imageUrl]).filter(Boolean).length > 1
                        ? `${(msg.imageUrls ?? [msg.imageUrl]).filter(Boolean).length} Photos`
                        : "Photo"}
                    </span>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                )}
              </div>
              {msg.role === "user" && (
                <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5 text-slate-600" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
