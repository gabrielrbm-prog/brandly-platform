import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  decimal,
  timestamp,
  boolean,
  pgEnum,
  index,
  jsonb,
} from 'drizzle-orm/pg-core';

// ============================================
// TIPOS TYPESCRIPT
// ============================================
export interface TrackingEvent {
  date: string;
  time: string;
  location: string;
  status: string;
  description: string;
}

// ============================================
// ENUMS
// ============================================
export const userRoleEnum = pgEnum('user_role', ['creator', 'brand', 'admin']);
export const userStatusEnum = pgEnum('user_status', ['active', 'inactive', 'pending']);
export const productTypeEnum = pgEnum('product_type', ['physical', 'digital']);
export const productStatusEnum = pgEnum('product_status', ['active', 'inactive', 'draft']);
export const saleStatusEnum = pgEnum('sale_status', ['pending', 'confirmed', 'cancelled', 'refunded']);
export const bonusTypeEnum = pgEnum('bonus_type', ['direct', 'infinite', 'matching', 'global']);
export const bonusStatusEnum = pgEnum('bonus_status', ['pending', 'approved', 'paid']);
export const levelNameEnum = pgEnum('level_name', [
  'Seed', 'Spark', 'Flow', 'Iconic', 'Vision', 'Empire', 'Infinity',
]);
export const poolStatusEnum = pgEnum('pool_status', ['open', 'closed', 'distributed']);
export const shipmentStatusEnum = pgEnum('shipment_status', [
  'pending',
  'posted',
  'in_transit',
  'out_for_delivery',
  'delivered',
  'returned',
  'failed',
]);
export const videoStatusEnum = pgEnum('video_status', ['pending', 'approved', 'rejected']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'approved', 'paid', 'withdrawn']);
export const withdrawalStatusEnum = pgEnum('withdrawal_status', ['requested', 'processing', 'completed', 'failed']);
export const brandCategoryEnum = pgEnum('brand_category', [
  'beauty', 'supplements', 'home', 'tech', 'fashion', 'food',
  'fitness', 'health', 'wellness', 'education', 'finance',
  'lifestyle', 'pets', 'kids', 'automotive', 'travel', 'other',
]);

// ============================================
// USERS & ONBOARDING
// ============================================
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: userRoleEnum('role').notNull().default('creator'),
  levelId: uuid('level_id').references(() => levels.id),
  sponsorId: uuid('sponsor_id').references((): any => users.id),
  referralCode: varchar('referral_code', { length: 20 }).unique(),
  status: userStatusEnum('status').notNull().default('pending'),
  instagramHandle: varchar('instagram_handle', { length: 100 }),
  tiktokHandle: varchar('tiktok_handle', { length: 100 }),
  pushToken: text('push_token'),
  onboardingCompleted: boolean('onboarding_completed').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('users_email_idx').on(table.email),
  index('users_sponsor_idx').on(table.sponsorId),
  index('users_referral_code_idx').on(table.referralCode),
]);

export const creatorProfiles = pgTable('creator_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull().unique(),
  preferredCategories: jsonb('preferred_categories').$type<string[]>().default([]),
  contentStyle: varchar('content_style', { length: 100 }),  // lifestyle, review, tutorial, etc.
  experienceLevel: varchar('experience_level', { length: 50 }), // none, beginner, intermediate, advanced
  availableHoursPerDay: integer('available_hours_per_day'),
  motivations: jsonb('motivations').$type<string[]>().default([]), // renda, identidade, carreira, etc.
  instagramFollowers: integer('instagram_followers'),
  tiktokFollowers: integer('tiktok_followers'),
  behavioralProfile: jsonb('behavioral_profile').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('creator_profiles_user_idx').on(table.userId),
]);

