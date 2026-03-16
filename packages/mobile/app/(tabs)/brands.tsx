import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
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
import { brandsApi } from '@/lib/api';
import { borderRadius, categoryColors, fontSize, fontWeight as fw, layout, spacing } from '@/lib/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

const CATEGORIES = [
  'Todas',
  'Beleza',
  'Suplementos',
  'Casa',
  'Tech',
  'Moda',
  'Alimentos',
] as const;

interface Brand {
  id: string;
  name: string;
  category: string;
  description: string;
  creatorsConnected: number;
  maxSlots: number;
}

// Icone Feather por categoria
const CATEGORY_ICONS: Record<string, React.ComponentProps<typeof Feather>['name']> = {
  Beleza: 'heart',
  Suplementos: 'activity',
  Casa: 'home',
  Tech: 'cpu',
  Moda: 'scissors',
  Alimentos: 'coffee',
};

export default function BrandsScreen() {
  useAuth();
  const { colors, colorAlpha, shadows } = useTheme();

  const [brands, setBrands] = useState<Brand[]>([]);
  const [myBrands, setMyBrands] = useState<Brand[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const slideAnim = useRef(new Animated.Value(400)).current;

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const category = selectedCategory === 'Todas' ? undefined : selectedCategory;
      const [brandsResult, myBrandsResult] = await Promise.all([
        brandsApi.list(category) as Promise<Brand[]>,
        brandsApi.my() as Promise<Brand[]>,
      ]);
      setBrands(brandsResult);
      setMyBrands(myBrandsResult);
    } catch (err: any) {
      setError(err.message ?? 'Erro ao carregar marcas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const openModal = useCallback((brand: Brand) => {
    setSelectedBrand(brand);
    setModalVisible(true);
    slideAnim.setValue(400);
    Animated.spring(slideAnim, {
      toValue: 0,
      damping: 24,
      stiffness: 280,
      useNativeDriver: true,
    }).start();
  }, [slideAnim]);

  const closeModal = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: 400,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
      setSelectedBrand(null);
    });
  }, [slideAnim]);

  const handleBrandPress = useCallback((brand: Brand) => {
    openModal(brand);
  }, [openModal]);

  const isConnected = useCallback(
    (brand: Brand) => myBrands.some((b) => b.id === brand.id),
    [myBrands],
  );

  const handleConnectToggle = useCallback(async () => {
    if (!selectedBrand) return;
    setActionLoading(true);
    try {
      if (isConnected(selectedBrand)) {
        await brandsApi.disconnect(selectedBrand.id);
      } else {
        await brandsApi.connect(selectedBrand.id);
      }
      // Recarrega a lista sem fechar o modal — atualiza myBrands em background
      const category = selectedCategory === 'Todas' ? undefined : selectedCategory;
      const [brandsResult, myBrandsResult] = await Promise.all([
        brandsApi.list(category) as Promise<Brand[]>,
        brandsApi.my() as Promise<Brand[]>,
      ]);
      setBrands(brandsResult);
      setMyBrands(myBrandsResult);
    } catch (err: any) {
      // Mantém modal aberto e exibe erro inline via state — sem Alert
      setError(err.message ?? 'Erro ao atualizar marca');
    } finally {
      setActionLoading(false);
    }
  }, [selectedBrand, selectedCategory, isConnected]);

  const getCategoryColor = (category: string): string => {
    const map: Record<string, string> = {
      Beleza: categoryColors.beauty,
      Suplementos: categoryColors.supplements,
      Casa: categoryColors.home,
      Tech: categoryColors.tech,
      Moda: categoryColors.fashion,
      Alimentos: categoryColors.food,
    };
    return map[category] ?? colors.textMuted;
  };

  const getCategoryAlpha = (category: string, opacity: number): string => {
    const hex = getCategoryColor(category);
    // Retorna rgba com opacidade a partir da cor hex
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  const renderBrandCard = useCallback(
    ({ item, isMine = false }: { item: Brand; isMine?: boolean }) => {
      const catColor = getCategoryColor(item.category);
      const catIcon = CATEGORY_ICONS[item.category] ?? 'tag';
      const fillPct = Math.min((item.creatorsConnected / item.maxSlots) * 100, 100);
      const fillColor =
        fillPct > 80 ? colors.danger : fillPct > 50 ? colors.warning : colors.success;

      return (
        <Pressable
          style={({ pressed }) => [
            styles.brandCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
            isMine && [styles.myBrandCard, { borderColor: colorAlpha.primary25, borderBottomColor: colors.border }],
            pressed && styles.brandCardPressed,
          ]}
          onPress={() => handleBrandPress(item)}
        >
          {/* Gradient left border via absolute View */}
          <View style={[styles.brandCardLeftBorder, { backgroundColor: catColor }]} />

          <View style={styles.brandCardContent}>
            {/* Header */}
            <View style={styles.brandHeader}>
              {/* Icon badge */}
              <View style={[styles.brandIconBadge, { backgroundColor: getCategoryAlpha(item.category, 0.15) }]}>
                <Feather name={catIcon} size={16} color={catColor} />
              </View>

              <View style={styles.brandNameBlock}>
                <View style={styles.brandNameRow}>
                  <Text style={[styles.brandName, { color: colors.text }]}>{item.name}</Text>
                  {isMine && (
                    <View style={[styles.starBadge, { backgroundColor: colorAlpha.accent20 }]}>
                      <Feather name="star" size={10} color={colors.accent} />
                    </View>
                  )}
                </View>
                <View style={[styles.categoryBadge, { backgroundColor: getCategoryAlpha(item.category, 0.15) }]}>
                  <Text style={[styles.categoryBadgeText, { color: catColor }]}>
                    {item.category}
                  </Text>
                </View>
              </View>
            </View>

            {/* Description */}
            <Text style={[styles.brandDescription, { color: colors.textSecondary }]} numberOfLines={2}>
              {item.description}
            </Text>

            {/* Slots bar */}
            <View style={styles.brandFooter}>
              <View style={styles.slotsLabelRow}>
                <Text style={[styles.slotsText, { color: colors.textMuted }]}>
                  {item.creatorsConnected}/{item.maxSlots} creators
                </Text>
                <Text style={[styles.slotsPercent, { color: fillColor }]}>
                  {Math.round(fillPct)}%
                </Text>
              </View>
              <View style={[styles.slotsBarBg, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    styles.slotsBarFill,
                    {
                      width: `${fillPct}%` as any,
                      backgroundColor: fillColor,
                    },
                  ]}
                />
              </View>
            </View>
          </View>
        </Pressable>
      );
    },
    [colors, colorAlpha, handleBrandPress],
  );

  const ListHeader = useCallback(
    () => (
      <View>
        {/* Category Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <Pressable
                key={cat}
                onPress={() => setSelectedCategory(cat)}
              >
                {isActive ? (
                  <LinearGradient
                    colors={[colors.primary, colors.primaryDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.categoryPill, styles.categoryPillActive]}
                  >
                    <Text style={[styles.categoryPillText, styles.categoryPillTextActive, { color: colors.text }]}>
                      {cat}
                    </Text>
                  </LinearGradient>
                ) : (
                  <View style={[styles.categoryPill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.categoryPillText, { color: colors.textSecondary }]}>{cat}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Minhas Marcas Section */}
        {myBrands.length > 0 && (
          <View style={styles.myBrandsSection}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.sectionTitleIcon, { backgroundColor: colorAlpha.accent20 }]}>
                <Feather name="star" size={14} color={colors.accent} />
              </View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Minhas Marcas</Text>
            </View>
            <View style={[styles.myBrandsSectionBox, { borderColor: colorAlpha.primary25 }, shadows.glowPrimarySubtle]}>
              {myBrands.map((brand) =>
                renderBrandCard({ item: brand, isMine: true }),
              )}
            </View>
            <View style={[styles.sectionDivider, { backgroundColor: colors.border }]} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Todas as Marcas</Text>
          </View>
        )}
      </View>
    ),
    [colors, colorAlpha, shadows, myBrands, selectedCategory, handleBrandPress, renderBrandCard],
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

  // Derivações do modal para a marca selecionada
  const modalBrand = selectedBrand;
  const modalConnected = modalBrand ? isConnected(modalBrand) : false;
  const modalCatColor = modalBrand ? getCategoryColor(modalBrand.category) : colors.textMuted;
  const modalCatAlpha = modalBrand ? getCategoryAlpha(modalBrand.category, 0.15) : colorAlpha.muted20;
  const modalCatIcon: React.ComponentProps<typeof Feather>['name'] =
    (modalBrand && CATEGORY_ICONS[modalBrand.category]) ?? 'tag';
  const modalFillPct = modalBrand
    ? Math.min((modalBrand.creatorsConnected / modalBrand.maxSlots) * 100, 100)
    : 0;
  const modalFillColor =
    modalFillPct > 80 ? colors.danger : modalFillPct > 50 ? colors.warning : colors.success;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={brands}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => renderBrandCard({ item, isMine: false })}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconCircle, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Feather name="search" size={28} color={colors.textMuted} />
            </View>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Nenhuma marca encontrada nesta categoria.
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
              Tente selecionar outra categoria.
            </Text>
          </View>
        }
      />

      {/* Brand Detail Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="none"
        onRequestClose={closeModal}
        statusBarTranslucent
      >
        {/* Backdrop */}
        <Pressable
          style={[styles.modalBackdrop, { backgroundColor: colors.overlayHeavy }]}
          onPress={closeModal}
        >
          {/* Prevent close when tapping the sheet itself */}
          <Pressable onPress={() => {}}>
            <Animated.View
              style={[
                styles.modalSheet,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  transform: [{ translateY: slideAnim }],
                },
                shadows.lg,
              ]}
            >
              {/* Handle indicator */}
              <View style={[styles.modalHandle, { backgroundColor: colors.borderLight }]} />

              {/* Close button */}
              <Pressable
                style={[styles.modalCloseBtn, { backgroundColor: colorAlpha.muted20 }]}
                onPress={closeModal}
                hitSlop={8}
              >
                <Feather name="x" size={18} color={colors.textSecondary} />
              </Pressable>

              {/* Header */}
              {modalBrand && (
                <View style={styles.modalHeader}>
                  {/* Category icon badge */}
                  <View style={[styles.modalIconBadge, { backgroundColor: modalCatAlpha }]}>
                    <Feather name={modalCatIcon} size={22} color={modalCatColor} />
                  </View>

                  <View style={styles.modalTitleBlock}>
                    {/* Category badge */}
                    <View style={[styles.modalCategoryBadge, { backgroundColor: modalCatAlpha }]}>
                      <View style={[styles.modalCategoryDot, { backgroundColor: modalCatColor }]} />
                      <Text style={[styles.modalCategoryText, { color: modalCatColor }]}>
                        {modalBrand.category}
                      </Text>
                    </View>
                    <Text style={[styles.modalBrandName, { color: colors.text }]}>
                      {modalBrand.name}
                    </Text>
                  </View>
                </View>
              )}

              {/* Divider */}
              <View style={[styles.modalDivider, { backgroundColor: colors.border }]} />

              {/* Description */}
              {modalBrand && (
                <View style={styles.modalBody}>
                  <Text style={[styles.modalDescriptionLabel, { color: colors.textMuted }]}>
                    Sobre a marca
                  </Text>
                  <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>
                    {modalBrand.description}
                  </Text>

                  {/* Slots section */}
                  <View style={[styles.modalSlotsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.modalSlotsHeader}>
                      <View style={styles.modalSlotsLabelRow}>
                        <Feather name="users" size={14} color={colors.textMuted} />
                        <Text style={[styles.modalSlotsLabel, { color: colors.textMuted }]}>
                          Vagas de creators
                        </Text>
                      </View>
                      <Text style={[styles.modalSlotsCount, { color: modalFillColor }]}>
                        {modalBrand.creatorsConnected}/{modalBrand.maxSlots}
                      </Text>
                    </View>
                    <View style={[styles.modalSlotsBarBg, { backgroundColor: colors.border }]}>
                      <View
                        style={[
                          styles.modalSlotsBarFill,
                          {
                            width: `${modalFillPct}%` as any,
                            backgroundColor: modalFillColor,
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.modalSlotsPct, { color: modalFillColor }]}>
                      {Math.round(modalFillPct)}% preenchido
                    </Text>
                  </View>
                </View>
              )}

              {/* Action button */}
              {modalBrand && (
                <View style={styles.modalFooter}>
                  <Pressable
                    onPress={handleConnectToggle}
                    disabled={actionLoading}
                    style={({ pressed }) => [
                      styles.modalActionBtn,
                      modalConnected
                        ? [styles.modalDisconnectBtn, { borderColor: colors.danger }]
                        : { backgroundColor: colors.primary },
                      pressed && styles.modalActionBtnPressed,
                      actionLoading && styles.modalActionBtnDisabled,
                    ]}
                  >
                    {actionLoading ? (
                      <ActivityIndicator
                        size="small"
                        color={modalConnected ? colors.danger : colors.text}
                      />
                    ) : (
                      <>
                        <Feather
                          name={modalConnected ? 'user-minus' : 'user-plus'}
                          size={16}
                          color={modalConnected ? colors.danger : colors.text}
                        />
                        <Text
                          style={[
                            styles.modalActionBtnText,
                            { color: modalConnected ? colors.danger : colors.text },
                          ]}
                        >
                          {modalConnected ? 'Desconectar' : 'Conectar'}
                        </Text>
                      </>
                    )}
                  </Pressable>
                </View>
              )}
            </Animated.View>
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

  // Category Pills
  categoriesContainer: {
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  categoryPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryPillActive: {
    borderWidth: 0,
  },
  categoryPillText: {
    fontSize: fontSize.sm,
    fontWeight: fw.medium,
  },
  categoryPillTextActive: {
    fontWeight: '600',
  },

  // My Brands Section
  myBrandsSection: {
    marginBottom: spacing.sm,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitleIcon: {
    width: 26,
    height: 26,
    borderRadius: borderRadius.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fw.bold,
    marginBottom: spacing.md,
  },
  myBrandsSectionBox: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  sectionDivider: {
    height: layout.dividerHeight,
    marginVertical: spacing.lg,
  },

  // Brand Card
  brandCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  myBrandCard: {
    borderRadius: 0,
    marginBottom: 0,
    borderBottomWidth: 1,
  },
  brandCardPressed: {
    opacity: 0.75,
  },
  brandCardLeftBorder: {
    width: 4,
  },
  brandCardContent: {
    flex: 1,
    padding: spacing.md,
  },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  brandIconBadge: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandNameBlock: {
    flex: 1,
    gap: spacing.xs,
  },
  brandNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  brandName: {
    fontSize: fontSize.lg,
    fontWeight: fw.semibold,
    flex: 1,
  },
  starBadge: {
    width: 20,
    height: 20,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  categoryBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fw.semibold,
  },
  brandDescription: {
    fontSize: fontSize.sm,
    lineHeight: 20,
    marginBottom: spacing.md,
  },

  // Slots Bar
  brandFooter: {
    gap: spacing.xs,
  },
  slotsLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  slotsText: {
    fontSize: fontSize.xs,
  },
  slotsPercent: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  slotsBarBg: {
    height: layout.progressBarMd,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  slotsBarFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: fontSize.md,
    textAlign: 'center',
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: fontSize.sm,
    textAlign: 'center',
  },

  // Modal
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingBottom: spacing.xxl,
    minHeight: 380,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: borderRadius.full,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  modalCloseBtn: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  modalIconBadge: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  modalTitleBlock: {
    flex: 1,
    gap: spacing.xs,
  },
  modalCategoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.sm,
  },
  modalCategoryDot: {
    width: 6,
    height: 6,
    borderRadius: borderRadius.full,
  },
  modalCategoryText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  modalBrandName: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    lineHeight: 28,
  },
  modalDivider: {
    height: layout.dividerHeight,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  modalBody: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  modalDescriptionLabel: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  modalDescription: {
    fontSize: fontSize.sm,
    lineHeight: 22,
  },
  modalSlotsCard: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
  },
  modalSlotsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalSlotsLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  modalSlotsLabel: {
    fontSize: fontSize.xs,
    fontWeight: '500',
  },
  modalSlotsCount: {
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  modalSlotsBarBg: {
    height: layout.progressBarLg,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  modalSlotsBarFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  modalSlotsPct: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    textAlign: 'right',
  },
  modalFooter: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  modalActionBtn: {
    height: layout.buttonHeight,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  modalDisconnectBtn: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  modalActionBtnPressed: {
    opacity: 0.75,
  },
  modalActionBtnDisabled: {
    opacity: 0.5,
  },
  modalActionBtnText: {
    fontSize: fontSize.md,
    fontWeight: '600',
  },
});
