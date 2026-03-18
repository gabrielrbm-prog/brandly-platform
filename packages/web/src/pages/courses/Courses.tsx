import { useEffect, useState, useCallback } from 'react';
import { BookOpen, CheckCircle, Play, Lock, ArrowLeft, GraduationCap } from 'lucide-react';
import { coursesApi } from '@/lib/api';
import PageContainer from '@/components/layout/PageContainer';
import CourseCard from '@/components/ui/CourseCard';
import Badge from '@/components/ui/Badge';
import { SkeletonCard } from '@/components/ui/Skeleton';

interface Course { id: string; title: string; description: string; totalLessons: number; completedLessons: number; progress: string }
interface Lesson { id: string; title: string; duration: string; completed: boolean; locked: boolean }

const COURSE_COLORS = ['purple', 'amber', 'emerald', 'blue', 'pink'] as const;

export default function Courses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCourses = useCallback(async () => {
    try {
      const res = (await coursesApi.list()) as { courses: Course[]; totalProgress: string; certificateAvailable: boolean };
      setCourses(res.courses ?? []);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  async function selectCourse(course: Course) {
    setSelectedCourse(course);
    try {
      const res = (await coursesApi.lessons(course.id)) as { courseId: string; lessons: Lesson[]; progress: string };
      setLessons(res.lessons ?? []);
    } catch { /* silent */ }
  }

  async function completeLesson(id: string) {
    try {
      await coursesApi.completeLesson(id);
      if (selectedCourse) selectCourse(selectedCourse);
      fetchCourses();
    } catch { /* silent */ }
  }

  if (loading) return (
    <PageContainer title="Formacao">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
      </div>
    </PageContainer>
  );

  return (
    <PageContainer title="Formacao">
      <div className="space-y-6">
        {!selectedCourse ? (
          <>
            {courses.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 rounded-2xl bg-brand-primary/10 flex items-center justify-center mx-auto mb-4">
                  <GraduationCap className="w-10 h-10 text-brand-primary-light" />
                </div>
                <p className="text-xl font-bold themed-text mb-2">Nenhum curso disponivel</p>
                <p className="text-sm themed-text-secondary max-w-xs mx-auto">Em breve novos cursos serao adicionados a plataforma.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {courses.map((c, i) => {
                  const pct = c.totalLessons > 0 ? (c.completedLessons / c.totalLessons) * 100 : 0;
                  return (
                    <CourseCard
                      key={c.id}
                      title={c.title}
                      description={c.description}
                      progress={pct}
                      lessonsCount={c.totalLessons}
                      completedLessons={c.completedLessons}
                      color={COURSE_COLORS[i % COURSE_COLORS.length]}
                      icon={<BookOpen className="w-4 h-4" style={{ color: ['#7C3AED', '#F59E0B', '#10B981', '#3B82F6', '#EC4899'][i % 5] }} />}
                      timeLeft={pct >= 100 ? 'Completo' : `${c.totalLessons - c.completedLessons} restantes`}
                      onClick={() => selectCourse(c)}
                    />
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <>
            <button
              onClick={() => setSelectedCourse(null)}
              className="inline-flex items-center gap-2 text-sm text-brand-primary-light hover:underline transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar aos cursos
            </button>

            <div className="themed-surface rounded-2xl border themed-border p-5 md:p-6">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-brand-primary-light" />
                </div>
                <div>
                  <h2 className="text-xl font-bold themed-text">{selectedCourse.title}</h2>
                  <p className="text-sm themed-text-secondary">{selectedCourse.description}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {lessons.map((l, i) => (
                <div
                  key={l.id}
                  className={`
                    flex items-center gap-3 themed-surface rounded-xl border themed-border p-3 md:p-4
                    transition-all duration-200
                    ${l.locked ? 'opacity-50' : 'hover:themed-surface-light'}
                  `}
                >
                  <div className="flex items-center justify-center w-7 h-7 rounded-full themed-surface-light text-xs font-bold themed-text-muted">
                    {i + 1}
                  </div>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    l.completed ? 'bg-emerald-500/10' : l.locked ? 'themed-surface-light' : 'bg-brand-primary/10'
                  }`}>
                    {l.completed ? <CheckCircle className="w-4 h-4 text-emerald-500 dark:text-emerald-400" /> :
                     l.locked ? <Lock className="w-4 h-4 themed-text-muted" /> :
                     <Play className="w-4 h-4 text-brand-primary-light" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium themed-text truncate">{l.title}</p>
                    <p className="text-xs themed-text-muted">{l.duration}</p>
                  </div>
                  {l.completed ? (
                    <Badge variant="success">Concluido</Badge>
                  ) : !l.locked && (
                    <button
                      onClick={() => completeLesson(l.id)}
                      className="text-xs font-semibold text-brand-primary-light hover:underline shrink-0"
                    >
                      Concluir
                    </button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </PageContainer>
  );
}
