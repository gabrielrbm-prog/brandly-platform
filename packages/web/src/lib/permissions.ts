/**
 * Frontend mirror of @brandly/core permissions matrix.
 * Keep in sync with packages/core/src/permissions.ts.
 */

export type AdminRole = 'super_admin' | 'educator' | 'financial' | 'moderator' | 'viewer';

export type AdminAction =
  | 'change_creator_status'
  | 'change_creator_level'
  | 'edit_creator'
  | 'approve_video'
  | 'reject_video'
  | 'approve_brand_application'
  | 'reject_brand_application'
  | 'edit_brand'
  | 'create_brand'
  | 'delete_brand'
  | 'manage_brand_invites'
  | 'manage_withdrawals'
  | 'process_payouts'
  | 'edit_sales'
  | 'view_financial'
  | 'view_compradores'
  | 'view_envios'
  | 'manage_courses'
  | 'manage_community'
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
  super_admin: ALL,
  educator: ['manage_courses', 'manage_community'],
  financial: ['view_financial', 'manage_withdrawals', 'process_payouts', 'edit_sales'],
  moderator: [
    'approve_video',
    'reject_video',
    'approve_brand_application',
    'reject_brand_application',
  ],
  viewer: [],
};

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

/**
 * Check if a given adminRole can perform an action.
 * Backward-compat: if adminRole is undefined (legacy token), treat as super_admin.
 * If null (admin without role assigned), no permissions.
 */
export function canDo(
  adminRole: AdminRole | null | undefined,
  action: AdminAction,
): boolean {
  // Legacy token (no adminRole field at all): full access
  if (adminRole === undefined) return true;
  if (!adminRole) return false;
  return ADMIN_PERMISSIONS[adminRole]?.includes(action) ?? false;
}
