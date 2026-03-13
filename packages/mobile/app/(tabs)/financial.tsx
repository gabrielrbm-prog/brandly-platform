import React, { useCallback, useEffect, useState } from 'react';
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
  colorAlpha,
  colors,
  fontSize,
  fontWeight,
  layout,
  shadows,
  spacing,
} from '@/lib/theme';
import { useAuth } from '@/contexts/AuthContext';
import AnimatedListItem from '@/components/AnimatedList';
import { SkeletonCard } from '@/components/Skeleton';

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

const TYPE_CONFIG: Record<string, { icon: FeatherIconName; color: string; bg: string }> = {
  video: { icon: 'film', color: colors.primary, bg: colorAlpha.primary15 },
  commission: { icon: 'trending-up', color: colors.success, bg: colorAlpha.success10 },
  bonus: { icon: 'award', color: colors.accent, bg: colorAlpha.accent10 },
  withdrawal: { icon: 'arrow-down-circle', color: colors.info, bg: colorAlpha.info10 },
};

const STATUS_COLORS: Record<string, string> = {
  completed: colors.success,
  pending: colors.warning,
  failed: colors.danger,
};

const STATUS_LABELS: Record<string, string> = {
  completed: 'Concluido',
  pending: 'Pendente',
  failed: 'Falhou',
};

const EARNINGS_CONFIG: Array<{
  key: keyof Omit<EarningsData, 'total'>;
  label: string;
  icon: FeatherIconName;
  color: string;
  bg: string;
}> = [
  { key: 'videos', label: 'Videos', icon: 'film', color: colors.primary, bg: colorAlpha.primary15 },
  { key: 'commissions', label: 'Comissoes', icon: 'trending-up', color: colors.success, bg: colorAlpha.success10 },
  { key: 'bonuses', label: 'Bonus', icon: 'award', color: colors.accent, bg: colorAlpha.accent10 },
];

