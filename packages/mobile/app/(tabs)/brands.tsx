import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
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
import { borderRadius, categoryColors, colorAlpha, colors, fontSize, fontWeight as fw, layout, shadows, spacing } from '@/lib/theme';
import { useAuth } from '@/contexts/AuthContext';

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

  const [brands, setBrands] = useState<Brand[]>([]);
  const [myBrands, setMyBrands] = useState<Brand[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleBrandPress = useCallback((brand: Brand) => {
    Alert.alert(brand.name, `Detalhes da marca ${brand.name} (em breve)`);
  }, []);

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
            isMine && styles.myBrandCard,
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
                  <Text style={styles.brandName}>{item.name}</Text>
                  {isMine && (
                    <View style={styles.starBadge}>
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
            <Text style={styles.brandDescription} numberOfLines={2}>
              {item.description}
            </Text>

            {/* Slots bar */}
            <View style={styles.brandFooter}>
              <View style={styles.slotsLabelRow}>
                <Text style={styles.slotsText}>
                  {item.creatorsConnected}/{item.maxSlots} creators
                </Text>
                <Text style={[styles.slotsPercent, { color: fillColor }]}>
                  {Math.round(fillPct)}%
                </Text>
              </View>
              <View style={styles.slotsBarBg}>
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
    [handleBrandPress],
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
                    <Text style={[styles.categoryPillText, styles.categoryPillTextActive]}>
                      {cat}
                    </Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.categoryPill}>
                    <Text style={styles.categoryPillText}>{cat}</Text>
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
              <View style={styles.sectionTitleIcon}>
                <Feather name="star" size={14} color={colors.accent} />
              </View>
              <Text style={styles.sectionTitle}>Minhas Marcas</Text>
            </View>
            <View style={[styles.myBrandsSectionBox, shadows.glowPrimarySubtle]}>
              {myBrands.map((brand) =>
                renderBrandCard({ item: brand, isMine: true }),
              )}
            </View>
            <View style={styles.sectionDivider} />
            <Text style={styles.sectionTitle}>Todas as Marcas</Text>
          </View>
        )}
      </View>
    ),
    [myBrands, selectedCategory, handleBrandPress, renderBrandCard],
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
            <View style={styles.emptyIconCircle}>
              <Feather name="search" size={28} color={colors.textMuted} />
            </View>
            <Text style={styles.emptyText}>
              Nenhuma marca encontrada nesta categoria.
            </Text>
            <Text style={styles.emptySubtext}>
              Tente selecionar outra categoria.
            </Text>
          </View>
        }
      />
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

  // Category Pills
  categoriesContainer: {
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  categoryPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryPillActive: {
    borderWidth: 0,
  },
  categoryPillText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fw.medium,
  },
  categoryPillTextActive: {
    color: colors.text,
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
    backgroundColor: colorAlpha.accent20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fw.bold,
    marginBottom: spacing.md,
  },
  myBrandsSectionBox: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colorAlpha.primary25,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  sectionDivider: {
    height: layout.dividerHeight,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },

  // Brand Card
  brandCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  myBrandCard: {
    borderColor: colorAlpha.primary25,
    borderRadius: 0,
    marginBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fw.semibold,
    flex: 1,
  },
  starBadge: {
    width: 20,
    height: 20,
    borderRadius: borderRadius.full,
    backgroundColor: colorAlpha.accent20,
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
    color: colors.textSecondary,
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
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
  slotsPercent: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  slotsBarBg: {
    height: layout.progressBarMd,
    backgroundColor: colors.border,
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    textAlign: 'center',
    fontWeight: '500',
  },
  emptySubtext: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
});
