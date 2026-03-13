export interface TenantSummary {
  id:        string;
  name:      string;
  ownerEmail: string;
  isActive:  boolean;
  leadCount: number;
  createdAt: string;
}

export interface TenantDetail {
  id:                string;
  name:              string;
  ownerEmail:        string;
  apiKey:            string;
  isActive:          boolean;
  notificationEmail: string | null;
  createdAt:         string;
}

export interface PlatformStats {
  totalTenants:  number;
  activeTenants: number;
  totalLeads:    number;
}

export interface CreateTenantForm {
  name:              string;
  ownerEmail:        string;
  password:          string;
  notificationEmail: string;
}
