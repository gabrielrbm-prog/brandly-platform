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
export const videoStatusEnum = pgEnum('video_status', ['pending', 'approved', 'rejected']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'approved', 'paid', 'withdrawn']);
export const withdrawalStatusEnum = pgEnum('withdrawal_status', ['requested', 'processing', 'completed', 'failed']);
export const brandCategoryEnum = pgEnum('brand_category', [
  'beauty', 'supplements', 'home', 'tech', 'fashion', 'food',
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