// ============================================
// TOKENS DE RECUPERACAO DE SENHA
// ============================================
export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  token: varchar('token', { length: 64 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  usedAt: timestamp('used_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('password_reset_tokens_token_idx').on(table.token),
  index('password_reset_tokens_user_idx').on(table.userId),
]);

// ============================================
// NIVEIS DE CARREIRA
// ============================================
export const levels = pgTable('levels', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: levelNameEnum('name').notNull().unique(),
  rank: integer('rank').notNull().unique(),
  requiredQV: decimal('required_qv', { precision: 12, scale: 2 }).notNull(),
  requiredDirects: integer('required_directs').notNull(),
  requiredPML: decimal('required_pml', { precision: 12, scale: 2 }).notNull(),
  directCommissionDigital: decimal('direct_commission_digital', { precision: 5, scale: 2 }).notNull(),
  directCommissionPhysical: decimal('direct_commission_physical', { precision: 5, scale: 2 }).notNull(),
  infiniteBonusDigital: decimal('infinite_bonus_digital', { precision: 5, scale: 2 }).notNull(),
  infiniteBonusPhysical: decimal('infinite_bonus_physical', { precision: 5, scale: 2 }).notNull(),
});

// ============================================
// MARCAS & BRIEFINGS
// ============================================
export const brands = pgTable('brands', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  logoUrl: text('logo_url'),
  category: brandCategoryEnum('category').notNull(),
  description: text('description'),
  websiteUrl: text('website_url'),
  contactEmail: varchar('contact_email', { length: 255 }),
  minVideosPerMonth: integer('min_videos_per_month').default(0),
  maxCreators: integer('max_creators'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('brands_category_idx').on(table.category),
]);

export const briefings = pgTable('briefings', {
  id: uuid('id').primaryKey().defaultRandom(),
  brandId: uuid('brand_id').references(() => brands.id).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  tone: varchar('tone', { length: 100 }),          // casual, profissional, fun, etc.
  doList: jsonb('do_list').$type<string[]>().default([]),        // o que fazer
  dontList: jsonb('dont_list').$type<string[]>().default([]),    // o que nao fazer
  exampleUrls: jsonb('example_urls').$type<string[]>().default([]),
  technicalRequirements: text('technical_requirements'),  // duracao, formato, resolucao
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('briefings_brand_idx').on(table.brandId),
]);

export const creatorBrands = pgTable('creator_brands', {
  id: uuid('id').primaryKey().defaultRandom(),
  creatorId: uuid('creator_id').references(() => users.id).notNull(),
  brandId: uuid('brand_id').references(() => brands.id).notNull(),
  connectedAt: timestamp('connected_at').defaultNow().notNull(),
  isActive: boolean('is_active').default(true),
}, (table) => [
  index('creator_brands_creator_idx').on(table.creatorId),
  index('creator_brands_brand_idx').on(table.brandId),
]);

// ============================================
// PRODUTOS & VENDAS
// ============================================
export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  type: productTypeEnum('type').notNull(),
  price: decimal('price', { precision: 12, scale: 2 }).notNull(),
  brandId: uuid('brand_id').references(() => brands.id).notNull(),
  commissionPercent: decimal('commission_percent', { precision: 5, scale: 2 }).notNull(),
  trackingType: varchar('tracking_type', { length: 20 }).default('link'), // link ou cupom
  status: productStatusEnum('status').notNull().default('draft'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('products_brand_idx').on(table.brandId),
]);

export const trackingLinks = pgTable('tracking_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  creatorId: uuid('creator_id').references(() => users.id).notNull(),
  productId: uuid('product_id').references(() => products.id).notNull(),
  code: varchar('code', { length: 50 }).notNull().unique(), // link ou cupom unico
  clicks: integer('clicks').default(0),
  conversions: integer('conversions').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('tracking_links_creator_idx').on(table.creatorId),
  index('tracking_links_code_idx').on(table.code),
]);

