export type LeadStatus = "new" | "contacted" | "quoted" | "converted" | "lost";

export interface Lead {
  id: string;
  customerName: string;
  phone: string;
  email?: string;
  requirements: string;
  quotedPrice: number;
  status: LeadStatus;
  notes?: string;
  extrasJson?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface UpdateLeadRequest {
  email?: string;
  status?: LeadStatus;
  notes?: string;
}

export interface PricingConfig {
  markupPercentage: number;
  laborFixedCost: number;
  categories: Record<string, {
    materials: Record<string, {
      basePrice: number;
      pricePerSqFt: number;
      minimumPrice?: number;
    }>;
  }>;
}

export interface TenantInfo {
  id: string;
  name: string;
  ownerEmail: string;
  apiKey: string;
  isActive: boolean;
  notificationEmail?: string;
  createdAt: string;
}

export interface LoginResponse {
  token: string;
  tenantId: string;
  tenantName: string;
}
