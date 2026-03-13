import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { onboardingApi } from '@/lib/api';
import type { OnboardingQuestion, CreatorDiagnostic } from '@/lib/api';
import { useTheme } from '@/contexts/ThemeContext';
import { borderRadius, fontSize, fontWeight, layout, spacing } from '@/lib/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function BehavioralOnboardingScreen() {
  const router = useRouter();
  const { colors, colorAlpha, shadows } = useTheme();
  const [questions, setQuestions] = useState<OnboardingQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string | string[] | number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sliderValue, setSliderValue] = useState(50);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const loadingPulse = useRef(new Animated.Value(0.6)).current;

  const BLOCK_LABELS = [
    { range: [1, 4], label: 'Motivacao e Contexto', emoji: '🎯', color: colors.primary },
    { range: [5, 8], label: 'Estilo de Conteudo', emoji: '🎬', color: colors.info },
    { range: [9, 12], label: 'Segmentos e Afinidade', emoji: '🏷️', color: colors.success },
    { range: [13, 16], label: 'Redes Sociais', emoji: '📱', color: colors.accent },
    { range: [17, 20], label: 'Personalidade', emoji: '🧠', color: colors.cyan },
  ];

  function getBlockInfo(questionId: number) {
    return BLOCK_LABELS.find(b => questionId >= b.range[0] && questionId <= b.range[1]);
  }

  useEffect(() => {
    loadQuestions();
  }, []);

  useEffect(() => {
    if (loading || submitting) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(loadingPulse, { toValue: 1, duration: 900, useNativeDriver: true }),
          Animated.timing(loadingPulse, { toValue: 0.6, duration: 900, useNativeDriver: true }),
        ])
      ).start();
    } else {
      loadingPulse.stopAnimation();
    }
  }, [loading, submitting]);

  const loadQuestions = async () => {
    try {
      const res = await onboardingApi.behavioralQuestions();
      setQuestions(res.questions);
    } catch {
      Alert.alert('Erro', 'Nao foi possivel carregar as perguntas.');
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion = questions[currentIndex];
  const progress = questions.length > 0 ? (currentIndex + 1) / questions.length : 0;
  const blockInfo = currentQuestion ? getBlockInfo(currentQuestion.id) : null;

  const animateTransition = useCallback((direction: 'next' | 'prev') => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim]);

  const goNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      animateTransition('next');
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
        const nextQ = questions[currentIndex + 1];
        if (nextQ?.type === 'slider') {
          const existing = answers[nextQ.id];
          setSliderValue(typeof existing === 'number' ? existing : 50);
        }
      }, 150);
    }
  }, [currentIndex, questions, animateTransition, answers]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      animateTransition('prev');
      setTimeout(() => {
        setCurrentIndex(prev => prev - 1);
        const prevQ = questions[currentIndex - 1];
        if (prevQ?.type === 'slider') {
          const existing = answers[prevQ.id];
          setSliderValue(typeof existing === 'number' ? existing : 50);
        }
      }, 150);
    }
  }, [currentIndex, questions, animateTransition, answers]);

  const handleSingleSelect = useCallback((questionId: number, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    setTimeout(goNext, 300);
  }, [goNext]);

  const handleMultipleSelect = useCallback((questionId: number, value: string) => {
    setAnswers(prev => {
      const current = (prev[questionId] as string[]) ?? [];
      if (value === 'none') return { ...prev, [questionId]: ['none'] };
      const filtered = current.filter(v => v !== 'none');
      const updated = filtered.includes(value)
        ? filtered.filter(v => v !== value)
        : [...filtered, value];
      return { ...prev, [questionId]: updated };
    });
  }, []);

  const handleSwipe = useCallback((questionId: number, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    setTimeout(goNext, 300);
  }, [goNext]);

  const handleSliderConfirm = useCallback((questionId: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: sliderValue }));
    goNext();
  }, [sliderValue, goNext]);

  const handleGridSelect = useCallback((questionId: number, value: string, maxSelections: number) => {
    setAnswers(prev => {
      const current = (prev[questionId] as string[]) ?? [];
      if (current.includes(value)) {
        return { ...prev, [questionId]: current.filter(v => v !== value) };
      }
      if (current.length >= maxSelections) return prev;
      return { ...prev, [questionId]: [...current, value] };
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    const answeredCount = Object.keys(answers).length;
    if (answeredCount < 15) {
      Alert.alert('Quase la!', `Voce respondeu ${answeredCount}/20 perguntas. Responda ao menos 15 para continuar.`);
      return;
    }
    setSubmitting(true);
    try {
      const res = await onboardingApi.submitBehavioral(answers);
      router.replace({
        pathname: '/behavioral-result',
        params: { diagnostic: JSON.stringify(res.creatorDiagnostic) },
      });
    } catch (err: any) {
      Alert.alert('Erro', err?.message ?? 'Erro ao analisar perfil. Tente novamente.');
      setSubmitting(false);
    }
  }, [answers, router]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Animated.View style={[styles.loadingIconWrap, { opacity: loadingPulse }]}>
          <LinearGradient
            colors={[colors.primary, colors.primaryLight]}
            style={styles.loadingIconGradient}
          >
            <Feather name="cpu" size={32} color={colors.text} />
          </LinearGradient>
        </Animated.View>
        <Text style={[styles.loadingText, { color: colors.text }]}>Preparando suas perguntas...</Text>
        <Text style={[styles.loadingSubtext, { color: colors.textSecondary }]}>Personalizando para o seu perfil</Text>
      </View>
    );
  }

  if (submitting) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Animated.View style={[styles.loadingIconWrap, { opacity: loadingPulse }]}>
          <LinearGradient
            colors={[colors.primary, colors.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.loadingIconGradient}
          >
            <Feather name="zap" size={32} color={colors.text} />
          </LinearGradient>
        </Animated.View>
        <Text style={[styles.loadingText, { color: colors.text }]}>Analisando seu perfil com IA...</Text>
        <Text style={[styles.loadingSubtext, { color: colors.textSecondary }]}>Isso pode levar alguns segundos</Text>
        <View style={styles.loadingDotsRow}>
          {[0, 1, 2].map(i => (
            <Animated.View
              key={i}
              style={[
                styles.loadingDot,
                { backgroundColor: colors.primary, opacity: loadingPulse, transform: [{ scale: loadingPulse }] },
              ]}
            />
          ))}
        </View>
      </View>
    );
  }

  if (!currentQuestion) return null;

  const isLastQuestion = currentIndex === questions.length - 1;
  const hasAnswer = answers[currentQuestion.id] !== undefined;
  const blockColor = blockInfo?.color ?? colors.primary;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={goPrev}
          disabled={currentIndex === 0}
          style={[styles.headerIconBtn, { backgroundColor: colors.surface, borderColor: colors.border }, currentIndex === 0 && { opacity: 0.3 }]}
        >
          <Feather name="chevron-left" size={20} color={colors.primaryLight} />
        </Pressable>

        <View style={[styles.headerCountPill, { backgroundColor: colorAlpha.primary15, borderColor: colors.primary + '40' }]}>
          <Text style={[styles.headerCountText, { color: colors.primaryLight }]}>{currentIndex + 1}</Text>
          <Text style={[styles.headerCountSep, { color: colors.textMuted }]}>/</Text>
          <Text style={[styles.headerCountTotal, { color: colors.textSecondary }]}>{questions.length}</Text>
        </View>

        <Pressable
          onPress={() => {
            Alert.alert('Sair', 'Tem certeza? Suas respostas serao perdidas.', [
              { text: 'Continuar', style: 'cancel' },
              { text: 'Sair', style: 'destructive', onPress: () => router.back() },
            ]);
          }}
          style={[styles.headerIconBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Feather name="x" size={20} color={colors.textSecondary} />
        </Pressable>
      </View>

      {/* Progress Bar */}
      <View style={[styles.progressContainer, { backgroundColor: colors.surface }]}>
        <LinearGradient
          colors={[colors.primary, colors.primaryLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.progressBar, { width: `${progress * 100}%` }]}
        />
      </View>

      {/* Block Label */}
      {blockInfo && (
        <View style={styles.blockLabelRow}>
          <View style={[styles.blockLabelPill, { backgroundColor: blockColor + '1A', borderColor: blockColor + '40' }]}>
            <Text style={styles.blockLabelEmoji}>{blockInfo.emoji}</Text>
            <Text style={[styles.blockLabelText, { color: blockColor }]}>{blockInfo.label}</Text>
          </View>
        </View>
      )}

      {/* Question */}
      <Animated.View style={[styles.questionContainer, { opacity: fadeAnim }]}>
        <Text style={[styles.questionText, { color: colors.text }]}>{currentQuestion.question}</Text>
        {currentQuestion.subtitle && (
          <Text style={[styles.questionSubtitle, { color: colors.textSecondary }]}>{currentQuestion.subtitle}</Text>
        )}

        <ScrollView style={styles.optionsScroll} contentContainerStyle={styles.optionsContent} showsVerticalScrollIndicator={false}>
          {/* Single Select */}
          {currentQuestion.type === 'single' && currentQuestion.options?.map(opt => {
            const isSelected = answers[currentQuestion.id] === opt.value;
            return (
              <Pressable
                key={opt.value}
                style={[
                  styles.optionCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  isSelected && { borderColor: colors.primary, backgroundColor: colorAlpha.primary10 },
                  isSelected && shadows.glowPrimarySubtle,
                ]}
                onPress={() => handleSingleSelect(currentQuestion.id, opt.value)}
              >
                {opt.emoji && <Text style={styles.optionEmoji}>{opt.emoji}</Text>}
                <Text style={[styles.optionLabel, { color: colors.text }, isSelected && { color: colors.primaryLight, fontWeight: fontWeight.bold }]}>{opt.label}</Text>
                {isSelected && (
                  <View style={[styles.checkIconWrap, { backgroundColor: colorAlpha.primary20, borderColor: colors.primary }]}>
                    <Feather name="check" size={14} color={colors.primary} />
                  </View>
                )}
              </Pressable>
            );
          })}

          {/* Multiple Select */}
          {currentQuestion.type === 'multiple' && (
            <>
              {currentQuestion.options?.map(opt => {
                const selected = ((answers[currentQuestion.id] as string[]) ?? []).includes(opt.value);
                return (
                  <Pressable
                    key={opt.value}
                    style={[
                      styles.optionCard,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                      selected && { borderColor: colors.primary, backgroundColor: colorAlpha.primary10 },
                      selected && shadows.glowPrimarySubtle,
                    ]}
                    onPress={() => handleMultipleSelect(currentQuestion.id, opt.value)}
                  >
                    {opt.emoji && <Text style={styles.optionEmoji}>{opt.emoji}</Text>}
                    <Text style={[styles.optionLabel, { color: colors.text }, selected && { color: colors.primaryLight, fontWeight: fontWeight.bold }]}>{opt.label}</Text>
                    {selected && (
                      <View style={[styles.checkIconWrap, { backgroundColor: colorAlpha.primary20, borderColor: colors.primary }]}>
                        <Feather name="check" size={14} color={colors.primary} />
                      </View>
                    )}
                  </Pressable>
                );
              })}
              {hasAnswer && (
                <Pressable style={styles.confirmBtn} onPress={goNext}>
                  <LinearGradient
                    colors={[colors.primary, colors.primaryLight]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.confirmBtnGradient}
                  >
                    <Feather name="arrow-right" size={18} color={colors.text} />
                    <Text style={[styles.confirmBtnText, { color: colors.text }]}>Confirmar</Text>
                  </LinearGradient>
                </Pressable>
              )}
            </>
          )}

          {/* Swipe (two big buttons) */}
          {currentQuestion.type === 'swipe' && currentQuestion.options && (
            <View style={styles.swipeContainer}>
              {currentQuestion.options.map((opt, i) => {
                const isSelected = answers[currentQuestion.id] === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    style={[
                      styles.swipeCard,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                      isSelected && { borderColor: colors.primary },
                      isSelected && shadows.glowPrimarySubtle,
                    ]}
                    onPress={() => handleSwipe(currentQuestion.id, opt.value)}
                  >
                    {isSelected && (
                      <LinearGradient
                        colors={[colors.primary + '30', colors.primaryLight + '10']}
                        style={StyleSheet.absoluteFillObject}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      />
                    )}
                    {opt.emoji && <Text style={styles.swipeEmoji}>{opt.emoji}</Text>}
                    <Text style={[styles.swipeLabel, { color: colors.text }, isSelected && { color: colors.primaryLight, fontWeight: fontWeight.bold }]}>
                      {opt.label}
                    </Text>
                    {isSelected && (
                      <View style={[styles.swipeCheckBadge, { backgroundColor: colorAlpha.primary20, borderColor: colors.primary }]}>
                        <Feather name="check" size={12} color={colors.primary} />
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* Slider */}
          {currentQuestion.type === 'slider' && currentQuestion.sliderConfig && (
            <View style={styles.sliderContainer}>
              <View style={styles.sliderValueDisplay}>
                <LinearGradient
                  colors={[colors.primary, colors.primaryLight]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.sliderValueBadge}
                >
                  <Text style={[styles.sliderValueText, { color: colors.text }]}>{sliderValue}%</Text>
                </LinearGradient>
              </View>
              <View style={styles.sliderLabels}>
                <Text style={[styles.sliderLabelText, { color: colors.textSecondary }]}>{currentQuestion.sliderConfig.minLabel}</Text>
                <Text style={[styles.sliderLabelText, { color: colors.textSecondary }]}>{currentQuestion.sliderConfig.maxLabel}</Text>
              </View>
              <View style={[styles.sliderTrack, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <LinearGradient
                  colors={[colors.primary, colors.primaryLight]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.sliderFill, { width: `${sliderValue}%` }]}
                />
                <View
                  style={[styles.sliderThumb, { left: `${sliderValue}%`, borderColor: colors.background }, shadows.glowPrimarySubtle]}
                  onStartShouldSetResponder={() => true}
                  onResponderMove={(e) => {
                    const trackWidth = SCREEN_WIDTH - 80;
                    const x = Math.max(0, Math.min(e.nativeEvent.locationX + (sliderValue / 100) * trackWidth - trackWidth / 2, trackWidth));
                    setSliderValue(Math.round((x / trackWidth) * 100));
                  }}
                >
                  <LinearGradient
                    colors={[colors.primary, colors.primaryLight]}
                    style={styles.sliderThumbGradient}
                  />
                </View>
              </View>
              <Pressable style={styles.confirmBtn} onPress={() => handleSliderConfirm(currentQuestion.id)}>
                <LinearGradient
                  colors={[colors.primary, colors.primaryLight]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.confirmBtnGradient}
                >
                  <Feather name="arrow-right" size={18} color={colors.text} />
                  <Text style={[styles.confirmBtnText, { color: colors.text }]}>Confirmar</Text>
                </LinearGradient>
              </Pressable>
            </View>
          )}

          {/* Grid */}
          {currentQuestion.type === 'grid' && (
            <>
              <View style={styles.gridContainer}>
                {currentQuestion.options?.map(opt => {
                  const selected = ((answers[currentQuestion.id] as string[]) ?? []).includes(opt.value);
                  return (
                    <Pressable
                      key={opt.value}
                      style={[
                        styles.gridItem,
                        { backgroundColor: colors.surface, borderColor: colors.border },
                        selected && { borderColor: colors.primary },
                        selected && shadows.glowPrimarySubtle,
                      ]}
                      onPress={() => handleGridSelect(currentQuestion.id, opt.value, currentQuestion.maxSelections ?? 4)}
                    >
                      {selected && (
                        <LinearGradient
                          colors={[colors.primary + '20', colors.primaryLight + '08']}
                          style={[StyleSheet.absoluteFillObject, { borderRadius: borderRadius.md }]}
                        />
                      )}
                      <Text style={styles.gridEmoji}>{opt.emoji}</Text>
                      <Text style={[styles.gridLabel, { color: colors.text }, selected && { color: colors.primaryLight, fontWeight: fontWeight.bold }]}>{opt.label}</Text>
                      {selected && (
                        <View style={[styles.gridCheckBadge, { backgroundColor: colorAlpha.primary20, borderColor: colors.primary }]}>
                          <Feather name="check" size={10} color={colors.primary} />
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>
              {hasAnswer && (
                <Pressable style={styles.confirmBtn} onPress={goNext}>
                  <LinearGradient
                    colors={[colors.primary, colors.primaryLight]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.confirmBtnGradient}
                  >
                    <Feather name="arrow-right" size={18} color={colors.text} />
                    <Text style={[styles.confirmBtnText, { color: colors.text }]}>Confirmar</Text>
                  </LinearGradient>
                </Pressable>
              )}
            </>
          )}
        </ScrollView>
      </Animated.View>

      {/* Bottom: Submit on last question */}
      {isLastQuestion && hasAnswer && (
        <View style={styles.bottomBar}>
          <Pressable style={[styles.submitBtn, shadows.glowPrimary]} onPress={handleSubmit}>
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.submitBtnGradient}
            >
              <Feather name="zap" size={20} color={colors.text} style={{ marginRight: spacing.sm }} />
              <Text style={[styles.submitBtnText, { color: colors.text }]}>Analisar meu perfil</Text>
            </LinearGradient>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingIconWrap: {
    marginBottom: spacing.lg,
  },
  loadingIconGradient: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  loadingDotsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: 60,
    paddingBottom: spacing.sm,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    gap: 3,
  },
  headerCountText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  headerCountSep: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.normal,
  },
  headerCountTotal: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },

  // Progress
  progressContainer: {
    height: layout.progressBarMd,
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.xs,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: borderRadius.xs,
  },

  // Block Label
  blockLabelRow: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  blockLabelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  blockLabelEmoji: {
    fontSize: fontSize.sm,
  },
  blockLabelText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // Question
  questionContainer: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  questionText: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    lineHeight: 34,
    letterSpacing: -0.3,
  },
  questionSubtitle: {
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
    lineHeight: 20,
  },

  // Options scroll
  optionsScroll: {
    flex: 1,
    marginTop: spacing.lg,
  },
  optionsContent: {
    gap: spacing.sm,
    paddingBottom: spacing.xxl,
  },

  // Option Card
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    padding: spacing.md,
    gap: spacing.sm,
  },
  optionEmoji: {
    fontSize: fontSize.xl,
    width: 32,
    textAlign: 'center',
  },
  optionLabel: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    lineHeight: 22,
  },
  checkIconWrap: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Swipe
  swipeContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  swipeCard: {
    flex: 1,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 160,
    overflow: 'hidden',
    position: 'relative',
  },
  swipeEmoji: {
    fontSize: fontSize['3xl'],
    marginBottom: spacing.sm,
  },
  swipeLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    textAlign: 'center',
    lineHeight: 22,
  },
  swipeCheckBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 20,
    height: 20,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Slider
  sliderContainer: {
    paddingVertical: spacing.lg,
  },
  sliderValueDisplay: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  sliderValueBadge: {
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    minWidth: 80,
    alignItems: 'center',
  },
  sliderValueText: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.extrabold,
    letterSpacing: -0.5,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sliderLabelText: {
    fontSize: fontSize.xs,
    maxWidth: '45%',
    lineHeight: 18,
  },
  sliderTrack: {
    height: layout.progressBarLg,
    borderRadius: borderRadius.sm,
    position: 'relative',
    borderWidth: 1,
  },
  sliderFill: {
    height: '100%',
    borderRadius: borderRadius.sm,
  },
  sliderThumb: {
    position: 'absolute',
    top: -12,
    width: 32,
    height: 32,
    borderRadius: 16,
    marginLeft: -16,
    borderWidth: 3,
    overflow: 'hidden',
  },
  sliderThumbGradient: {
    flex: 1,
    borderRadius: 16,
  },

  // Grid
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  gridItem: {
    width: (SCREEN_WIDTH - spacing.md * 2 - spacing.sm * 2) / 3,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 88,
    position: 'relative',
    overflow: 'hidden',
  },
  gridEmoji: {
    fontSize: fontSize['2xl'],
    marginBottom: spacing.xs,
  },
  gridLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    textAlign: 'center',
    lineHeight: 16,
  },
  gridCheckBadge: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    width: 18,
    height: 18,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Confirm button
  confirmBtn: {
    borderRadius: borderRadius.md,
    height: layout.buttonHeight,
    overflow: 'hidden',
    marginTop: spacing.md,
  },
  confirmBtnGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  confirmBtnText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },

  // Bottom bar
  bottomBar: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  submitBtn: {
    borderRadius: borderRadius.md,
    height: layout.buttonHeightLg,
    overflow: 'hidden',
  },
  submitBtnGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.2,
  },
});
