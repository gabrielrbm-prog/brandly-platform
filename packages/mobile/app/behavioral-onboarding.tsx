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
import { onboardingApi } from '@/lib/api';
import type { OnboardingQuestion, CreatorDiagnostic } from '@/lib/api';
import { borderRadius, colorAlpha, colors, fontSize, layout, spacing } from '@/lib/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const BLOCK_LABELS = [
  { range: [1, 4], label: 'Motivacao e Contexto', emoji: '🎯' },
  { range: [5, 8], label: 'Estilo de Conteudo', emoji: '🎬' },
  { range: [9, 12], label: 'Segmentos e Afinidade', emoji: '🏷️' },
  { range: [13, 16], label: 'Redes Sociais', emoji: '📱' },
  { range: [17, 20], label: 'Personalidade', emoji: '🧠' },
];

function getBlockInfo(questionId: number) {
  return BLOCK_LABELS.find(b => questionId >= b.range[0] && questionId <= b.range[1]);
}

export default function BehavioralOnboardingScreen() {
  const router = useRouter();
  const [questions, setQuestions] = useState<OnboardingQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string | string[] | number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sliderValue, setSliderValue] = useState(50);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadQuestions();
  }, []);

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
        // Reset slider for next question
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
    // Auto-advance after 300ms
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
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Preparando suas perguntas...</Text>
      </View>
    );
  }

  if (submitting) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Analisando seu perfil com IA...</Text>
        <Text style={styles.loadingSubtext}>Isso pode levar alguns segundos</Text>
      </View>
    );
  }

  if (!currentQuestion) return null;

  const isLastQuestion = currentIndex === questions.length - 1;
  const hasAnswer = answers[currentQuestion.id] !== undefined;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={goPrev} disabled={currentIndex === 0}>
          <Text style={[styles.headerBtn, currentIndex === 0 && { opacity: 0.3 }]}>{'<'} Voltar</Text>
        </Pressable>
        <Text style={styles.headerCount}>{currentIndex + 1}/{questions.length}</Text>
        <Pressable onPress={() => {
          Alert.alert('Sair', 'Tem certeza? Suas respostas serao perdidas.', [
            { text: 'Continuar', style: 'cancel' },
            { text: 'Sair', style: 'destructive', onPress: () => router.back() },
          ]);
        }}>
          <Text style={styles.headerBtn}>Sair</Text>
        </Pressable>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
      </View>

      {/* Block Label */}
      {blockInfo && (
        <View style={styles.blockLabel}>
          <Text style={styles.blockLabelText}>{blockInfo.emoji} {blockInfo.label}</Text>
        </View>
      )}

      {/* Question */}
      <Animated.View style={[styles.questionContainer, { opacity: fadeAnim }]}>
        <Text style={styles.questionText}>{currentQuestion.question}</Text>
        {currentQuestion.subtitle && (
          <Text style={styles.questionSubtitle}>{currentQuestion.subtitle}</Text>
        )}

        <ScrollView style={styles.optionsScroll} contentContainerStyle={styles.optionsContent} showsVerticalScrollIndicator={false}>
          {/* Single Select */}
          {currentQuestion.type === 'single' && currentQuestion.options?.map(opt => {
            const isSelected = answers[currentQuestion.id] === opt.value;
            return (
              <Pressable
                key={opt.value}
                style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                onPress={() => handleSingleSelect(currentQuestion.id, opt.value)}
              >
                {opt.emoji && <Text style={styles.optionEmoji}>{opt.emoji}</Text>}
                <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>{opt.label}</Text>
                {isSelected && <Text style={styles.checkMark}>{'✓'}</Text>}
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
                    style={[styles.optionCard, selected && styles.optionCardSelected]}
                    onPress={() => handleMultipleSelect(currentQuestion.id, opt.value)}
                  >
                    {opt.emoji && <Text style={styles.optionEmoji}>{opt.emoji}</Text>}
                    <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>{opt.label}</Text>
                    {selected && <Text style={styles.checkMark}>{'✓'}</Text>}
                  </Pressable>
                );
              })}
              {hasAnswer && (
                <Pressable style={styles.confirmBtn} onPress={goNext}>
                  <Text style={styles.confirmBtnText}>Confirmar</Text>
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
                      i === 0 ? styles.swipeCardLeft : styles.swipeCardRight,
                      isSelected && styles.swipeCardSelected,
                    ]}
                    onPress={() => handleSwipe(currentQuestion.id, opt.value)}
                  >
                    <Text style={[styles.swipeLabel, isSelected && styles.swipeLabelSelected]}>
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* Slider */}
          {currentQuestion.type === 'slider' && currentQuestion.sliderConfig && (
            <View style={styles.sliderContainer}>
              <View style={styles.sliderLabels}>
                <Text style={styles.sliderLabelText}>{currentQuestion.sliderConfig.minLabel}</Text>
                <Text style={styles.sliderLabelText}>{currentQuestion.sliderConfig.maxLabel}</Text>
              </View>
              <View style={styles.sliderTrack}>
                <View style={[styles.sliderFill, { width: `${sliderValue}%` }]} />
                <View
                  style={[styles.sliderThumb, { left: `${sliderValue}%` }]}
                  onStartShouldSetResponder={() => true}
                  onResponderMove={(e) => {
                    const trackWidth = SCREEN_WIDTH - 80; // padding
                    const x = Math.max(0, Math.min(e.nativeEvent.locationX + (sliderValue / 100) * trackWidth - trackWidth / 2, trackWidth));
                    setSliderValue(Math.round((x / trackWidth) * 100));
                  }}
                />
              </View>
              <Text style={styles.sliderValueText}>{sliderValue}%</Text>
              <Pressable style={styles.confirmBtn} onPress={() => handleSliderConfirm(currentQuestion.id)}>
                <Text style={styles.confirmBtnText}>Confirmar</Text>
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
                      style={[styles.gridItem, selected && styles.gridItemSelected]}
                      onPress={() => handleGridSelect(currentQuestion.id, opt.value, currentQuestion.maxSelections ?? 4)}
                    >
                      <Text style={styles.gridEmoji}>{opt.emoji}</Text>
                      <Text style={[styles.gridLabel, selected && styles.gridLabelSelected]}>{opt.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
              {hasAnswer && (
                <Pressable style={styles.confirmBtn} onPress={goNext}>
                  <Text style={styles.confirmBtnText}>Confirmar</Text>
                </Pressable>
              )}
            </>
          )}
        </ScrollView>
      </Animated.View>

      {/* Bottom: Submit on last question */}
      {isLastQuestion && hasAnswer && (
        <View style={styles.bottomBar}>
          <Pressable style={styles.submitBtn} onPress={handleSubmit}>
            <Text style={styles.submitBtnText}>Analisar meu perfil</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '600',
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  loadingSubtext: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginTop: spacing.sm,
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
  headerBtn: {
    color: colors.primaryLight,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  headerCount: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },

  // Progress
  progressContainer: {
    height: layout.progressBarSm,
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },

  // Block Label
  blockLabel: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  blockLabelText: {
    color: colors.primaryLight,
    fontSize: fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // Question
  questionContainer: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  questionText: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '700',
    lineHeight: 32,
  },
  questionSubtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
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
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  optionCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colorAlpha.primary10,
  },
  optionEmoji: {
    fontSize: fontSize.xl,
  },
  optionLabel: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '500',
  },
  optionLabelSelected: {
    color: colors.primaryLight,
    fontWeight: '700',
  },
  checkMark: {
    color: colors.primary,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },

  // Swipe
  swipeContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  swipeCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
  },
  swipeCardLeft: {},
  swipeCardRight: {},
  swipeCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colorAlpha.primary10,
  },
  swipeLabel: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 22,
  },
  swipeLabelSelected: {
    color: colors.primaryLight,
  },

  // Slider
  sliderContainer: {
    paddingVertical: spacing.lg,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sliderLabelText: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    maxWidth: '45%',
  },
  sliderTrack: {
    height: layout.progressBarLg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xs,
    position: 'relative',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xs,
  },
  sliderThumb: {
    position: 'absolute',
    top: -10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    marginLeft: -14,
    borderWidth: 3,
    borderColor: colors.text,
  },
  sliderValueText: {
    color: colors.text,
    fontSize: fontSize.xxl,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: spacing.lg,
  },

  // Grid
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  gridItem: {
    width: (SCREEN_WIDTH - spacing.md * 2 - spacing.sm * 2) / 3,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  gridItemSelected: {
    borderColor: colors.primary,
    backgroundColor: colorAlpha.primary10,
  },
  gridEmoji: {
    fontSize: fontSize['2xl'],
    marginBottom: spacing.xs,
  },
  gridLabel: {
    color: colors.text,
    fontSize: fontSize.xs,
    fontWeight: '500',
    textAlign: 'center',
  },
  gridLabelSelected: {
    color: colors.primaryLight,
    fontWeight: '700',
  },

  // Confirm button
  confirmBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    height: layout.buttonHeight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  confirmBtnText: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '700',
  },

  // Bottom bar
  bottomBar: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    height: layout.buttonHeightLg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
});
