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
import { socialApi, type SocialAccount, type ConnectResponse } from '@/lib/api';
import { borderRadius, colorAlpha, colors, fontSize, layout, platformColors, spacing } from '@/lib/theme';

const PLATFORM_CONFIG = {
  instagram: { label: 'Instagram', icon: '📸', color: platformColors.instagram },
  tiktok: { label: 'TikTok', icon: '🎵', color: platformColors.tiktok },
} as const;

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
      <Text style={styles.title}>Redes Sociais</Text>
      <Text style={styles.subtitle}>
        Conecte suas contas para acompanhar metricas
      </Text>

      {/* Botao Conectar */}
      {(!hasInstagram || !hasTiktok) && (
        <Pressable
          style={[styles.connectButton, connecting && { opacity: 0.6 }]}
          onPress={handleConnect}
          disabled={connecting}
        >
          {connecting ? (
            <ActivityIndicator color={colors.text} size="small" />
          ) : (
            <>
              <Text style={styles.connectButtonIcon}>+</Text>
              <Text style={styles.connectButtonText}>Conectar Rede Social</Text>
            </>
          )}
        </Pressable>
      )}

      {/* Contas Conectadas */}
      {connectedAccounts.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📱</Text>
          <Text style={styles.emptyTitle}>Nenhuma conta conectada</Text>
          <Text style={styles.emptySubtitle}>
            Conecte seu Instagram ou TikTok para ver suas metricas de performance
          </Text>
        </View>
      ) : (
        connectedAccounts.map((account) => {
          const config = PLATFORM_CONFIG[account.platform];
          const isSyncing = syncing === account.platform;

          return (
            <View key={account.id} style={styles.card}>
              {/* Header da conta */}
              <View style={styles.cardHeader}>
                <View style={styles.platformInfo}>
                  <Text style={styles.platformIcon}>{config.icon}</Text>
                  <View>
                    <Text style={styles.platformName}>{config.label}</Text>
                    <Text style={styles.username}>
                      @{account.username ?? '—'}
                      {account.isVerified && ' ✓'}
                    </Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: config.color + '33' }]}>
                  <Text style={[styles.statusText, { color: config.color }]}>Conectado</Text>
                </View>
              </View>

              {/* Metricas principais */}
              <View style={styles.metricsGrid}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricValue}>{formatNumber(account.followers)}</Text>
                  <Text style={styles.metricLabel}>Seguidores</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricValue}>{formatNumber(account.avgLikes)}</Text>
                  <Text style={styles.metricLabel}>Likes/Post</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricValue}>{formatNumber(account.avgViews)}</Text>
                  <Text style={styles.metricLabel}>Views/Post</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={[styles.metricValue, { color: colors.success }]}>
                    {account.engagementRate.toFixed(1)}%
                  </Text>
                  <Text style={styles.metricLabel}>Engajamento</Text>
                </View>
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
                    <Text style={styles.actionButtonText}>Atualizar</Text>
                  )}
                </Pressable>
                <Pressable
                  style={styles.disconnectButton}
                  onPress={() => handleDisconnect(account.platform)}
                >
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
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total de seguidores</Text>
            <Text style={styles.summaryValue}>
              {formatNumber(connectedAccounts.reduce((s, a) => s + a.followers, 0))}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Engajamento medio</Text>
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
            <Text style={styles.summaryLabel}>Plataformas conectadas</Text>
            <Text style={styles.summaryValue}>{connectedAccounts.length}</Text>
          </View>
        </View>
      )}

      {/* Modal com instrucoes de conexao */}
      <Modal visible={showConnectInfo} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
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
                style={styles.modalPrimary}
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
                <Text style={styles.modalPrimaryText}>Continuar</Text>
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

  title: {
    color: colors.text,
    fontSize: fontSize.xxl,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    marginBottom: spacing.lg,
  },

  // Botao conectar
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    height: layout.buttonHeightLg,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  connectButtonIcon: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '700',
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
    gap: spacing.sm,
  },
  emptyIcon: { fontSize: fontSize.emoji },
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
  platformIcon: { fontSize: fontSize['2xl'] },
  platformName: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  username: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  statusBadge: {
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
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
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    alignItems: 'center',
  },
  metricValue: {
    color: colors.text,
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
    backgroundColor: colorAlpha.primary20,
    borderRadius: borderRadius.sm,
    height: layout.iconXl,
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: colorAlpha.danger20,
    borderRadius: borderRadius.sm,
    height: layout.iconXl,
    alignItems: 'center',
    justifyContent: 'center',
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
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  summaryLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  summaryValue: {
    color: colors.text,
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
  },
  modalTitle: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  modalText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  modalInfo: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginVertical: spacing.sm,
  },
  modalInfoText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
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
  modalPrimary: {
    flex: 1,
    height: 44,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  modalPrimaryText: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
});
