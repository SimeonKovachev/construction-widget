"use client";
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, CheckCircle, XCircle, FileText } from "lucide-react";
import api from "@/lib/api";

export default function PriceListUpload({ onSuccess }: { onSuccess: () => void }) {
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const onDrop = useCallback(async (accepted: File[]) => {
    const file = accepted[0];
    if (!file) return;

    setStatus("uploading");
    setMessage("");

    const form = new FormData();
    form.append("file", file);

    try {
      await api.post("/api/admin/pricelist", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setStatus("success");
      setMessage("Price list updated successfully!");
      onSuccess();
    } catch (err: unknown) {
      setStatus("error");
      const msg = err instanceof Error ? err.message : "Upload failed";
      setMessage(msg);
    }
  }, [onSuccess]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"] },
    maxFiles: 1,
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? "border-blue-400 bg-blue-50"
            : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
        <p className="text-sm font-medium text-gray-700">
          {isDragActive ? "Drop your CSV here" : "Drag & drop a CSV file, or click to browse"}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Columns: Category, Material, BasePrice, PricePerSqFt, MinimumPrice
        </p>
        <p className="text-xs text-gray-400">
          Global rows: GLOBAL, MarkupPercentage and GLOBAL, LaborFixedCost
        </p>
      </div>

      {status === "uploading" && (
        <div className="flex items-center gap-2 text-sm text-blue-600">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          Uploading...
        </div>
      )}
      {status === "success" && (
        <div className="flex items-center gap-2 text-sm text-green-700">
          <CheckCircle className="w-4 h-4" /> {message}
        </div>
      )}
      {status === "error" && (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <XCircle className="w-4 h-4" /> {message}
        </div>
      )}

      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">CSV Format Example</span>
        </div>
        <pre className="text-xs text-gray-600 overflow-x-auto">
{`Category,Material,BasePrice,PricePerSqFt,MinimumPrice
windows,vinyl,150,8.50,250
windows,aluminum,200,12.00,350
doors,steel,400,20.00,500
GLOBAL,MarkupPercentage,15,,
GLOBAL,LaborFixedCost,75,,`}
        </pre>
      </div>
    </div>
  );
}