export const sales = pgTable('sales', {
  id: uuid('id').primaryKey().defaultRandom(),
  sellerId: uuid('seller_id').references(() => users.id).notNull(),
  productId: uuid('product_id').references(() => products.id).notNull(),
  trackingLinkId: uuid('tracking_link_id').references(() => trackingLinks.id),
  buyerEmail: varchar('buyer_email', { length: 255 }),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  qualifiedVolume: decimal('qualified_volume', { precision: 12, scale: 2 }).notNull(),
  status: saleStatusEnum('status').notNull().default('pending'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('sales_seller_idx').on(table.sellerId),
  index('sales_created_idx').on(table.createdAt),
]);

// ============================================
// VIDEOS & PAGAMENTO POR PRODUCAO
// ============================================
export const videos = pgTable('videos', {
  id: uuid('id').primaryKey().defaultRandom(),
  creatorId: uuid('creator_id').references(() => users.id).notNull(),
  brandId: uuid('brand_id').references(() => brands.id).notNull(),
  briefingId: uuid('briefing_id').references(() => briefings.id),
  externalUrl: text('external_url'),
  platform: varchar('platform', { length: 50 }), // tiktok, instagram, youtube
  status: videoStatusEnum('status').notNull().default('pending'),
  rejectionReason: text('rejection_reason'),
  paymentAmount: decimal('payment_amount', { precision: 10, scale: 2 }).default('10.00'),
  isPaid: boolean('is_paid').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  reviewedAt: timestamp('reviewed_at'),
  reviewedBy: uuid('reviewed_by').references(() => users.id),
}, (table) => [
  index('videos_creator_idx').on(table.creatorId),
  index('videos_brand_idx').on(table.brandId),
  index('videos_created_idx').on(table.createdAt),
  index('videos_status_idx').on(table.status),
]);

// ============================================
// FINANCEIRO
// ============================================
export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  type: varchar('type', { length: 20 }).notNull(), // video, commission, bonus
  referenceId: uuid('reference_id'), // id do video, sale ou bonus
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  description: text('description'),
  status: paymentStatusEnum('status').notNull().default('pending'),
  period: varchar('period', { length: 7 }).notNull(), // YYYY-MM
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('payments_user_idx').on(table.userId),
  index('payments_period_idx').on(table.period),
  index('payments_type_idx').on(table.type),
]);

export const withdrawals = pgTable('withdrawals', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  status: withdrawalStatusEnum('status').notNull().default('requested'),
  pixKey: varchar('pix_key', { length: 255 }),
  processedAt: timestamp('processed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('withdrawals_user_idx').on(table.userId),
]);

// ============================================
// REDE & BONUS
// ============================================
export const lines = pgTable('lines', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  sponsorId: uuid('sponsor_id').references(() => users.id).notNull(),
  depth: integer('depth').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('lines_user_idx').on(table.userId),
  index('lines_sponsor_idx').on(table.sponsorId),
]);

export const qualifications = pgTable('qualifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  period: varchar('period', { length: 7 }).notNull(),
  qualifiedVolume: decimal('qualified_volume', { precision: 12, scale: 2 }).notNull().default('0'),
  directsActive: integer('directs_active').notNull().default(0),
  maxLinePML: decimal('max_line_pml', { precision: 12, scale: 2 }).notNull().default('0'),
  isQualified: boolean('is_qualified').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('qualifications_user_period_idx').on(table.userId, table.period),
]);

export const bonuses = pgTable('bonuses', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  saleId: uuid('sale_id').references(() => sales.id),
  type: bonusTypeEnum('type').notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  poolId: uuid('pool_id').references(() => globalPools.id),
  period: varchar('period', { length: 7 }).notNull(),
  status: bonusStatusEnum('status').notNull().default('pending'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('bonuses_user_idx').on(table.userId),
  index('bonuses_period_idx').on(table.period),
]);

