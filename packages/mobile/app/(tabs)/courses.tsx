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
  colorAlpha,
  colors,
  fontSize,
  fontWeight as fw,
  layout,
  shadows,
  spacing,
} from '@/lib/theme';
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
      <View style={[styles.container, { padding: spacing.md, gap: spacing.md }]}>
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
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Hero Progress Card */}
      <AnimatedListItem index={0}>
      <LinearGradient
        colors={['#1E1040', '#121212']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        {/* Glow blob */}
        <View style={styles.heroGlow} />

        <View style={styles.heroTop}>
          <View style={styles.heroIconWrap}>
            <Feather name="book-open" size={22} color={colors.primaryLight} />
          </View>
          <Text style={styles.heroLabel}>FORMACAO CREATOR</Text>
        </View>

        {/* Big percentage */}
        <Text style={styles.heroPercent}>{totalProgress}</Text>

        {/* Progress bar with gradient fill */}
        <View style={styles.heroTrack}>
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
            <Text style={styles.heroStatValue}>{courses.length}</Text>
            <Text style={styles.heroStatLabel}>modulos</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStat}>
            <Feather name="play-circle" size={14} color={colors.textSecondary} />
            <Text style={styles.heroStatValue}>{completedLessons}/{totalLessons}</Text>
            <Text style={styles.heroStatLabel}>aulas</Text>
          </View>
          {progressNum === 100 && (
            <>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStat}>
                <Feather name="award" size={14} color={colors.accent} />
                <Text style={[styles.heroStatValue, { color: colors.accent }]}>Completo</Text>
              </View>
            </>
          )}
        </View>

        {progressNum === 100 && (
          <View style={styles.certificateBanner}>
            <Feather name="award" size={16} color={colors.accent} />
            <Text style={styles.certificateText}>Certificado disponivel!</Text>
          </View>
        )}
      </LinearGradient>
      </AnimatedListItem>

      {/* Courses List */}
      {courses.length === 0 ? (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconWrap}>
            <Feather name="book" size={28} color={colors.primary} />
          </View>
          <Text style={styles.emptyText}>Nenhum modulo disponivel ainda</Text>
          <Text style={styles.emptySubtext}>Em breve novos conteudos serao publicados</Text>
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
                style={({ pressed }) => [styles.courseCard, pressed && styles.courseCardPressed]}
                onPress={() => loadLessons(course.id)}
              >
                <View style={styles.courseHeader}>
                  {/* Module number badge */}
                  {isComplete ? (
                    <LinearGradient
                      colors={[colors.success, colors.successLight]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.courseOrderBadge}
                    >
                      <Feather name="check" size={14} color={colors.background} />
                    </LinearGradient>
                  ) : (
                    <LinearGradient
                      colors={[colors.primary, colors.primaryDark]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.courseOrderBadge}
                    >
                      <Text style={styles.courseOrderText}>{index + 1}</Text>
                    </LinearGradient>
                  )}

                  <View style={styles.courseInfo}>
                    <Text style={styles.courseTitle}>{course.title}</Text>
                    {course.description && (
                      <Text style={styles.courseDescription} numberOfLines={2}>{course.description}</Text>
                    )}
                    <View style={styles.courseMeta}>
                      <View style={styles.courseMetaItem}>
                        <Feather name="play-circle" size={11} color={colors.textMuted} />
                        <Text style={styles.courseMetaText}>
                          {course.completedLessons}/{course.totalLessons} aulas
                        </Text>
                      </View>
                      <Text style={[
                        styles.courseProgressLabel,
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
                <View style={styles.courseProgressTrack}>
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
                <View style={styles.lessonsContainer}>
                  {lessonsLoading ? (
                    <ActivityIndicator size="small" color={colors.primary} style={{ padding: spacing.md }} />
                  ) : (
                    lessons.map((lesson, li) => (
                      <View key={lesson.id} style={[styles.lessonRow, li < lessons.length - 1 && styles.lessonBorder]}>
                        {/* Check circle */}
                        <View style={[
                          styles.lessonCheck,
                          lesson.completed && styles.lessonCheckCompleted,
                        ]}>
                          {lesson.completed ? (
                            <Feather name="check" size={12} color={colors.background} />
                          ) : (
                            <Text style={styles.lessonNumber}>{li + 1}</Text>
                          )}
                        </View>

                        <View style={styles.lessonInfo}>
                          <Text style={[styles.lessonTitle, lesson.completed && styles.lessonTitleCompleted]}>
                            {lesson.title}
                          </Text>
                          {lesson.duration && (
                            <View style={styles.lessonDurationRow}>
                              <Feather name="clock" size={10} color={colors.textMuted} />
                              <Text style={styles.lessonDuration}>{formatDuration(lesson.duration)}</Text>
                            </View>
                          )}
                        </View>

                        {!lesson.completed && (
                          <Pressable
                            style={({ pressed }) => [styles.completeBtn, pressed && styles.completeBtnPressed]}
                            onPress={() => handleComplete(lesson.id)}
                            disabled={completing === lesson.id}
                          >
                            {completing === lesson.id ? (
                              <ActivityIndicator size="small" color={colors.text} />
                            ) : (
                              <>
                                <Feather name="check-circle" size={12} color={colors.text} />
                                <Text style={styles.completeBtnText}>Concluir</Text>
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
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.md },

  // Hero Progress Card
  heroCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colorAlpha.primary30,
    padding: spacing.lg,
    overflow: 'hidden',
    ...shadows.glowPrimarySubtle,
  },
  heroGlow: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colorAlpha.primary25,
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
    backgroundColor: colorAlpha.primary20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    fontWeight: fw.bold,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  heroPercent: {
    color: colors.text,
    fontSize: fontSize['4xl'],
    fontWeight: fw.extrabold,
    marginBottom: spacing.sm,
  },
  heroTrack: {
    height: layout.progressBarLg,
    backgroundColor: colorAlpha.white10,
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
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: fw.bold,
  },
  heroStatLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
  },
  heroStatDivider: {
    width: 1,
    height: 16,
    backgroundColor: colorAlpha.muted30,
  },
  certificateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colorAlpha.accent20,
  },
  certificateText: {
    color: colors.accent,
    fontSize: fontSize.sm,
    fontWeight: fw.bold,
  },

  // Empty
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
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
    backgroundColor: colorAlpha.primary15,
    borderColor: colorAlpha.primary30,
  },
  emptyText: { color: colors.text, fontSize: fontSize.md, fontWeight: fw.semibold, textAlign: 'center' },
  emptySubtext: { color: colors.textSecondary, fontSize: fontSize.sm, textAlign: 'center', lineHeight: 20 },

  // Course Card
  courseCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.sm,
  },
  courseCardPressed: {
    backgroundColor: colors.surfaceLight,
  },
  courseHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  courseOrderBadge: {
    width: layout.avatarSm,
    height: layout.avatarSm,
    borderRadius: layout.avatarSm / 2,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  courseOrderText: { color: colors.text, fontSize: fontSize.sm, fontWeight: fw.bold },
  courseInfo: { flex: 1 },
  courseTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: fw.semibold },
  courseDescription: { color: colors.textSecondary, fontSize: fontSize.xs, marginTop: 2 },
  courseMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  courseMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  courseMetaText: { color: colors.textMuted, fontSize: fontSize.xs },
  courseProgressLabel: { color: colors.primaryLight, fontSize: fontSize.xs, fontWeight: fw.semibold },
  courseProgressTrack: {
    height: layout.progressBarSm,
    backgroundColor: colorAlpha.white10,
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
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
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
  lessonBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  lessonCheck: {
    width: layout.iconMd,
    height: layout.iconMd,
    borderRadius: layout.iconMd / 2,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lessonCheckCompleted: {
    backgroundColor: colors.success,
    borderColor: colors.success,
    ...shadows.glowSuccess,
  },
  lessonNumber: { color: colors.textMuted, fontSize: 10, fontWeight: fw.semibold },
  lessonInfo: { flex: 1 },
  lessonTitle: { color: colors.text, fontSize: fontSize.sm, fontWeight: fw.medium },
  lessonTitleCompleted: { color: colors.textMuted, textDecorationLine: 'line-through' },
  lessonDurationRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  lessonDuration: { color: colors.textMuted, fontSize: fontSize.xs },
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minWidth: 80,
    justifyContent: 'center',
  },
  completeBtnPressed: {
    backgroundColor: colors.primaryDark,
  },
  completeBtnText: { color: colors.text, fontSize: fontSize.xs, fontWeight: fw.semibold },
});
