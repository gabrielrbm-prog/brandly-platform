import React, { useEffect, useState, useRef } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { onboardingApi } from '@/lib/api';
import type { CreatorDiagnostic } from '@/lib/api';
import { useTheme } from '@/contexts/ThemeContext';
import { borderRadius, fontSize, fontWeight, layout, spacing } from '@/lib/theme';
import ScoreRing from '@/components/ScoreRing';
import AnimatedListItem from '@/components/AnimatedList';
import { SkeletonCard } from '@/components/Skeleton';

export default function BehavioralResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors, shadows } = useTheme();
  const [diagnostic, setDiagnostic] = useState<CreatorDiagnostic | null>(null);
  const [loading, setLoading] = useState(true);

  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  const ARCHETYPE_COLORS: Record<string, string> = {
    Educador: colors.info,
    Entertainer: colors.warning,
    Motivador: colors.danger,
    Conector: colors.success,
    Curador: colors.primaryLight,
    Estrategista: colors.cyan,
  };

  useEffect(() => {
    if (params.diagnostic) {
      try {
        setDiagnostic(JSON.parse(params.diagnostic as string));
        setLoading(false);
      } catch {
        loadFromApi();
      }
    } else {
      loadFromApi();
    }
  }, [params.diagnostic]);

  useEffect(() => {
    if (!loading && diagnostic) {
      Animated.parallel([
        Animated.timing(fadeIn, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(slideUp, { toValue: 0, duration: 600, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 6, useNativeDriver: true }),
      ]).start();
    }
  }, [loading, diagnostic]);

  const loadFromApi = async () => {
    try {
      const res = await onboardingApi.behavioralResult();
      setDiagnostic(res.creatorDiagnostic);
    } catch {
      // No profile yet
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, gap: spacing.md }]}>
        <SkeletonCard />
        <SkeletonCard />
      </View>
    );
  }

  if (!diagnostic) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Perfil nao encontrado</Text>
        <Pressable style={styles.ctaBtnWrap} onPress={() => router.replace('/behavioral-onboarding')}>
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            style={styles.ctaBtnGradient}
          >
            <Text style={[styles.ctaBtnText, { color: colors.text }]}>Fazer analise</Text>
          </LinearGradient>
        </Pressable>
      </View>
    );
  }

  const accentColor = ARCHETYPE_COLORS[diagnostic.archetype] ?? colors.primary;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      {/* Hero Card — Spotify Wrapped style */}
      <Animated.View
        style={[
          styles.heroCard,
          shadows.lg,
          { borderColor: accentColor + '60' },
          { opacity: fadeIn, transform: [{ translateY: slideUp }, { scale: scaleAnim }] },
        ]}
      >
        {/* Gradient background fills based on accent */}
        <LinearGradient
          colors={[accentColor + '2A', accentColor + '08', colors.surface]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[StyleSheet.absoluteFillObject, { borderRadius: borderRadius.xl }]}
        />

        {/* Decorative glow blob */}
        <View style={[styles.heroGlowBlob, { backgroundColor: accentColor + '20' }]} />

        <View style={[styles.heroEmojiWrap, { backgroundColor: accentColor + '1A', borderColor: accentColor + '40' }]}>
          <Text style={styles.heroEmoji}>{diagnostic.archetypeEmoji}</Text>
        </View>

        <Text style={[styles.heroTitle, { color: accentColor }]}>{diagnostic.title}</Text>
        <Text style={[styles.heroDescription, { color: colors.textSecondary }]}>{diagnostic.shortDescription}</Text>

        {/* Readiness Score Ring */}
        <ScoreRing score={diagnostic.readinessScore} color={accentColor} label="Prontidao" />

        <View style={[styles.levelBadge, { backgroundColor: accentColor + '20', borderColor: accentColor + '50' }]}>
          <Feather name="award" size={12} color={accentColor} style={{ marginRight: 5 }} />
          <Text style={[styles.levelText, { color: accentColor }]}>
            {diagnostic.level.charAt(0).toUpperCase() + diagnostic.level.slice(1)}
          </Text>
        </View>
      </Animated.View>

      {/* Superpower */}
      <AnimatedListItem index={0}>
        <Animated.View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, opacity: fadeIn }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconCircle, { backgroundColor: accentColor + '20', borderColor: accentColor + '40' }]}>
              <Feather name="zap" size={16} color={accentColor} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Seu Superpoder</Text>
          </View>
          <Text style={[styles.superpowerText, { color: colors.text }]}>{diagnostic.superpower}</Text>
        </Animated.View>
      </AnimatedListItem>

      {/* Strengths */}
      <AnimatedListItem index={1}>
        <Animated.View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, opacity: fadeIn }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconCircle, { backgroundColor: accentColor + '20', borderColor: accentColor + '40' }]}>
              <Feather name="target" size={16} color={accentColor} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Seus Pontos Fortes</Text>
          </View>
          {diagnostic.strengths.map((s, i) => (
            <View key={i} style={styles.strengthRow}>
              <Feather name="check-circle" size={16} color={accentColor} />
              <Text style={[styles.strengthText, { color: colors.text }]}>{s}</Text>
            </View>
          ))}
        </Animated.View>
      </AnimatedListItem>

      {/* Content Style */}
      <AnimatedListItem index={2}>
        <Animated.View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, opacity: fadeIn }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconCircle, { backgroundColor: accentColor + '20', borderColor: accentColor + '40' }]}>
              <Feather name="film" size={16} color={accentColor} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Estilo de Conteudo</Text>
          </View>
          <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>{diagnostic.contentStyle}</Text>
          <View style={styles.tagsRow}>
            {diagnostic.idealFormats.map((f, i) => (
              <LinearGradient
                key={i}
                colors={[accentColor + '25', accentColor + '10']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.tagGradient, { borderColor: accentColor + '50' }]}
              >
                <Text style={[styles.tagText, { color: accentColor }]}>{f}</Text>
              </LinearGradient>
            ))}
          </View>
        </Animated.View>
      </AnimatedListItem>

      {/* Product Match */}
      <AnimatedListItem index={3}>
        <Animated.View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, opacity: fadeIn }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconCircle, { backgroundColor: accentColor + '20', borderColor: accentColor + '40' }]}>
              <Feather name="tag" size={16} color={accentColor} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Segmentos que Combinam</Text>
          </View>
          <View style={styles.tagsRow}>
            {diagnostic.productMatch.map((p, i) => (
              <LinearGradient
                key={i}
                colors={[accentColor + '30', accentColor + '15']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.tagFilledGradient, { borderColor: accentColor + '40' }]}
              >
                <Text style={[styles.tagFilledText, { color: accentColor }]}>{p}</Text>
              </LinearGradient>
            ))}
          </View>
        </Animated.View>
      </AnimatedListItem>

      {/* Motivation */}
      <Animated.View style={[styles.motivationCard, { backgroundColor: colors.surface, borderColor: accentColor + '50', borderLeftColor: accentColor, opacity: fadeIn }]}>
        <View style={styles.motivationIconRow}>
          <View style={[styles.motivationIconCircle, { backgroundColor: accentColor + '20' }]}>
            <Feather name="message-circle" size={18} color={accentColor} />
          </View>
        </View>
        <Text style={[styles.motivationQuote, { color: colors.text }]}>
          "{diagnostic.motivationPhrase}"
        </Text>
      </Animated.View>

      {/* CTA primary */}
      <Pressable
        style={[styles.ctaBtnWrap, shadows.glowPrimary]}
        onPress={() => router.replace('/(tabs)')}
      >
        <LinearGradient
          colors={[accentColor, accentColor + 'CC']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.ctaBtnGradient}
        >
          <Feather name="arrow-right" size={20} color={colors.text} style={{ marginRight: spacing.sm }} />
          <Text style={[styles.ctaBtnText, { color: colors.text }]}>Comecar minha jornada</Text>
        </LinearGradient>
      </Pressable>

      <Pressable style={styles.secondaryBtn} onPress={() => router.replace('/behavioral-onboarding')}>
        <Feather name="refresh-cw" size={14} color={colors.textSecondary} style={{ marginRight: spacing.xs }} />
        <Text style={[styles.secondaryBtnText, { color: colors.textSecondary }]}>Refazer analise</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingTop: 70,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: fontSize.lg,
    marginBottom: spacing.lg,
  },

  // Hero Card
  heroCard: {
    borderRadius: borderRadius.xl,
    borderWidth: 1.5,
    padding: spacing.xl,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  heroGlowBlob: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
  },
  heroEmojiWrap: {
    width: 96,
    height: 96,
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  heroEmoji: {
    fontSize: fontSize['4xl'],
  },
  heroTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.extrabold,
    textAlign: 'center',
    marginBottom: spacing.sm,
    letterSpacing: -0.5,
  },
  heroDescription: {
    fontSize: fontSize.md,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.sm,
  },

  // Level
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    marginTop: spacing.md,
  },
  levelText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },

  // Card
  card: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  cardIconCircle: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  cardDescription: {
    fontSize: fontSize.md,
    lineHeight: 22,
    marginBottom: spacing.md,
  },

  // Superpower
  superpowerText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    fontStyle: 'italic',
    lineHeight: 26,
  },

  // Strengths
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  strengthText: {
    flex: 1,
    fontSize: fontSize.md,
    lineHeight: 22,
  },

  // Tags — gradient variants
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tagGradient: {
    borderRadius: borderRadius.full,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  tagText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  tagFilledGradient: {
    borderRadius: borderRadius.full,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  tagFilledText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },

  // Motivation
  motivationCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderLeftWidth: 4,
    padding: spacing.lg,
    paddingLeft: spacing.xl,
  },
  motivationIconRow: {
    marginBottom: spacing.md,
  },
  motivationIconCircle: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  motivationQuote: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    fontStyle: 'italic',
    lineHeight: 30,
  },

  // CTA
  ctaBtnWrap: {
    borderRadius: borderRadius.md,
    height: layout.buttonHeightLg,
    overflow: 'hidden',
  },
  ctaBtnGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaBtnText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.2,
  },
  secondaryBtn: {
    height: layout.buttonHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
});