export const globalPools = pgTable('global_pools', {
  id: uuid('id').primaryKey().defaultRandom(),
  period: varchar('period', { length: 7 }).notNull().unique(),
  totalAmount: decimal('total_amount', { precision: 14, scale: 2 }).notNull().default('0'),
  status: poolStatusEnum('status').notNull().default('open'),
  distributedAt: timestamp('distributed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================
// CONTAS SOCIAIS (Phyllo)
// ============================================
export const socialPlatformEnum = pgEnum('social_platform', ['instagram', 'tiktok']);
export const socialAccountStatusEnum = pgEnum('social_account_status', ['connected', 'disconnected', 'expired']);

export const socialAccounts = pgTable('social_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  platform: socialPlatformEnum('platform').notNull(),
  phylloUserId: varchar('phyllo_user_id', { length: 100 }),
  phylloAccountId: varchar('phyllo_account_id', { length: 100 }),
  phylloProfileId: varchar('phyllo_profile_id', { length: 100 }),
  platformUsername: varchar('platform_username', { length: 255 }),
  platformUrl: text('platform_url'),
  followers: integer('followers').default(0),
  following: integer('following').default(0),
  avgLikes: integer('avg_likes').default(0),
  avgViews: integer('avg_views').default(0),
  avgComments: integer('avg_comments').default(0),
  engagementRate: decimal('engagement_rate', { precision: 5, scale: 2 }).default('0'),
  isVerified: boolean('is_verified').default(false),
  status: socialAccountStatusEnum('status').notNull().default('connected'),
  lastSyncAt: timestamp('last_sync_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('social_accounts_user_idx').on(table.userId),
  index('social_accounts_phyllo_account_idx').on(table.phylloAccountId),
  index('social_accounts_platform_idx').on(table.userId, table.platform),
]);

// ============================================
// CAMPANHAS
// ============================================
export const campaignStatusEnum = pgEnum('campaign_status', ['draft', 'active', 'paused', 'completed']);
export const campaignCreatorStatusEnum = pgEnum('campaign_creator_status', ['invited', 'accepted', 'declined', 'removed']);
export const campaignVideoStatusEnum = pgEnum('campaign_video_status', ['pending', 'approved', 'rejected']);

export const campaigns = pgTable('campaigns', {
  id: uuid('id').primaryKey().defaultRandom(),
  brandId: uuid('brand_id').references(() => brands.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  budget: decimal('budget', { precision: 14, scale: 2 }).notNull(),
  spent: decimal('spent', { precision: 14, scale: 2 }).notNull().default('0'),
  targetVideos: integer('target_videos').notNull(),
  status: campaignStatusEnum('status').notNull().default('draft'),
  briefing: text('briefing'),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('campaigns_brand_idx').on(table.brandId),
  index('campaigns_status_idx').on(table.status),
  index('campaigns_dates_idx').on(table.startDate, table.endDate),
]);

export const campaignCreators = pgTable('campaign_creators', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id').references(() => campaigns.id).notNull(),
  creatorId: uuid('creator_id').references(() => users.id).notNull(),
  status: campaignCreatorStatusEnum('status').notNull().default('invited'),
  assignedAt: timestamp('assigned_at').defaultNow().notNull(),
}, (table) => [
  index('campaign_creators_campaign_idx').on(table.campaignId),
  index('campaign_creators_creator_idx').on(table.creatorId),
]);

export const campaignVideos = pgTable('campaign_videos', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id').references(() => campaigns.id).notNull(),
  videoId: uuid('video_id').references(() => videos.id).notNull(),
  status: campaignVideoStatusEnum('status').notNull().default('pending'),
}, (table) => [
  index('campaign_videos_campaign_idx').on(table.campaignId),
  index('campaign_videos_video_idx').on(table.videoId),
]);

// ============================================
// INTEGRACOES EXTERNAS
// ============================================
export const integrationProviderEnum = pgEnum('integration_provider', ['tiktok', 'instagram', 'youtube']);

export const integrations = pgTable('integrations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  provider: integrationProviderEnum('provider').notNull(),
  providerUserId: varchar('provider_user_id', { length: 255 }).notNull(),
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  connectedAt: timestamp('connected_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at'),
}, (table) => [
  index('integrations_user_idx').on(table.userId),
  index('integrations_provider_idx').on(table.provider),
]);

// ============================================
// GERACOES DE CONTEUDO IA
// ============================================
export const contentGenerationTypeEnum = pgEnum('content_generation_type', ['script', 'caption', 'hashtags', 'video_analysis']);

export const contentGenerations = pgTable('content_generations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  type: contentGenerationTypeEnum('type').notNull(),
  input: jsonb('input').$type<Record<string, unknown>>().notNull(),
  output: jsonb('output').$type<Record<string, unknown>>().notNull(),
  provider: varchar('provider', { length: 50 }).notNull(),
  tokensUsed: integer('tokens_used').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('content_generations_user_idx').on(table.userId),
  index('content_generations_type_idx').on(table.type),
]);

