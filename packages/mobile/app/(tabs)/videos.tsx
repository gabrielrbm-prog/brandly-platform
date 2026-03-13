import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { brandsApi, videosApi } from '@/lib/api';
import {
  borderRadius,
  fontSize,
  fontWeight,
  layout,
  spacing,
  statusColors,
  gradients,
} from '@/lib/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

interface DailySummary {
  submitted: number;
  approved: number;
  pending: number;
  rejected: number;
  maxDaily: number;
}

interface Video {
  id: string;
  brandName: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  payment: number;
}

interface Brand {
  id: string;
  name: string;
}

type Platform = 'tiktok' | 'instagram' | 'youtube';

const PLATFORMS: { value: Platform; label: string }[] = [
  { value: 'tiktok', label: 'TikTok' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'youtube', label: 'YouTube' },
];

export default function VideosScreen() {
  useAuth();
  const { colors, colorAlpha, shadows, isDark } = useTheme();

  const STATUS_CONFIG: Record<
    string,
    { color: string; label: string; icon: keyof typeof Feather.glyphMap; borderColor: string; bgAlpha: string }
  > = useMemo(() => ({
    pending: {
      color: statusColors.pending,
      label: 'Pendente',
      icon: 'clock',
      borderColor: colors.warning,
      bgAlpha: colorAlpha.warning10,
    },
    approved: {
      color: statusColors.approved,
      label: 'Aprovado',
      icon: 'check-circle',
      borderColor: colors.success,
      bgAlpha: colorAlpha.success10,
    },
    rejected: {
      color: statusColors.rejected,
      label: 'Rejeitado',
      icon: 'x-circle',
      borderColor: colors.danger,
      bgAlpha: colorAlpha.danger10,
    },
  }), [colors, colorAlpha]);

  const [videos, setVideos] = useState<Video[]>([]);
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Submit modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [myBrands, setMyBrands] = useState<Brand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('tiktok');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [videosResult, summaryResult] = await Promise.all([
        videosApi.list() as Promise<Video[]>,
        videosApi.dailySummary() as Promise<DailySummary>,
      ]);
      setVideos(videosResult);
      setSummary(summaryResult);
    } catch (err: any) {
      setError(err.message ?? 'Erro ao carregar videos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const openSubmitModal = useCallback(async () => {
    try {
      const brands = (await brandsApi.my()) as Brand[];
      setMyBrands(brands);
      if (brands.length === 0) {
        Alert.alert(
          'Sem marcas',
          'Voce precisa se conectar a uma marca antes de enviar videos.',
        );
        return;
      }
      setSelectedBrand(brands[0]);
      setVideoUrl('');
      setSelectedPlatform('tiktok');
      setModalVisible(true);
    } catch {
      Alert.alert('Erro', 'Nao foi possivel carregar suas marcas.');
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!selectedBrand) {
      Alert.alert('Erro', 'Selecione uma marca.');
      return;
    }
    if (!videoUrl.trim()) {
      Alert.alert('Erro', 'Insira a URL do video.');
      return;
    }

    setSubmitting(true);
    try {
      await videosApi.submit({
        brandId: selectedBrand.id,
        url: videoUrl.trim(),
        platform: selectedPlatform,
      });
      setModalVisible(false);
      fetchData();
    } catch (err: any) {
      Alert.alert('Erro', err.message ?? 'Nao foi possivel enviar o video.');
    } finally {
      setSubmitting(false);
    }
  }, [selectedBrand, videoUrl, selectedPlatform, fetchData]);

  const dailyCount = summary?.submitted ?? 0;
  const maxDaily = summary?.maxDaily ?? 10;
  const progressPercent = Math.min((dailyCount / maxDaily) * 100, 100);
  const isNearGoal = progressPercent >= 70;
  const progressColor = isNearGoal ? colors.success : colors.primary;
  const dailyEarnings = dailyCount * 10;

  const formatDate = (dateStr: string): string => {
    try {
      const d = new Date(dateStr);
      return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
    } catch {
      return dateStr;
    }
  };

  const renderVideoItem = useCallback(
    ({ item }: { item: Video }) => {
      const status = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.pending;
      return (
        <View
          style={[
            styles.videoCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderLeftColor: status.borderColor,
              ...shadows.sm,
            },
          ]}
        >
          <View style={styles.videoHeader}>
            <View style={styles.videoBrandRow}>
              <Feather
                name={status.icon}
                size={14}
                color={status.color}
                style={styles.statusIcon}
              />
              <Text style={[styles.videoBrandName, { color: colors.text }]}>{item.brandName}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: status.bgAlpha }]}>
              <Text style={[styles.statusBadgeText, { color: status.color }]}>
                {status.label}
              </Text>
            </View>
          </View>
          <View style={styles.videoFooter}>
            <View style={styles.videoDateRow}>
              <Feather name="calendar" size={12} color={colors.textMuted} />
              <Text style={[styles.videoDate, { color: colors.textMuted }]}>{formatDate(item.createdAt)}</Text>
            </View>
            <Text style={[styles.videoPayment, { color: colors.success }]}>
              R$ {(item.payment ?? 0).toFixed(2)}
            </Text>
          </View>
        </View>
      );
    },
    [STATUS_CONFIG, colors, shadows],
  );

  if (loading && !refreshing) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={videos}
        keyExtractor={(item) => item.id}
        renderItem={renderVideoItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <View>
            {/* Daily Progress Hero */}
            <LinearGradient
              colors={isDark ? gradients.dark.heroCard : gradients.light.heroCard}
              style={[
                styles.dailyHeroCard,
                {
                  borderColor: colorAlpha.primary20,
                  ...shadows.glowPrimarySubtle,
                },
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {/* Glow accent */}
              <View style={[styles.heroGlowDot, { backgroundColor: colorAlpha.primary15 }]} />

              <View style={styles.heroTopRow}>
                <Text style={[styles.heroLabel, { color: colors.textSecondary }]}>Progresso Diario</Text>
                <View style={[styles.heroDateBadge, { backgroundColor: colorAlpha.accent10 }]}>
                  <Feather name="sun" size={12} color={colors.accent} />
                  <Text style={[styles.heroDateText, { color: colors.accent }]}>Hoje</Text>
                </View>
              </View>

              {/* Ring progress area */}
              <View style={styles.heroCenter}>
                <View
                  style={[
                    styles.progressRingOuter,
                    { borderColor: colorAlpha.primary20 },
                  ]}
                >
                  <View
                    style={[
                      styles.progressRingInner,
                      { borderColor: progressColor + '60' },
                    ]}
                  >
                    <Text style={[styles.heroCountBig, { color: progressColor }]}>
                      {dailyCount}
                    </Text>
                    <Text style={[styles.heroCountSlash, { color: colors.textSecondary }]}>/ {maxDaily}</Text>
                    <Text style={[styles.heroCountLabel, { color: colors.textMuted }]}>videos</Text>
                  </View>
                </View>

                <View style={styles.heroRightInfo}>
                  <View style={styles.heroStatItem}>
                    <Feather name="check-circle" size={14} color={colors.success} />
                    <Text style={[styles.heroStatValue, { color: colors.text }]}>{summary?.approved ?? 0}</Text>
                    <Text style={[styles.heroStatLabel, { color: colors.textMuted }]}>aprovados</Text>
                  </View>
                  <View style={styles.heroStatItem}>
                    <Feather name="clock" size={14} color={colors.warning} />
                    <Text style={[styles.heroStatValue, { color: colors.text }]}>{summary?.pending ?? 0}</Text>
                    <Text style={[styles.heroStatLabel, { color: colors.textMuted }]}>pendentes</Text>
                  </View>
                  <View style={styles.heroStatItem}>
                    <Feather name="x-circle" size={14} color={colors.danger} />
                    <Text style={[styles.heroStatValue, { color: colors.text }]}>{summary?.rejected ?? 0}</Text>
                    <Text style={[styles.heroStatLabel, { color: colors.textMuted }]}>rejeitados</Text>
                  </View>
                </View>
              </View>

              {/* Progress bar */}
              <View style={[styles.progressBarBg, { backgroundColor: colorAlpha.white10 }]}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${progressPercent}%` as any,
                      backgroundColor: progressColor,
                    },
                  ]}
                />
              </View>

              {/* Daily earnings */}
              <View style={styles.heroEarningsRow}>
                <Feather name="dollar-sign" size={14} color={colors.accent} />
                <Text style={[styles.heroEarningsLabel, { color: colors.textSecondary }]}>Ganhos hoje: </Text>
                <Text style={[styles.heroEarningsValue, { color: colors.accent }]}>
                  R$ {dailyEarnings.toFixed(2)}
                </Text>
              </View>
            </LinearGradient>

            {/* Submit CTA Button */}
            <Pressable
              onPress={openSubmitModal}
              style={({ pressed }) => [pressed && { opacity: 0.85 }]}
            >
              <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                style={[styles.submitButton, shadows.glowPrimary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <View style={styles.submitButtonInner}>
                  <View style={[styles.submitIconCircle, { backgroundColor: colorAlpha.white10 }]}>
                    <Feather name="video" size={18} color={colors.text} />
                  </View>
                  <Text style={[styles.submitButtonText, { color: colors.text }]}>Enviar Video</Text>
                  <Feather name="plus-circle" size={18} color={colors.primaryLight} />
                </View>
              </LinearGradient>
            </Pressable>

            {/* List Header */}
            <View style={styles.listTitleRow}>
              <Text style={[styles.listTitle, { color: colors.text }]}>Videos Enviados</Text>
              <View style={[styles.listCountBadge, { backgroundColor: colorAlpha.primary20 }]}>
                <Text style={[styles.listCountText, { color: colors.primaryLight }]}>{videos.length}</Text>
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconCircle, { backgroundColor: colorAlpha.muted20 }]}>
              <Feather name="film" size={32} color={colors.textMuted} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Nenhum video ainda</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Envie seu primeiro video e comece a ganhar R$10 por aprovacao!
            </Text>
            <Pressable
              onPress={openSubmitModal}
              style={[styles.emptyCta, { backgroundColor: colorAlpha.primary20, borderColor: colors.primary }]}
            >
              <Text style={[styles.emptyCtaText, { color: colors.primary }]}>Enviar agora</Text>
            </Pressable>
          </View>
        }
      />

      {/* Submit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={[styles.modalOverlay, { backgroundColor: colors.overlayHeavy }]}
          onPress={() => setModalVisible(false)}
        >
          <Pressable
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
            onPress={() => {}}
          >
            {/* Drag handle */}
            <View style={[styles.modalDragHandle, { backgroundColor: colors.border }]} />

            <View style={styles.modalTitleRow}>
              <Feather name="video" size={20} color={colors.primary} />
              <Text style={[styles.modalTitle, { color: colors.text }]}>Enviar Video</Text>
            </View>

            {/* Brand Selector */}
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              <Feather name="tag" size={12} color={colors.textSecondary} /> Marca
            </Text>
            <View style={styles.brandSelectorContainer}>
              {myBrands.map((brand) => (
                <Pressable
                  key={brand.id}
                  style={[
                    styles.brandOption,
                    {
                      backgroundColor: colors.surfaceLight,
                      borderColor: colors.border,
                    },
                    selectedBrand?.id === brand.id && {
                      backgroundColor: colorAlpha.primary20,
                      borderColor: colors.primary,
                    },
                  ]}
                  onPress={() => setSelectedBrand(brand)}
                >
                  <Text
                    style={[
                      styles.brandOptionText,
                      { color: colors.textSecondary },
                      selectedBrand?.id === brand.id && {
                        color: colors.primary,
                        fontWeight: fontWeight.semibold,
                      },
                    ]}
                  >
                    {brand.name}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Video URL */}
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>URL do Video</Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: colors.surfaceLight,
                  borderColor: colors.border,
                },
              ]}
            >
              <Feather name="link" size={16} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.textInput, { color: colors.text }]}
                placeholder="https://..."
                placeholderTextColor={colors.textMuted}
                value={videoUrl}
                onChangeText={setVideoUrl}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
            </View>

            {/* Platform Selector */}
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Plataforma</Text>
            <View style={styles.platformContainer}>
              {PLATFORMS.map((p) => (
                <Pressable
                  key={p.value}
                  style={[
                    styles.platformOption,
                    {
                      backgroundColor: colors.surfaceLight,
                      borderColor: colors.border,
                    },
                    selectedPlatform === p.value && {
                      backgroundColor: colorAlpha.primary20,
                      borderColor: colors.primary,
                    },
                  ]}
                  onPress={() => setSelectedPlatform(p.value)}
                >
                  <Text
                    style={[
                      styles.platformOptionText,
                      { color: colors.textSecondary },
                      selectedPlatform === p.value && {
                        color: colors.primary,
                        fontWeight: fontWeight.semibold,
                      },
                    ]}
                  >
                    {p.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Actions */}
            <Pressable
              onPress={handleSubmit}
              disabled={submitting}
              style={({ pressed }) => [pressed && { opacity: 0.85 }, submitting && { opacity: 0.5 }]}
            >
              <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                style={[styles.modalSubmitButton, shadows.glowPrimary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {submitting ? (
                  <ActivityIndicator color={colors.text} size="small" />
                ) : (
                  <>
                    <Feather name="send" size={16} color={colors.text} />
                    <Text style={[styles.submitButtonText, { color: colors.text }]}>Enviar</Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>

            <Pressable
              style={styles.modalCancelButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>Cancelar</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: fontSize.md,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },

  // --- Daily Hero Card ---
  dailyHeroCard: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  heroGlowDot: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  heroLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  heroDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  heroDateText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  heroCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  progressRingOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRingInner: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  heroCountBig: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.extrabold,
    lineHeight: 36,
  },
  heroCountSlash: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  heroCountLabel: {
    fontSize: fontSize.xs,
  },
  heroRightInfo: {
    flex: 1,
    gap: spacing.sm,
  },
  heroStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  heroStatValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  heroStatLabel: {
    fontSize: fontSize.xs,
  },
  progressBarBg: {
    height: layout.progressBarMd,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  heroEarningsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  heroEarningsLabel: {
    fontSize: fontSize.sm,
  },
  heroEarningsValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },

  // --- Submit Button ---
  submitButton: {
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  submitButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  submitIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    flex: 1,
    textAlign: 'center',
  },

  // --- List header ---
  listTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  listTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  listCountBadge: {
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  listCountText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },

  // --- Video Cards ---
  videoCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderLeftWidth: 3,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  videoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  videoBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
    gap: spacing.xs,
  },
  statusIcon: {
    marginRight: 2,
  },
  videoBrandName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.sm,
  },
  statusBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  videoFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  videoDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  videoDate: {
    fontSize: fontSize.xs,
    marginLeft: 2,
  },
  videoPayment: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },

  // --- Empty State ---
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: fontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  emptyCta: {
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
  },
  emptyCtaText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },

  // --- Modal ---
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    borderTopWidth: 1,
  },
  modalDragHandle: {
    width: 40,
    height: 4,
    borderRadius: borderRadius.full,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  inputLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.sm,
  },
  brandSelectorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  brandOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  brandOptionText: {
    fontSize: fontSize.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  textInput: {
    flex: 1,
    fontSize: fontSize.md,
    paddingVertical: spacing.md,
  },
  platformContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  platformOption: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  platformOptionText: {
    fontSize: fontSize.sm,
  },
  modalSubmitButton: {
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  modalCancelButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: fontSize.md,
  },
});
