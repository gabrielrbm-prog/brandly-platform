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
import { brandsApi } from '@/lib/api';
import { borderRadius, categoryColors, colorAlpha, colors, fontSize, fontWeight as fw, layout, spacing } from '@/lib/theme';
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

  const getCategoryBadgeColor = (category: string): string => {
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

  const renderBrandCard = useCallback(
    ({ item }: { item: Brand }) => (
      <Pressable
        style={({ pressed }) => [
          styles.brandCard,
          pressed && styles.brandCardPressed,
        ]}
        onPress={() => handleBrandPress(item)}
      >
        <View style={styles.brandHeader}>
          <Text style={styles.brandName}>{item.name}</Text>
          <View
            style={[
              styles.categoryBadge,
              { backgroundColor: getCategoryBadgeColor(item.category) + '20' },
            ]}
          >
            <Text
              style={[
                styles.categoryBadgeText,
                { color: getCategoryBadgeColor(item.category) },
              ]}
            >
              {item.category}
            </Text>
          </View>
        </View>
        <Text style={styles.brandDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.brandFooter}>
          <Text style={styles.slotsText}>
            {item.creatorsConnected}/{item.maxSlots} creators
          </Text>
          <View style={styles.slotsBarBg}>
            <View
              style={[
                styles.slotsBarFill,
                {
                  width: `${Math.min((item.creatorsConnected / item.maxSlots) * 100, 100)}%`,
                },
              ]}
            />
          </View>
        </View>
      </Pressable>
    ),
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
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat}
              style={[
                styles.categoryPill,
                selectedCategory === cat && styles.categoryPillActive,
              ]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text
                style={[
                  styles.categoryPillText,
                  selectedCategory === cat && styles.categoryPillTextActive,
                ]}
              >
                {cat}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Minhas Marcas Section */}
        {myBrands.length > 0 && (
          <View style={styles.myBrandsSection}>
            <Text style={styles.sectionTitle}>Minhas Marcas</Text>
            {myBrands.map((brand) => (
              <Pressable
                key={brand.id}
                style={({ pressed }) => [
                  styles.brandCard,
                  styles.myBrandCard,
                  pressed && styles.brandCardPressed,
                ]}
                onPress={() => handleBrandPress(brand)}
              >
                <View style={styles.brandHeader}>
                  <Text style={styles.brandName}>{brand.name}</Text>
                  <View
                    style={[
                      styles.categoryBadge,
                      {
                        backgroundColor:
                          getCategoryBadgeColor(brand.category) + '20',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryBadgeText,
                        { color: getCategoryBadgeColor(brand.category) },
                      ]}
                    >
                      {brand.category}
                    </Text>
                  </View>
                </View>
                <Text style={styles.brandDescription} numberOfLines={2}>
                  {brand.description}
                </Text>
              </Pressable>
            ))}
            <View style={styles.sectionDivider} />
            <Text style={styles.sectionTitle}>Todas as Marcas</Text>
          </View>
        )}
      </View>
    ),
    [myBrands, selectedCategory, handleBrandPress],
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
        renderItem={renderBrandCard}
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
            <Text style={styles.emptyText}>
              Nenhuma marca encontrada nesta categoria.
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
    backgroundColor: colors.primary,
    borderColor: colors.primary,
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
  myBrandsSection: {
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fw.bold,
    marginBottom: spacing.md,
  },
  sectionDivider: {
    height: layout.dividerHeight,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },
  brandCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  myBrandCard: {
    borderColor: colorAlpha.primary25,
  },
  brandCardPressed: {
    opacity: 0.7,
  },
  brandHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  brandName: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fw.semibold,
    flex: 1,
    marginRight: spacing.sm,
  },
  categoryBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
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
  brandFooter: {
    gap: spacing.xs,
  },
  slotsText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
  slotsBarBg: {
    height: layout.progressBarSm,
    backgroundColor: colors.border,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  slotsBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
  },
});
