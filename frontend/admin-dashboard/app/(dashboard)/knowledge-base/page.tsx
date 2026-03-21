"use client";
import { useState, useEffect, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import api from "@/lib/api";
import type { TenantDocument } from "@/lib/types";
import { Plus, Pencil, Trash2, X, BookOpen, FileText, Upload, Loader2 } from "lucide-react";

const CATEGORIES = ["general", "warranty", "delivery", "installation", "faq", "pricing", "other"];

export default function KnowledgeBasePage() {
  const [docs, setDocs] = useState<TenantDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCat, setFilterCat] = useState("all");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState<TenantDocument | null>(null);
  const [form, setForm] = useState({ title: "", content: "", category: "general" });
  const [saving, setSaving] = useState(false);

  // File upload state
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState("");

  useEffect(() => {
    fetchDocs();
  }, []);

  async function fetchDocs() {
    try {
      const { data } = await api.get<TenantDocument[]>("/api/admin/knowledge-base");
      setDocs(data);
    } catch (e) {
      console.error("Failed to load knowledge base", e);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingDoc(null);
    setForm({ title: "", content: "", category: "general" });
    setExtractError("");
    setShowModal(true);
  }

  function openEdit(doc: TenantDocument) {
    setEditingDoc(doc);
    setForm({ title: doc.title, content: doc.content, category: doc.category });
    setExtractError("");
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.title.trim() || !form.content.trim()) return;
    setSaving(true);
    try {
      if (editingDoc) {
        await api.put(`/api/admin/knowledge-base/${editingDoc.id}`, form);
      } else {
        await api.post("/api/admin/knowledge-base", form);
      }
      setShowModal(false);
      await fetchDocs();
    } catch (e) {
      console.error("Failed to save document", e);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this document? The AI will no longer have access to this information.")) return;
    try {
      await api.delete(`/api/admin/knowledge-base/${id}`);
      setDocs((prev) => prev.filter((d) => d.id !== id));
    } catch (e) {
      console.error("Failed to delete document", e);
    }
  }

  async function toggleActive(doc: TenantDocument) {
    try {
      await api.put(`/api/admin/knowledge-base/${doc.id}`, { isActive: !doc.isActive });
      await fetchDocs();
    } catch (e) {
      console.error("Failed to toggle document", e);
    }
  }

  const onDrop = useCallback(async (accepted: File[]) => {
    const file = accepted[0];
    if (!file) return;
    setExtracting(true);
    setExtractError("");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const { data } = await api.post("/api/admin/knowledge-base/extract", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setForm((prev) => ({
        ...prev,
        content: data.text,
        title: prev.title || file.name.replace(/\.(pdf|docx)$/i, ""),
      }));
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.error ?? "Upload failed"
        : "Upload failed";
      setExtractError(msg);
    } finally {
      setExtracting(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const filtered = filterCat === "all" ? docs : docs.filter((d) => d.category === filterCat);
  const totalChars = docs.filter((d) => d.isActive).reduce((sum, d) => sum + d.content.length, 0);
  const charLimit = 100_000;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Knowledge Base</h1>
          <p className="text-sm text-slate-500 mt-1">
            Add company info, policies, and FAQs. The AI chatbot uses these documents to answer customer questions.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:brightness-110 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
          style={{ background: "linear-gradient(135deg, #2563eb, #1d4ed8)" }}
        >
          <Plus className="w-4 h-4" /> Add Document
        </button>
      </div>

      {/* Usage bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">Context usage</span>
          <span className="text-sm text-slate-500">
            {(totalChars / 1000).toFixed(1)}k / {(charLimit / 1000).toFixed(0)}k characters
          </span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min((totalChars / charLimit) * 100, 100)}%`,
              background: totalChars > charLimit * 0.8 ? "#ef4444" : "#2563eb",
            }}
          />
        </div>
        {totalChars > charLimit * 0.8 && (
          <p className="text-xs text-red-500 mt-1">
            Approaching context limit. Consider shortening or deactivating some documents.
          </p>
        )}
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        {["all", ...CATEGORIES].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCat(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
              filterCat === cat
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Documents list */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No documents yet</p>
          <p className="text-sm text-slate-400 mt-1">
            Add company policies, FAQs, or product info so the AI can help customers better.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((doc) => (
            <div
              key={doc.id}
              className={`bg-white rounded-xl border p-5 transition-all ${
                doc.isActive ? "border-slate-200" : "border-slate-100 opacity-60"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <h3 className="font-semibold text-slate-900 truncate">{doc.title}</h3>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 capitalize flex-shrink-0">
                      {doc.category}
                    </span>
                    {!doc.isActive && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 flex-shrink-0">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 line-clamp-2 mt-1">{doc.content}</p>
                  <p className="text-xs text-slate-400 mt-2">
                    {doc.content.length.toLocaleString()} characters
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => toggleActive(doc)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      doc.isActive
                        ? "bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
                        : "bg-green-50 text-green-700 hover:bg-green-100"
                    }`}
                  >
                    {doc.isActive ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    onClick={() => openEdit(doc)}
                    className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">
                {editingDoc ? "Edit Document" : "Add Document"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 transition-all"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Warranty Policy, Delivery Info, FAQ"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 capitalize"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat} className="capitalize">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* File upload dropzone */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Upload Document (optional)
                </label>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                    isDragActive
                      ? "border-blue-400 bg-blue-50"
                      : extractError
                        ? "border-red-300 bg-red-50"
                        : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
                  }`}
                >
                  <input {...getInputProps()} />
                  {extracting ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                      <p className="text-sm text-blue-600 font-medium">Extracting text...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-6 h-6 text-slate-400" />
                      <p className="text-sm text-slate-600">
                        {isDragActive
                          ? "Drop your file here..."
                          : "Drop a PDF or DOCX file here, or click to browse"}
                      </p>
                      <p className="text-xs text-slate-400">
                        Extracted text will appear in the content field below for review
                      </p>
                    </div>
                  )}
                  {extractError && (
                    <p className="text-sm text-red-500 mt-2">{extractError}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Content
                  <span className="text-slate-400 font-normal ml-2">
                    ({form.content.length.toLocaleString()} characters)
                  </span>
                </label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder="Write, paste, or upload a file above. The AI chatbot will use this to answer customer questions accurately."
                  rows={12}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.title.trim() || !form.content.trim()}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 hover:brightness-110 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg, #2563eb, #1d4ed8)" }}
              >
                {saving ? "Saving..." : editingDoc ? "Save Changes" : "Add Document"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
