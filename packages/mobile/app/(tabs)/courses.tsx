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
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { coursesApi } from '@/lib/api';
import {
  borderRadius,
  fontSize,
  fontWeight as fw,
  layout,
  spacing,
} from '@/lib/theme';
import { useTheme } from '@/contexts/ThemeContext';
import AnimatedListItem from '@/components/AnimatedList';
import { SkeletonCard } from '@/components/Skeleton';

interface Course {
  id: string;
  title: string;
  description: string | null;
  orderIndex: number;
  totalLessons: number;
  completedLessons: number;
  progress: string;
}

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string | null;
  duration: number | null;
  orderIndex: number;
  completed: boolean;
}

export default function CoursesScreen() {
  const { colors, colorAlpha, shadows } = useTheme();

  const [courses, setCourses] = useState<Course[]>([]);
  const [totalProgress, setTotalProgress] = useState('0%');
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [completing, setCompleting] = useState<string | null>(null);

  const fetchCourses = useCallback(async () => {
    try {
      const res = await coursesApi.list() as {
        courses: Course[];
        totalProgress: string;
      };
      setCourses(res.courses);
      setTotalProgress(res.totalProgress);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setSelectedCourse(null);
    fetchCourses();
  }, [fetchCourses]);

  const loadLessons = useCallback(async (courseId: string) => {
    if (selectedCourse === courseId) {
      setSelectedCourse(null);
      return;
    }
    setSelectedCourse(courseId);
    setLessonsLoading(true);
    try {
      const res = await coursesApi.lessons(courseId) as { lessons: Lesson[] };
      setLessons(res.lessons);
    } catch {
      // silently fail
    } finally {
      setLessonsLoading(false);
    }
  }, [selectedCourse]);

  const handleComplete = useCallback(async (lessonId: string) => {
    setCompleting(lessonId);
    try {
      await coursesApi.completeLesson(lessonId);
      setLessons(prev => prev.map(l => l.id === lessonId ? { ...l, completed: true } : l));
      fetchCourses();
    } catch {
      // silently fail
    } finally {
      setCompleting(null);
    }
  }, [fetchCourses]);

  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return '';
    const min = Math.floor(seconds / 60);
    return `${min} min`;
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, padding: spacing.md, gap: spacing.md }]}>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </View>
    );
  }

  const progressNum = parseInt(totalProgress);
  const totalLessons = courses.reduce((s, c) => s + c.totalLessons, 0);
  const completedLessons = courses.reduce((s, c) => s + c.completedLessons, 0);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Hero Progress Card */}
      <AnimatedListItem index={0}>
      <LinearGradient
        colors={['#1E1040', '#121212']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.heroCard, { borderColor: colorAlpha.primary30, ...shadows.glowPrimarySubtle }]}
      >
        {/* Glow blob */}
        <View style={[styles.heroGlow, { backgroundColor: colorAlpha.primary25 }]} />

        <View style={styles.heroTop}>
          <View style={[styles.heroIconWrap, { backgroundColor: colorAlpha.primary20 }]}>
            <Feather name="book-open" size={22} color={colors.primaryLight} />
          </View>
          <Text style={[styles.heroLabel, { color: colors.textSecondary }]}>FORMACAO CREATOR</Text>
        </View>

        {/* Big percentage */}
        <Text style={[styles.heroPercent, { color: colors.text }]}>{totalProgress}</Text>

        {/* Progress bar with gradient fill */}
        <View style={[styles.heroTrack, { backgroundColor: colorAlpha.white10 }]}>
          <LinearGradient
            colors={[colors.primary, colors.primaryLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.heroFill, { width: totalProgress as any }]}
          />
        </View>

        {/* Stats row */}
        <View style={styles.heroStats}>
          <View style={styles.heroStat}>
            <Feather name="layers" size={14} color={colors.textSecondary} />
            <Text style={[styles.heroStatValue, { color: colors.text }]}>{courses.length}</Text>
            <Text style={[styles.heroStatLabel, { color: colors.textSecondary }]}>modulos</Text>
          </View>
          <View style={[styles.heroStatDivider, { backgroundColor: colorAlpha.muted30 }]} />
          <View style={styles.heroStat}>
            <Feather name="play-circle" size={14} color={colors.textSecondary} />
            <Text style={[styles.heroStatValue, { color: colors.text }]}>{completedLessons}/{totalLessons}</Text>
            <Text style={[styles.heroStatLabel, { color: colors.textSecondary }]}>aulas</Text>
          </View>
          {progressNum === 100 && (
            <>
              <View style={[styles.heroStatDivider, { backgroundColor: colorAlpha.muted30 }]} />
              <View style={styles.heroStat}>
                <Feather name="award" size={14} color={colors.accent} />
                <Text style={[styles.heroStatValue, { color: colors.accent }]}>Completo</Text>
              </View>
            </>
          )}
        </View>

        {progressNum === 100 && (
          <View style={[styles.certificateBanner, { borderTopColor: colorAlpha.accent20 }]}>
            <Feather name="award" size={16} color={colors.accent} />
            <Text style={[styles.certificateText, { color: colors.accent }]}>Certificado disponivel!</Text>
          </View>
        )}
      </LinearGradient>
      </AnimatedListItem>

      {/* Courses List */}
      {courses.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.emptyIconWrap, { backgroundColor: colorAlpha.primary15, borderColor: colorAlpha.primary30 }]}>
            <Feather name="book" size={28} color={colors.primary} />
          </View>
          <Text style={[styles.emptyText, { color: colors.text }]}>Nenhum modulo disponivel ainda</Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>Em breve novos conteudos serao publicados</Text>
        </View>
      ) : (
        courses.map((course, index) => {
          const isOpen = selectedCourse === course.id;
          const coursePct = parseInt(course.progress);
          const isComplete = coursePct === 100;
          return (
            <AnimatedListItem key={course.id} index={index + 1}>
            <View>
              <Pressable
                style={({ pressed }) => [
                  styles.courseCard,
                  { backgroundColor: colors.surface, borderColor: colors.border, ...shadows.sm },
                  pressed && { backgroundColor: colors.surfaceLight },
                ]}
                onPress={() => loadLessons(course.id)}
              >
                <View style={styles.courseHeader}>
                  {/* Module number badge */}
                  {isComplete ? (
                    <LinearGradient
                      colors={[colors.success, colors.successLight]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[styles.courseOrderBadge, shadows.sm]}
                    >
                      <Feather name="check" size={14} color={colors.background} />
                    </LinearGradient>
                  ) : (
                    <LinearGradient
                      colors={[colors.primary, colors.primaryDark]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[styles.courseOrderBadge, shadows.sm]}
                    >
                      <Text style={[styles.courseOrderText, { color: colors.text }]}>{index + 1}</Text>
                    </LinearGradient>
                  )}

                  <View style={styles.courseInfo}>
                    <Text style={[styles.courseTitle, { color: colors.text }]}>{course.title}</Text>
                    {course.description && (
                      <Text style={[styles.courseDescription, { color: colors.textSecondary }]} numberOfLines={2}>{course.description}</Text>
                    )}
                    <View style={styles.courseMeta}>
                      <View style={styles.courseMetaItem}>
                        <Feather name="play-circle" size={11} color={colors.textMuted} />
                        <Text style={[styles.courseMetaText, { color: colors.textMuted }]}>
                          {course.completedLessons}/{course.totalLessons} aulas
                        </Text>
                      </View>
                      <Text style={[
                        styles.courseProgressLabel,
                        { color: colors.primaryLight },
                        isComplete && { color: colors.success },
                      ]}>{course.progress}</Text>
                    </View>
                  </View>

                  <Feather
                    name={isOpen ? 'chevron-down' : 'chevron-right'}
                    size={18}
                    color={colors.textMuted}
                  />
                </View>

                {/* Mini progress bar */}
                <View style={[styles.courseProgressTrack, { backgroundColor: colorAlpha.white10 }]}>
                  <LinearGradient
                    colors={isComplete ? [colors.success, colors.successLight] : [colors.primary, colors.primaryLight]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.courseProgressFill, { width: course.progress as any }]}
                  />
                </View>
              </Pressable>

              {/* Lessons */}
              {isOpen && (
                <View style={[styles.lessonsContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  {lessonsLoading ? (
                    <ActivityIndicator size="small" color={colors.primary} style={{ padding: spacing.md }} />
                  ) : (
                    lessons.map((lesson, li) => (
                      <View
                        key={lesson.id}
                        style={[
                          styles.lessonRow,
                          li < lessons.length - 1 && styles.lessonBorder,
                          li < lessons.length - 1 && { borderBottomColor: colors.border },
                        ]}
                      >
                        {/* Check circle */}
                        <View style={[
                          styles.lessonCheck,
                          { borderColor: colors.border },
                          lesson.completed && {
                            backgroundColor: colors.success,
                            borderColor: colors.success,
                            ...shadows.glowSuccess,
                          },
                        ]}>
                          {lesson.completed ? (
                            <Feather name="check" size={12} color={colors.background} />
                          ) : (
                            <Text style={[styles.lessonNumber, { color: colors.textMuted }]}>{li + 1}</Text>
                          )}
                        </View>

                        <View style={styles.lessonInfo}>
                          <Text style={[
                            styles.lessonTitle,
                            { color: colors.text },
                            lesson.completed && { color: colors.textMuted, textDecorationLine: 'line-through' },
                          ]}>
                            {lesson.title}
                          </Text>
                          {lesson.duration && (
                            <View style={styles.lessonDurationRow}>
                              <Feather name="clock" size={10} color={colors.textMuted} />
                              <Text style={[styles.lessonDuration, { color: colors.textMuted }]}>{formatDuration(lesson.duration)}</Text>
                            </View>
                          )}
                        </View>

                        {!lesson.completed && (
                          <Pressable
                            style={({ pressed }) => [
                              styles.completeBtn,
                              { backgroundColor: colors.primary },
                              pressed && { backgroundColor: colors.primaryDark },
                            ]}
                            onPress={() => handleComplete(lesson.id)}
                            disabled={completing === lesson.id}
                          >
                            {completing === lesson.id ? (
                              <ActivityIndicator size="small" color={colors.text} />
                            ) : (
                              <>
                                <Feather name="check-circle" size={12} color={colors.text} />
                                <Text style={[styles.completeBtnText, { color: colors.text }]}>Concluir</Text>
                              </>
                            )}
                          </Pressable>
                        )}
                      </View>
                    ))
                  )}
                </View>
              )}
            </View>
            </AnimatedListItem>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.md },

  // Hero Progress Card
  heroCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  heroIconWrap: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLabel: {
    fontSize: fontSize.xs,
    fontWeight: fw.bold,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  heroPercent: {
    fontSize: fontSize['4xl'],
    fontWeight: fw.extrabold,
    marginBottom: spacing.sm,
  },
  heroTrack: {
    height: layout.progressBarLg,
    borderRadius: borderRadius.xs,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  heroFill: {
    height: '100%',
    borderRadius: borderRadius.xs,
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  heroStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  heroStatValue: {
    fontSize: fontSize.sm,
    fontWeight: fw.bold,
  },
  heroStatLabel: {
    fontSize: fontSize.xs,
  },
  heroStatDivider: {
    width: 1,
    height: 16,
  },
  certificateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
  },
  certificateText: {
    fontSize: fontSize.sm,
    fontWeight: fw.bold,
  },

  // Empty
  emptyCard: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  emptyIconWrap: {
    width: 68,
    height: 68,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  emptyText: { fontSize: fontSize.md, fontWeight: fw.semibold, textAlign: 'center' },
  emptySubtext: { fontSize: fontSize.sm, textAlign: 'center', lineHeight: 20 },

  // Course Card
  courseCard: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  courseHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  courseOrderBadge: {
    width: layout.avatarSm,
    height: layout.avatarSm,
    borderRadius: layout.avatarSm / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  courseOrderText: { fontSize: fontSize.sm, fontWeight: fw.bold },
  courseInfo: { flex: 1 },
  courseTitle: { fontSize: fontSize.md, fontWeight: fw.semibold },
  courseDescription: { fontSize: fontSize.xs, marginTop: 2 },
  courseMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  courseMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  courseMetaText: { fontSize: fontSize.xs },
  courseProgressLabel: { fontSize: fontSize.xs, fontWeight: fw.semibold },
  courseProgressTrack: {
    height: layout.progressBarSm,
    borderRadius: 2,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  courseProgressFill: {
    height: '100%',
    borderRadius: 2,
  },

  // Lessons
  lessonsContainer: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderTopWidth: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    paddingHorizontal: spacing.md,
  },
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  lessonBorder: { borderBottomWidth: 1 },
  lessonCheck: {
    width: layout.iconMd,
    height: layout.iconMd,
    borderRadius: layout.iconMd / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lessonNumber: { fontSize: 10, fontWeight: fw.semibold },
  lessonInfo: { flex: 1 },
  lessonTitle: { fontSize: fontSize.sm, fontWeight: fw.medium },
  lessonDurationRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  lessonDuration: { fontSize: fontSize.xs },
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minWidth: 80,
    justifyContent: 'center',
  },
  completeBtnText: { fontSize: fontSize.xs, fontWeight: fw.semibold },
});
