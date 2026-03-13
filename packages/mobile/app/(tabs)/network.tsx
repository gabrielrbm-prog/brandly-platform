import React, { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { networkApi } from '@/lib/api';
import {
  borderRadius,
  fontSize,
  fontWeight,
  layout,
  levelColors,
  spacing,
} from '@/lib/theme';
import { useTheme } from '@/contexts/ThemeContext';
import AnimatedListItem, { FadeInView } from '@/components/AnimatedList';
import { SkeletonCard } from '@/components/Skeleton';
import Card from '@/components/Card';
import StatCard from '@/components/StatCard';

interface NetworkStats {
  period: string;
  level: {
    current: string;
    rank: number;
    nextLevel: string | null;
    requirements: {
      qv: { current: number; required: number };
      directs: { current: number; required: number };
      pml: { current: number; required: number };
    };
  };
  network: {
    totalMembers: number;
    activeMembers: number;
    directsActive: number;
    totalVolume: string;
  };
  bonuses: {
    direct: string;
    infinite: string;
    matching: string;
    global: string;
    total: string;
  };
}

interface DirectMember {
  id: string;
  name: string;
  level: string;
  status: string;
  createdAt: string;
  directCount: number;
}

interface ReferralData {
  referralCode: string;
  referralUrl: string;
  totalReferrals: number;
  activeReferrals: number;
}

type FeatherIconName = keyof typeof Feather.glyphMap;

const LEVEL_COLORS: Record<string, string> = levelColors;

const REQ_CONFIG: Array<{
  key: 'qv' | 'directs' | 'pml';
  label: string;
  icon: FeatherIconName;
}> = [
  { key: 'qv', label: 'Volume Qualificado', icon: 'bar-chart-2' },
  { key: 'directs', label: 'Diretos Ativos', icon: 'users' },
  { key: 'pml', label: 'PML', icon: 'layers' },
];

function formatCurrency(value: string | number): string {
  return `R$ ${Number(value).toFixed(2).replace('.', ',')}`;
}

export default function NetworkScreen() {
  const { colors, colorAlpha, shadows } = useTheme();

  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [directs, setDirects] = useState<DirectMember[]>([]);
  const [referral, setReferral] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);

  const BONUS_CONFIG: Array<{
    key: keyof NetworkStats['bonuses'];
    label: string;
    icon: FeatherIconName;
    color: string;
    bg: string;
  }> = [
    { key: 'direct', label: 'Direto', icon: 'arrow-right', color: colors.info, bg: colorAlpha.info10 },
    { key: 'infinite', label: 'Infinito', icon: 'repeat', color: colors.primaryLight, bg: colorAlpha.primary10 },
    { key: 'matching', label: 'Equiparacao', icon: 'git-merge', color: colors.warning, bg: colorAlpha.warning10 },
    { key: 'global', label: 'Global', icon: 'globe', color: colors.success, bg: colorAlpha.success10 },
  ];

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, treeRes, refRes] = await Promise.all([
        networkApi.stats() as Promise<NetworkStats>,
        networkApi.tree() as Promise<{ directs: DirectMember[] }>,
        networkApi.referralLink() as Promise<ReferralData>,
      ]);
      setStats(statsRes);
      setDirects(treeRes.directs);
      setReferral(refRes);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const handleCopy = useCallback(async () => {
    if (!referral?.referralUrl) return;
    await Clipboard.setStringAsync(referral.referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [referral]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, padding: spacing.md, gap: spacing.md }]}>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </View>
    );
  }

  const levelColor = LEVEL_COLORS[stats?.level.current ?? 'Seed'] ?? colors.primary;
  const bonusTotal = stats ? Number(stats.bonuses.total) : 0;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* ─── Level Hero Card ─── */}
      {stats && (
        <AnimatedListItem index={0}>
          <LinearGradient
            colors={[`${levelColor}20`, colors.surface]}
            style={[styles.levelCard, { borderColor: colorAlpha.primary20 }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Decorative glow blob */}
            <View style={[styles.levelGlowBlob, { backgroundColor: `${levelColor}15` }]} />

            <View style={styles.levelTopRow}>
              <View style={styles.levelLeft}>
                <View style={[styles.levelIconWrap, { backgroundColor: `${levelColor}25` }]}>
                  <Feather name="award" size={24} color={levelColor} />
                </View>
                <View>
                  <Text style={[styles.levelLabel, { color: colors.textMuted }]}>Nivel Atual</Text>
                  <Text style={[styles.levelName, { color: levelColor }]}>{stats.level.current}</Text>
                </View>
              </View>
              {stats.level.nextLevel && (
                <View style={[styles.nextLevelWrap, { backgroundColor: colorAlpha.muted20 }]}>
                  <Feather name="arrow-up" size={12} color={colors.textMuted} />
                  <Text style={[styles.nextLevelText, { color: colors.textSecondary }]}>{stats.level.nextLevel}</Text>
                </View>
              )}
            </View>

            {/* Requirements */}
            {stats.level.nextLevel && (
              <View style={styles.requirementsSection}>
                {REQ_CONFIG.map((req) => {
                  const data = stats.level.requirements[req.key];
                  const pct = data.required > 0 ? Math.min((data.current / data.required) * 100, 100) : 0;
                  return (
                    <View key={req.key} style={styles.requirementItem}>
                      <View style={styles.requirementTop}>
                        <View style={styles.reqLabelRow}>
                          <Feather name={req.icon} size={12} color={colors.textMuted} />
                          <Text style={[styles.reqLabel, { color: colors.textSecondary }]}>{req.label}</Text>
                        </View>
                        <Text style={styles.reqValue}>
                          <Text style={[styles.reqCurrent, { color: levelColor }]}>{data.current}</Text>
                          <Text style={[styles.reqSeparator, { color: colors.textMuted }]}> / {data.required}</Text>
                        </Text>
                      </View>
                      <View style={[styles.progressTrack, { backgroundColor: colorAlpha.muted20 }]}>
                        <LinearGradient
                          colors={[levelColor, `${levelColor}80`]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={[styles.progressFill, { width: `${pct}%` as any }]}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </LinearGradient>
        </AnimatedListItem>
      )}

      {/* ─── Network Stats Grid ─── */}
      {stats && (
        <AnimatedListItem index={1}>
          <View style={styles.sectionHeader}>
            <Feather name="users" size={14} color={colors.textMuted} />
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Minha Rede</Text>
          </View>
          <View style={styles.statsGrid}>
            <StatCard
              icon="users"
              label="Rede Total"
              value={String(stats.network.totalMembers)}
              color={colors.info}
              tinted
              compact
              style={styles.statGridItem}
            />
            <StatCard
              icon="check-circle"
              label="Ativos"
              value={String(stats.network.activeMembers)}
              color={colors.success}
              tinted
              compact
              style={styles.statGridItem}
            />
            <StatCard
              icon="user-plus"
              label="Diretos"
              value={String(stats.network.directsActive)}
              color={colors.primaryLight}
              tinted
              compact
              style={styles.statGridItem}
            />
            <StatCard
              icon="trending-up"
              label="Volume"
              value={formatCurrency(stats.network.totalVolume)}
              color={colors.accent}
              tinted
              compact
              style={styles.statGridItem}
            />
          </View>
        </AnimatedListItem>
      )}

      {/* ─── Bonuses Card ─── */}
      {stats && (
        <AnimatedListItem index={2}>
          <Card icon="gift" title="Bonus do Mes" variant="elevated">
            {BONUS_CONFIG.map((cfg) => {
              const value = stats.bonuses[cfg.key];
              const numValue = Number(value);
              const pct = bonusTotal > 0 ? Math.min((numValue / bonusTotal) * 100, 100) : 0;

              return (
                <View key={cfg.key} style={styles.bonusItem}>
                  <View style={[styles.bonusIconCircle, { backgroundColor: cfg.bg }]}>
                    <Feather name={cfg.icon} size={14} color={cfg.color} />
                  </View>
                  <View style={styles.bonusItemContent}>
                    <View style={styles.bonusItemTop}>
                      <Text style={[styles.bonusLabel, { color: colors.textSecondary }]}>{cfg.label}</Text>
                      <Text style={[styles.bonusValue, { color: colors.text }]}>{formatCurrency(value)}</Text>
                    </View>
                    <View style={[styles.bonusMiniBarBg, { backgroundColor: colorAlpha.muted20 }]}>
                      <View
                        style={[
                          styles.bonusMiniBarFill,
                          { width: `${pct}%` as any, backgroundColor: cfg.color },
                        ]}
                      />
                    </View>
                  </View>
                </View>
              );
            })}

            <View style={[styles.bonusTotalRow, { borderTopColor: colors.border }]}>
              <View style={styles.bonusTotalLeft}>
                <Feather name="trending-up" size={16} color={colors.success} />
                <Text style={[styles.bonusTotalLabel, { color: colors.text }]}>Total do mes</Text>
              </View>
              <Text style={[styles.bonusTotalValue, { color: colors.success }]}>{formatCurrency(stats.bonuses.total)}</Text>
            </View>
          </Card>
        </AnimatedListItem>
      )}

      {/* ─── Referral Link Card ─── */}
      {referral && (
        <AnimatedListItem index={3}>
          <View style={[styles.referralCard, { borderColor: colors.primary, ...shadows.glowPrimarySubtle }]}>
            <LinearGradient
              colors={[colorAlpha.primary15, colorAlpha.accent10]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.referralTitleRow}>
              <Feather name="share-2" size={16} color={colors.primaryLight} />
              <Text style={[styles.referralTitle, { color: colors.text }]}>Link de Indicacao</Text>
            </View>
            <Text style={[styles.referralSubtitle, { color: colors.textSecondary }]}>
              Compartilhe e ganhe bonus em cada venda da sua rede
            </Text>

            <View style={[styles.referralUrlBox, { backgroundColor: colorAlpha.white10, borderColor: colors.border }]}>
              <Feather name="link" size={14} color={colors.textMuted} />
              <Text style={[styles.referralUrl, { color: colors.textSecondary }]} numberOfLines={1}>{referral.referralUrl}</Text>
            </View>

            <Pressable
              style={[
                styles.copyBtn,
                { backgroundColor: colors.primary, ...shadows.glowPrimarySubtle },
                copied && { backgroundColor: colorAlpha.success20, borderWidth: 1, borderColor: colors.success },
              ]}
              onPress={handleCopy}
            >
              <Feather
                name={copied ? 'check' : 'copy'}
                size={14}
                color={copied ? colors.success : colors.text}
              />
              <Text style={[styles.copyBtnText, { color: copied ? colors.success : colors.text }]}>
                {copied ? 'Copiado!' : 'Copiar Link'}
              </Text>
            </Pressable>

            <View style={[styles.referralStatsRow, { backgroundColor: colorAlpha.white10 }]}>
              <View style={styles.referralStatItem}>
                <Feather name="user-plus" size={12} color={colors.textMuted} />
                <Text style={[styles.referralStatValue, { color: colors.text }]}>{referral.totalReferrals}</Text>
                <Text style={[styles.referralStatLabel, { color: colors.textMuted }]}>indicados</Text>
              </View>
              <View style={[styles.referralStatDivider, { backgroundColor: colors.border }]} />
              <View style={styles.referralStatItem}>
                <Feather name="activity" size={12} color={colors.success} />
                <Text style={[styles.referralStatValue, { color: colors.success }]}>{referral.activeReferrals}</Text>
                <Text style={[styles.referralStatLabel, { color: colors.textMuted }]}>ativos</Text>
              </View>
            </View>
          </View>
        </AnimatedListItem>
      )}

      {/* ─── Direct Members ─── */}
      <AnimatedListItem index={4}>
        <Card
          icon="user-check"
          title="Meus Diretos"
          variant="elevated"
          headerRight={
            <View style={[styles.memberCountBadge, { backgroundColor: colorAlpha.primary20 }]}>
              <Text style={[styles.memberCountText, { color: colors.primaryLight }]}>{directs.length}</Text>
            </View>
          }
        >

          {directs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Feather name="users" size={28} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.text }]}>Nenhum membro direto ainda</Text>
              <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>Compartilhe seu link de indicacao!</Text>
            </View>
          ) : (
            directs.map((member, index) => {
              const memberColor = LEVEL_COLORS[member.level] ?? colors.textMuted;
              const isLast = index === directs.length - 1;
              return (
                <View key={member.id} style={[styles.memberRow, !isLast && styles.memberRowBorder, !isLast && { borderBottomColor: colors.border }]}>
                  <View style={[styles.memberAvatar, { borderColor: memberColor, backgroundColor: colors.surfaceLight }]}>
                    <Text style={[styles.memberInitial, { color: colors.text }]}>{member.name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={styles.memberInfo}>
                    <Text style={[styles.memberName, { color: colors.text }]}>{member.name}</Text>
                    <View style={styles.memberMetaRow}>
                      <View style={[styles.memberLevelBadge, { backgroundColor: `${memberColor}20` }]}>
                        <Text style={[styles.memberLevelText, { color: memberColor }]}>{member.level}</Text>
                      </View>
                      {member.directCount > 0 && (
                        <View style={styles.memberDirectsTag}>
                          <Feather name="users" size={10} color={colors.textMuted} />
                          <Text style={[styles.memberDirectsText, { color: colors.textMuted }]}>{member.directCount}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <View style={styles.memberRight}>
                    <View style={[styles.statusDot, { backgroundColor: member.status === 'active' ? colors.success : colors.textMuted }]} />
                    <Text style={[styles.statusText, { color: member.status === 'active' ? colors.success : colors.textMuted }]}>
                      {member.status === 'active' ? 'Ativo' : 'Inativo'}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </Card>
      </AnimatedListItem>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.md },

  // ─── Level Hero Card ───
  levelCard: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    overflow: 'hidden',
  },
  levelGlowBlob: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  levelTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  levelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  levelIconWrap: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  levelName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.extrabold,
    letterSpacing: 0.5,
  },
  nextLevelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  nextLevelText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },

  // Requirements
  requirementsSection: { gap: spacing.md },
  requirementItem: { gap: spacing.xs },
  requirementTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reqLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  reqLabel: { fontSize: fontSize.sm },
  reqValue: { fontSize: fontSize.sm },
  reqCurrent: { fontWeight: fontWeight.bold },
  reqSeparator: { fontWeight: fontWeight.normal },
  progressTrack: {
    height: 5,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },

  // ─── Section header ───
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sectionTitle: {
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
  },
  statGridItem: {
    flex: 1,
    minWidth: '45%',
  },

  // ─── Bonuses ───
  bonusItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  bonusIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  bonusItemContent: {
    flex: 1,
    gap: spacing.xs,
  },
  bonusItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bonusLabel: {
    fontSize: fontSize.md,
  },
  bonusValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  bonusMiniBarBg: {
    height: 3,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  bonusMiniBarFill: {
    height: '100%',
    borderRadius: borderRadius.full,
    opacity: 0.8,
  },
  bonusTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
  },
  bonusTotalLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  bonusTotalLabel: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  bonusTotalValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },

  // ─── Referral Card ───
  referralCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
    overflow: 'hidden',
  },
  referralTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  referralTitle: {
    flex: 1,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  referralSubtitle: {
    fontSize: fontSize.sm,
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  referralUrlBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  referralUrl: {
    flex: 1,
    fontSize: fontSize.sm,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: borderRadius.md,
    height: layout.buttonHeight,
    marginBottom: spacing.md,
  },
  copyBtnText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  referralStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  referralStatItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxs,
  },
  referralStatValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  referralStatLabel: {
    fontSize: fontSize.xs,
  },
  referralStatDivider: {
    width: 1,
    height: 20,
  },

  // ─── Members ───
  memberCountBadge: {
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  memberCountText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  emptySubtext: {
    fontSize: fontSize.sm,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  memberRowBorder: {
    borderBottomWidth: 1,
  },
  memberAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberInitial: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  memberInfo: { flex: 1, gap: spacing.xxs },
  memberName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  memberMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  memberLevelBadge: {
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.xs,
    paddingVertical: 1,
  },
  memberLevelText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  memberDirectsTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  memberDirectsText: {
    fontSize: fontSize.xs,
  },
  memberRight: {
    alignItems: 'center',
    gap: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
});
