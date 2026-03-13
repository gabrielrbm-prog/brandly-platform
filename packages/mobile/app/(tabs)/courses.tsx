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
import { coursesApi } from '@/lib/api';
import { borderRadius, colors, fontSize, spacing } from '@/lib/theme';

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
      // Atualizar estado local
      setLessons(prev => prev.map(l => l.id === lessonId ? { ...l, completed: true } : l));
      // Atualizar progresso dos cursos
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
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const progressNum = parseInt(totalProgress);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Overall Progress */}
      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Formacao Creator</Text>
          <Text style={styles.progressPercent}>{totalProgress}</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: totalProgress }]} />
        </View>
        {progressNum === 100 && (
          <View style={styles.certificateBanner}>
            <Text style={styles.certificateText}>{'🎉'} Certificado disponivel!</Text>
          </View>
        )}
      </View>

      {/* Courses List */}
      {courses.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyEmoji}>{'📚'}</Text>
          <Text style={styles.emptyText}>Nenhum modulo disponivel ainda</Text>
          <Text style={styles.emptySubtext}>Em breve novos conteudos serao publicados</Text>
        </View>
      ) : (
        courses.map((course, index) => {
          const isOpen = selectedCourse === course.id;
          const coursePct = parseInt(course.progress);
          return (
            <View key={course.id}>
              <Pressable style={styles.courseCard} onPress={() => loadLessons(course.id)}>
                <View style={styles.courseHeader}>
                  <View style={styles.courseOrderBadge}>
                    <Text style={styles.courseOrderText}>{index + 1}</Text>
                  </View>
                  <View style={styles.courseInfo}>
                    <Text style={styles.courseTitle}>{course.title}</Text>
                    {course.description && (
                      <Text style={styles.courseDescription} numberOfLines={2}>{course.description}</Text>
                    )}
                    <View style={styles.courseMeta}>
                      <Text style={styles.courseMetaText}>
                        {course.completedLessons}/{course.totalLessons} aulas
                      </Text>
                      <Text style={[
                        styles.courseProgress,
                        coursePct === 100 && { color: colors.success },
                      ]}>{course.progress}</Text>
                    </View>
                  </View>
                  <Text style={styles.courseArrow}>{isOpen ? '▼' : '▶'}</Text>
                </View>
                <View style={styles.courseProgressTrack}>
                  <View style={[
                    styles.courseProgressFill,
                    { width: course.progress },
                    coursePct === 100 && { backgroundColor: colors.success },
                  ]} />
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
                        <View style={[styles.lessonCheck, lesson.completed && styles.lessonCheckCompleted]}>
                          {lesson.completed && <Text style={styles.lessonCheckMark}>{'✓'}</Text>}
                        </View>
                        <View style={styles.lessonInfo}>
                          <Text style={[styles.lessonTitle, lesson.completed && styles.lessonTitleCompleted]}>
                            {lesson.title}
                          </Text>
                          {lesson.duration && (
                            <Text style={styles.lessonDuration}>{formatDuration(lesson.duration)}</Text>
                          )}
                        </View>
                        {!lesson.completed && (
                          <Pressable
                            style={styles.completeBtn}
                            onPress={() => handleComplete(lesson.id)}
                            disabled={completing === lesson.id}
                          >
                            {completing === lesson.id ? (
                              <ActivityIndicator size="small" color={colors.text} />
                            ) : (
                              <Text style={styles.completeBtnText}>Concluir</Text>
                            )}
                          </Pressable>
                        )}
                      </View>
                    ))
                  )}
                </View>
              )}
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.md },
  center: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },

  // Progress Card
  progressCard: {
    backgroundColor: colors.primary + '1A',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    padding: spacing.lg,
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  progressTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700' },
  progressPercent: { color: colors.primaryLight, fontSize: fontSize.xl, fontWeight: '800' },
  progressTrack: { height: 8, backgroundColor: colors.surface, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 4 },
  certificateBanner: { marginTop: spacing.sm, alignItems: 'center' },
  certificateText: { color: colors.success, fontSize: fontSize.sm, fontWeight: '700' },

  // Empty
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyEmoji: { fontSize: 48, marginBottom: spacing.md },
  emptyText: { color: colors.text, fontSize: fontSize.lg, fontWeight: '600' },
  emptySubtext: { color: colors.textSecondary, fontSize: fontSize.sm, marginTop: spacing.xs },

  // Course Card
  courseCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  courseHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  courseOrderBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary + '33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  courseOrderText: { color: colors.primaryLight, fontSize: fontSize.sm, fontWeight: '700' },
  courseInfo: { flex: 1 },
  courseTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: '600' },
  courseDescription: { color: colors.textSecondary, fontSize: fontSize.xs, marginTop: 2 },
  courseMeta: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  courseMetaText: { color: colors.textMuted, fontSize: fontSize.xs },
  courseProgress: { color: colors.primaryLight, fontSize: fontSize.xs, fontWeight: '600' },
  courseArrow: { color: colors.textMuted, fontSize: fontSize.sm },
  courseProgressTrack: { height: 4, backgroundColor: colors.surfaceLight, borderRadius: 2, marginTop: spacing.sm, overflow: 'hidden' },
  courseProgressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 2 },

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
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lessonCheckCompleted: { backgroundColor: colors.success, borderColor: colors.success },
  lessonCheckMark: { color: colors.text, fontSize: 12, fontWeight: '700' },
  lessonInfo: { flex: 1 },
  lessonTitle: { color: colors.text, fontSize: fontSize.sm, fontWeight: '500' },
  lessonTitleCompleted: { color: colors.textMuted, textDecorationLine: 'line-through' },
  lessonDuration: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 2 },
  completeBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minWidth: 70,
    alignItems: 'center',
  },
  completeBtnText: { color: colors.text, fontSize: fontSize.xs, fontWeight: '600' },
});
