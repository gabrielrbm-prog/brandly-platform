export interface PlatformOverview {
  totalCreators: number;
  activeCreators: number;
  totalBrands: number;
  totalVideos: number;
  approvedVideos: number;
  totalRevenue: number;
  totalPaidToCreators: number;
  averageVideosPerCreator: number;
  period: string;
}

export interface CreatorPerformance {
  creatorId: string;
  creatorName: string;
  level: string;
  totalVideos: number;
  approvedVideos: number;
  approvalRate: number;
  totalEarnings: number;
  totalSales: number;
  networkSize: number;
  engagementRate: number;
}

export interface ContentMetrics {
  totalVideos: number;
  approvedVideos: number;
  rejectedVideos: number;
  pendingVideos: number;
  approvalRate: number;
  averageReviewTime: number;
  topPlatforms: PlatformMetric[];
  topBrands: BrandMetric[];
}

export interface PlatformMetric {
  platform: string;
  videos: number;
  views: number;
  engagement: number;
}

export interface BrandMetric {
  brandId: string;
  brandName: string;
  videos: number;
  views: number;
  conversions: number;
}

export interface RevenueAnalytics {
  totalRevenue: number;
  revenueByPeriod: PeriodRevenue[];
  revenueByBrand: BrandRevenue[];
  revenueByCreator: CreatorRevenue[];
  averageOrderValue: number;
  conversionRate: number;
}

export interface PeriodRevenue {
  period: string;
  revenue: number;
  orders: number;
  growth: number;
}

export interface BrandRevenue {
  brandId: string;
  brandName: string;
  revenue: number;
  orders: number;
  percentage: number;
}

export interface CreatorRevenue {
  creatorId: string;
  creatorName: string;
  revenue: number;
  commissions: number;
  videos: number;
}

export interface TikTokShopAnalytics {
  gmv: number;
  totalOrders: number;
  averageOrderValue: number;
  topProducts: TikTokProductMetric[];
  dailyGMV: DailyGMV[];
  conversionRate: number;
}

export interface TikTokProductMetric {
  productId: string;
  productName: string;
  sales: number;
  revenue: number;
  views: number;
}

export interface DailyGMV {
  date: string;
  gmv: number;
  orders: number;
}

export interface AudienceInsights {
  totalReach: number;
  demographics: {
    ageGroups: AgeGroup[];
    genderSplit: GenderSplit;
    topCities: CityMetric[];
    topStates: StateMetric[];
  };
  interests: InterestMetric[];
}

export interface AgeGroup {
  range: string;
  percentage: number;
}

export interface GenderSplit {
  female: number;
  male: number;
  other: number;
}

export interface CityMetric {
  city: string;
  state: string;
  percentage: number;
}

export interface StateMetric {
  state: string;
  percentage: number;
}

export interface InterestMetric {
  interest: string;
  percentage: number;
}

export interface TrendingItem {
  type: 'content' | 'product' | 'hashtag';
  name: string;
  metric: number;
  growth: number;
  period: string;
}
