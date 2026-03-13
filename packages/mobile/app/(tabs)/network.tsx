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
import * as Clipboard from 'expo-clipboard';
import { networkApi } from '@/lib/api';
import { borderRadius, colors, fontSize, fontWeight as fw, layout, levelColors, spacing } from '@/lib/theme';

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

const LEVEL_COLORS: Record<string, string> = levelColors;

function formatCurrency(value: string | number): string {
  return `R$ ${Number(value).toFixed(2).replace('.', ',')}`;
}

function ProgressBar({ current, required, color }: { current: number; required: number; color: string }) {
  const pct = required > 0 ? Math.min((current / required) * 100, 100) : 0;
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: color }]} />
    </View>
  );
}

export default function NetworkScreen() {
  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [directs, setDirects] = useState<DirectMember[]>([]);
  const [referral, setReferral] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);

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
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const levelColor = LEVEL_COLORS[stats?.level.current ?? 'Seed'] ?? colors.primary;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Level Card */}
      {stats && (
        <View style={[styles.card, { borderColor: levelColor, borderWidth: 2 }]}>
          <View style={styles.levelHeader}>
            <View style={[styles.levelBadge, { backgroundColor: levelColor + '33', borderColor: levelColor }]}>
              <Text style={[styles.levelBadgeText, { color: levelColor }]}>{stats.level.current}</Text>
            </View>
            {stats.level.nextLevel && (
              <Text style={styles.nextLevelText}>Proximo: {stats.level.nextLevel}</Text>
            )}
          </View>

          {stats.level.nextLevel && (
            <View style={styles.requirementsSection}>
              <View style={styles.requirementRow}>
                <Text style={styles.reqLabel}>QV</Text>
                <Text style={styles.reqValue}>{stats.level.requirements.qv.current} / {stats.level.requirements.qv.required}</Text>
              </View>
              <ProgressBar current={stats.level.requirements.qv.current} required={stats.level.requirements.qv.required} color={levelColor} />

              <View style={styles.requirementRow}>
                <Text style={styles.reqLabel}>Diretos Ativos</Text>
                <Text style={styles.reqValue}>{stats.level.requirements.directs.current} / {stats.level.requirements.directs.required}</Text>
              </View>
              <ProgressBar current={stats.level.requirements.directs.current} required={stats.level.requirements.directs.required} color={levelColor} />

              <View style={styles.requirementRow}>
                <Text style={styles.reqLabel}>PML</Text>
                <Text style={styles.reqValue}>{stats.level.requirements.pml.current} / {stats.level.requirements.pml.required}</Text>
              </View>
              <ProgressBar current={stats.level.requirements.pml.current} required={stats.level.requirements.pml.required} color={levelColor} />
            </View>
          )}
        </View>
      )}

      {/* Network Stats */}
      {stats && (
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.network.totalMembers}</Text>
            <Text style={styles.statLabel}>Rede Total</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.network.activeMembers}</Text>
            <Text style={styles.statLabel}>Ativos</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.network.directsActive}</Text>
            <Text style={styles.statLabel}>Diretos</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { fontSize: fontSize.sm }]}>{formatCurrency(stats.network.totalVolume)}</Text>
            <Text style={styles.statLabel}>Volume</Text>
          </View>
        </View>
      )}

      {/* Bonuses */}
      {stats && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Bonus do Mes</Text>
          <View style={styles.bonusGrid}>
            {[
              { label: 'Direto', value: stats.bonuses.direct, color: colors.info },
              { label: 'Infinito', value: stats.bonuses.infinite, color: colors.primaryLight },
              { label: 'Equiparacao', value: stats.bonuses.matching, color: colors.warning },
              { label: 'Global', value: stats.bonuses.global, color: colors.success },
            ].map(b => (
              <View key={b.label} style={styles.bonusItem}>
                <View style={[styles.bonusDot, { backgroundColor: b.color }]} />
                <Text style={styles.bonusLabel}>{b.label}</Text>
                <Text style={styles.bonusValue}>{formatCurrency(b.value)}</Text>
              </View>
            ))}
          </View>
          <View style={styles.bonusTotalRow}>
            <Text style={styles.bonusTotalLabel}>Total</Text>
            <Text style={styles.bonusTotalValue}>{formatCurrency(stats.bonuses.total)}</Text>
          </View>
        </View>
      )}

      {/* Referral Link */}
      {referral && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Link de Indicacao</Text>
          <Text style={styles.referralUrl} numberOfLines={1}>{referral.referralUrl}</Text>
          <Pressable style={styles.copyBtn} onPress={handleCopy}>
            <Text style={styles.copyBtnText}>{copied ? 'Copiado!' : 'Copiar Link'}</Text>
          </Pressable>
          <View style={styles.referralStats}>
            <Text style={styles.referralStatText}>{referral.totalReferrals} indicados | {referral.activeReferrals} ativos</Text>
          </View>
        </View>
      )}

      {/* Direct Members */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Meus Diretos ({directs.length})</Text>
        {directs.length === 0 ? (
          <Text style={styles.emptyText}>Nenhum membro direto ainda. Compartilhe seu link!</Text>
        ) : (
          directs.map(member => {
            const memberColor = LEVEL_COLORS[member.level] ?? colors.textMuted;
            return (
              <View key={member.id} style={styles.memberRow}>
                <View style={[styles.memberAvatar, { borderColor: memberColor }]}>
                  <Text style={styles.memberInitial}>{member.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{member.name}</Text>
                  <Text style={styles.memberMeta}>
                    <Text style={{ color: memberColor }}>{member.level}</Text>
                    {' · '}
                    {member.status === 'active' ? 'Ativo' : 'Inativo'}
                    {member.directCount > 0 ? ` · ${member.directCount} diretos` : ''}
                  </Text>
                </View>
                <View style={[styles.statusDot, { backgroundColor: member.status === 'active' ? colors.success : colors.textMuted }]} />
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.md },
  center: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },

  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  cardTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
    marginBottom: spacing.md,
  },

  // Level
  levelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  levelBadge: {
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderWidth: 1,
  },
  levelBadgeText: { fontSize: fontSize.lg, fontWeight: '800', letterSpacing: 1 },
  nextLevelText: { color: colors.textSecondary, fontSize: fontSize.sm },

  // Requirements
  requirementsSection: { gap: spacing.xs },
  requirementRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  reqLabel: { color: colors.textSecondary, fontSize: fontSize.sm },
  reqValue: { color: colors.text, fontSize: fontSize.sm, fontWeight: '600' },
  progressTrack: { height: layout.progressBarMd, backgroundColor: colors.surfaceLight, borderRadius: layout.progressBarMd / 2, marginTop: spacing.xs },
  progressFill: { height: '100%', borderRadius: layout.progressBarMd / 2 },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { color: colors.text, fontSize: fontSize.md, fontWeight: '700' },
  statLabel: { color: colors.textSecondary, fontSize: fontSize.xs, marginTop: spacing.xs },
  statDivider: { width: layout.dividerHeight, height: layout.iconLg, backgroundColor: colors.border },

  // Bonuses
  bonusGrid: { gap: spacing.sm },
  bonusItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  bonusDot: { width: layout.dotMd, height: layout.dotMd, borderRadius: layout.dotMd / 2 },
  bonusLabel: { flex: 1, color: colors.textSecondary, fontSize: fontSize.sm },
  bonusValue: { color: colors.text, fontSize: fontSize.sm, fontWeight: '600' },
  bonusTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  bonusTotalLabel: { color: colors.text, fontSize: fontSize.md, fontWeight: '700' },
  bonusTotalValue: { color: colors.primary, fontSize: fontSize.md, fontWeight: '700' },

  // Referral
  referralUrl: { color: colors.textSecondary, fontSize: fontSize.sm, marginBottom: spacing.sm },
  copyBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
    height: layout.iconXl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyBtnText: { color: colors.text, fontSize: fontSize.sm, fontWeight: '600' },
  referralStats: { marginTop: spacing.sm, alignItems: 'center' },
  referralStatText: { color: colors.textMuted, fontSize: fontSize.xs },

  // Members
  emptyText: { color: colors.textMuted, fontSize: fontSize.sm, textAlign: 'center', paddingVertical: spacing.lg },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  memberAvatar: {
    width: layout.iconXl,
    height: layout.iconXl,
    borderRadius: layout.iconXl / 2,
    borderWidth: 2,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberInitial: { color: colors.text, fontSize: fontSize.md, fontWeight: '700' },
  memberInfo: { flex: 1 },
  memberName: { color: colors.text, fontSize: fontSize.md, fontWeight: '600' },
  memberMeta: { color: colors.textSecondary, fontSize: fontSize.xs, marginTop: 2 },
  statusDot: { width: layout.dotSm, height: layout.dotSm, borderRadius: borderRadius.xs },
});
