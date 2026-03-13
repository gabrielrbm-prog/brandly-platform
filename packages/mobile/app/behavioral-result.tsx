import React, { useEffect, useState, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { onboardingApi } from '@/lib/api';
import type { CreatorDiagnostic } from '@/lib/api';
import { borderRadius, colors, fontSize, spacing } from '@/lib/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ARCHETYPE_COLORS: Record<string, string> = {
  Educador: '#3B82F6',
  Entertainer: '#F59E0B',
  Motivador: '#EF4444',
  Conector: '#10B981',
  Curador: '#8B5CF6',
  Estrategista: '#06B6D4',
};

export default function BehavioralResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [diagnostic, setDiagnostic] = useState<CreatorDiagnostic | null>(null);
  const [loading, setLoading] = useState(true);

  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

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
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!diagnostic) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Perfil nao encontrado</Text>
        <Pressable style={styles.ctaBtn} onPress={() => router.replace('/behavioral-onboarding')}>
          <Text style={styles.ctaBtnText}>Fazer analise</Text>
        </Pressable>
      </View>
    );
  }

  const accentColor = ARCHETYPE_COLORS[diagnostic.archetype] ?? colors.primary;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Hero Card — Spotify Wrapped style */}
      <Animated.View
        style={[
          styles.heroCard,
          { backgroundColor: accentColor + '1A', borderColor: accentColor },
          { opacity: fadeIn, transform: [{ translateY: slideUp }, { scale: scaleAnim }] },
        ]}
      >
        <Text style={styles.heroEmoji}>{diagnostic.archetypeEmoji}</Text>
        <Text style={[styles.heroTitle, { color: accentColor }]}>{diagnostic.title}</Text>
        <Text style={styles.heroDescription}>{diagnostic.shortDescription}</Text>

        {/* Readiness Score Ring */}
        <View style={styles.scoreContainer}>
          <View style={[styles.scoreRing, { borderColor: accentColor }]}>
            <Text style={[styles.scoreValue, { color: accentColor }]}>{diagnostic.readinessScore}</Text>
            <Text style={styles.scoreLabel}>Prontidao</Text>
          </View>
        </View>

        <View style={[styles.levelBadge, { backgroundColor: accentColor + '33', borderColor: accentColor }]}>
          <Text style={[styles.levelText, { color: accentColor }]}>
            {diagnostic.level.charAt(0).toUpperCase() + diagnostic.level.slice(1)}
          </Text>
        </View>
      </Animated.View>

      {/* Superpower */}
      <Animated.View style={[styles.card, { opacity: fadeIn }]}>
        <Text style={styles.cardEmoji}>{'⚡'}</Text>
        <Text style={styles.cardTitle}>Seu Superpoder</Text>
        <Text style={styles.superpowerText}>{diagnostic.superpower}</Text>
      </Animated.View>

      {/* Strengths */}
      <Animated.View style={[styles.card, { opacity: fadeIn }]}>
        <Text style={styles.cardTitle}>{'💪'} Seus Pontos Fortes</Text>
        {diagnostic.strengths.map((s, i) => (
          <View key={i} style={styles.strengthRow}>
            <View style={[styles.strengthDot, { backgroundColor: accentColor }]} />
            <Text style={styles.strengthText}>{s}</Text>
          </View>
        ))}
      </Animated.View>

      {/* Content Style */}
      <Animated.View style={[styles.card, { opacity: fadeIn }]}>
        <Text style={styles.cardTitle}>{'🎬'} Estilo de Conteudo</Text>
        <Text style={styles.cardDescription}>{diagnostic.contentStyle}</Text>
        <View style={styles.tagsRow}>
          {diagnostic.idealFormats.map((f, i) => (
            <View key={i} style={[styles.tag, { borderColor: accentColor }]}>
              <Text style={[styles.tagText, { color: accentColor }]}>{f}</Text>
            </View>
          ))}
        </View>
      </Animated.View>

      {/* Product Match */}
      <Animated.View style={[styles.card, { opacity: fadeIn }]}>
        <Text style={styles.cardTitle}>{'🏷️'} Segmentos que Combinam</Text>
        <View style={styles.tagsRow}>
          {diagnostic.productMatch.map((p, i) => (
            <View key={i} style={[styles.tagFilled, { backgroundColor: accentColor + '33' }]}>
              <Text style={[styles.tagFilledText, { color: accentColor }]}>{p}</Text>
            </View>
          ))}
        </View>
      </Animated.View>

      {/* Motivation */}
      <Animated.View style={[styles.motivationCard, { borderColor: accentColor, opacity: fadeIn }]}>
        <Text style={styles.motivationQuote}>"{diagnostic.motivationPhrase}"</Text>
      </Animated.View>

      {/* CTA */}
      <Pressable
        style={[styles.ctaBtn, { backgroundColor: accentColor }]}
        onPress={() => router.replace('/(tabs)')}
      >
        <Text style={styles.ctaBtnText}>Comecar minha jornada</Text>
      </Pressable>

      <Pressable style={styles.secondaryBtn} onPress={() => router.replace('/behavioral-onboarding')}>
        <Text style={styles.secondaryBtnText}>Refazer analise</Text>
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
    padding: spacing.md,
    paddingTop: 70,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  center: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: fontSize.lg,
    marginBottom: spacing.lg,
  },

  // Hero Card
  heroCard: {
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    padding: spacing.xl,
    alignItems: 'center',
  },
  heroEmoji: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  heroTitle: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  heroDescription: {
    color: colors.text,
    fontSize: fontSize.md,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.lg,
  },

  // Score
  scoreContainer: {
    marginVertical: spacing.md,
  },
  scoreRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreValue: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
  },
  scoreLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },

  // Level
  levelBadge: {
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderWidth: 1,
  },
  levelText: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // Card
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  cardEmoji: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  cardTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  cardDescription: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    lineHeight: 22,
    marginBottom: spacing.md,
  },

  // Superpower
  superpowerText: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
    fontStyle: 'italic',
    lineHeight: 24,
  },

  // Strengths
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  strengthDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  strengthText: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.md,
  },

  // Tags
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tag: {
    borderRadius: borderRadius.full,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  tagText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  tagFilled: {
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  tagFilledText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },

  // Motivation
  motivationCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderLeftWidth: 4,
    padding: spacing.lg,
    backgroundColor: colors.surface,
  },
  motivationQuote: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '600',
    fontStyle: 'italic',
    lineHeight: 28,
    textAlign: 'center',
  },

  // CTA
  ctaBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaBtnText: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  secondaryBtn: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    fontWeight: '500',
  },
});
