// mobile/src/api/client.ts
// Authenticated REST client and Demo Mode adapter for BelikHub Platform
// Single uniform BelikHubClient interface used by both real backend and demo mode

import {
  Role,
  UserProfile,
  SpringPublic,
  SpringSettings,
  Resident,
  PendingUser,
  RetributionBill,
  RetributionSummary,
  RevitalizationCampaign,
  RevitalizationUpdate,
  Donation,
  FieldReport,
  AdminUser,
  RoleSummary,
  UploadPurpose,
  PaymentMethod,
  DonorType,
  ReportType,
  SpringMetrics
} from './types';
import { DemoStore } from '../demo/demoStore';

export interface BelikHubClient {
  getMe(): Promise<UserProfile>;
  onboarding(data: {
    role: Role;
    name?: string;
    phone?: string;
    springId?: string;
    linkCode?: string;
    donorType?: DonorType;
    organizationName?: string;
  }): Promise<{ success: boolean; user: UserProfile }>;
  updateProfile(data: {
    name?: string;
    phone?: string;
    donorType?: DonorType;
    organizationName?: string;
    springId?: string;
    linkCode?: string;
  }): Promise<{ success: boolean; user: UserProfile }>;
  uploadImage(purpose: UploadPurpose, base64Data: string, mimeType?: string): Promise<{ objectPath: string; readUrl: string }>;

  listSprings(): Promise<{ metrics: SpringMetrics; source: string; springs: SpringPublic[] }>;
  createSpring(data: Partial<SpringPublic> & { seedBaseline?: boolean }): Promise<{ success: boolean; spring?: SpringPublic; message?: string }>;
  updateSpring(id: string, updates: Partial<SpringPublic>): Promise<{ success: boolean; spring: SpringPublic }>;
  getSpringSettings(springId: string): Promise<SpringSettings>;
  putSpringSettings(springId: string, settings: { defaultMonthlyFee: number; paymentInstructions: string; qrisImagePath?: string | null }): Promise<{ success: boolean; settings?: SpringSettings }>;

  listResidents(springId?: string): Promise<{ success: boolean; residents: Resident[]; pendingUsers: PendingUser[]; pendingLinkRequests: PendingUser[] }>;
  createResident(data: { springId: string; name: string; phone: string; monthlyFee: number }): Promise<{ success: boolean; resident: Resident }>;
  updateResident(id: string, updates: Partial<Resident>): Promise<{ success: boolean; resident: Resident }>;
  generateLinkCode(residentId: string): Promise<{ success: boolean; linkCode: string; linkCodeExpiresAt: string; residentId: string }>;
  approveLink(data: { userUid: string; residentId?: string; createResident?: { name: string; phone: string; monthlyFee: number } }): Promise<{ success: boolean; message?: string; resident?: Resident }>;

  listRetributions(params?: { springId?: string; period?: string; status?: string; residentId?: string }): Promise<{ success: boolean; bills: RetributionBill[]; summary: RetributionSummary }>;
  generateBills(data: { springId: string; period: string }): Promise<{ success: boolean; createdCount: number; skippedCount: number; period: string; springId: string }>;
  submitRetributionProof(billId: string, data: { proofPath: string; paymentMethod?: PaymentMethod }): Promise<{ success: boolean; bill: RetributionBill }>;
  recordCashRetribution(billId: string): Promise<{ success: boolean; bill: RetributionBill }>;
  recordCash(billId: string): Promise<{ success: boolean; bill: RetributionBill }>;
  verifyRetribution(billId: string, action: 'approve' | 'reject', rejectionReason?: string): Promise<{ success: boolean; bill: RetributionBill }>;

  listCampaigns(params?: { status?: string; springId?: string }): Promise<{ success: boolean; campaigns: RevitalizationCampaign[] }>;
  getCampaign(id: string): Promise<{ success: boolean; campaign: RevitalizationCampaign }>;
  createCampaign(data: { springId: string; title: string; description: string; targetAmount: number; paymentInstructions: string; qrisImagePath?: string | null }): Promise<{ success: boolean; campaign: RevitalizationCampaign }>;
  updateCampaign(id: string, updates: Partial<RevitalizationCampaign>): Promise<{ success: boolean; campaign: RevitalizationCampaign }>;
  createCampaignUpdate(campaignId: string, data: { title: string; notes?: string; progressPercent: number; photoPath?: string | null; spentAmount?: number | null }): Promise<{ success: boolean; update: RevitalizationUpdate }>;

