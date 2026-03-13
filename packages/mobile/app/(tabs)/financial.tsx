import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { financialApi } from '@/lib/api';
import {
  borderRadius,
  fontSize,
  fontWeight,
  layout,
  spacing,
} from '@/lib/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import AnimatedListItem from '@/components/AnimatedList';
import { SkeletonCard } from '@/components/Skeleton';
import Card from '@/components/Card';

interface BalanceData {
  available: number;
  pending: number;
  withdrawn: number;
  total: number;
}

interface EarningsData {
  videos: { amount: number; count: number };
  commissions: { amount: number; count: number };
  bonuses: { amount: number; count: number };
  total: number;
}

interface Transaction {
  id: string;
  type: 'video' | 'commission' | 'bonus' | 'withdrawal' | string;
  description: string;
  amount: number;
  date: string;
  status: 'completed' | 'pending' | 'failed' | string;
}

type FeatherIconName = keyof typeof Feather.glyphMap;

function formatCurrency(value: number): string {
  return `R$ ${value.toFixed(2).replace('.', ',')}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

export default function FinancialScreen() {
  const { user } = useAuth();
  const { colors, colorAlpha, shadows } = useTheme();

  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Withdraw form state
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  // Theme-dependent configs (recomputed when theme changes)
  const TYPE_CONFIG = useMemo<Record<string, { icon: FeatherIconName; color: string; bg: string }>>(() => ({
    video: { icon: 'film', color: colors.primary, bg: colorAlpha.primary15 },
    commission: { icon: 'trending-up', color: colors.success, bg: colorAlpha.success10 },
    bonus: { icon: 'award', color: colors.accent, bg: colorAlpha.accent10 },
    withdrawal: { icon: 'arrow-down-circle', color: colors.info, bg: colorAlpha.info10 },
  }), [colors, colorAlpha]);

  const STATUS_COLORS = useMemo<Record<string, string>>(() => ({
    completed: colors.success,
    pending: colors.warning,
    failed: colors.danger,
  }), [colors]);

  const STATUS_LABELS: Record<string, string> = {
    completed: 'Concluido',
    pending: 'Pendente',
    failed: 'Falhou',
  };

  const EARNINGS_CONFIG = useMemo<Array<{
    key: keyof Omit<EarningsData, 'total'>;
    label: string;
    icon: FeatherIconName;
    color: string;
    bg: string;
  }>>(() => [
    { key: 'videos', label: 'Videos', icon: 'film', color: colors.primary, bg: colorAlpha.primary15 },
    { key: 'commissions', label: 'Comissoes', icon: 'trending-up', color: colors.success, bg: colorAlpha.success10 },
    { key: 'bonuses', label: 'Bonus', icon: 'award', color: colors.accent, bg: colorAlpha.accent10 },
  ], [colors, colorAlpha]);

  const fetchData = useCallback(async () => {
    try {
      const [balanceRes, earningsRes, historyRes] = await Promise.all([
        financialApi.balance() as Promise<BalanceData>,
        financialApi.earnings() as Promise<EarningsData>,
        financialApi.history('limit=20') as Promise<Transaction[]>,
      ]);
      setBalance(balanceRes);
      setEarnings(earningsRes);
      setTransactions(Array.isArray(historyRes) ? historyRes : []);
    } catch (err: any) {
      Alert.alert('Erro', err?.message ?? 'Nao foi possivel carregar dados financeiros.');
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

  const handleWithdraw = useCallback(async () => {
    const amount = parseFloat(withdrawAmount.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Erro', 'Informe um valor valido.');
      return;
    }
    if (!pixKey.trim()) {
      Alert.alert('Erro', 'Informe sua chave PIX.');
      return;
    }
    if (balance && amount > balance.available) {
      Alert.alert('Erro', 'Saldo insuficiente.');
      return;
    }

    setWithdrawLoading(true);
    try {
      await financialApi.withdraw({ amount, pixKey: pixKey.trim() });
      Alert.alert('Sucesso', 'Solicitacao de saque enviada.');
      setShowWithdrawForm(false);
      setWithdrawAmount('');
      setPixKey('');
      fetchData();
    } catch (err: any) {
      Alert.alert('Erro', err?.message ?? 'Falha ao solicitar saque.');
    } finally {
      setWithdrawLoading(false);
    }
  }, [withdrawAmount, pixKey, balance, fetchData]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, padding: spacing.md, gap: spacing.md }]}>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </View>
    );
  }

  const isInsufficientFunds =
    balance !== null &&
    withdrawAmount.length > 0 &&
    parseFloat(withdrawAmount.replace(',', '.')) > balance.available;

  // Compute relative earnings bar widths
  const earningsTotal = earnings?.total ?? 1;
  const videosPct = Math.min(((earnings?.videos.amount ?? 0) / earningsTotal) * 100, 100);
  const commissionsPct = Math.min(((earnings?.commissions.amount ?? 0) / earningsTotal) * 100, 100);
  const bonusesPct = Math.min(((earnings?.bonuses.amount ?? 0) / earningsTotal) * 100, 100);
  const earningsPcts = [videosPct, commissionsPct, bonusesPct];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
    >
      {/* ─── Balance Hero Card ─── */}
      <AnimatedListItem index={0}>
        <LinearGradient
          colors={['#1E1040', '#121212']}
          style={[
            styles.balanceCard,
            {
              borderColor: colorAlpha.primary20,
              ...shadows.glowPrimarySubtle,
            },
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Decorative glow blob */}
          <View style={[styles.balanceGlowBlob, { backgroundColor: colorAlpha.primary10 }]} />

          <View style={styles.balanceTopRow}>
            <View>
              <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>Saldo Disponivel</Text>
              <Text
                style={[
                  styles.balanceAmount,
                  {
                    color:
                      balance && balance.available >= 0
                        ? colors.success
                        : colors.danger,
                  },
                ]}
              >
                {formatCurrency(balance?.available ?? 0)}
              </Text>
            </View>
            <View
              style={[
                styles.balanceIconCircle,
                {
                  backgroundColor: colorAlpha.primary15,
                  borderColor: colorAlpha.primary30,
                },
              ]}
            >
              <Feather name="credit-card" size={22} color={colors.primaryLight} />
            </View>
          </View>

          {/* Secondary stats row */}
          <View style={[styles.balanceStatsRow, { backgroundColor: colorAlpha.white10 }]}>
            <View style={styles.balanceStatItem}>
              <Feather name="clock" size={12} color={colors.warning} />
              <Text style={[styles.balanceStatLabel, { color: colors.textMuted }]}>Pendente</Text>
              <Text style={[styles.balanceStatValue, { color: colors.textSecondary }]}>
                {formatCurrency(balance?.pending ?? 0)}
              </Text>
            </View>
            <View style={[styles.balanceStatDivider, { backgroundColor: colors.border }]} />
            <View style={styles.balanceStatItem}>
              <Feather name="arrow-up-circle" size={12} color={colors.info} />
              <Text style={[styles.balanceStatLabel, { color: colors.textMuted }]}>Sacado</Text>
              <Text style={[styles.balanceStatValue, { color: colors.textSecondary }]}>
                {formatCurrency(balance?.withdrawn ?? 0)}
              </Text>
            </View>
            <View style={[styles.balanceStatDivider, { backgroundColor: colors.border }]} />
            <View style={styles.balanceStatItem}>
              <Feather name="bar-chart-2" size={12} color={colors.textSecondary} />
              <Text style={[styles.balanceStatLabel, { color: colors.textMuted }]}>Total</Text>
              <Text style={[styles.balanceStatValue, { color: colors.textSecondary }]}>
                {formatCurrency(balance?.total ?? 0)}
              </Text>
            </View>
          </View>

          {/* Withdraw Button / Form */}
          {!showWithdrawForm ? (
            <Pressable
              onPress={() => setShowWithdrawForm(true)}
              style={({ pressed }) => [pressed && { opacity: 0.85 }]}
            >
              <LinearGradient
                colors={[colors.accent, '#D97706']}
                style={[styles.withdrawButton, shadows.md]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Feather name="download" size={16} color={colors.background} />
                <Text style={[styles.withdrawButtonText, { color: colors.background }]}>Solicitar Saque</Text>
              </LinearGradient>
            </Pressable>
          ) : (
            <View style={styles.withdrawForm}>
              {/* Amount input */}
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: colorAlpha.white10,
                    borderColor: isInsufficientFunds ? colors.danger : colors.border,
                  },
                ]}
              >
                <Feather name="dollar-sign" size={16} color={colors.textMuted} />
                <TextInput
                  style={[styles.formInput, { color: colors.text }]}
                  placeholder="Valor (R$)"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  value={withdrawAmount}
                  onChangeText={setWithdrawAmount}
                />
              </View>
              {isInsufficientFunds && (
                <View style={styles.validationRow}>
                  <Feather name="alert-circle" size={12} color={colors.danger} />
                  <Text style={[styles.validationError, { color: colors.danger }]}>Saldo insuficiente</Text>
                </View>
              )}

              {/* PIX key input */}
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: colorAlpha.white10,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Feather name="key" size={16} color={colors.textMuted} />
                <TextInput
                  style={[styles.formInput, { color: colors.text }]}
                  placeholder="Chave PIX"
                  placeholderTextColor={colors.textMuted}
                  value={pixKey}
                  onChangeText={setPixKey}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.withdrawActions}>
                <Pressable
                  onPress={handleWithdraw}
                  disabled={withdrawLoading}
                  style={[styles.withdrawSubmitWrap, withdrawLoading && { opacity: 0.5 }]}
                >
                  <LinearGradient
                    colors={[colors.accent, '#D97706']}
                    style={styles.withdrawSubmitGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {withdrawLoading ? (
                      <ActivityIndicator color={colors.background} size="small" />
                    ) : (
                      <>
                        <Feather name="check" size={16} color={colors.background} />
                        <Text style={[styles.withdrawSubmitText, { color: colors.background }]}>Confirmar</Text>
                      </>
                    )}
                  </LinearGradient>
                </Pressable>
                <Pressable
                  style={[
                    styles.withdrawCancel,
                    {
                      backgroundColor: colorAlpha.muted20,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => setShowWithdrawForm(false)}
                >
                  <Text style={[styles.withdrawCancelText, { color: colors.textSecondary }]}>Cancelar</Text>
                </Pressable>
              </View>
            </View>
          )}
        </LinearGradient>
      </AnimatedListItem>

      {/* ─── Earnings Breakdown Card ─── */}
      <AnimatedListItem index={1}>
        <Card icon="pie-chart" title="Ganhos deste mes" variant="elevated">
          {EARNINGS_CONFIG.map((cfg, i) => {
            const item = earnings?.[cfg.key];
            const amount = item?.amount ?? 0;
            const count = item?.count ?? 0;
            const pct = earningsPcts[i] ?? 0;

            return (
              <View key={cfg.key} style={styles.earningsItem}>
                <View style={[styles.earningsIconCircle, { backgroundColor: cfg.bg }]}>
                  <Feather name={cfg.icon} size={14} color={cfg.color} />
                </View>
                <View style={styles.earningsItemContent}>
                  <View style={styles.earningsItemTop}>
                    <Text style={[styles.earningsLabel, { color: colors.textSecondary }]}>{cfg.label}</Text>
                    <View style={styles.earningsRight}>
                      <Text style={[styles.earningsValue, { color: colors.text }]}>{formatCurrency(amount)}</Text>
                      <Text
                        style={[
                          styles.earningsCount,
                          {
                            color: colors.textMuted,
                            backgroundColor: colorAlpha.muted20,
                          },
                        ]}
                      >
                        {count}x
                      </Text>
                    </View>
                  </View>
                  {/* Mini progress bar */}
                  <View style={[styles.earningsMiniBarBg, { backgroundColor: colorAlpha.muted20 }]}>
                    <View
                      style={[
                        styles.earningsMiniBarFill,
                        { width: `${pct}%` as any, backgroundColor: cfg.color },
                      ]}
                    />
                  </View>
                </View>
              </View>
            );
          })}

          <View style={[styles.earningsTotalRow, { borderTopColor: colors.border }]}>
            <View style={styles.earningsTotalLeft}>
              <Feather name="trending-up" size={16} color={colors.success} />
              <Text style={[styles.earningsTotalLabel, { color: colors.text }]}>Total do mes</Text>
            </View>
            <Text style={[styles.earningsTotalValue, { color: colors.success }]}>
              {formatCurrency(earnings?.total ?? 0)}
            </Text>
          </View>
        </Card>
      </AnimatedListItem>

      {/* ─── Recent Transactions ─── */}
      <AnimatedListItem index={2}>
        <Card icon="list" title="Transacoes recentes" variant="elevated">
          {transactions.length === 0 ? (
            <View style={styles.emptyTxContainer}>
              <Feather name="inbox" size={28} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>Nenhuma transacao encontrada.</Text>
            </View>
          ) : (
            transactions.map((tx, index) => {
              const cfg = TYPE_CONFIG[tx.type] ?? {
                icon: 'file-text' as FeatherIconName,
                color: colors.textMuted,
                bg: colorAlpha.muted20,
              };
              const statusColor = STATUS_COLORS[tx.status] ?? colors.textMuted;
              const statusLabel = STATUS_LABELS[tx.status] ?? tx.status;
              const isLast = index === transactions.length - 1;

              return (
                <View
                  key={tx.id}
                  style={[styles.txRow, !isLast && styles.txRowBorder, !isLast && { borderBottomColor: colors.border }]}
                >
                  <View style={[styles.txIconCircle, { backgroundColor: cfg.bg }]}>
                    <Feather name={cfg.icon} size={16} color={cfg.color} />
                  </View>
                  <View style={styles.txInfo}>
                    <Text style={[styles.txDescription, { color: colors.text }]} numberOfLines={1}>
                      {tx.description}
                    </Text>
                    <View style={styles.txDateRow}>
                      <Feather name="calendar" size={10} color={colors.textMuted} />
                      <Text style={[styles.txDate, { color: colors.textMuted }]}>{formatDate(tx.date)}</Text>
                    </View>
                  </View>
                  <View style={styles.txRight}>
                    <Text
                      style={[
                        styles.txAmount,
                        { color: tx.amount >= 0 ? colors.success : colors.danger },
                      ]}
                    >
                      {tx.amount >= 0 ? '+' : ''}
                      {formatCurrency(tx.amount)}
                    </Text>
                    <View
                      style={[
                        styles.txBadge,
                        { backgroundColor: statusColor + '22' },
                      ]}
                    >
                      <Text
                        style={[styles.txBadgeText, { color: statusColor }]}
                      >
                        {statusLabel}
                      </Text>
                    </View>
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
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },

  // ─── Balance Hero ───
  balanceCard: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    overflow: 'hidden',
  },
  balanceGlowBlob: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 160,
    height: 160,
    borderRadius: 80,
  },
  balanceTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  balanceLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  balanceAmount: {
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.extrabold,
    letterSpacing: -1,
  },
  balanceIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  balanceStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  balanceStatItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  balanceStatDivider: {
    width: 1,
    height: 28,
  },
  balanceStatLabel: {
    fontSize: fontSize.xs,
  },
  balanceStatValue: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  withdrawButton: {
    borderRadius: borderRadius.md,
    height: layout.buttonHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  withdrawButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  withdrawForm: {
    gap: spacing.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  formInput: {
    flex: 1,
    fontSize: fontSize.md,
    paddingVertical: spacing.md,
  },
  validationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    marginTop: -spacing.xs,
  },
  validationError: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  withdrawActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  withdrawSubmitWrap: {
    flex: 1,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  withdrawSubmitGradient: {
    height: layout.buttonHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  withdrawSubmitText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  withdrawCancel: {
    flex: 1,
    borderRadius: borderRadius.md,
    height: layout.buttonHeight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  withdrawCancelText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },

  // ─── Earnings ───
  earningsItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  earningsIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  earningsItemContent: {
    flex: 1,
    gap: spacing.xs,
  },
  earningsItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  earningsLabel: {
    fontSize: fontSize.md,
  },
  earningsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  earningsValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  earningsCount: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.normal,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.xs,
    paddingVertical: 1,
  },
  earningsMiniBarBg: {
    height: 3,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  earningsMiniBarFill: {
    height: '100%',
    borderRadius: borderRadius.full,
    opacity: 0.8,
  },
  earningsTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
  },
  earningsTotalLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  earningsTotalLabel: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  earningsTotalValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },

  // ─── Transactions ───
  emptyTxContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  txRowBorder: {
    borderBottomWidth: 1,
  },
  txIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txInfo: {
    flex: 1,
    gap: 2,
  },
  txDescription: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  txDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  txDate: {
    fontSize: fontSize.xs,
  },
  txRight: {
    alignItems: 'flex-end',
    gap: 3,
  },
  txAmount: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  txBadge: {
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  txBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
});
