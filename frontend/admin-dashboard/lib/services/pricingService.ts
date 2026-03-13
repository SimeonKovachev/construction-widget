import api from "@/lib/api";
import type { PricingConfig } from "@/lib/types";

export const pricingService = {
  getConfig: () =>
    api.get<PricingConfig>("/api/admin/pricelist").then(r => r.data),

  uploadCsv: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.post("/api/admin/pricelist", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  updateGlobals: (markupPercentage: number, laborFixedCost: number) =>
    api.put("/api/admin/pricelist/globals", { markupPercentage, laborFixedCost }),

  upsertMaterial: (category: string, material: string, basePrice: number, pricePerSqFt: number, minimumPrice: number | null) =>
    api.put(`/api/admin/pricelist/${encodeURIComponent(category)}/${encodeURIComponent(material)}`, {
      basePrice, pricePerSqFt, minimumPrice,
    }),

  deleteMaterial: (category: string, material: string) =>
    api.delete(`/api/admin/pricelist/${encodeURIComponent(category)}/${encodeURIComponent(material)}`),

  addCategory: (category: string) =>
    api.post("/api/admin/pricelist/category", { category }),

  deleteCategory: (category: string) =>
    api.delete(`/api/admin/pricelist/${encodeURIComponent(category)}`),
};
