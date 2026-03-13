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
import { financialApi } from '@/lib/api';
import { borderRadius, colors, fontSize, layout, spacing } from '@/lib/theme';
import { useAuth } from '@/contexts/AuthContext';

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

const TYPE_ICONS: Record<string, string> = {
  video: '🎬',
  commission: '💰',
  bonus: '⭐',
  withdrawal: '🏦',
};

const STATUS_COLORS: Record<string, string> = {
  completed: colors.success,
  pending: colors.warning,
  failed: colors.danger,
};

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
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

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
      {/* Balance Card */}
      <View style={styles.card}>
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
        <View style={styles.balanceRow}>
          <Text style={styles.balanceSub}>
            Pendente: {formatCurrency(balance?.pending ?? 0)}
          </Text>
          <Text style={styles.balanceDivider}>|</Text>
          <Text style={styles.balanceSub}>
            Sacado: {formatCurrency(balance?.withdrawn ?? 0)}
          </Text>
          <Text style={styles.balanceDivider}>|</Text>
          <Text style={styles.balanceSub}>
            Total: {formatCurrency(balance?.total ?? 0)}
          </Text>
        </View>

        {/* Withdraw Button / Form */}
        {!showWithdrawForm ? (
          <Pressable
            style={styles.withdrawButton}
            onPress={() => setShowWithdrawForm(true)}
          >
            <Text style={styles.withdrawButtonText}>Solicitar Saque</Text>
          </Pressable>
        ) : (
          <View style={styles.withdrawForm}>
            <TextInput
              style={styles.input}
              placeholder="Valor (R$)"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={withdrawAmount}
              onChangeText={setWithdrawAmount}
            />
            {balance && parseFloat(withdrawAmount.replace(',', '.')) > balance.available && (
              <Text style={styles.validationError}>Saldo insuficiente</Text>
            )}
            <TextInput
              style={styles.input}
              placeholder="Chave PIX"
              placeholderTextColor={colors.textMuted}
              value={pixKey}
              onChangeText={setPixKey}
              autoCapitalize="none"
            />
            <View style={styles.withdrawActions}>
              <Pressable
                style={[styles.withdrawSubmit, withdrawLoading && { opacity: 0.5 }]}
                onPress={handleWithdraw}
                disabled={withdrawLoading}
              >
                {withdrawLoading ? (
                  <ActivityIndicator color={colors.text} size="small" />
                ) : (
                  <Text style={styles.withdrawSubmitText}>Confirmar Saque</Text>
                )}
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
      </View>

      {/* Earnings Breakdown Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Ganhos deste mes</Text>
        <View style={styles.earningsRow}>
          <Text style={styles.earningsLabel}>Videos</Text>
          <Text style={styles.earningsValue}>
            {formatCurrency(earnings?.videos.amount ?? 0)}{' '}
            <Text style={styles.earningsCount}>({earnings?.videos.count ?? 0})</Text>
          </Text>
        </View>
        <View style={styles.earningsRow}>
          <Text style={styles.earningsLabel}>Comissoes</Text>
          <Text style={styles.earningsValue}>
            {formatCurrency(earnings?.commissions.amount ?? 0)}{' '}
            <Text style={styles.earningsCount}>({earnings?.commissions.count ?? 0})</Text>
          </Text>
        </View>
        <View style={styles.earningsRow}>
          <Text style={styles.earningsLabel}>Bonus</Text>
          <Text style={styles.earningsValue}>
            {formatCurrency(earnings?.bonuses.amount ?? 0)}{' '}
            <Text style={styles.earningsCount}>({earnings?.bonuses.count ?? 0})</Text>
          </Text>
        </View>
        <View style={[styles.earningsRow, styles.earningsTotalRow]}>
          <Text style={styles.earningsTotalLabel}>Total</Text>
          <Text style={styles.earningsTotalValue}>
            {formatCurrency(earnings?.total ?? 0)}
          </Text>
        </View>
      </View>

      {/* Recent Transactions */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Transacoes recentes</Text>
        {transactions.length === 0 ? (
          <Text style={styles.emptyText}>Nenhuma transacao encontrada.</Text>
        ) : (
          transactions.map((tx) => (
            <View key={tx.id} style={styles.txRow}>
              <Text style={styles.txIcon}>
                {TYPE_ICONS[tx.type] ?? '📄'}
              </Text>
              <View style={styles.txInfo}>
                <Text style={styles.txDescription} numberOfLines={1}>
                  {tx.description}
                </Text>
                <Text style={styles.txDate}>{formatDate(tx.date)}</Text>
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
                    {
                      backgroundColor:
                        (STATUS_COLORS[tx.status] ?? colors.textMuted) + '22',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.txBadgeText,
                      { color: STATUS_COLORS[tx.status] ?? colors.textMuted },
                    ]}
                  >
                    {tx.status}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </View>
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
  center: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Card
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
    fontWeight: '600',
    marginBottom: spacing.md,
  },

  // Balance
  balanceLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginBottom: spacing.xs,
  },
  balanceAmount: {
    fontSize: fontSize.hero,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  balanceSub: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
  },
  balanceDivider: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginHorizontal: spacing.sm,
  },

  // Withdraw
  withdrawButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    height: layout.buttonHeight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  withdrawButtonText: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  withdrawForm: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  input: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontSize: fontSize.md,
    paddingHorizontal: spacing.md,
    height: layout.buttonHeight,
  },
  validationError: {
    color: colors.danger,
    fontSize: fontSize.xs,
    marginTop: -spacing.xs,
  },
  withdrawActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  withdrawSubmit: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    height: layout.buttonHeight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  withdrawSubmitText: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  withdrawCancel: {
    flex: 1,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    height: layout.buttonHeight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  withdrawCancelText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    fontWeight: '600',
  },

  // Earnings
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  earningsLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
  },
  earningsValue: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  earningsCount: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: '400',
  },
  earningsTotalRow: {
    borderBottomWidth: 0,
    marginTop: spacing.xs,
  },
  earningsTotalLabel: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  earningsTotalValue: {
    color: colors.success,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },

  // Transactions
  emptyText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  txIcon: {
    fontSize: fontSize.lg,
    marginRight: spacing.sm,
  },
  txInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  txDescription: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  txDate: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  txRight: {
    alignItems: 'flex-end',
  },
  txAmount: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  txBadge: {
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginTop: 4,
  },
  txBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});
