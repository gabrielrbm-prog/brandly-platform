export interface Integration {
  id: string;
  userId: string;
  provider: IntegrationProvider;
  providerUserId: string;
  accessToken: string;
  refreshToken: string | null;
  metadata: Record<string, unknown> | null;
  connectedAt: Date;
  expiresAt: Date | null;
}

export type IntegrationProvider = 'tiktok' | 'instagram' | 'youtube';

export interface TikTokConnectInput {
  authCode: string;
  redirectUri: string;
}

export interface InstagramConnectInput {
  authCode: string;
  redirectUri: string;
}

export interface TikTokMetrics {
  followers: number;
  following: number;
  totalViews: number;
  totalLikes: number;
  engagementRate: number;
  averageViews: number;
  recentVideos: TikTokVideoMetric[];
}

export interface TikTokVideoMetric {
  videoId: string;
  title: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  createdAt: string;
}

export interface TikTokShopProduct {
  productId: string;
  name: string;
  price: number;
  salesCount: number;
  revenue: number;
  status: string;
  imageUrl: string;
}

export interface TikTokOrder {
  orderId: string;
  productName: string;
  amount: number;
  commission: number;
  status: string;
  createdAt: string;
  buyerCity: string;
}

export interface InstagramMetrics {
  followers: number;
  following: number;
  totalPosts: number;
  engagementRate: number;
  averageReach: number;
  averageLikes: number;
  recentPosts: InstagramPostMetric[];
}

export interface InstagramPostMetric {
  postId: string;
  type: 'image' | 'video' | 'reel' | 'carousel';
  caption: string;
  likes: number;
  comments: number;
  reach: number;
  saves: number;
  createdAt: string;
}

export interface ContentGenerationInput {
  type: 'script' | 'caption' | 'hashtags';
  brandName: string;
  productName: string;
  tone?: string;
  platform?: string;
  briefing?: string;
}

export interface ContentGenerationOutput {
  id: string;
  type: string;
  content: string | string[];
  provider: string;
  tokensUsed: number;
  createdAt: string;
}

export interface VideoAnalysisInput {
  videoUrl: string;
  platform: string;
}

export interface VideoAnalysisOutput {
  id: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  engagementRate: number;
  estimatedReach: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  topCommentThemes: string[];
  recommendations: string[];
}

export interface WebhookPayload {
  event: string;
  data: Record<string, unknown>;
  timestamp: string;
  signature: string;
}

export interface ContentGeneration {
  id: string;
  userId: string;
  type: ContentGenerationType;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  provider: string;
  tokensUsed: number;
  createdAt: Date;
}

export type ContentGenerationType = 'script' | 'caption' | 'hashtags' | 'video_analysis';
