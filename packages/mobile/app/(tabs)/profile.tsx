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
  fontSize,
  fontWeight,
  layout,
  levelColors,
  spacing,
  WHITE,
} from '@/lib/theme';
import AnimatedListItem, { FadeInView } from '@/components/AnimatedList';
import { SkeletonCard } from '@/components/Skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

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
  { label: 'Studio IA', icon: 'zap' as const, route: '/(tabs)/studio', colorKey: 'accent' },
  { label: 'Marcas', icon: 'briefcase' as const, route: '/(tabs)/brands', colorKey: 'info' },
  { label: 'Social', icon: 'bar-chart-2' as const, route: '/(tabs)/social', colorKey: 'success' },
  { label: 'Formacao', icon: 'book-open' as const, route: '/(tabs)/courses', colorKey: 'primaryLight' },
  { label: 'Comunidade', icon: 'users' as const, route: '/(tabs)/community', colorKey: 'cyan' },
  { label: 'Meu Perfil Creator', icon: 'target' as const, route: '/behavioral-result', colorKey: 'accentLight' },
] as const;

const THEME_OPTIONS = [
  { mode: 'light' as const, icon: 'sun' as const, label: 'Claro' },
  { mode: 'dark' as const, icon: 'moon' as const, label: 'Escuro' },
  { mode: 'system' as const, icon: 'smartphone' as const, label: 'Sistema' },
] as const;

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { colors, colorAlpha, shadows, mode, isDark, setMode } = useTheme();

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
      // Silently fail
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
      <View style={[styles.container, { backgroundColor: colors.background, padding: spacing.md, gap: spacing.md }]}>
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
      {/* Avatar & User Info */}
      <FadeInView>
        <LinearGradient
          colors={[colorAlpha.primary20, 'transparent']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.profileHeader}
        >
          <View style={[styles.avatarOuter, { borderColor: levelColor }]}>
            <View style={[styles.avatarGlow, { shadowColor: levelColor }]}>
              <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatar}
              >
                <Text style={[styles.avatarText, { color: WHITE }]}>{getInitials(userName)}</Text>
              </LinearGradient>
            </View>
          </View>

          <Text style={[styles.userName, { color: colors.text }]}>{userName}</Text>
          <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{userEmail}</Text>
          <Text style={[styles.userRole, { color: colors.textMuted }]}>{userRole}</Text>

          <View style={[styles.levelBadge, { borderColor: levelColor, backgroundColor: `${levelColor}22` }]}>
            <View style={[styles.levelDot, { backgroundColor: levelColor }]} />
            <Text style={[styles.levelBadgeText, { color: levelColor }]}>{userLevel}</Text>
          </View>
        </LinearGradient>
      </FadeInView>

      {/* Stats Row */}
      <AnimatedListItem index={0}>
        <View style={[styles.statsRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.statItem}>
            <View style={[styles.statIconWrapper, { backgroundColor: colorAlpha.accent10 }]}>
              <Feather name="video" size={16} color={colors.accent} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>{totalVideos}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Videos</Text>
          </View>

          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />

          <View style={styles.statItem}>
            <View style={[styles.statIconWrapper, { backgroundColor: colorAlpha.success10 }]}>
              <Feather name="dollar-sign" size={16} color={colors.success} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>{formatCurrency(totalEarnings)}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Ganhos</Text>
          </View>

          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />

          <View style={styles.statItem}>
            <View style={[styles.statIconWrapper, { backgroundColor: colorAlpha.info10 }]}>
              <Feather name="users" size={16} color={colors.info} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>{networkSize}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Rede</Text>
          </View>
        </View>
      </AnimatedListItem>

      {/* Referral Code Card */}
      {referral?.code && (
        <AnimatedListItem index={1}>
          <View style={[styles.referralCard, { borderColor: colors.primary, ...shadows.glowPrimarySubtle }]}>
            <LinearGradient
              colors={[colorAlpha.primary15, colorAlpha.accent10]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.referralGradientBg}
            />
            <View style={styles.referralHeader}>
              <Feather name="share-2" size={16} color={colors.primaryLight} />
              <Text style={[styles.referralTitle, { color: colors.text }]}>Codigo de Indicacao</Text>
            </View>
            <Text style={[styles.referralSubtitle, { color: colors.textSecondary }]}>
              Convide amigos e ganhe bonus em cada venda da sua rede
            </Text>
            <View style={styles.referralRow}>
              <View style={[styles.referralCodeBox, { backgroundColor: colorAlpha.white10, borderColor: colors.border }]}>
                <Text style={[styles.referralCode, { color: colors.text }]}>{referral.code}</Text>
              </View>
              <Pressable
                style={[
                  styles.copyButton,
                  { backgroundColor: colors.primary, ...shadows.glowPrimarySubtle },
                  copied && { backgroundColor: colorAlpha.success20, borderWidth: 1, borderColor: colors.success },
                ]}
                onPress={handleCopyCode}
              >
                <Feather
                  name={copied ? 'check' : 'copy'}
                  size={14}
                  color={copied ? colors.success : WHITE}
                />
                <Text style={[styles.copyButtonText, { color: copied ? colors.success : WHITE }]}>
                  {copied ? 'Copiado!' : 'Copiar'}
                </Text>
              </Pressable>
            </View>
          </View>
        </AnimatedListItem>
      )}

      {/* Theme Selector */}
      <AnimatedListItem index={2}>
        <View style={[styles.themeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.themeHeader}>
            <View style={[styles.themeIconWrap, { backgroundColor: colorAlpha.accent10 }]}>
              <Feather name={isDark ? 'moon' : 'sun'} size={16} color={colors.accent} />
            </View>
            <Text style={[styles.themeTitle, { color: colors.text }]}>Aparencia</Text>
          </View>
          <View style={styles.themeOptions}>
            {THEME_OPTIONS.map((opt) => {
              const isActive = mode === opt.mode;
              return (
                <Pressable
                  key={opt.mode}
                  style={[styles.themeOptionWrap]}
                  onPress={() => setMode(opt.mode)}
                >
                  {isActive ? (
                    <LinearGradient
                      colors={[colors.primary, colors.primaryDark]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.themeOption}
                    >
                      <Feather name={opt.icon} size={14} color={WHITE} />
                      <Text style={[styles.themeOptionText, { color: WHITE, fontWeight: fontWeight.bold }]}>
                        {opt.label}
                      </Text>
                    </LinearGradient>
                  ) : (
                    <View style={[styles.themeOption, { backgroundColor: colorAlpha.muted20 }]}>
                      <Feather name={opt.icon} size={14} color={colors.textMuted} />
                      <Text style={[styles.themeOptionText, { color: colors.textMuted }]}>
                        {opt.label}
                      </Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>
      </AnimatedListItem>

      {/* Menu Items */}
      <AnimatedListItem index={3}>
        <View style={[styles.menuCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {MENU_ITEMS.map((item, index) => {
            const itemColor = colors[item.colorKey as keyof typeof colors] ?? colors.primary;
            return (
              <Pressable
                key={item.label}
                style={({ pressed }) => [
                  styles.menuItem,
                  index < MENU_ITEMS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                  pressed && { backgroundColor: colorAlpha.primary10 },
                ]}
                onPress={() => {
                  router.push(item.route as any);
                }}
              >
                <View style={[styles.menuIconCircle, { backgroundColor: `${itemColor}18` }]}>
                  <Feather name={item.icon} size={18} color={itemColor} />
                </View>
                <Text style={[styles.menuLabel, { color: colors.text }]}>{item.label}</Text>
                <Feather name="chevron-right" size={16} color={colors.textMuted} />
              </Pressable>
            );
          })}
        </View>
      </AnimatedListItem>

      {/* Logout Button */}
      <Pressable
        style={({ pressed }) => [
          styles.logoutButton,
          { borderColor: colors.border },
          loggingOut && { opacity: 0.5 },
          pressed && { backgroundColor: colorAlpha.danger10, borderColor: colors.danger },
        ]}
        onPress={handleLogout}
        disabled={loggingOut}
      >
        {loggingOut ? (
          <ActivityIndicator color={colors.danger} size="small" />
        ) : (
          <>
            <Feather name="log-out" size={16} color={colors.textMuted} />
            <Text style={[styles.logoutButtonText, { color: colors.textMuted }]}>Sair da conta</Text>
          </>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
  },
  userName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  userEmail: {
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  userRole: {
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
    borderRadius: borderRadius.lg,
    borderWidth: 1,
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
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  statLabel: {
    fontSize: fontSize.xs,
  },
  statDivider: {
    width: layout.dividerHeight,
    height: 48,
  },

  // Referral Card
  referralCard: {
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
    overflow: 'hidden',
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
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  referralSubtitle: {
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
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
  },
  referralCode: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    letterSpacing: 2,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  copyButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },

  // Theme Selector
  themeCard: {
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  themeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  themeIconWrap: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  themeOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  themeOptionWrap: {
    flex: 1,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  themeOptionText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },

  // Menu
  menuCard: {
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
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
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },

  // Logout
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    paddingVertical: spacing.md,
    backgroundColor: 'transparent',
  },
  logoutButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
});
