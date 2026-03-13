export interface Campaign {
  id: string;
  brandId: string;
  name: string;
  description: string | null;
  budget: number;
  spent: number;
  targetVideos: number;
  status: CampaignStatus;
  briefing: string | null;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed';

export interface CampaignCreator {
  campaignId: string;
  creatorId: string;
  status: CampaignCreatorStatus;
  assignedAt: Date;
}

export type CampaignCreatorStatus = 'invited' | 'accepted' | 'declined' | 'removed';

export interface CampaignVideo {
  campaignId: string;
  videoId: string;
  status: CampaignVideoStatus;
}

export type CampaignVideoStatus = 'pending' | 'approved' | 'rejected';

export interface CampaignAnalytics {
  campaignId: string;
  totalVideos: number;
  approvedVideos: number;
  totalViews: number;
  totalEngagement: number;
  totalConversions: number;
  totalRevenue: number;
  roi: number;
}

export interface CampaignCreateInput {
  name: string;
  brandId: string;
  description?: string;
  budget: number;
  targetVideos: number;
  briefing?: string;
  startDate: string;
  endDate: string;
}

export interface CampaignUpdateInput {
  name?: string;
  description?: string;
  budget?: number;
  targetVideos?: number;
  briefing?: string;
  startDate?: string;
  endDate?: string;
}
