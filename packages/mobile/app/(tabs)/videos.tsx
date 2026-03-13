import React, { useCallback, useEffect, useState } from 'react';
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
import { brandsApi, videosApi } from '@/lib/api';
import { borderRadius, colorAlpha, colors, fontSize, layout, spacing, statusColors } from '@/lib/theme';
import { useAuth } from '@/contexts/AuthContext';

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

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  pending: { color: statusColors.pending, label: 'Pendente' },
  approved: { color: statusColors.approved, label: 'Aprovado' },
  rejected: { color: statusColors.rejected, label: 'Rejeitado' },
};

export default function VideosScreen() {
  useAuth();

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
        <View style={styles.videoCard}>
          <View style={styles.videoHeader}>
            <Text style={styles.videoBrandName}>{item.brandName}</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: status.color + '20' },
              ]}
            >
              <Text style={[styles.statusBadgeText, { color: status.color }]}>
                {status.label}
              </Text>
            </View>
          </View>
          <View style={styles.videoFooter}>
            <Text style={styles.videoDate}>{formatDate(item.createdAt)}</Text>
            <Text style={styles.videoPayment}>
              R$ {(item.payment ?? 0).toFixed(2)}
            </Text>
          </View>
        </View>
      );
    },
    [],
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
            {/* Daily Stats Bar */}
            <View style={styles.dailyStatsCard}>
              <View style={styles.dailyStatsHeader}>
                <Text style={styles.dailyStatsTitle}>
                  Hoje: {dailyCount}/{maxDaily} videos
                </Text>
              </View>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${progressPercent}%` },
                  ]}
                />
              </View>
            </View>

            {/* Submit Button */}
            <Pressable
              style={({ pressed }) => [
                styles.submitButton,
                pressed && styles.submitButtonPressed,
              ]}
              onPress={openSubmitModal}
            >
              <Text style={styles.submitButtonText}>Enviar Video</Text>
            </Pressable>

            {/* List Header */}
            <Text style={styles.listTitle}>Videos Enviados</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              Nenhum video enviado ainda. Comece agora!
            </Text>
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
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <Pressable style={styles.modalContent} onPress={() => {}}>
            <Text style={styles.modalTitle}>Enviar Video</Text>

            {/* Brand Selector */}
            <Text style={styles.inputLabel}>Marca</Text>
            <View style={styles.brandSelectorContainer}>
              {myBrands.map((brand) => (
                <Pressable
                  key={brand.id}
                  style={[
                    styles.brandOption,
                    selectedBrand?.id === brand.id &&
                      styles.brandOptionSelected,
                  ]}
                  onPress={() => setSelectedBrand(brand)}
                >
                  <Text
                    style={[
                      styles.brandOptionText,
                      selectedBrand?.id === brand.id &&
                        styles.brandOptionTextSelected,
                    ]}
                  >
                    {brand.name}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Video URL */}
            <Text style={styles.inputLabel}>URL do Video</Text>
            <TextInput
              style={styles.textInput}
              placeholder="https://..."
              placeholderTextColor={colors.textMuted}
              value={videoUrl}
              onChangeText={setVideoUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />

            {/* Platform Selector */}
            <Text style={styles.inputLabel}>Plataforma</Text>
            <View style={styles.platformContainer}>
              {PLATFORMS.map((p) => (
                <Pressable
                  key={p.value}
                  style={[
                    styles.platformOption,
                    selectedPlatform === p.value &&
                      styles.platformOptionSelected,
                  ]}
                  onPress={() => setSelectedPlatform(p.value)}
                >
                  <Text
                    style={[
                      styles.platformOptionText,
                      selectedPlatform === p.value &&
                        styles.platformOptionTextSelected,
                    ]}
                  >
                    {p.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Actions */}
            <Pressable
              style={({ pressed }) => [
                styles.modalSubmitButton,
                pressed && styles.submitButtonPressed,
                submitting && { opacity: 0.5 },
              ]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color={colors.text} size="small" />
              ) : (
                <Text style={styles.submitButtonText}>Enviar</Text>
              )}
            </Pressable>

            <Pressable
              style={styles.modalCancelButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalCancelText}>Cancelar</Text>
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
    backgroundColor: colors.background,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: colors.danger,
    fontSize: fontSize.md,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  dailyStatsCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  dailyStatsHeader: {
    marginBottom: spacing.sm,
  },
  dailyStatsTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  progressBarBg: {
    height: layout.progressBarLg,
    backgroundColor: colors.border,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  submitButtonPressed: {
    opacity: 0.8,
  },
  submitButtonText: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  listTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  videoCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  videoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  videoBrandName: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
    flex: 1,
    marginRight: spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  statusBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  videoFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  videoDate: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
  videoPayment: {
    color: colors.success,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    textAlign: 'center',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlayHeavy,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  modalTitle: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '700',
    marginBottom: spacing.lg,
  },
  inputLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: '600',
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
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  brandOptionSelected: {
    backgroundColor: colorAlpha.primary30,
    borderColor: colors.primary,
  },
  brandOptionText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  brandOptionTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontSize: fontSize.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  platformContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  platformOption: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  platformOptionSelected: {
    backgroundColor: colorAlpha.primary30,
    borderColor: colors.primary,
  },
  platformOptionText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  platformOptionTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  modalSubmitButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  modalCancelButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  modalCancelText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
  },
});
