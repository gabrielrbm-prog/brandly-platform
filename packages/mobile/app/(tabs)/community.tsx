import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { communityApi } from '@/lib/api';
import { borderRadius, colors, fontSize, fontWeight as fw, medalColors, spacing } from '@/lib/theme';

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
          { key: 'ranking', label: 'Ranking', emoji: '🏆' },
          { key: 'lives', label: 'Lives', emoji: '🔴' },
          { key: 'cases', label: 'Cases', emoji: '⭐' },
        ] as const).map(t => (
          <Pressable
            key={t.key}
            style={[styles.tabItem, tab === t.key && styles.tabItemActive]}
            onPress={() => setTab(t.key)}
          >
            <Text style={styles.tabEmoji}>{t.emoji}</Text>
            <Text style={[styles.tabLabel, tab === t.key && styles.tabLabelActive]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <>
          {/* RANKING */}
          {tab === 'ranking' && (
            <>
              {/* Filters */}
              <View style={styles.filtersRow}>
                <View style={styles.filterGroup}>
                  {(['production', 'earnings'] as const).map(t => (
                    <Pressable
                      key={t}
                      style={[styles.filterBtn, rankingType === t && styles.filterBtnActive]}
                      onPress={() => setRankingType(t)}
                    >
                      <Text style={[styles.filterText, rankingType === t && styles.filterTextActive]}>
                        {t === 'production' ? 'Videos' : 'Ganhos'}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <View style={styles.filterGroup}>
                  {(['week', 'month'] as const).map(p => (
                    <Pressable
                      key={p}
                      style={[styles.filterBtn, rankingPeriod === p && styles.filterBtnActive]}
                      onPress={() => setRankingPeriod(p)}
                    >
                      <Text style={[styles.filterText, rankingPeriod === p && styles.filterTextActive]}>
                        {p === 'week' ? 'Semana' : 'Mes'}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {ranking.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>Nenhum creator no ranking ainda</Text>
                </View>
              ) : (
                <View style={styles.card}>
                  {ranking.map((entry, i) => (
                    <View key={entry.creatorId} style={[styles.rankRow, i < ranking.length - 1 && styles.rankRowBorder]}>
                      <View style={styles.rankPosition}>
                        {i < 3 ? (
                          <View style={[styles.medal, { backgroundColor: MEDAL_COLORS[i] }]}>
                            <Text style={styles.medalText}>{i + 1}</Text>
                          </View>
                        ) : (
                          <Text style={styles.rankNumber}>{i + 1}</Text>
                        )}
                      </View>
                      <View style={styles.rankAvatar}>
                        <Text style={styles.rankInitial}>{entry.name.charAt(0).toUpperCase()}</Text>
                      </View>
                      <Text style={styles.rankName}>{entry.name}</Text>
                      <Text style={styles.rankValue}>
                        {rankingType === 'production'
                          ? `${entry.total} videos`
                          : formatCurrency(entry.total)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}

          {/* LIVES */}
          {tab === 'lives' && (
            <>
              {lives.upcoming.length > 0 && (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>{'📅'} Proximas Lives</Text>
                  {lives.upcoming.map(live => (
                    <View key={live.id} style={styles.liveRow}>
                      <View style={[styles.liveDot, { backgroundColor: colors.success }]} />
                      <View style={styles.liveInfo}>
                        <Text style={styles.liveTitle}>{live.title}</Text>
                        {live.instructorName && <Text style={styles.liveInstructor}>com {live.instructorName}</Text>}
                        <Text style={styles.liveDate}>{formatDate(live.scheduledAt)}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {lives.past.length > 0 && (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Lives Anteriores</Text>
                  {lives.past.map(live => (
                    <View key={live.id} style={styles.liveRow}>
                      <View style={[styles.liveDot, { backgroundColor: colors.textMuted }]} />
                      <View style={styles.liveInfo}>
                        <Text style={[styles.liveTitle, { color: colors.textSecondary }]}>{live.title}</Text>
                        <Text style={styles.liveDate}>{formatDate(live.scheduledAt)}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {lives.upcoming.length === 0 && lives.past.length === 0 && (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyEmoji}>{'🔴'}</Text>
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
                  <Text style={styles.emptyEmoji}>{'⭐'}</Text>
                  <Text style={styles.emptyText}>Nenhum case de sucesso ainda</Text>
                  <Text style={styles.emptySubtext}>Seja o primeiro a contar sua historia!</Text>
                </View>
              ) : (
                cases.map(c => (
                  <View key={c.id} style={styles.caseCard}>
                    <View style={styles.caseHeader}>
                      <View style={styles.caseAvatar}>
                        <Text style={styles.caseInitial}>{c.creatorName.charAt(0).toUpperCase()}</Text>
                      </View>
                      <View style={styles.caseHeaderInfo}>
                        <Text style={styles.caseName}>{c.creatorName}</Text>
                        {c.earnings && (
                          <Text style={styles.caseEarnings}>{formatCurrency(c.earnings)}</Text>
                        )}
                      </View>
                    </View>
                    <Text style={styles.caseTitle}>{c.title}</Text>
                    <Text style={styles.caseStory} numberOfLines={4}>{c.story}</Text>
                  </View>
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
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  tabItemActive: { backgroundColor: colors.primary + '33' },
  tabEmoji: { fontSize: 16 },
  tabLabel: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '600' },
  tabLabelActive: { color: colors.primaryLight },

  // Filters
  filtersRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  filterGroup: { flexDirection: 'row', gap: spacing.xs },
  filterBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterBtnActive: { backgroundColor: colors.primary + '33', borderColor: colors.primary },
  filterText: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '600' },
  filterTextActive: { color: colors.primaryLight },

  // Card
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  cardTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700', marginBottom: spacing.md },

  // Empty
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyEmoji: { fontSize: 48, marginBottom: spacing.md },
  emptyText: { color: colors.text, fontSize: fontSize.md, fontWeight: '600', textAlign: 'center' },
  emptySubtext: { color: colors.textSecondary, fontSize: fontSize.sm, marginTop: spacing.xs, textAlign: 'center' },

  // Ranking
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  rankRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  rankPosition: { width: 32, alignItems: 'center' },
  medal: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medalText: { color: colors.background, fontSize: fontSize.sm, fontWeight: fw.extrabold },
  rankNumber: { color: colors.textMuted, fontSize: fontSize.md, fontWeight: '600' },
  rankAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankInitial: { color: colors.text, fontSize: fontSize.sm, fontWeight: '700' },
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
  liveDot: { width: 10, height: 10, borderRadius: 5, marginTop: 5 },
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
  },
  caseHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  caseAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  caseInitial: { color: colors.primaryLight, fontSize: fontSize.md, fontWeight: '700' },
  caseHeaderInfo: { flex: 1 },
  caseName: { color: colors.text, fontSize: fontSize.md, fontWeight: '600' },
  caseEarnings: { color: colors.success, fontSize: fontSize.sm, fontWeight: '700' },
  caseTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700', marginBottom: spacing.xs },
  caseStory: { color: colors.textSecondary, fontSize: fontSize.sm, lineHeight: 20 },
});
