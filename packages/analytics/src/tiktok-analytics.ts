/**
 * BRANDLY Platform - TikTok Shop Analytics System
 * Monitoramento e análise de performance para Creator Economy
 * Created by Rubim IA - 2026
 */

interface TikTokMetrics {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  engagement_rate: number;
  conversion_rate: number;
  revenue: number;
  cost_per_acquisition: number;
}

interface TikTokProduct {
  id: string;
  name: string;
  price: number;
  sales: number;
  revenue: number;
  conversion_rate: number;
  views: number;
  engagement: TikTokMetrics;
  created_at: string;
  updated_at: string;
}

interface TikTokCampaign {
  id: string;
  name: string;
  budget: number;
  spent: number;
  reach: number;
  impressions: number;
  clicks: number;
  conversions: number;
  products: TikTokProduct[];
  metrics: TikTokMetrics;
  start_date: string;
  end_date: string;
  status: 'active' | 'paused' | 'completed';
}

interface CreatorProfile {
  username: string;
  followers: number;
  engagement_rate: number;
  niche: string;
  campaigns: TikTokCampaign[];
  total_revenue: number;
  avg_conversion_rate: number;
}

export class TikTokAnalytics {
  private campaigns: Map<string, TikTokCampaign> = new Map();
  private creators: Map<string, CreatorProfile> = new Map();
  private realTimeMetrics: TikTokMetrics = {
    views: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    engagement_rate: 0,
    conversion_rate: 0,
    revenue: 0,
    cost_per_acquisition: 0
  };

  constructor() {
    this.initializeSampleData();
    this.startRealTimeTracking();
  }

  private initializeSampleData() {
    // Sample campaign data for ETF/Trading niche
    const etfCampaign: TikTokCampaign = {
      id: 'etf-campaign-001',
      name: 'Escola Trader Financiado - Black Friday',
      budget: 50000,
      spent: 32450,
      reach: 1250000,
      impressions: 8500000,
      clicks: 45600,
      conversions: 2280,
      start_date: '2026-03-01',
      end_date: '2026-03-31',
      status: 'active',
      products: [
        {
          id: 'personal-trader',
          name: 'Personal Trader - Mentoria 1:1',
          price: 1500,
          sales: 1200,
          revenue: 1800000,
          conversion_rate: 5.2,
          views: 2500000,
          engagement: {
            views: 2500000,
            likes: 125000,
            comments: 8900,
            shares: 4500,
            engagement_rate: 5.5,
            conversion_rate: 5.2,
            revenue: 1800000,
            cost_per_acquisition: 27.04
          },
          created_at: '2026-03-01',
          updated_at: '2026-03-13'
        },
        {
          id: 'dobra-conta',
          name: 'Dobra Conta - Estratégias Avançadas',
          price: 497,
          sales: 1080,
          revenue: 536760,
          conversion_rate: 4.7,
          views: 3200000,
          engagement: {
            views: 3200000,
            likes: 156000,
            comments: 12400,
            shares: 6800,
            engagement_rate: 5.5,
            conversion_rate: 4.7,
            revenue: 536760,
            cost_per_acquisition: 30.05
          },
          created_at: '2026-03-01',
          updated_at: '2026-03-13'
        }
      ],
      metrics: {
        views: 5700000,
        likes: 281000,
        comments: 21300,
        shares: 11300,
        engagement_rate: 5.5,
        conversion_rate: 5.0,
        revenue: 2336760,
        cost_per_acquisition: 14.24
      }
    };

    this.campaigns.set(etfCampaign.id, etfCampaign);

    // Sample creator profile
    const rubimCreator: CreatorProfile = {
      username: '@rubimfx',
      followers: 850000,
      engagement_rate: 6.2,
      niche: 'Trading & Finanças',
      campaigns: [etfCampaign],
      total_revenue: 2336760,
      avg_conversion_rate: 5.0
    };

    this.creators.set(rubimCreator.username, rubimCreator);
  }

