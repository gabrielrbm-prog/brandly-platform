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
  fontSize,
  fontWeight as fw,
  layout,
  medalColors,
  medalGradients,
  spacing,
} from '@/lib/theme';
import { useTheme } from '@/contexts/ThemeContext';
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

const MEDAL_GRADIENTS = medalGradients;

// Avatar ring colors for top 3
const RANK_RING_COLORS = [...medalColors];

function formatCurrency(value: string | number): string {
  return `R$ ${Number(value).toFixed(2).replace('.', ',')}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function CommunityScreen() {
  const { colors, colorAlpha, shadows } = useTheme();

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
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Tab Bar */}
      <View style={[styles.tabBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
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
                  <Text style={[styles.tabLabelActive, { color: colors.text }]}>{t.label}</Text>
                </LinearGradient>
              ) : (
                <View style={styles.tabItemInner}>
                  <View style={[styles.tabIconCircle, { backgroundColor: colorAlpha.muted20 }]}>
                    <Feather name={t.icon} size={14} color={colors.textMuted} />
                  </View>
                  <Text style={[styles.tabLabel, { color: colors.textMuted }]}>{t.label}</Text>
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
                            <Text style={[styles.filterTextActive, { color: colors.text }]}>
                              {t === 'production' ? 'Videos' : 'Ganhos'}
                            </Text>
                          </LinearGradient>
                        ) : (
                          <View style={[styles.filterBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <Text style={[styles.filterText, { color: colors.textMuted }]}>
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
                            <Text style={[styles.filterTextActive, { color: colors.text }]}>
                              {p === 'week' ? 'Semana' : 'Mes'}
                            </Text>
                          </LinearGradient>
                        ) : (
                          <View style={[styles.filterBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <Text style={[styles.filterText, { color: colors.textMuted }]}>
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
                <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={[styles.emptyIconWrap, { backgroundColor: colorAlpha.primary15, borderColor: colorAlpha.primary30 }]}>
                    <Feather name="award" size={28} color={colors.accent} />
                  </View>
                  <Text style={[styles.emptyText, { color: colors.text }]}>Nenhum creator no ranking ainda</Text>
                  <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>Os primeiros resultados apareceram em breve!</Text>
                </View>
              ) : (
                <AnimatedListItem index={0}>
                <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  {ranking.map((entry, i) => (
                    <View key={entry.creatorId} style={[styles.rankRow, i < ranking.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                      <View style={styles.rankPosition}>
                        {i < 3 ? (
                          <LinearGradient
                            colors={MEDAL_GRADIENTS[i]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={[styles.medal, shadows.md]}
                          >
                            <Feather name="award" size={12} color={colors.background} />
                          </LinearGradient>
                        ) : (
                          <Text style={[styles.rankNumber, { color: colors.textMuted }]}>{i + 1}</Text>
                        )}
                      </View>
                      {/* Avatar with colored ring for top 3 */}
                      <View style={[
                        styles.rankAvatarWrap,
                        i < 3 && { borderColor: RANK_RING_COLORS[i], borderWidth: 2 },
                      ]}>
                        <View style={[styles.rankAvatar, { backgroundColor: colors.surfaceLight }]}>
                          <Text style={[styles.rankInitial, { color: colors.text }]}>{entry.name.charAt(0).toUpperCase()}</Text>
                        </View>
                        {i >= 3 && (
                          <View style={[styles.rankNumberOverlay, { backgroundColor: colors.primaryDark, borderColor: colors.surface }]}>
                            <Text style={[styles.rankNumberOverlayText, { color: colors.text }]}>{i + 1}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.rankName, { color: colors.text }]}>{entry.name}</Text>
                      <Text style={[styles.rankValue, { color: i < 3 ? MEDAL_COLORS[i] : colors.primaryLight }]}>
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
                <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.cardTitleRow}>
                    <View style={[styles.cardTitleIcon, { backgroundColor: colorAlpha.success10 }]}>
                      <Feather name="radio" size={14} color={colors.success} />
                    </View>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>Proximas Lives</Text>
                  </View>
                  {lives.upcoming.map(live => (
                    <View key={live.id} style={[styles.liveRow, { borderBottomColor: colors.border }]}>
                      <View style={[styles.liveIconWrap, { backgroundColor: colorAlpha.success10 }]}>
                        <Feather name="radio" size={14} color={colors.success} />
                      </View>
                      <View style={styles.liveInfo}>
                        <Text style={[styles.liveTitle, { color: colors.text }]}>{live.title}</Text>
                        {live.instructorName && <Text style={[styles.liveInstructor, { color: colors.textSecondary }]}>com {live.instructorName}</Text>}
                        <Text style={[styles.liveDate, { color: colors.textMuted }]}>{formatDate(live.scheduledAt)}</Text>
                      </View>
                    </View>
                  ))}
                </View>
                </AnimatedListItem>
              )}

              {lives.past.length > 0 && (
                <AnimatedListItem index={1}>
                <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.cardTitleRow}>
                    <View style={[styles.cardTitleIcon, { backgroundColor: colorAlpha.muted20 }]}>
                      <Feather name="play-circle" size={14} color={colors.textMuted} />
                    </View>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>Lives Anteriores</Text>
                  </View>
                  {lives.past.map(live => (
                    <View key={live.id} style={[styles.liveRow, { borderBottomColor: colors.border }]}>
                      <View style={[styles.liveIconWrap, { backgroundColor: colorAlpha.muted20 }]}>
                        <Feather name="play-circle" size={14} color={colors.textMuted} />
                      </View>
                      <View style={styles.liveInfo}>
                        <Text style={[styles.liveTitle, { color: colors.textSecondary }]}>{live.title}</Text>
                        <Text style={[styles.liveDate, { color: colors.textMuted }]}>{formatDate(live.scheduledAt)}</Text>
                      </View>
                    </View>
                  ))}
                </View>
                </AnimatedListItem>
              )}

              {lives.upcoming.length === 0 && lives.past.length === 0 && (
                <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={[styles.emptyIconWrap, { backgroundColor: colorAlpha.danger10, borderColor: 'rgba(239,68,68,0.3)' }]}>
                    <Feather name="radio" size={28} color={colors.danger} />
                  </View>
                  <Text style={[styles.emptyText, { color: colors.text }]}>Nenhuma live agendada</Text>
                  <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>Fique atento, novas lives serao anunciadas em breve!</Text>
                </View>
              )}
            </>
          )}

          {/* CASES */}
          {tab === 'cases' && (
            <>
              {cases.length === 0 ? (
                <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={[styles.emptyIconWrap, { backgroundColor: colorAlpha.accent10, borderColor: 'rgba(245,158,11,0.3)' }]}>
                    <Feather name="star" size={28} color={colors.accent} />
                  </View>
                  <Text style={[styles.emptyText, { color: colors.text }]}>Nenhum case de sucesso ainda</Text>
                  <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>Seja o primeiro a contar sua historia!</Text>
                </View>
              ) : (
                cases.map((c, i) => (
                  <AnimatedListItem key={c.id} index={i}>
                  <View style={[styles.caseCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={styles.caseHeader}>
                      {/* Avatar with gradient ring */}
                      <LinearGradient
                        colors={[colors.primary, colors.primaryDark]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.caseAvatarRing}
                      >
                        <View style={[styles.caseAvatar, { backgroundColor: colorAlpha.primary20 }]}>
                          <Text style={[styles.caseInitial, { color: colors.primaryLight }]}>{c.creatorName.charAt(0).toUpperCase()}</Text>
                        </View>
                      </LinearGradient>
                      <View style={styles.caseHeaderInfo}>
                        <Text style={[styles.caseName, { color: colors.text }]}>{c.creatorName}</Text>
                        {c.earnings && (
                          <View style={styles.earningsBadge}>
                            <Feather name="dollar-sign" size={12} color={colors.success} />
                            <Text style={[styles.caseEarnings, { color: colors.success }]}>{formatCurrency(c.earnings)}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    {/* Quote-style story */}
                    <View style={[styles.quoteBar, { backgroundColor: colors.primary }]} />
                    <Text style={[styles.caseTitle, { color: colors.text }]}>{c.title}</Text>
                    <Text style={[styles.caseStory, { color: colors.textSecondary }]} numberOfLines={4}>{c.story}</Text>
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
  container: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.md },
  loadingContainer: { paddingVertical: spacing.xxl, alignItems: 'center' },

  // Tabs
  tabBar: {
    flexDirection: 'row',
    borderRadius: borderRadius.md,
    padding: spacing.xs,
    gap: spacing.xs,
    borderWidth: 1,
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
  tabLabel: { fontSize: fontSize.sm, fontWeight: '600' },
  tabLabelActive: { fontSize: fontSize.sm, fontWeight: '700' },

  // Filters
  filtersRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  filterGroup: { flexDirection: 'row', gap: spacing.xs },
  filterBtnWrap: { borderRadius: borderRadius.full, overflow: 'hidden' },
  filterBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  filterBtnActive: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  filterText: { fontSize: fontSize.xs, fontWeight: '600' },
  filterTextActive: { fontSize: fontSize.xs, fontWeight: '700' },

  // Card
  card: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
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
  cardTitle: { fontSize: fontSize.lg, fontWeight: '700' },

  // Empty
  emptyCard: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
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
  },
  emptyText: { fontSize: fontSize.md, fontWeight: '600', textAlign: 'center' },
  emptySubtext: { fontSize: fontSize.sm, textAlign: 'center', lineHeight: 20 },

  // Ranking
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  rankPosition: { width: layout.avatarSm, alignItems: 'center' },
  medal: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medalText: { fontSize: fontSize.sm, fontWeight: fw.extrabold },
  rankNumber: { fontSize: fontSize.md, fontWeight: '600' },
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankInitial: { fontSize: fontSize.sm, fontWeight: '700' },
  rankNumberOverlay: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  rankNumberOverlayText: { fontSize: 8, fontWeight: '700' },
  rankName: { flex: 1, fontSize: fontSize.sm, fontWeight: '500' },
  rankValue: { fontSize: fontSize.sm, fontWeight: '700' },

  // Lives
  liveRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
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
  liveTitle: { fontSize: fontSize.md, fontWeight: '600' },
  liveInstructor: { fontSize: fontSize.sm, marginTop: 2 },
  liveDate: { fontSize: fontSize.xs, marginTop: 2 },

  // Cases
  caseCard: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  caseInitial: { fontSize: fontSize.md, fontWeight: '700' },
  caseHeaderInfo: { flex: 1 },
  caseName: { fontSize: fontSize.md, fontWeight: '600' },
  earningsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  caseEarnings: { fontSize: fontSize.sm, fontWeight: '700' },
  quoteBar: {
    width: 3,
    height: '100%' as any,
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderTopLeftRadius: borderRadius.md,
    borderBottomLeftRadius: borderRadius.md,
  },
  caseTitle: { fontSize: fontSize.lg, fontWeight: '700', marginBottom: spacing.xs },
  caseStory: { fontSize: fontSize.sm, lineHeight: 20 },
});
