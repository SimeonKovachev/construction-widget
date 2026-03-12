export interface Lead {
  id: string;
  customerName: string;
  phone: string;
  requirements: string;
  quotedPrice: number;
  createdAt: string;
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