  private startRealTimeTracking() {
    // Simulate real-time updates every 10 seconds
    setInterval(() => {
      this.updateRealTimeMetrics();
    }, 10000);
  }

  private updateRealTimeMetrics() {
    // Simulate incremental updates
    const incrementViews = Math.floor(Math.random() * 1000) + 100;
    const incrementLikes = Math.floor(incrementViews * 0.05);
    const incrementComments = Math.floor(incrementViews * 0.003);
    const incrementShares = Math.floor(incrementViews * 0.002);
    const incrementRevenue = Math.floor(Math.random() * 5000);

    this.realTimeMetrics.views += incrementViews;
    this.realTimeMetrics.likes += incrementLikes;
    this.realTimeMetrics.comments += incrementComments;
    this.realTimeMetrics.shares += incrementShares;
    this.realTimeMetrics.revenue += incrementRevenue;

    // Calculate rates
    this.realTimeMetrics.engagement_rate = 
      ((this.realTimeMetrics.likes + this.realTimeMetrics.comments + this.realTimeMetrics.shares) / 
       this.realTimeMetrics.views) * 100;

    // Update campaign data
    this.campaigns.forEach(campaign => {
      campaign.metrics.views += incrementViews;
      campaign.metrics.likes += incrementLikes;
      campaign.metrics.comments += incrementComments;
      campaign.metrics.shares += incrementShares;
      campaign.metrics.revenue += incrementRevenue;
    });
  }

  // Public API methods
  getCampaignMetrics(campaignId: string): TikTokCampaign | null {
    return this.campaigns.get(campaignId) || null;
  }

  getAllCampaigns(): TikTokCampaign[] {
    return Array.from(this.campaigns.values());
  }

  getCreatorProfile(username: string): CreatorProfile | null {
    return this.creators.get(username) || null;
  }

  getAllCreators(): CreatorProfile[] {
    return Array.from(this.creators.values());
  }

  getRealTimeMetrics(): TikTokMetrics {
    return { ...this.realTimeMetrics };
  }

  getDashboardData() {
    const campaigns = this.getAllCampaigns();
    const totalRevenue = campaigns.reduce((sum, c) => sum + c.metrics.revenue, 0);
    const totalSpent = campaigns.reduce((sum, c) => sum + c.spent, 0);
    const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0);
    const totalReach = campaigns.reduce((sum, c) => sum + c.reach, 0);

