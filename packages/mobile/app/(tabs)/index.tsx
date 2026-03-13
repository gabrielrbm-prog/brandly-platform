import React, { useCallback, useEffect, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { dashboardApi } from '@/lib/api';
import {
  borderRadius,
  colorAlpha,
  colors,
  fontSize,
  fontWeight,
  layout,
  levelColors,
  shadows,
  spacing,
} from '@/lib/theme';
import { useAuth } from '@/contexts/AuthContext';
import AnimatedListItem, { FadeInView } from '@/components/AnimatedList';
import { SkeletonCard } from '@/components/Skeleton';
import GlowCard from '@/components/GlowCard';

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

// Retorna uma saudacao motivacional baseada nos slots usados
function getMotivationalSubtitle(daily: DailyStats | undefined): string {
  if (!daily) return 'Pronto para dominar hoje?';
  const used = 10 - (daily.remainingSlots ?? 10);
  if (used === 0) return 'Pronto para dominar hoje?';
  if (used < 5) return `${used} videos feitos — keep going!`;
  if (used < 10) return `${used}/10 — voce esta arrasando!`;
  return 'Meta diaria concluida!';
}

// Calcula quantos slots foram usados
function slotsUsed(daily: DailyStats | undefined): number {
  return 10 - (daily?.remainingSlots ?? 10);
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
  const levelName = level?.name ?? 'Seed';
  const levelColor = levelColors[levelName] ?? colors.primary;
  const progressPct = Math.min((level?.progress ?? 0) * 100, 100);
  const used = slotsUsed(daily);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
    >
      {/* ─── Hero: Greeting ─── */}
      <FadeInView>
        <LinearGradient
          colors={[colorAlpha.primary15, 'transparent']}
          style={styles.heroGradient}
        >
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.greeting}>
                Ola, {user?.name?.split(' ')[0] ?? 'Creator'} 👋
              </Text>
              <Text style={styles.subtitle}>
                {getMotivationalSubtitle(daily)}
              </Text>
            </View>
            {/* Badge de nivel */}
            <View style={[styles.levelBadge, { borderColor: levelColor, shadowColor: levelColor }]}>
              <Text style={[styles.levelBadgeText, { color: levelColor }]}>
                {levelName}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </FadeInView>

      {/* ─── Hero: Ganhos Hoje ─── */}
      <AnimatedListItem index={0}>
        <GlowCard style={styles.earningsHeroCard} glowColor={colors.success}>
          <LinearGradient
            colors={[colorAlpha.success20, colorAlpha.success10]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={styles.earningsHeroInner}>
            {/* Valor principal */}
            <View style={styles.earningsLeft}>
              <View style={styles.earningsLabelRow}>
                <Feather name="trending-up" size={14} color={colors.success} />
                <Text style={styles.earningsLabel}>Ganhos Hoje</Text>
              </View>
              <Text style={styles.earningsValue}>
                R${' '}
                <Text style={styles.earningsValueBig}>
                  {(daily?.earningsToday ?? 0).toFixed(2)}
                </Text>
              </Text>
              <Text style={styles.earningsGoalText}>
                Meta: R$ 100,00/dia
              </Text>
            </View>

            {/* Indicador circular de slots */}
            <View style={styles.slotsRing}>
              <View style={styles.slotsRingOuter}>
                <View style={styles.slotsRingInner}>
                  <Text style={styles.slotsNumber}>{used}</Text>
                  <Text style={styles.slotsTotal}>/10</Text>
                </View>
              </View>
              <Text style={styles.slotsLabel}>videos</Text>
            </View>
          </View>

          {/* Barra de progresso de slots */}
          <View style={styles.slotsBarBg}>
            <LinearGradient
              colors={[colors.success, colors.successLight ?? colors.success]}
              style={[styles.slotsBarFill, { width: `${(used / 10) * 100}%` as any }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </View>
          <Text style={styles.slotsBarLabel}>
            {daily?.remainingSlots ?? 10} slots restantes hoje
          </Text>
        </GlowCard>
      </AnimatedListItem>

      {/* ─── Grid de stats diarios ─── */}
      <AnimatedListItem index={1}>
        <View style={styles.sectionHeader}>
          <Feather name="sun" size={14} color={colors.textMuted} />
          <Text style={styles.sectionTitle}>Hoje</Text>
        </View>
        <View style={styles.statsGrid}>
          {/* Aprovados */}
          <View style={[styles.statCard, { backgroundColor: colorAlpha.success10, borderColor: colorAlpha.success20 }]}>
            <View style={[styles.statIcon, { backgroundColor: colorAlpha.success20 }]}>
              <Feather name="check-circle" size={16} color={colors.success} />
            </View>
            <Text style={[styles.statGridValue, { color: colors.success }]}>
              {daily?.approved ?? 0}
            </Text>
            <Text style={styles.statGridLabel}>Aprovados</Text>
          </View>

          {/* Pendentes */}
          <View style={[styles.statCard, { backgroundColor: colorAlpha.warning10, borderColor: colorAlpha.warning20 }]}>
            <View style={[styles.statIcon, { backgroundColor: colorAlpha.warning20 }]}>
              <Feather name="clock" size={16} color={colors.warning} />
            </View>
            <Text style={[styles.statGridValue, { color: colors.warning }]}>
              {daily?.pending ?? 0}
            </Text>
            <Text style={styles.statGridLabel}>Pendentes</Text>
          </View>

          {/* Rejeitados */}
          <View style={[styles.statCard, { backgroundColor: colorAlpha.danger10, borderColor: colorAlpha.danger20 }]}>
            <View style={[styles.statIcon, { backgroundColor: colorAlpha.danger20 }]}>
              <Feather name="x-circle" size={16} color={colors.danger} />
            </View>
            <Text style={[styles.statGridValue, { color: colors.danger }]}>
              {daily?.rejected ?? 0}
            </Text>
            <Text style={styles.statGridLabel}>Rejeitados</Text>
          </View>

          {/* Slots */}
          <View style={[styles.statCard, { backgroundColor: colorAlpha.primary10, borderColor: colorAlpha.primary20 }]}>
            <View style={[styles.statIcon, { backgroundColor: colorAlpha.primary20 }]}>
              <Feather name="zap" size={16} color={colors.primaryLight} />
            </View>
            <Text style={[styles.statGridValue, { color: colors.primaryLight }]}>
              {daily?.remainingSlots ?? 10}
            </Text>
            <Text style={styles.statGridLabel}>Restantes</Text>
          </View>
        </View>
      </AnimatedListItem>

      {/* ─── Card: Este Mes ─── */}
      <AnimatedListItem index={2}>
        <View style={styles.sectionHeader}>
          <Feather name="calendar" size={14} color={colors.textMuted} />
          <Text style={styles.sectionTitle}>Este Mes</Text>
        </View>
        <View style={styles.card}>
          {/* Linha de metricas principais */}
          <View style={styles.monthlyTopRow}>
            <View style={styles.monthlyMetric}>
              <Feather name="video" size={16} color={colors.textMuted} style={{ marginBottom: spacing.xs }} />
              <Text style={styles.monthlyMetricValue}>{monthly?.totalVideos ?? 0}</Text>
              <Text style={styles.monthlyMetricLabel}>Videos</Text>
            </View>
            <View style={styles.monthlyDivider} />
            <View style={styles.monthlyMetric}>
              <Feather name="bar-chart-2" size={16} color={colors.success} style={{ marginBottom: spacing.xs }} />
              <Text style={[styles.monthlyMetricValue, { color: colors.success }]}>
                {((monthly?.approvalRate ?? 0) * 100).toFixed(0)}%
              </Text>
              <Text style={styles.monthlyMetricLabel}>Aprovacao</Text>
            </View>
            <View style={styles.monthlyDivider} />
            <View style={styles.monthlyMetric}>
              <Feather name="dollar-sign" size={16} color={colors.success} style={{ marginBottom: spacing.xs }} />
              <Text style={[styles.monthlyMetricValue, { color: colors.success }]}>
                R$ {(monthly?.totalEarnings ?? 0).toFixed(0)}
              </Text>
              <Text style={styles.monthlyMetricLabel}>Total</Text>
            </View>
          </View>

          {/* Breakdown de ganhos */}
          {monthly?.earningsBreakdown && (
            <>
              <View style={styles.breakdownContainer}>
                <View style={styles.breakdownRow}>
                  <View style={styles.breakdownLabelRow}>
                    <View style={[styles.breakdownDot, { backgroundColor: colors.info }]} />
                    <Text style={styles.breakdownLabel}>Videos</Text>
                  </View>
                  <Text style={styles.breakdownValue}>
                    R$ {(monthly.earningsBreakdown.videos ?? 0).toFixed(2)}
                  </Text>
                </View>
                <View style={styles.breakdownRow}>
                  <View style={styles.breakdownLabelRow}>
                    <View style={[styles.breakdownDot, { backgroundColor: colors.primary }]} />
                    <Text style={styles.breakdownLabel}>Comissoes</Text>
                  </View>
                  <Text style={styles.breakdownValue}>
                    R$ {(monthly.earningsBreakdown.commissions ?? 0).toFixed(2)}
                  </Text>
                </View>
                <View style={styles.breakdownRow}>
                  <View style={styles.breakdownLabelRow}>
                    <View style={[styles.breakdownDot, { backgroundColor: colors.accent }]} />
                    <Text style={styles.breakdownLabel}>Bonus</Text>
                  </View>
                  <Text style={styles.breakdownValue}>
                    R$ {(monthly.earningsBreakdown.bonuses ?? 0).toFixed(2)}
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>
      </AnimatedListItem>

      {/* ─── Card: Nivel ─── */}
      <AnimatedListItem index={3}>
        <View style={styles.sectionHeader}>
          <Feather name="award" size={14} color={colors.textMuted} />
          <Text style={styles.sectionTitle}>Nivel</Text>
        </View>
        <View style={[styles.card, { borderColor: `${levelColor}30` }]}>
          <View style={styles.levelHeader}>
            <View style={[styles.levelIconWrap, { backgroundColor: `${levelColor}20` }]}>
              <Feather name="star" size={20} color={levelColor} />
            </View>
            <View style={styles.levelInfo}>
              <Text style={[styles.levelName, { color: levelColor }]}>{levelName}</Text>
              <Text style={styles.levelProgressText}>
                {progressPct.toFixed(0)}% para o proximo nivel
              </Text>
            </View>
          </View>
          {/* Barra de progresso com gradiente */}
          <View style={styles.progressBarBg}>
            <LinearGradient
              colors={[levelColor, `${levelColor}80`]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressBarFill, { width: `${progressPct}%` as any }]}
            />
          </View>
        </View>
      </AnimatedListItem>

      {/* ─── Card: Marcas Ativas ─── */}
      <AnimatedListItem index={4}>
        <View style={[styles.card, styles.brandsCard]}>
          <View style={[styles.brandsIcon, { backgroundColor: colorAlpha.primary15 }]}>
            <Feather name="briefcase" size={22} color={colors.primaryLight} />
          </View>
          <View style={styles.brandsInfo}>
            <Text style={styles.brandsLabel}>Marcas Conectadas</Text>
            <Text style={styles.brandsValue}>{data?.activeBrands ?? 0}</Text>
          </View>
          <Feather name="chevron-right" size={18} color={colors.textMuted} />
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
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
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

  // ─── Hero greeting ───
  heroGradient: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colorAlpha.primary15,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    color: colors.text,
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  levelBadge: {
    borderWidth: 1.5,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  levelBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.5,
  },

  // ─── Hero Earnings Card ───
  earningsHeroCard: {
    marginBottom: spacing.md,
    overflow: 'hidden',
    padding: spacing.md,
    borderColor: colorAlpha.success20,
  },
  earningsHeroInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  earningsLeft: {
    flex: 1,
  },
  earningsLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  earningsLabel: {
    color: colors.success,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginLeft: spacing.xs,
  },
  earningsValue: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  earningsValueBig: {
    color: colors.success,
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.bold,
  },
  earningsGoalText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  // Anel de slots
  slotsRing: {
    alignItems: 'center',
    marginLeft: spacing.md,
  },
  slotsRingOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: colorAlpha.success20,
    backgroundColor: colorAlpha.success10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotsRingInner: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  slotsNumber: {
    color: colors.success,
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
  },
  slotsTotal: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  slotsLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  // Barra de slots
  slotsBarBg: {
    height: 4,
    backgroundColor: colorAlpha.success10,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  slotsBarFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  slotsBarLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },

  // ─── Section header ───
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginLeft: spacing.xs,
  },

  // ─── Stats grid 2x2 ───
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.sm,
    alignItems: 'flex-start',
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  statGridValue: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    marginBottom: 2,
  },
  statGridLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },

  // ─── Card base ───
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },

  // ─── Monthly ───
  monthlyTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  monthlyMetric: {
    alignItems: 'center',
    flex: 1,
  },
  monthlyMetricValue: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  monthlyMetricLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  monthlyDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  breakdownContainer: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  breakdownLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  breakdownDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  breakdownLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginLeft: spacing.xs,
  },
  breakdownValue: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },

  // ─── Level ───
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  levelIconWrap: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelInfo: {
    flex: 1,
  },
  levelName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    marginBottom: 2,
  },
  levelProgressText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
  progressBarBg: {
    height: layout.progressBarLg,
    backgroundColor: colors.border,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },

  // ─── Brands compact card ───
  brandsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  brandsIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandsInfo: {
    flex: 1,
  },
  brandsLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  brandsValue: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
});
