import React, { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { communityApi } from '@/lib/api';
import {
  borderRadius,
  colorAlpha,
  colors,
  fontSize,
  fontWeight as fw,
  layout,
  medalColors,
  shadows,
  spacing,
} from '@/lib/theme';
import AnimatedListItem from '@/components/AnimatedList';
import { SkeletonCard } from '@/components/Skeleton';

interface RankingEntry {
  creatorId: string;
  name: string;
  total: number | string;
}

interface LiveEvent {
  id: string;
  title: string;
  instructorName: string | null;
  scheduledAt: string;
  meetingUrl: string | null;
}

interface SuccessCase {
  id: string;
  creatorName: string;
  title: string;
  story: string;
  earnings: string | null;
  createdAt: string;
}

type TabType = 'ranking' | 'lives' | 'cases';
type RankingType = 'production' | 'earnings';
type RankingPeriod = 'week' | 'month';

const MEDAL_COLORS = medalColors;

// Medal gradient pairs per position
const MEDAL_GRADIENTS: [string, string][] = [
  ['#FFD700', '#F59E0B'],
  ['#C0C0C0', '#9CA3AF'],
  ['#CD7F32', '#92400E'],
];

// Avatar ring colors for top 3
const RANK_RING_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];

function formatCurrency(value: string | number): string {
  return `R$ ${Number(value).toFixed(2).replace('.', ',')}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function CommunityScreen() {
  const [tab, setTab] = useState<TabType>('ranking');
  const [rankingType, setRankingType] = useState<RankingType>('production');
  const [rankingPeriod, setRankingPeriod] = useState<RankingPeriod>('month');
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [lives, setLives] = useState<{ upcoming: LiveEvent[]; past: LiveEvent[] }>({ upcoming: [], past: [] });
  const [cases, setCases] = useState<SuccessCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      if (tab === 'ranking') {
        const res = await communityApi.ranking(rankingPeriod, rankingType) as { ranking: RankingEntry[] };
        setRanking(res.ranking);
      } else if (tab === 'lives') {
        const res = await communityApi.lives() as { upcoming: LiveEvent[]; past: LiveEvent[] };
        setLives(res);
      } else {
        const res = await communityApi.cases() as { cases: SuccessCase[] };
        setCases(res.cases);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tab, rankingType, rankingPeriod]);

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {([
          { key: 'ranking', label: 'Ranking', icon: 'award' as const, activeColor: colors.accent },
          { key: 'lives', label: 'Lives', icon: 'radio' as const, activeColor: colors.danger },
          { key: 'cases', label: 'Cases', icon: 'star' as const, activeColor: colors.primary },
        ] as const).map(t => {
          const isActive = tab === t.key;
          return (
            <Pressable
              key={t.key}
              style={styles.tabItem}
              onPress={() => setTab(t.key)}
            >
              {isActive ? (
                <LinearGradient
                  colors={[colors.primary, colors.primaryDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.tabItemActiveGradient}
                >
                  <View style={[styles.tabIconCircle, { backgroundColor: colorAlpha.white20 }]}>
                    <Feather name={t.icon} size={14} color={colors.text} />
                  </View>
                  <Text style={styles.tabLabelActive}>{t.label}</Text>
                </LinearGradient>
              ) : (
                <View style={styles.tabItemInner}>
                  <View style={[styles.tabIconCircle, { backgroundColor: colorAlpha.muted20 }]}>
                    <Feather name={t.icon} size={14} color={colors.textMuted} />
                  </View>
                  <Text style={styles.tabLabel}>{t.label}</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <SkeletonCard />
          <View style={{ height: spacing.md }} />
          <SkeletonCard />
        </View>
      ) : (
        <>
          {/* RANKING */}
          {tab === 'ranking' && (
            <>
              {/* Filters */}
              <View style={styles.filtersRow}>
                <View style={styles.filterGroup}>
                  {(['production', 'earnings'] as const).map(t => {
                    const isActive = rankingType === t;
                    return (
                      <Pressable
                        key={t}
                        style={styles.filterBtnWrap}
                        onPress={() => setRankingType(t)}
                      >
                        {isActive ? (
                          <LinearGradient
                            colors={[colors.primary, colors.primaryDark]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.filterBtnActive}
                          >
                            <Text style={styles.filterTextActive}>
                              {t === 'production' ? 'Videos' : 'Ganhos'}
                            </Text>
                          </LinearGradient>
                        ) : (
                          <View style={styles.filterBtn}>
                            <Text style={styles.filterText}>
                              {t === 'production' ? 'Videos' : 'Ganhos'}
                            </Text>
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
                <View style={styles.filterGroup}>
                  {(['week', 'month'] as const).map(p => {
                    const isActive = rankingPeriod === p;
                    return (
                      <Pressable
                        key={p}
                        style={styles.filterBtnWrap}
                        onPress={() => setRankingPeriod(p)}
                      >
                        {isActive ? (
                          <LinearGradient
                            colors={[colors.primary, colors.primaryDark]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.filterBtnActive}
                          >
                            <Text style={styles.filterTextActive}>
                              {p === 'week' ? 'Semana' : 'Mes'}
                            </Text>
                          </LinearGradient>
                        ) : (
                          <View style={styles.filterBtn}>
                            <Text style={styles.filterText}>
                              {p === 'week' ? 'Semana' : 'Mes'}
                            </Text>
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {ranking.length === 0 ? (
                <View style={styles.emptyCard}>
                  <View style={styles.emptyIconWrap}>
                    <Feather name="award" size={28} color={colors.accent} />
                  </View>
                  <Text style={styles.emptyText}>Nenhum creator no ranking ainda</Text>
                  <Text style={styles.emptySubtext}>Os primeiros resultados apareceram em breve!</Text>
                </View>
              ) : (
                <AnimatedListItem index={0}>
                <View style={styles.card}>
                  {ranking.map((entry, i) => (
                    <View key={entry.creatorId} style={[styles.rankRow, i < ranking.length - 1 && styles.rankRowBorder]}>
                      <View style={styles.rankPosition}>
                        {i < 3 ? (
                          <LinearGradient
                            colors={MEDAL_GRADIENTS[i]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.medal}
                          >
                            <Feather name="award" size={12} color={colors.background} />
                          </LinearGradient>
                        ) : (
                          <Text style={styles.rankNumber}>{i + 1}</Text>
                        )}
                      </View>
                      {/* Avatar with colored ring for top 3 */}
                      <View style={[
                        styles.rankAvatarWrap,
                        i < 3 && { borderColor: RANK_RING_COLORS[i], borderWidth: 2 },
                      ]}>
                        <View style={styles.rankAvatar}>
                          <Text style={styles.rankInitial}>{entry.name.charAt(0).toUpperCase()}</Text>
                        </View>
                        {i >= 3 && (
                          <View style={styles.rankNumberOverlay}>
                            <Text style={styles.rankNumberOverlayText}>{i + 1}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.rankName}>{entry.name}</Text>
                      <Text style={[styles.rankValue, i < 3 && { color: MEDAL_COLORS[i] }]}>
                        {rankingType === 'production'
                          ? `${entry.total} videos`
                          : formatCurrency(entry.total)}
                      </Text>
                    </View>
                  ))}
                </View>
                </AnimatedListItem>
              )}
            </>
          )}

          {/* LIVES */}
          {tab === 'lives' && (
            <>
              {lives.upcoming.length > 0 && (
                <AnimatedListItem index={0}>
                <View style={styles.card}>
                  <View style={styles.cardTitleRow}>
                    <View style={[styles.cardTitleIcon, { backgroundColor: colorAlpha.success10 }]}>
                      <Feather name="radio" size={14} color={colors.success} />
                    </View>
                    <Text style={styles.cardTitle}>Proximas Lives</Text>
                  </View>
                  {lives.upcoming.map(live => (
                    <View key={live.id} style={styles.liveRow}>
                      <View style={[styles.liveIconWrap, { backgroundColor: colorAlpha.success10 }]}>
                        <Feather name="radio" size={14} color={colors.success} />
                      </View>
                      <View style={styles.liveInfo}>
                        <Text style={styles.liveTitle}>{live.title}</Text>
                        {live.instructorName && <Text style={styles.liveInstructor}>com {live.instructorName}</Text>}
                        <Text style={styles.liveDate}>{formatDate(live.scheduledAt)}</Text>
                      </View>
                    </View>
                  ))}
                </View>
                </AnimatedListItem>
              )}

              {lives.past.length > 0 && (
                <AnimatedListItem index={1}>
                <View style={styles.card}>
                  <View style={styles.cardTitleRow}>
                    <View style={[styles.cardTitleIcon, { backgroundColor: colorAlpha.muted20 }]}>
                      <Feather name="play-circle" size={14} color={colors.textMuted} />
                    </View>
                    <Text style={styles.cardTitle}>Lives Anteriores</Text>
                  </View>
                  {lives.past.map(live => (
                    <View key={live.id} style={styles.liveRow}>
                      <View style={[styles.liveIconWrap, { backgroundColor: colorAlpha.muted20 }]}>
                        <Feather name="play-circle" size={14} color={colors.textMuted} />
                      </View>
                      <View style={styles.liveInfo}>
                        <Text style={[styles.liveTitle, { color: colors.textSecondary }]}>{live.title}</Text>
                        <Text style={styles.liveDate}>{formatDate(live.scheduledAt)}</Text>
                      </View>
                    </View>
                  ))}
                </View>
                </AnimatedListItem>
              )}

              {lives.upcoming.length === 0 && lives.past.length === 0 && (
                <View style={styles.emptyCard}>
                  <View style={[styles.emptyIconWrap, { backgroundColor: colorAlpha.danger10, borderColor: 'rgba(239,68,68,0.3)' }]}>
                    <Feather name="radio" size={28} color={colors.danger} />
                  </View>
                  <Text style={styles.emptyText}>Nenhuma live agendada</Text>
                  <Text style={styles.emptySubtext}>Fique atento, novas lives serao anunciadas em breve!</Text>
                </View>
              )}
            </>
          )}

          {/* CASES */}
          {tab === 'cases' && (
            <>
              {cases.length === 0 ? (
                <View style={styles.emptyCard}>
                  <View style={[styles.emptyIconWrap, { backgroundColor: colorAlpha.accent10, borderColor: 'rgba(245,158,11,0.3)' }]}>
                    <Feather name="star" size={28} color={colors.accent} />
                  </View>
                  <Text style={styles.emptyText}>Nenhum case de sucesso ainda</Text>
                  <Text style={styles.emptySubtext}>Seja o primeiro a contar sua historia!</Text>
                </View>
              ) : (
                cases.map((c, i) => (
                  <AnimatedListItem key={c.id} index={i}>
                  <View style={styles.caseCard}>
                    <View style={styles.caseHeader}>
                      {/* Avatar with gradient ring */}
                      <LinearGradient
                        colors={[colors.primary, colors.primaryDark]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.caseAvatarRing}
                      >
                        <View style={styles.caseAvatar}>
                          <Text style={styles.caseInitial}>{c.creatorName.charAt(0).toUpperCase()}</Text>
                        </View>
                      </LinearGradient>
                      <View style={styles.caseHeaderInfo}>
                        <Text style={styles.caseName}>{c.creatorName}</Text>
                        {c.earnings && (
                          <View style={styles.earningsBadge}>
                            <Feather name="dollar-sign" size={12} color={colors.success} />
                            <Text style={styles.caseEarnings}>{formatCurrency(c.earnings)}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    {/* Quote-style story */}
                    <View style={styles.quoteBar} />
                    <Text style={styles.caseTitle}>{c.title}</Text>
                    <Text style={styles.caseStory} numberOfLines={4}>{c.story}</Text>
                  </View>
                  </AnimatedListItem>
                ))
              )}
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.md },
  loadingContainer: { paddingVertical: spacing.xxl, alignItems: 'center' },

  // Tabs
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.xs,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabItem: {
    flex: 1,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  tabItemActiveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  tabItemInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  tabIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '600' },
  tabLabelActive: { color: colors.text, fontSize: fontSize.sm, fontWeight: '700' },

  // Filters
  filtersRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  filterGroup: { flexDirection: 'row', gap: spacing.xs },
  filterBtnWrap: { borderRadius: borderRadius.full, overflow: 'hidden' },
  filterBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterBtnActive: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  filterText: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '600' },
  filterTextActive: { color: colors.text, fontSize: fontSize.xs, fontWeight: '700' },

  // Card
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  cardTitleIcon: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700' },

  // Empty
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  emptyIconWrap: {
    width: 68,
    height: 68,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    backgroundColor: colorAlpha.primary15,
    borderColor: colorAlpha.primary30,
  },
  emptyText: { color: colors.text, fontSize: fontSize.md, fontWeight: '600', textAlign: 'center' },
  emptySubtext: { color: colors.textSecondary, fontSize: fontSize.sm, textAlign: 'center', lineHeight: 20 },

  // Ranking
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  rankRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  rankPosition: { width: layout.avatarSm, alignItems: 'center' },
  medal: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  medalText: { color: colors.background, fontSize: fontSize.sm, fontWeight: fw.extrabold },
  rankNumber: { color: colors.textMuted, fontSize: fontSize.md, fontWeight: '600' },
  rankAvatarWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderColor: 'transparent',
    borderWidth: 0,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  rankAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankInitial: { color: colors.text, fontSize: fontSize.sm, fontWeight: '700' },
  rankNumberOverlay: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.surface,
  },
  rankNumberOverlayText: { color: colors.text, fontSize: 8, fontWeight: '700' },
  rankName: { flex: 1, color: colors.text, fontSize: fontSize.sm, fontWeight: '500' },
  rankValue: { color: colors.primaryLight, fontSize: fontSize.sm, fontWeight: '700' },

  // Lives
  liveRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  liveIconWrap: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.xs,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  liveInfo: { flex: 1 },
  liveTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: '600' },
  liveInstructor: { color: colors.textSecondary, fontSize: fontSize.sm, marginTop: 2 },
  liveDate: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 2 },

  // Cases
  caseCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    overflow: 'hidden',
  },
  caseHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  caseAvatarRing: {
    width: 46,
    height: 46,
    borderRadius: 23,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  caseAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colorAlpha.primary20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  caseInitial: { color: colors.primaryLight, fontSize: fontSize.md, fontWeight: '700' },
  caseHeaderInfo: { flex: 1 },
  caseName: { color: colors.text, fontSize: fontSize.md, fontWeight: '600' },
  earningsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  caseEarnings: { color: colors.success, fontSize: fontSize.sm, fontWeight: '700' },
  quoteBar: {
    width: 3,
    height: '100%' as any,
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.primary,
    borderTopLeftRadius: borderRadius.md,
    borderBottomLeftRadius: borderRadius.md,
  },
  caseTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700', marginBottom: spacing.xs },
  caseStory: { color: colors.textSecondary, fontSize: fontSize.sm, lineHeight: 20 },
});
