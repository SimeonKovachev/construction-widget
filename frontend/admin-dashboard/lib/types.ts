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
  sessionId?: string;
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
  primaryColor?: string;
  secondaryColor?: string;
  logoUrl?: string;
  welcomeMessage?: string;
  widgetPosition?: string;
  agentName?: string;
  agentAvatarUrl?: string;
  createdAt: string;
}

export type LeadStatusExtended = LeadStatus | "escalated";

export interface TenantDocument {
  id: string;
  tenantId: string;
  title: string;
  content: string;
  category: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface LoginResponse {
  token: string;
  tenantId: string;
  tenantName: string;
}

// ── Conversations ────────────────────────────────────────────────────────────

export interface ConversationSummary {
  id: string;
  sessionId: string;
  messageCount: number;
  firstUserMessage: string | null;
  isFlagged: boolean;
  hasLead: boolean;
  leadStatus: string | null;
  customerName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationDetail {
  id: string;
  sessionId: string;
  messages: ConversationMessage[];
  isFlagged: boolean;
  hasLead: boolean;
  leadStatus: string | null;
  customerName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationMessage {
  role: string;
  content: string;
  type?: "text" | "image";
  imageUrl?: string;
}

// ── Chat Photos ─────────────────────────────────────────────────────────────

export interface ChatPhoto {
  id: string;
  fileName: string;
  imageUrl: string;
  fileSizeBytes: number;
  createdAt: string;
}

// ── Analytics ────────────────────────────────────────────────────────────────

export type AnalyticsRange = "7d" | "30d" | "90d";

export interface AnalyticsData {
  leadsOverTime: { date: string; count: number }[];
  revenueOverTime: { date: string; revenue: number }[];
  totalConversations: number;
  totalLeads: number;
  conversionRate: number;
  peakHours: { hour: number; count: number }[];
  topQuestions: { question: string; count: number }[];
  leadsByStatus: { status: string; count: number }[];
}