    return {
      summary: {
        total_campaigns: campaigns.length,
        total_revenue: totalRevenue,
        total_spent: totalSpent,
        total_conversions: totalConversions,
        total_reach: totalReach,
        roas: totalRevenue / totalSpent,
        avg_conversion_rate: totalConversions / totalReach * 100,
        profit: totalRevenue - totalSpent
      },
      campaigns: campaigns,
      creators: this.getAllCreators(),
      real_time: this.getRealTimeMetrics(),
      top_products: this.getTopProducts(),
      performance_trends: this.getPerformanceTrends()
    };
  }

  private getTopProducts(): Array<{product: TikTokProduct, campaign: string}> {
    const allProducts: Array<{product: TikTokProduct, campaign: string}> = [];
    
    this.campaigns.forEach((campaign, campaignId) => {
      campaign.products.forEach(product => {
        allProducts.push({ product, campaign: campaign.name });
      });
    });

    return allProducts
      .sort((a, b) => b.product.revenue - a.product.revenue)
      .slice(0, 10);
  }

  private getPerformanceTrends(): Array<{date: string, metrics: TikTokMetrics}> {
    // Simulate 30 days of historical data
    const trends = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const baseViews = 150000 + Math.floor(Math.random() * 50000);
      const views = Math.floor(baseViews * (1 + Math.sin(i * 0.1) * 0.3));
      
      trends.push({
        date: date.toISOString().split('T')[0],
        metrics: {
          views: views,
          likes: Math.floor(views * 0.05),
          comments: Math.floor(views * 0.003),
          shares: Math.floor(views * 0.002),
          engagement_rate: 4.5 + Math.random() * 2,
          conversion_rate: 4.0 + Math.random() * 2,
          revenue: Math.floor(views * 0.4),
          cost_per_acquisition: 15 + Math.random() * 20
        }
      });
    }

    return trends;
  }

  // Campaign management
  createCampaign(campaignData: Omit<TikTokCampaign, 'id' | 'metrics'>): string {
    const id = `campaign-${Date.now()}`;
    const campaign: TikTokCampaign = {
      ...campaignData,
      id,
      metrics: {
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        engagement_rate: 0,
        conversion_rate: 0,
        revenue: 0,
        cost_per_acquisition: 0
      }
    };

    this.campaigns.set(id, campaign);
    return id;
  }

  updateCampaign(campaignId: string, updates: Partial<TikTokCampaign>): boolean {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) return false;

    Object.assign(campaign, updates);
    this.campaigns.set(campaignId, campaign);
    return true;
  }

  deleteCampaign(campaignId: string): boolean {
    return this.campaigns.delete(campaignId);
  }

  // Analytics queries
  getRevenueByPeriod(startDate: string, endDate: string): number {
    return Array.from(this.campaigns.values())
      .filter(campaign => 
        campaign.start_date >= startDate && 
        campaign.end_date <= endDate
      )
      .reduce((sum, campaign) => sum + campaign.metrics.revenue, 0);
  }

  getTopPerformingCreators(limit: number = 10): CreatorProfile[] {
    return Array.from(this.creators.values())
      .sort((a, b) => b.total_revenue - a.total_revenue)
      .slice(0, limit);
  }

  getCampaignsByNiche(niche: string): TikTokCampaign[] {
    return Array.from(this.campaigns.values()).filter(campaign =>
      this.creators.get('@rubimfx')?.niche.toLowerCase().includes(niche.toLowerCase())
    );
  }

  // Advanced analytics
  predictRevenue(campaignId: string, days: number = 30): number {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) return 0;

    const dailyAvgRevenue = campaign.metrics.revenue / 30; // Assume 30 days
    const growthRate = 1.05; // 5% growth rate
    
    return dailyAvgRevenue * days * growthRate;
  }

  getAudienceInsights(campaignId: string) {
    return {
      demographics: {
        age_groups: [
          { range: '18-24', percentage: 25 },
          { range: '25-34', percentage: 45 },
          { range: '35-44', percentage: 20 },
          { range: '45+', percentage: 10 }
        ],
        gender: {
          male: 60,
          female: 40
        },
        locations: [
          { country: 'Brasil', percentage: 70 },
          { country: 'Portugal', percentage: 15 },
          { country: 'Angola', percentage: 8 },
          { country: 'Outros', percentage: 7 }
        ]
      },
      interests: [
        'Trading & Investimentos',
        'Educação Financeira', 
        'Empreendedorismo',
        'Criptomoedas',
        'Bolsa de Valores'
      ],
      engagement_patterns: {
        peak_hours: ['19:00-22:00', '12:00-14:00'],
        best_days: ['Segunda', 'Quarta', 'Sexta'],
        content_types: ['Educational', 'Behind-the-scenes', 'Results/Testimonials']
      }
    };
  }

  exportData(format: 'json' | 'csv' = 'json') {
    const data = this.getDashboardData();
    
    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    }
    
    // Simple CSV export for summary
    const csv = [
      'Campaign,Revenue,Spent,ROAS,Conversions,Reach',
      ...data.campaigns.map(c => 
        `"${c.name}",${c.metrics.revenue},${c.spent},${(c.metrics.revenue/c.spent).toFixed(2)},${c.conversions},${c.reach}`
      )
    ].join('\n');
    
    return csv;
  }
}

export default TikTokAnalytics;