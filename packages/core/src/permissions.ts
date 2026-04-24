/**
 * Admin permissions matrix.
 *
 * Each user with role='admin' has an adminRole that determines
 * which write actions they can perform. Read access is granted
 * to every admin (handled by requireAdmin middleware), so this
 * matrix only lists actions that need extra gating.
 *
 * To add a new action: add it to AdminAction, then list the roles
 * allowed in ADMIN_PERMISSIONS. To add a new role: add to schema
 * adminRoleEnum + drop a new row here.
 */

export type AdminRole = 'super_admin' | 'educator' | 'financial' | 'moderator' | 'viewer';

export type AdminAction =
  // Creator management
  | 'change_creator_status'
  | 'change_creator_level'
  | 'edit_creator'
  // Video moderation
  | 'approve_video'
  | 'reject_video'
  // Brand applications
  | 'approve_brand_application'
  | 'reject_brand_application'
  // Brand management
  | 'edit_brand'
  | 'create_brand'
  | 'delete_brand'
  | 'manage_brand_invites'
  // Financial — write
  | 'manage_withdrawals'
  | 'process_payouts'
  | 'edit_sales'
  // Financial — view (gates whole financial area in sidebar)
  | 'view_financial'
  // Operational areas (gates sidebar items)
  | 'view_compradores'
  | 'view_envios'
  | 'manage_courses'
  | 'manage_community'
  // Team management
  | 'manage_team';

const ALL: AdminAction[] = [
  'change_creator_status',
  'change_creator_level',
  'edit_creator',
  'approve_video',
  'reject_video',
  'approve_brand_application',
  'reject_brand_application',
  'edit_brand',
  'create_brand',
  'delete_brand',
  'manage_brand_invites',
  'manage_withdrawals',
  'process_payouts',
  'edit_sales',
  'view_financial',
  'view_compradores',
  'view_envios',
  'manage_courses',
  'manage_community',
  'manage_team',
];

export const ADMIN_PERMISSIONS: Record<AdminRole, AdminAction[]> = {
  // Full access — equivalent to legacy "admin"
  super_admin: ALL,

  // Educator: read everything (granted by requireAdmin), no write actions.
  // Can manage courses + community (her domain).
  educator: ['manage_courses', 'manage_community'],

  // Financial ops: handles money but not content moderation
  financial: ['view_financial', 'manage_withdrawals', 'process_payouts', 'edit_sales'],

  // Content moderator: approves videos and brand applications
  moderator: [
    'approve_video',
    'reject_video',
    'approve_brand_application',
    'reject_brand_application',
  ],

  // Pure viewer: zero write actions
  viewer: [],
};

/**
 * Check if a given adminRole can perform an action.
 * Returns false for null/undefined adminRole.
 */
export function canDo(adminRole: AdminRole | null | undefined, action: AdminAction): boolean {
  if (!adminRole) return false;
  return ADMIN_PERMISSIONS[adminRole]?.includes(action) ?? false;
}

/**
 * Human-readable labels for the admin team UI.
 */
export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: 'Super Admin',
  educator: 'Educadora',
  financial: 'Financeiro',
  moderator: 'Moderador de Conteúdo',
  viewer: 'Visualizador',
};

export const ADMIN_ROLE_DESCRIPTIONS: Record<AdminRole, string> = {
  super_admin: 'Acesso total — pode tudo.',
  educator: 'Vê creators, vídeos e marcas. Gerencia formação e comunidade. Não aprova vídeo nem mexe em financeiro.',
  financial: 'Gerencia saques, payouts e vendas. Não modera conteúdo.',
  moderator: 'Aprova/rejeita vídeos e candidaturas. Não vê financeiro.',
  viewer: 'Só leitura. Nenhuma ação permitida.',
};
