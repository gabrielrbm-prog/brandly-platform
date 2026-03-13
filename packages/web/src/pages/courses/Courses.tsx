import { useEffect, useState, useCallback } from 'react';
import { BookOpen, CheckCircle, Play, Lock } from 'lucide-react';
import { coursesApi } from '@/lib/api';
import PageContainer from '@/components/layout/PageContainer';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import ProgressBar from '@/components/ui/ProgressBar';
import { SkeletonCard } from '@/components/ui/Skeleton';

interface Course { id: string; title: string; description: string; lessonsCount: number; completedLessons: number }
interface Lesson { id: string; title: string; duration: string; completed: boolean; locked: boolean }

export default function Courses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCourses = useCallback(async () => {
    try {
      const result = (await coursesApi.list()) as Course[];
      setCourses(result);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  async function selectCourse(course: Course) {
    setSelectedCourse(course);
    try {
      const result = (await coursesApi.lessons(course.id)) as Lesson[];
      setLessons(result);
    } catch { /* silent */ }
  }

  async function completeLesson(id: string) {
    try {
      await coursesApi.completeLesson(id);
      if (selectedCourse) selectCourse(selectedCourse);
      fetchCourses();
    } catch { /* silent */ }
  }

  if (loading) return <PageContainer title="Formacao"><div className="space-y-4"><SkeletonCard /><SkeletonCard /></div></PageContainer>;

  return (
    <PageContainer title="Formacao">
      <div className="space-y-6">
        {!selectedCourse ? (
          <>
            {courses.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8 text-gray-500" />
                </div>
                <p className="text-lg font-bold text-white mb-1">Nenhum curso disponivel</p>
                <p className="text-sm text-gray-400">Em breve novos cursos serao adicionados.</p>
              </div>
            ) : (
              courses.map((c) => {
                const pct = c.lessonsCount > 0 ? (c.completedLessons / c.lessonsCount) * 100 : 0;
                return (
                  <button key={c.id} onClick={() => selectCourse(c)} className="w-full text-left">
                    <Card>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-5 h-5 text-brand-primary-light" />
                          <h3 className="text-sm font-semibold text-white">{c.title}</h3>
                        </div>
                        <Badge variant={pct === 100 ? 'success' : 'primary'}>
                          {c.completedLessons}/{c.lessonsCount}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mb-3">{c.description}</p>
                      <ProgressBar value={pct} color={pct === 100 ? '#10B981' : '#7C3AED'} />
                    </Card>
                  </button>
                );
              })
            )}
          </>
        ) : (
          <>
            <button onClick={() => setSelectedCourse(null)} className="text-sm text-brand-primary-light hover:underline">
              &larr; Voltar
            </button>
            <h2 className="text-xl font-bold text-white">{selectedCourse.title}</h2>
            <div className="space-y-2">
              {lessons.map((l) => (
                <div key={l.id} className={`flex items-center gap-3 bg-surface rounded-xl border border-gray-800 p-3 ${l.locked ? 'opacity-50' : ''}`}>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    l.completed ? 'bg-emerald-500/10' : l.locked ? 'bg-gray-800' : 'bg-brand-primary/10'
                  }`}>
                    {l.completed ? <CheckCircle className="w-4 h-4 text-emerald-400" /> :
                     l.locked ? <Lock className="w-4 h-4 text-gray-500" /> :
                     <Play className="w-4 h-4 text-brand-primary-light" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{l.title}</p>
                    <p className="text-xs text-gray-500">{l.duration}</p>
                  </div>
                  {!l.completed && !l.locked && (
                    <button
                      onClick={() => completeLesson(l.id)}
                      className="text-xs text-brand-primary-light hover:underline"
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
