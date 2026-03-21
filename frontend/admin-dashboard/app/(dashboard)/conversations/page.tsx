"use client";
import { useEffect, useState, useCallback } from "react";
import { Search, Flag, Calendar, MessageCircle, UserCheck, X } from "lucide-react";
import type { ConversationSummary, ConversationDetail } from "@/lib/types";
import { conversationService, type ConversationFilters } from "@/lib/services/conversationService";
import { Input } from "@/components/ui/Input";
import IconButton from "@/components/ui/IconButton";
import TranscriptDrawer from "@/components/TranscriptDrawer";

const STATUS_COLORS: Record<string, string> = {
  new:       "bg-blue-50 text-blue-700",
  contacted: "bg-amber-50 text-amber-700",
  quoted:    "bg-purple-50 text-purple-700",
  converted: "bg-emerald-50 text-emerald-700",
  lost:      "bg-red-50 text-red-700",
};

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  // Filters
  const [search, setSearch]       = useState("");
  const [dateFrom, setDateFrom]   = useState("");
  const [dateTo, setDateTo]       = useState("");
  const [flaggedOnly, setFlaggedOnly] = useState(false);

  // Drawer
  const [selected, setSelected] = useState<ConversationDetail | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);

  const loadConversations = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const filters: ConversationFilters = {};
      if (search.trim())  filters.search = search.trim();
      if (dateFrom)        filters.from = new Date(dateFrom).toISOString();
      if (dateTo)          filters.to = new Date(dateTo + "T23:59:59").toISOString();
      if (flaggedOnly)     filters.flagged = true;

      const data = await conversationService.getAll(filters);
      setConversations(data);
    } catch {
      setError("Failed to load conversations.");
    } finally {
      setLoading(false);
    }
  }, [search, dateFrom, dateTo, flaggedOnly]);

  useEffect(() => {
    const timer = setTimeout(loadConversations, 300);
    return () => clearTimeout(timer);
  }, [loadConversations]);

  async function openTranscript(id: string) {
    setDrawerLoading(true);
    try {
      const detail = await conversationService.getById(id);
      setSelected(detail);
    } catch {
      setError("Failed to load conversation.");
    } finally {
      setDrawerLoading(false);
    }
  }

  async function handleToggleFlag(id: string, isFlagged: boolean) {
    await conversationService.setFlag(id, isFlagged);
    // Update list
    setConversations(prev =>
      prev.map(c => c.id === id ? { ...c, isFlagged } : c)
    );
    // Update drawer if open
    if (selected?.id === id) {
      setSelected(prev => prev ? { ...prev, isFlagged } : prev);
    }
  }

  function clearFilters() {
    setSearch("");
    setDateFrom("");
    setDateTo("");
    setFlaggedOnly(false);
  }

  const hasFilters = search || dateFrom || dateTo || flaggedOnly;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Conversations</h1>
        <p className="text-slate-500 text-sm mt-1">
          View chat transcripts and track which conversations converted to leads
        </p>
      </div>

      {/* Filters */}
      <div
        className="bg-white rounded-2xl border border-slate-200 p-4 mb-5"
        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
      >
        <div className="flex flex-wrap items-end gap-3">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search messages…"
                className="!pl-9"
              />
            </div>
          </div>

          {/* Date from */}
          <div className="w-40">
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">From</label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>

          {/* Date to */}
          <div className="w-40">
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">To</label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>

          {/* Flagged only */}
          <button
            onClick={() => setFlaggedOnly(!flaggedOnly)}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium border transition-all ${
              flaggedOnly
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Flag className={`w-3.5 h-3.5 ${flaggedOnly ? "fill-amber-500" : ""}`} />
            Flagged
          </button>

          {/* Clear */}
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 border border-slate-200 transition-all"
            >
              <X className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div
        className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
      >
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="m-6 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        ) : conversations.length === 0 ? (
          <div className="py-16 text-center">
            <MessageCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-500">No conversations found</p>
            <p className="text-xs text-slate-400 mt-1">
              {hasFilters ? "Try adjusting your filters" : "Conversations will appear here once visitors start chatting"}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3 w-8"></th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Conversation</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Lead</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Messages</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Date</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {conversations.map((c) => (
                <tr
                  key={c.id}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  onClick={() => openTranscript(c.id)}
                >
                  {/* Flag */}
                  <td className="px-5 py-3.5">
                    <IconButton
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFlag(c.id, !c.isFlagged);
                      }}
                      title={c.isFlagged ? "Unflag" : "Flag"}
                    >
                      <Flag
                        className={`w-3.5 h-3.5 ${
                          c.isFlagged ? "text-amber-500 fill-amber-500" : "text-slate-300"
                        }`}
                      />
                    </IconButton>
                  </td>

                  {/* Preview */}
                  <td className="px-5 py-3.5 max-w-[300px]">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {c.firstUserMessage ?? "No messages"}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">
                      Session: {c.sessionId.slice(0, 12)}…
                    </p>
                  </td>

                  {/* Lead status */}
                  <td className="px-5 py-3.5">
                    {c.hasLead ? (
                      <div className="flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[c.leadStatus ?? "new"]}`}>
                          {c.leadStatus}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>

                  {/* Message count */}
                  <td className="px-5 py-3.5">
                    <span className="text-sm text-slate-600">{c.messageCount}</span>
                  </td>

                  {/* Date */}
                  <td className="px-5 py-3.5">
                    <p className="text-sm text-slate-600">
                      {new Date(c.createdAt).toLocaleDateString("en-US", {
                        month: "short", day: "numeric",
                      })}
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(c.createdAt).toLocaleTimeString("en-US", {
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  </td>

                  {/* Arrow */}
                  <td className="px-5 py-3.5 text-right">
                    <svg className="w-4 h-4 text-slate-300 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Loading overlay for drawer */}
      {drawerLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10">
          <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Transcript drawer */}
      {selected && (
        <TranscriptDrawer
          conversation={selected}
          onClose={() => setSelected(null)}
          onToggleFlag={handleToggleFlag}
        />
      )}
    </div>
  );
}