  listDonations(params?: { campaignId?: string }): Promise<{ success: boolean; donations: Donation[] }>;
  createDonation(data: { campaignId: string; amount: number; donorType?: DonorType; organizationName?: string; isAnonymous?: boolean; paymentMethod?: string; proofPath?: string }): Promise<{ success: boolean; donation: Donation }>;
  verifyDonation(id: string, action: 'approve' | 'reject', rejectionReason?: string): Promise<{ success: boolean; donation: Donation }>;

  listMyReports(): Promise<{ reports: FieldReport[]; total: number }>;
  listAllReports(params?: { status?: string; limit?: number }): Promise<{ reports: FieldReport[]; total: number }>;
  createReport(data: { reportType: ReportType; location: string; notes: string; lat?: number; lng?: number; photoPath?: string; photoUrl?: string }): Promise<{ success: boolean; id: string; points?: number }>;
  updateReportStatus(id: string, status: 'approved' | 'rejected'): Promise<{ success: boolean; status: string }>;

  listAdminUsers(): Promise<{ success: boolean; users: AdminUser[] }>;
  setAdminUserRoles(uid: string, data: { roles: Role[]; managedSpringIds?: string[] }): Promise<{ success: boolean; user: { uid: string; roles: Role[]; managedSpringIds?: string[] } }>;
  getSummary(role?: Role): Promise<{ success: boolean; summary: RoleSummary }>;
}

