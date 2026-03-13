import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { socialApi, type SocialAccount, type ConnectResponse } from '@/lib/api';
import {
  borderRadius,
  colorAlpha,
  colors,
  fontSize,
  layout,
  platformColors,
  shadows,
  spacing,
} from '@/lib/theme';

const PLATFORM_CONFIG = {
  instagram: { label: 'Instagram', featherIcon: 'instagram' as const, color: platformColors.instagram },
  tiktok: { label: 'TikTok', featherIcon: 'music' as const, color: platformColors.tiktok },
} as const;

const METRIC_CONFIG = [
  { key: 'followers', label: 'Seguidores', icon: 'users' as const, color: colors.info, bg: colorAlpha.info10 },
  { key: 'avgLikes', label: 'Likes/Post', icon: 'heart' as const, color: colors.danger, bg: colorAlpha.danger10 },
  { key: 'avgViews', label: 'Views/Post', icon: 'eye' as const, color: colors.accent, bg: colorAlpha.accent10 },
  { key: 'engagementRate', label: 'Engajamento', icon: 'trending-up' as const, color: colors.success, bg: colorAlpha.success10 },
] as const;

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

export default function SocialScreen() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [showConnectInfo, setShowConnectInfo] = useState(false);
  const [connectData, setConnectData] = useState<ConnectResponse | null>(null);

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await socialApi.accounts();
      setAccounts(res.accounts);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAccounts();
  }, [fetchAccounts]);

  const handleConnect = useCallback(async () => {
    setConnecting(true);
    try {
      const res = await socialApi.connect();
      setConnectData(res);
      setShowConnectInfo(true);
    } catch (err: any) {
      Alert.alert('Erro', err.message ?? 'Falha ao iniciar conexao');
    } finally {
      setConnecting(false);
    }
  }, []);

  const handleSync = useCallback(async (platform: 'instagram' | 'tiktok') => {
    setSyncing(platform);
    try {
      await socialApi.sync(platform);
      await fetchAccounts();
      Alert.alert('Sucesso', 'Metricas atualizadas!');
    } catch (err: any) {
      Alert.alert('Erro', err.message ?? 'Falha ao sincronizar');
    } finally {
      setSyncing(null);
    }
  }, [fetchAccounts]);

  const handleDisconnect = useCallback(async (platform: string) => {
    Alert.alert(
      'Desconectar',
      `Deseja desconectar ${PLATFORM_CONFIG[platform as keyof typeof PLATFORM_CONFIG]?.label}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desconectar',
          style: 'destructive',
          onPress: async () => {
            try {
              await socialApi.disconnect(platform);
              await fetchAccounts();
            } catch (err: any) {
              Alert.alert('Erro', err.message ?? 'Falha ao desconectar');
            }
          },
        },
      ],
    );
  }, [fetchAccounts]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const connectedAccounts = accounts.filter(a => a.status === 'connected');
  const hasInstagram = connectedAccounts.some(a => a.platform === 'instagram');
  const hasTiktok = connectedAccounts.some(a => a.platform === 'tiktok');

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerIconWrap}>
          <Feather name="bar-chart-2" size={20} color={colors.primary} />
        </View>
        <View>
          <Text style={styles.title}>Redes Sociais</Text>
          <Text style={styles.subtitle}>Conecte suas contas para acompanhar metricas</Text>
        </View>
      </View>

      {/* Botao Conectar */}
      {(!hasInstagram || !hasTiktok) && (
        <Pressable
          style={[styles.connectButtonWrap, connecting && { opacity: 0.6 }]}
          onPress={handleConnect}
          disabled={connecting}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.connectButton}
          >
            {connecting ? (
              <ActivityIndicator color={colors.text} size="small" />
            ) : (
              <>
                <Feather name="plus-circle" size={20} color={colors.text} />
                <Text style={styles.connectButtonText}>Conectar Rede Social</Text>
              </>
            )}
          </LinearGradient>
        </Pressable>
      )}

      {/* Contas Conectadas */}
      {connectedAccounts.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconWrap}>
            <Feather name="smartphone" size={32} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>Nenhuma conta conectada</Text>
          <Text style={styles.emptySubtitle}>
            Conecte seu Instagram ou TikTok para ver suas metricas de performance
          </Text>
        </View>
      ) : (
        connectedAccounts.map((account) => {
          const config = PLATFORM_CONFIG[account.platform];
          const isSyncing = syncing === account.platform;

          const metricValues: Record<string, string> = {
            followers: formatNumber(account.followers),
            avgLikes: formatNumber(account.avgLikes),
            avgViews: formatNumber(account.avgViews),
            engagementRate: account.engagementRate.toFixed(1) + '%',
          };

          return (
            <View key={account.id} style={styles.card}>
              {/* Header da conta */}
              <View style={styles.cardHeader}>
                <View style={styles.platformInfo}>
                  <View style={[styles.platformIconCircle, { backgroundColor: config.color + '22' }]}>
                    <Feather name={config.featherIcon} size={20} color={config.color} />
                  </View>
                  <View>
                    <Text style={styles.platformName}>{config.label}</Text>
                    <Text style={styles.username}>
                      @{account.username ?? '—'}
                      {account.isVerified && ' ✓'}
                    </Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: config.color + '22' }]}>
                  <View style={[styles.statusDot, { backgroundColor: config.color }]} />
                  <Text style={[styles.statusText, { color: config.color }]}>Conectado</Text>
                </View>
              </View>

              {/* Metricas principais */}
              <View style={styles.metricsGrid}>
                {METRIC_CONFIG.map((m) => (
                  <View key={m.key} style={[styles.metricItem, { backgroundColor: m.bg }]}>
                    <Feather name={m.icon} size={14} color={m.color} style={styles.metricIcon} />
                    <Text style={[styles.metricValue, { color: m.key === 'engagementRate' ? colors.success : colors.text }]}>
                      {metricValues[m.key]}
                    </Text>
                    <Text style={styles.metricLabel}>{m.label}</Text>
                  </View>
                ))}
              </View>

              {/* Ultima sincronizacao */}
              {account.lastSyncAt && (
                <Text style={styles.lastSync}>
                  Atualizado: {new Date(account.lastSyncAt).toLocaleDateString('pt-BR')}
                </Text>
              )}

              {/* Acoes */}
              <View style={styles.actionsRow}>
                <Pressable
                  style={[styles.actionButton, isSyncing && { opacity: 0.6 }]}
                  onPress={() => handleSync(account.platform)}
                  disabled={isSyncing}
                >
                  {isSyncing ? (
                    <ActivityIndicator color={colors.primary} size="small" />
                  ) : (
                    <>
                      <Feather name="refresh-cw" size={14} color={colors.primary} />
                      <Text style={styles.actionButtonText}>Atualizar</Text>
                    </>
                  )}
                </Pressable>
                <Pressable
                  style={styles.disconnectButton}
                  onPress={() => handleDisconnect(account.platform)}
                >
                  <Feather name="x" size={14} color={colors.danger} />
                  <Text style={styles.disconnectButtonText}>Desconectar</Text>
                </Pressable>
              </View>
            </View>
          );
        })
      )}

      {/* Resumo de engajamento */}
      {connectedAccounts.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Resumo Geral</Text>
          <View style={[styles.summaryRow, styles.summaryRowBorder]}>
            <View style={styles.summaryLabelRow}>
              <Feather name="users" size={14} color={colors.info} />
              <Text style={styles.summaryLabel}>Total de seguidores</Text>
            </View>
            <Text style={[styles.summaryValue, { color: colors.info }]}>
              {formatNumber(connectedAccounts.reduce((s, a) => s + a.followers, 0))}
            </Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryRowBorder]}>
            <View style={styles.summaryLabelRow}>
              <Feather name="trending-up" size={14} color={colors.success} />
              <Text style={styles.summaryLabel}>Engajamento medio</Text>
            </View>
            <Text style={[styles.summaryValue, { color: colors.success }]}>
              {connectedAccounts.length > 0
                ? (
                    connectedAccounts.reduce((s, a) => s + a.engagementRate, 0) /
                    connectedAccounts.length
                  ).toFixed(1)
                : '0'}
              %
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <View style={styles.summaryLabelRow}>
              <Feather name="link" size={14} color={colors.primaryLight} />
              <Text style={styles.summaryLabel}>Plataformas conectadas</Text>
            </View>
            <Text style={[styles.summaryValue, { color: colors.primaryLight }]}>
              {connectedAccounts.length}
            </Text>
          </View>
        </View>
      )}

      {/* Modal com instrucoes de conexao */}
      <Modal visible={showConnectInfo} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal icon */}
            <View style={styles.modalIconWrap}>
              <Feather name="shield" size={28} color={colors.primary} />
            </View>
            <Text style={styles.modalTitle}>Conectar Rede Social</Text>
            <Text style={styles.modalText}>
              Para conectar sua conta, voce sera redirecionado para autorizar o acesso
              de leitura das suas metricas publicas.
            </Text>
            <Text style={styles.modalText}>
              Nos acessamos apenas dados de performance (seguidores, curtidas, views).
              Nunca publicamos nada em seu nome.
            </Text>
            {connectData && (
              <View style={styles.modalInfo}>
                <Text style={styles.modalInfoText}>
                  Ambiente: {connectData.environment}
                </Text>
                <Text style={styles.modalInfoText}>
                  Token gerado com sucesso
                </Text>
              </View>
            )}
            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalSecondary}
                onPress={() => setShowConnectInfo(false)}
              >
                <Text style={styles.modalSecondaryText}>Fechar</Text>
              </Pressable>
              <Pressable
                style={styles.modalPrimaryWrap}
                onPress={() => {
                  setShowConnectInfo(false);
                  // TODO: Abrir WebView com Phyllo Connect SDK
                  Alert.alert(
                    'Em breve',
                    'A conexao via OAuth sera habilitada quando as credenciais Phyllo estiverem configuradas. ' +
                    'Por enquanto, suas metricas serao atualizadas automaticamente apos a configuracao.',
                  );
                }}
              >
                <LinearGradient
                  colors={[colors.primary, colors.primaryDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.modalPrimary}
                >
                  <Text style={styles.modalPrimaryText}>Continuar</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  headerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colorAlpha.primary20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: colors.text,
    fontSize: fontSize.xxl,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginTop: 2,
  },

  // Botao conectar
  connectButtonWrap: {
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    ...shadows.glowPrimary,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    height: layout.buttonHeightLg,
    gap: spacing.sm,
  },
  connectButtonText: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.xl,
    backgroundColor: colorAlpha.primary15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colorAlpha.primary30,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
  emptySubtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    lineHeight: 20,
  },

  // Card
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardTitle: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  platformInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  platformIconCircle: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  platformName: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  username: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginTop: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },

  // Metricas
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  metricItem: {
    flex: 1,
    minWidth: '40%' as any,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    alignItems: 'center',
  },
  metricIcon: {
    marginBottom: 4,
  },
  metricValue: {
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  metricLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    marginTop: 2,
  },

  lastSync: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginBottom: spacing.sm,
  },

  // Acoes
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colorAlpha.primary20,
    borderRadius: borderRadius.sm,
    height: layout.iconXl,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  actionButtonText: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  disconnectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colorAlpha.danger20,
    borderRadius: borderRadius.sm,
    height: layout.iconXl,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  disconnectButtonText: {
    color: colors.danger,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },

  // Resumo
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  summaryRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  summaryLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  summaryLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  summaryValue: {
    fontSize: fontSize.sm,
    fontWeight: '700',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlayHeavy,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  modalIconWrap: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.lg,
    backgroundColor: colorAlpha.primary20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colorAlpha.primary30,
  },
  modalTitle: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '700',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  modalText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 20,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  modalInfo: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginVertical: spacing.sm,
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalInfoText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    width: '100%',
  },
  modalSecondary: {
    flex: 1,
    height: 44,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalSecondaryText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  modalPrimaryWrap: {
    flex: 1,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    ...shadows.glowPrimary,
  },
  modalPrimary: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPrimaryText: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
});
