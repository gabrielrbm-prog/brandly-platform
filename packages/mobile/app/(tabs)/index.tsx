import React, { useCallback, useEffect, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { dashboardApi } from '@/lib/api';
import { borderRadius, colors, fontSize, layout, spacing } from '@/lib/theme';
import { useAuth } from '@/contexts/AuthContext';
import AnimatedListItem, { FadeInView } from '@/components/AnimatedList';
import { SkeletonCard } from '@/components/Skeleton';

interface DailyStats {
  approved: number;
  pending: number;
  rejected: number;
  earningsToday: number;
  remainingSlots: number;
}

interface MonthlyStats {
  totalVideos: number;
  approvalRate: number;
  totalEarnings: number;
  earningsBreakdown: {
    videos: number;
    commissions: number;
    bonuses: number;
  };
}

interface Overview {
  daily: DailyStats;
  monthly: MonthlyStats;
  level: {
    name: string;
    progress: number;
  };
  activeBrands: number;
}

export default function HomeScreen() {
  const { user } = useAuth();
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const result = (await dashboardApi.overview()) as Overview;
      setData(result);
    } catch (err: any) {
      setError(err.message ?? 'Erro ao carregar dados');
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

  if (loading) {
    return (
      <View style={[styles.container, { padding: spacing.md }]}>
        <SkeletonCard />
        <View style={{ height: spacing.md }} />
        <SkeletonCard />
        <View style={{ height: spacing.md }} />
        <SkeletonCard />
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

  const daily = data?.daily;
  const monthly = data?.monthly;
  const level = data?.level;

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
      <FadeInView>
        <Text style={styles.greeting}>
          Ola, {user?.name ?? 'Creator'}
        </Text>
        <Text style={styles.subtitle}>Seu resumo de hoje</Text>
      </FadeInView>

      {/* Card: Hoje */}
      <AnimatedListItem index={0}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Hoje</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{daily?.approved ?? 0}</Text>
            <Text style={styles.statLabel}>Aprovados</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.warning }]}>
              {daily?.pending ?? 0}
            </Text>
            <Text style={styles.statLabel}>Pendentes</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.danger }]}>
              {daily?.rejected ?? 0}
            </Text>
            <Text style={styles.statLabel}>Rejeitados</Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.success }]}>
              R$ {(daily?.earningsToday ?? 0).toFixed(2)}
            </Text>
            <Text style={styles.statLabel}>Ganhos Hoje</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primaryLight }]}>
              {daily?.remainingSlots ?? 10}/10
            </Text>
            <Text style={styles.statLabel}>Slots Restantes</Text>
          </View>
        </View>
      </View>
      </AnimatedListItem>

      {/* Card: Este Mes */}
      <AnimatedListItem index={1}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Este Mes</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{monthly?.totalVideos ?? 0}</Text>
            <Text style={styles.statLabel}>Videos</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.success }]}>
              {((monthly?.approvalRate ?? 0) * 100).toFixed(0)}%
            </Text>
            <Text style={styles.statLabel}>Aprovacao</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.success }]}>
              R$ {(monthly?.totalEarnings ?? 0).toFixed(2)}
            </Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>
        {monthly?.earningsBreakdown && (
          <>
            <View style={styles.divider} />
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Videos</Text>
              <Text style={styles.breakdownValue}>
                R$ {(monthly.earningsBreakdown.videos ?? 0).toFixed(2)}
              </Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Comissoes</Text>
              <Text style={styles.breakdownValue}>
                R$ {(monthly.earningsBreakdown.commissions ?? 0).toFixed(2)}
              </Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Bonus</Text>
              <Text style={styles.breakdownValue}>
                R$ {(monthly.earningsBreakdown.bonuses ?? 0).toFixed(2)}
              </Text>
            </View>
          </>
        )}
      </View>
      </AnimatedListItem>

      {/* Card: Nivel */}
      <AnimatedListItem index={2}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Nivel</Text>
        <Text style={styles.levelName}>{level?.name ?? 'Seed'}</Text>
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${((level?.progress ?? 0) * 100).toFixed(0)}%` as any },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {((level?.progress ?? 0) * 100).toFixed(0)}% para o proximo nivel
        </Text>
      </View>
      </AnimatedListItem>

      {/* Card: Marcas Ativas */}
      <AnimatedListItem index={3}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Marcas Ativas</Text>
        <Text style={styles.bigNumber}>{data?.activeBrands ?? 0}</Text>
        <Text style={styles.statLabel}>marcas conectadas</Text>
      </View>
      </AnimatedListItem>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
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
  greeting: {
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
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '700',
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  divider: {
    height: layout.dividerHeight,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  breakdownLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  breakdownValue: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  levelName: {
    color: colors.primary,
    fontSize: fontSize.xl,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  progressBarBg: {
    height: layout.progressBarLg,
    backgroundColor: colors.border,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
  },
  progressText: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
  },
  bigNumber: {
    color: colors.primary,
    fontSize: fontSize.hero,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
});