export function createApiClient(getToken: () => Promise<string | null>, baseUrl = process.env.EXPO_PUBLIC_API_URL || ''): BelikHubClient {
  async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = await getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...((options.headers as Record<string, string>) || {})
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const cleanBase = baseUrl.replace(/\/+$/, '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const url = `${cleanBase}${cleanPath}`;

    const res = await fetch(url, {
      ...options,
      headers
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const err: any = new Error(data?.error || `Request failed with status ${res.status}`);
      err.status = res.status;
      err.data = data;
      throw err;
    }

    return data as T;
  }

  return {
    async getMe(): Promise<UserProfile> {
      return request<UserProfile>('/api/me');
    },

    async onboarding(data): Promise<{ success: boolean; user: UserProfile }> {
      return request('/api/v1/onboarding', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    async updateProfile(data): Promise<{ success: boolean; user: UserProfile }> {
      return request('/api/v1/profile', {
        method: 'PATCH',
        body: JSON.stringify(data)
      });
    },

    async uploadImage(purpose: UploadPurpose, base64Data: string, mimeType = 'image/jpeg'): Promise<{ objectPath: string; readUrl: string }> {
      return request('/api/v1/uploads', {
        method: 'POST',
        body: JSON.stringify({
          purpose,
          contentType: mimeType,
          dataBase64: base64Data
        })
      });
    },

    async listSprings(): Promise<{ metrics: SpringMetrics; source: string; springs: SpringPublic[] }> {
      return request('/api/springs');
    },

    async createSpring(data): Promise<{ success: boolean; spring?: SpringPublic; message?: string }> {
      return request('/api/v1/springs', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    async updateSpring(id: string, updates: Partial<SpringPublic>): Promise<{ success: boolean; spring: SpringPublic }> {
      return request(`/api/v1/springs/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });
    },

    async getSpringSettings(springId: string): Promise<SpringSettings> {
      return request(`/api/v1/springs/${encodeURIComponent(springId)}/settings`);
    },

    async putSpringSettings(springId: string, settings): Promise<{ success: boolean; settings?: SpringSettings }> {
      return request(`/api/v1/springs/${encodeURIComponent(springId)}/settings`, {
        method: 'PUT',
        body: JSON.stringify(settings)
      });
    },

    async listResidents(springId?: string): Promise<{ success: boolean; residents: Resident[]; pendingUsers: PendingUser[]; pendingLinkRequests: PendingUser[] }> {
      const q = springId ? `?springId=${encodeURIComponent(springId)}` : '';
      return request(`/api/v1/residents${q}`);
    },

    async createResident(data): Promise<{ success: boolean; resident: Resident }> {
      return request('/api/v1/residents', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    async updateResident(id: string, updates: Partial<Resident>): Promise<{ success: boolean; resident: Resident }> {
      return request(`/api/v1/residents/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });
    },

    async generateLinkCode(residentId: string): Promise<{ success: boolean; linkCode: string; linkCodeExpiresAt: string; residentId: string }> {
      return request(`/api/v1/residents/${encodeURIComponent(residentId)}/link-code`, {
        method: 'POST'
      });
    },

    async approveLink(data): Promise<{ success: boolean; message?: string; resident?: Resident }> {
      return request('/api/v1/residents/approve-link', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    async listRetributions(params?: { springId?: string; period?: string; status?: string; residentId?: string }): Promise<{ success: boolean; bills: RetributionBill[]; summary: RetributionSummary }> {
      const sp = new URLSearchParams();
      if (params?.springId) sp.set('springId', params.springId);
      if (params?.period) sp.set('period', params.period);
      if (params?.status) sp.set('status', params.status);
      if (params?.residentId) sp.set('residentId', params.residentId);
      const query = sp.toString() ? `?${sp.toString()}` : '';
      return request(`/api/v1/retributions${query}`);
    },

    async generateBills(data): Promise<{ success: boolean; createdCount: number; skippedCount: number; period: string; springId: string }> {
      return request('/api/v1/retributions/generate', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    async submitRetributionProof(billId: string, data): Promise<{ success: boolean; bill: RetributionBill }> {
      return request(`/api/v1/retributions/${encodeURIComponent(billId)}`, {
        method: 'PATCH',
        body: JSON.stringify({
          action: 'submit_proof',
          proofPath: data.proofPath,
          paymentMethod: data.paymentMethod || 'transfer'
        })
      });
    },

    async recordCashRetribution(billId: string): Promise<{ success: boolean; bill: RetributionBill }> {
      return request(`/api/v1/retributions/${encodeURIComponent(billId)}`, {
        method: 'PATCH',
        body: JSON.stringify({ action: 'record_cash' })
      });
    },

    async recordCash(billId: string): Promise<{ success: boolean; bill: RetributionBill }> {
      return this.recordCashRetribution(billId);
    },

    async verifyRetribution(billId: string, action: 'approve' | 'reject', rejectionReason?: string): Promise<{ success: boolean; bill: RetributionBill }> {
      return request(`/api/v1/retributions/${encodeURIComponent(billId)}`, {
        method: 'PATCH',
        body: JSON.stringify({ action, rejectionReason })
      });
    },

    async listCampaigns(params?: { status?: string; springId?: string }): Promise<{ success: boolean; campaigns: RevitalizationCampaign[] }> {
      const sp = new URLSearchParams();
      if (params?.status) sp.set('status', params.status);
      if (params?.springId) sp.set('springId', params.springId);
      const query = sp.toString() ? `?${sp.toString()}` : '';
      return request(`/api/v1/campaigns${query}`);
    },

    async getCampaign(id: string): Promise<{ success: boolean; campaign: RevitalizationCampaign }> {
      return request(`/api/v1/campaigns/${encodeURIComponent(id)}`);
    },

    async createCampaign(data): Promise<{ success: boolean; campaign: RevitalizationCampaign }> {
      return request('/api/v1/campaigns', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    async updateCampaign(id: string, updates): Promise<{ success: boolean; campaign: RevitalizationCampaign }> {
      return request(`/api/v1/campaigns/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });
    },

    async createCampaignUpdate(campaignId: string, data): Promise<{ success: boolean; update: RevitalizationUpdate }> {
      return request(`/api/v1/campaigns/${encodeURIComponent(campaignId)}/updates`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    async listDonations(params?: { campaignId?: string }): Promise<{ success: boolean; donations: Donation[] }> {
      const q = params?.campaignId ? `?campaignId=${encodeURIComponent(params.campaignId)}` : '';
      return request(`/api/v1/donations${q}`);
    },

    async createDonation(data): Promise<{ success: boolean; donation: Donation }> {
      return request('/api/v1/donations', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    async verifyDonation(id: string, action: 'approve' | 'reject', rejectionReason?: string): Promise<{ success: boolean; donation: Donation }> {
      return request(`/api/v1/donations/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ action, rejectionReason })
      });
    },

    async listMyReports(): Promise<{ reports: FieldReport[]; total: number }> {
      return request('/api/reports?mine=1');
    },

    async listAllReports(params?: { status?: string; limit?: number }): Promise<{ reports: FieldReport[]; total: number }> {
      const sp = new URLSearchParams();
      sp.set('scope', 'all');
      if (params?.status) sp.set('status', params.status);
      if (params?.limit) sp.set('limit', String(params.limit));
      return request(`/api/reports?${sp.toString()}`);
    },

    async createReport(data): Promise<{ success: boolean; id: string; points?: number }> {
      return request('/api/reports', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    async updateReportStatus(id: string, status: 'approved' | 'rejected'): Promise<{ success: boolean; status: string }> {
      return request(`/api/admin/reports/${encodeURIComponent(id)}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
    },

    async listAdminUsers(): Promise<{ success: boolean; users: AdminUser[] }> {
      return request('/api/v1/admin/users');
    },

    async setAdminUserRoles(uid: string, data): Promise<{ success: boolean; user: { uid: string; roles: Role[]; managedSpringIds?: string[] } }> {
      return request(`/api/v1/admin/users/${encodeURIComponent(uid)}/roles`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      });
    },

    async getSummary(role?: Role): Promise<{ success: boolean; summary: RoleSummary }> {
      const q = role ? `?role=${encodeURIComponent(role)}` : '';
      return request(`/api/v1/summary${q}`);
    }
  };
}

export function createDemoApiClient(store: DemoStore): BelikHubClient {
  return {
    getMe: () => store.getMe(),
    onboarding: (data) => store.onboarding(data),
    updateProfile: (data) => store.updateProfile(data),
    uploadImage: (purpose, base64, mime) => store.uploadImage(purpose, base64, mime),
    listSprings: () => store.listSprings(),
    createSpring: (data) => store.createSpring(data),
    updateSpring: (id, updates) => store.updateSpring(id, updates),
    getSpringSettings: (springId) => store.getSpringSettings(springId),
    putSpringSettings: (springId, settings) => store.putSpringSettings(springId, settings),
    listResidents: (springId) => store.listResidents(springId),
    createResident: (data) => store.createResident(data),
    updateResident: (id, updates) => store.updateResident(id, updates),
    generateLinkCode: (residentId) => store.generateLinkCode(residentId),
    approveLink: (data) => store.approveLink(data),
    listRetributions: (params) => store.listRetributions(params),
    generateBills: (data) => store.generateBills(data),
    submitRetributionProof: (billId, data) => store.submitRetributionProof(billId, data),
    recordCashRetribution: (billId) => store.recordCashRetribution(billId),
    recordCash: (billId) => store.recordCash(billId),
    verifyRetribution: (billId, action, rejectionReason) => store.verifyRetribution(billId, action, rejectionReason),
    listCampaigns: (params) => store.listCampaigns(params),
    getCampaign: (id) => store.getCampaign(id),
    createCampaign: (data) => store.createCampaign(data),
    updateCampaign: (id, updates) => store.updateCampaign(id, updates),
    createCampaignUpdate: (campaignId, data) => store.createCampaignUpdate(campaignId, data),
    listDonations: (params) => store.listDonations(params),
    createDonation: (data) => store.createDonation(data),
    verifyDonation: (id, action, rejectionReason) => store.verifyDonation(id, action, rejectionReason),
    listMyReports: () => store.listMyReports(),
    listAllReports: (params) => store.listAllReports(params),
    createReport: (data) => store.createReport(data),
    updateReportStatus: (id, status) => store.updateReportStatus(id, status),
    listAdminUsers: () => store.listAdminUsers(),
    setAdminUserRoles: (uid, data) => store.setAdminUserRoles(uid, data),
    getSummary: (role) => store.getSummary(role)
  };
}
