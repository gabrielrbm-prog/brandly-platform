import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { networkApi } from '@/lib/api';
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
import AnimatedListItem, { FadeInView } from '@/components/AnimatedList';
import { SkeletonCard } from '@/components/Skeleton';
import { useAuth } from '@/contexts/AuthContext';

interface ReferralData {
  code: string;
  link: string;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

function formatCurrency(value: number): string {
  return `R$ ${value.toFixed(2).replace('.', ',')}`;
}

const MENU_ITEMS = [
  { label: 'Studio IA', icon: 'zap' as const, route: '/(tabs)/studio', color: colors.accent },
  { label: 'Marcas', icon: 'briefcase' as const, route: '/(tabs)/brands', color: colors.info },
  { label: 'Social', icon: 'bar-chart-2' as const, route: '/(tabs)/social', color: colors.success },
  { label: 'Formacao', icon: 'book-open' as const, route: '/(tabs)/courses', color: colors.primaryLight },
  { label: 'Comunidade', icon: 'users' as const, route: '/(tabs)/community', color: colors.cyan },
  { label: 'Meu Perfil Creator', icon: 'target' as const, route: '/behavioral-result', color: colors.accentLight },
] as const;

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [referral, setReferral] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = (await networkApi.referralLink()) as ReferralData;
      setReferral(res);
    } catch {
      // Silently fail — referral info is secondary
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

  const handleCopyCode = useCallback(async () => {
    if (!referral?.code) return;
    await Clipboard.setStringAsync(referral.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [referral]);

  const handleLogout = useCallback(async () => {
    Alert.alert('Sair', 'Deseja realmente sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          try {
            await logout();
          } catch {
            Alert.alert('Erro', 'Falha ao sair. Tente novamente.');
          } finally {
            setLoggingOut(false);
          }
        },
      },
    ]);
  }, [logout]);

  if (loading) {
    return (
      <View style={[styles.container, { padding: spacing.md, gap: spacing.md }]}>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </View>
    );
  }

  const userName = (user?.name as string) ?? 'Usuario';
  const userEmail = (user?.email as string) ?? '';
  const userRole = (user?.role as string) ?? 'Creator';
  const userLevel = (user?.level as string) ?? 'Seed';
  const totalVideos = (user?.totalVideos as number) ?? 0;
  const totalEarnings = (user?.totalEarnings as number) ?? 0;
  const networkSize = (user?.networkSize as number) ?? 0;

  const levelColor = levelColors[userLevel] ?? colors.primary;

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
      {/* Avatar & User Info */}
      <FadeInView>
        <LinearGradient
          colors={[colorAlpha.primary20, 'transparent']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.profileHeader}
        >
          {/* Avatar com borda de nivel */}
          <View style={[styles.avatarOuter, { borderColor: levelColor }]}>
            <View style={[styles.avatarGlow, { shadowColor: levelColor }]}>
              <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatar}
              >
                <Text style={styles.avatarText}>{getInitials(userName)}</Text>
              </LinearGradient>
            </View>
          </View>

          <Text style={styles.userName}>{userName}</Text>
          <Text style={styles.userEmail}>{userEmail}</Text>
          <Text style={styles.userRole}>{userRole}</Text>

          {/* Badge de nivel com cor do nivel */}
          <View style={[styles.levelBadge, { borderColor: levelColor, backgroundColor: `${levelColor}22` }]}>
            <View style={[styles.levelDot, { backgroundColor: levelColor }]} />
            <Text style={[styles.levelBadgeText, { color: levelColor }]}>{userLevel}</Text>
          </View>
        </LinearGradient>
      </FadeInView>

      {/* Stats Row */}
      <AnimatedListItem index={0}>
        <View style={styles.statsRow}>
          {/* Videos */}
          <View style={styles.statItem}>
            <View style={[styles.statIconWrapper, { backgroundColor: colorAlpha.accent10 }]}>
              <Feather name="video" size={16} color={colors.accent} />
            </View>
            <Text style={styles.statValue}>{totalVideos}</Text>
            <Text style={styles.statLabel}>Videos</Text>
          </View>

          <View style={styles.statDivider} />

          {/* Ganhos */}
          <View style={styles.statItem}>
            <View style={[styles.statIconWrapper, { backgroundColor: colorAlpha.success10 }]}>
              <Feather name="dollar-sign" size={16} color={colors.success} />
            </View>
            <Text style={styles.statValue}>{formatCurrency(totalEarnings)}</Text>
            <Text style={styles.statLabel}>Ganhos</Text>
          </View>

          <View style={styles.statDivider} />

          {/* Rede */}
          <View style={styles.statItem}>
            <View style={[styles.statIconWrapper, { backgroundColor: colorAlpha.info10 }]}>
              <Feather name="users" size={16} color={colors.info} />
            </View>
            <Text style={styles.statValue}>{networkSize}</Text>
            <Text style={styles.statLabel}>Rede</Text>
          </View>
        </View>
      </AnimatedListItem>

      {/* Referral Code Card */}
      {referral?.code && (
        <AnimatedListItem index={1}>
          <View style={styles.referralCard}>
            <LinearGradient
              colors={[colorAlpha.primary15, colorAlpha.accent10]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.referralGradientBg}
            />
            <View style={styles.referralHeader}>
              <Feather name="share-2" size={16} color={colors.primaryLight} />
              <Text style={styles.referralTitle}>Codigo de Indicacao</Text>
            </View>
            <Text style={styles.referralSubtitle}>
              Convide amigos e ganhe bonus em cada venda da sua rede
            </Text>
            <View style={styles.referralRow}>
              <View style={styles.referralCodeBox}>
                <Text style={styles.referralCode}>{referral.code}</Text>
              </View>
              <Pressable
                style={[styles.copyButton, copied && styles.copyButtonSuccess]}
                onPress={handleCopyCode}
              >
                <Feather
                  name={copied ? 'check' : 'copy'}
                  size={14}
                  color={copied ? colors.success : colors.text}
                />
                <Text style={[styles.copyButtonText, copied && styles.copyButtonTextSuccess]}>
                  {copied ? 'Copiado!' : 'Copiar'}
                </Text>
              </Pressable>
            </View>
          </View>
        </AnimatedListItem>
      )}

      {/* Menu Items */}
      <AnimatedListItem index={2}>
        <View style={styles.menuCard}>
          {MENU_ITEMS.map((item, index) => (
            <Pressable
              key={item.label}
              style={({ pressed }) => [
                styles.menuItem,
                index < MENU_ITEMS.length - 1 && styles.menuItemBorder,
                pressed && styles.menuItemPressed,
              ]}
              onPress={() => {
                router.push(item.route as any);
              }}
            >
              <View style={[styles.menuIconCircle, { backgroundColor: `${item.color}18` }]}>
                <Feather name={item.icon} size={18} color={item.color} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Feather name="chevron-right" size={16} color={colors.textMuted} />
            </Pressable>
          ))}
        </View>
      </AnimatedListItem>

      {/* Logout Button — outline, discreto */}
      <Pressable
        style={({ pressed }) => [
          styles.logoutButton,
          loggingOut && { opacity: 0.5 },
          pressed && styles.logoutButtonPressed,
        ]}
        onPress={handleLogout}
        disabled={loggingOut}
      >
        {loggingOut ? (
          <ActivityIndicator color={colors.danger} size="small" />
        ) : (
          <>
            <Feather name="log-out" size={16} color={colors.textMuted} />
            <Text style={styles.logoutButtonText}>Sair da conta</Text>
          </>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },

  // Profile Header
  profileHeader: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  avatarOuter: {
    width: layout.avatarLg + 8,
    height: layout.avatarLg + 8,
    borderRadius: (layout.avatarLg + 8) / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarGlow: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  avatar: {
    width: layout.avatarLg,
    height: layout.avatarLg,
    borderRadius: layout.avatarLg / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.text,
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
  },
  userName: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  userEmail: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  userRole: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  levelBadge: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
  },
  levelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  levelBadgeText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: spacing.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  statIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxs,
  },
  statValue: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
  },
  statDivider: {
    width: layout.dividerHeight,
    height: 48,
    backgroundColor: colors.border,
  },

  // Referral Card
  referralCard: {
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    padding: spacing.md,
    overflow: 'hidden',
    ...shadows.glowPrimarySubtle,
  },
  referralGradientBg: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: borderRadius.lg,
  },
  referralHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  referralTitle: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  referralSubtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  referralRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  referralCodeBox: {
    flex: 1,
    backgroundColor: colorAlpha.white10,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  referralCode: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    letterSpacing: 2,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...shadows.glowPrimarySubtle,
  },
  copyButtonSuccess: {
    backgroundColor: colorAlpha.success20,
    borderWidth: 1,
    borderColor: colors.success,
  },
  copyButtonText: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  copyButtonTextSuccess: {
    color: colors.success,
  },

  // Menu
  menuCard: {
    marginHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuItemPressed: {
    backgroundColor: colorAlpha.primary10,
  },
  menuIconCircle: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },

  // Logout — outline discreto
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    backgroundColor: 'transparent',
  },
  logoutButtonPressed: {
    backgroundColor: colorAlpha.danger10,
    borderColor: colors.danger,
  },
  logoutButtonText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
});