// ============================================
// ROTEIROS IA
// ============================================
export const scripts = pgTable('scripts', {
  id: uuid('id').primaryKey().defaultRandom(),
  creatorId: uuid('creator_id').references(() => users.id).notNull(),
  briefingId: uuid('briefing_id').references(() => briefings.id).notNull(),
  hook: text('hook').notNull(),
  body: text('body').notNull(),
  cta: text('cta').notNull(),
  fullScript: text('full_script').notNull(),
  isUsed: boolean('is_used').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('scripts_creator_idx').on(table.creatorId),
  index('scripts_briefing_idx').on(table.briefingId),
]);

// ============================================
// FORMACAO / AREA DE MEMBRO
// ============================================
export const courses = pgTable('courses', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  orderIndex: integer('order_index').notNull(),
  isPublished: boolean('is_published').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const lessons = pgTable('lessons', {
  id: uuid('id').primaryKey().defaultRandom(),
  courseId: uuid('course_id').references(() => courses.id).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  videoUrl: text('video_url'),
  duration: integer('duration'), // segundos
  orderIndex: integer('order_index').notNull(),
  isPublished: boolean('is_published').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('lessons_course_idx').on(table.courseId),
]);

export const userProgress = pgTable('user_progress', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  lessonId: uuid('lesson_id').references(() => lessons.id).notNull(),
  completedAt: timestamp('completed_at').defaultNow().notNull(),
}, (table) => [
  index('user_progress_user_idx').on(table.userId),
]);

// ============================================
// COMUNIDADE
// ============================================
export const liveEvents = pgTable('live_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  instructorName: varchar('instructor_name', { length: 255 }),
  scheduledAt: timestamp('scheduled_at').notNull(),
  meetingUrl: text('meeting_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const successCases = pgTable('success_cases', {
  id: uuid('id').primaryKey().defaultRandom(),
  creatorId: uuid('creator_id').references(() => users.id),
  title: varchar('title', { length: 255 }).notNull(),
  story: text('story').notNull(),
  earnings: decimal('earnings', { precision: 12, scale: 2 }),
  isPublished: boolean('is_published').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================
// RASTREAMENTO DE ENVIOS (Correios)
// ============================================
export const shipments = pgTable('shipments', {
  id: uuid('id').primaryKey().defaultRandom(),
  saleId: uuid('sale_id').references(() => sales.id),
  trackingCode: varchar('tracking_code', { length: 50 }).notNull(),
  carrier: varchar('carrier', { length: 50 }).notNull().default('correios'),
  status: shipmentStatusEnum('status').notNull().default('pending'),
  recipientName: varchar('recipient_name', { length: 255 }),
  recipientCpf: varchar('recipient_cpf', { length: 20 }),
  destinationCity: varchar('destination_city', { length: 100 }),
  destinationState: varchar('destination_state', { length: 2 }),
  lastEvent: text('last_event'),
  lastEventDate: timestamp('last_event_date'),
  events: jsonb('events').$type<TrackingEvent[]>().default([]),
  estimatedDelivery: timestamp('estimated_delivery'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by').references(() => users.id),
}, (table) => [
  index('shipments_tracking_code_idx').on(table.trackingCode),
  index('shipments_sale_idx').on(table.saleId),
  index('shipments_status_idx').on(table.status),
]);