function formatCurrency(value: number): string {
  return `R$ ${value.toFixed(2).replace('.', ',')}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

export default function FinancialScreen() {
  const { user } = useAuth();

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
      <View style={[styles.container, { padding: spacing.md, gap: spacing.md }]}>
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
      {/* ─── Balance Hero Card ─── */}
      <AnimatedListItem index={0}>
        <LinearGradient
          colors={['#1E1040', '#121212']}
          style={styles.balanceCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Decorative glow blob */}
          <View style={styles.balanceGlowBlob} />

          <View style={styles.balanceTopRow}>
            <View>
              <Text style={styles.balanceLabel}>Saldo Disponivel</Text>
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
            <View style={styles.balanceIconCircle}>
              <Feather name="credit-card" size={22} color={colors.primaryLight} />
            </View>
          </View>

          {/* Secondary stats row */}
          <View style={styles.balanceStatsRow}>
            <View style={styles.balanceStatItem}>
              <Feather name="clock" size={12} color={colors.warning} />
              <Text style={styles.balanceStatLabel}>Pendente</Text>
              <Text style={styles.balanceStatValue}>
                {formatCurrency(balance?.pending ?? 0)}
              </Text>
            </View>
            <View style={styles.balanceStatDivider} />
            <View style={styles.balanceStatItem}>
              <Feather name="arrow-up-circle" size={12} color={colors.info} />
              <Text style={styles.balanceStatLabel}>Sacado</Text>
              <Text style={styles.balanceStatValue}>
                {formatCurrency(balance?.withdrawn ?? 0)}
              </Text>
            </View>
            <View style={styles.balanceStatDivider} />
            <View style={styles.balanceStatItem}>
              <Feather name="bar-chart-2" size={12} color={colors.textSecondary} />
              <Text style={styles.balanceStatLabel}>Total</Text>
              <Text style={styles.balanceStatValue}>
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
                style={styles.withdrawButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Feather name="download" size={16} color={colors.background} />
                <Text style={styles.withdrawButtonText}>Solicitar Saque</Text>
              </LinearGradient>
            </Pressable>
          ) : (
            <View style={styles.withdrawForm}>
              {/* Amount input */}
              <View style={[styles.inputWrapper, isInsufficientFunds && styles.inputWrapperError]}>
                <Feather name="dollar-sign" size={16} color={colors.textMuted} />
                <TextInput
                  style={styles.formInput}
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
                  <Text style={styles.validationError}>Saldo insuficiente</Text>
                </View>
              )}

              {/* PIX key input */}
              <View style={styles.inputWrapper}>
                <Feather name="key" size={16} color={colors.textMuted} />
                <TextInput
                  style={styles.formInput}
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
                        <Text style={styles.withdrawSubmitText}>Confirmar</Text>
                      </>
                    )}
                  </LinearGradient>
                </Pressable>
                <Pressable
                  style={styles.withdrawCancel}
                  onPress={() => setShowWithdrawForm(false)}
                >
                  <Text style={styles.withdrawCancelText}>Cancelar</Text>
                </Pressable>
              </View>
            </View>
          )}
        </LinearGradient>
      </AnimatedListItem>

      {/* ─── Earnings Breakdown Card ─── */}
      <AnimatedListItem index={1}>
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Feather name="pie-chart" size={16} color={colors.primary} />
            <Text style={styles.cardTitle}>Ganhos deste mes</Text>
          </View>

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
                    <Text style={styles.earningsLabel}>{cfg.label}</Text>
                    <View style={styles.earningsRight}>
                      <Text style={styles.earningsValue}>{formatCurrency(amount)}</Text>
                      <Text style={styles.earningsCount}>{count}x</Text>
                    </View>
                  </View>
                  {/* Mini progress bar */}
                  <View style={styles.earningsMiniBarBg}>
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

          <View style={styles.earningsTotalRow}>
            <View style={styles.earningsTotalLeft}>
              <Feather name="trending-up" size={16} color={colors.success} />
              <Text style={styles.earningsTotalLabel}>Total do mes</Text>
            </View>
            <Text style={styles.earningsTotalValue}>
              {formatCurrency(earnings?.total ?? 0)}
            </Text>
          </View>
        </View>
      </AnimatedListItem>

      {/* ─── Recent Transactions ─── */}
      <AnimatedListItem index={2}>
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Feather name="list" size={16} color={colors.primary} />
            <Text style={styles.cardTitle}>Transacoes recentes</Text>
          </View>

          {transactions.length === 0 ? (
            <View style={styles.emptyTxContainer}>
              <Feather name="inbox" size={28} color={colors.textMuted} />
              <Text style={styles.emptyText}>Nenhuma transacao encontrada.</Text>
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
                  style={[styles.txRow, !isLast && styles.txRowBorder]}
                >
                  <View style={[styles.txIconCircle, { backgroundColor: cfg.bg }]}>
                    <Feather name={cfg.icon} size={16} color={cfg.color} />
                  </View>
                  <View style={styles.txInfo}>
                    <Text style={styles.txDescription} numberOfLines={1}>
                      {tx.description}
                    </Text>
                    <View style={styles.txDateRow}>
                      <Feather name="calendar" size={10} color={colors.textMuted} />
                      <Text style={styles.txDate}>{formatDate(tx.date)}</Text>
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
    gap: spacing.md,
  },

  // ─── Balance Hero ───
  balanceCard: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colorAlpha.primary20,
    padding: spacing.lg,
    overflow: 'hidden',
    ...shadows.glowPrimarySubtle,
  },
  balanceGlowBlob: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colorAlpha.primary10,
  },
  balanceTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  balanceLabel: {
    color: colors.textSecondary,
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
    backgroundColor: colorAlpha.primary15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colorAlpha.primary30,
  },
  balanceStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    backgroundColor: colorAlpha.white10,
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
    backgroundColor: colors.border,
  },
  balanceStatLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
  balanceStatValue: {
    color: colors.textSecondary,
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
    ...shadows.md,
  },
  withdrawButtonText: {
    color: colors.background,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  withdrawForm: {
    gap: spacing.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colorAlpha.white10,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  inputWrapperError: {
    borderColor: colors.danger,
  },
  formInput: {
    flex: 1,
    color: colors.text,
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
    color: colors.danger,
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
    color: colors.background,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  withdrawCancel: {
    flex: 1,
    backgroundColor: colorAlpha.muted20,
    borderRadius: borderRadius.md,
    height: layout.buttonHeight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  withdrawCancelText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },

  // ─── Generic Card ───
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.sm,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  cardTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
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
    color: colors.textSecondary,
    fontSize: fontSize.md,
  },
  earningsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  earningsValue: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  earningsCount: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.normal,
    backgroundColor: colorAlpha.muted20,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.xs,
    paddingVertical: 1,
  },
  earningsMiniBarBg: {
    height: 3,
    backgroundColor: colorAlpha.muted20,
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
    borderTopColor: colors.border,
  },
  earningsTotalLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  earningsTotalLabel: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  earningsTotalValue: {
    color: colors.success,
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
    color: colors.textMuted,
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
    borderBottomColor: colors.border,
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
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  txDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  txDate: {
    color: colors.textMuted,
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
