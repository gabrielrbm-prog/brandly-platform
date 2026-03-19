import { useEffect, useState, useCallback } from 'react';
import {
  GraduationCap,
  Plus,
  ChevronLeft,
  Eye,
  EyeOff,
  BookOpen,
  Users,
  BarChart2,
  X,
  Pencil,
  Clock,
  FileText,
  Video,
  HelpCircle,
} from 'lucide-react';
import { adminApi, type AdminCourse, type AdminLesson, type AdminCourseProgress } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import PageContainer from '@/components/layout/PageContainer';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { SkeletonCard } from '@/components/ui/Skeleton';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(d: string) {
  const date = new Date(d);
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
}

function formatDuration(minutes?: number): string {
  if (!minutes) return '—';
  if (minutes < 60) return `${minutes}min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

const CONTENT_TYPE_ICONS: Record<string, React.ReactNode> = {
  video: <Video className="w-3.5 h-3.5" />,
  text: <FileText className="w-3.5 h-3.5" />,
  quiz: <HelpCircle className="w-3.5 h-3.5" />,
};

const CONTENT_TYPE_LABELS: Record<string, string> = {
  video: 'Video',
  text: 'Texto',
  quiz: 'Quiz',
};

const CONTENT_TYPE_COLORS: Record<string, string> = {
  video: 'text-violet-400 bg-violet-500/10',
  text: 'text-blue-400 bg-blue-500/10',
  quiz: 'text-amber-400 bg-amber-500/10',
};

// ─── ProgressBar ──────────────────────────────────────────────────────────────

function ProgressBar({ value }: { value: number }) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full bg-gradient-to-r from-brand-primary to-violet-400 transition-all"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

// ─── Course Modal ─────────────────────────────────────────────────────────────

interface CourseFormData {
  title: string;
  description: string;
  thumbnailUrl: string;
}

const EMPTY_COURSE: CourseFormData = { title: '', description: '', thumbnailUrl: '' };

interface CourseModalProps {
  course?: AdminCourse | null;
  onClose: () => void;
  onSaved: () => void;
}

function CourseModal({ course, onClose, onSaved }: CourseModalProps) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CourseFormData>(() =>
    course
      ? {
          title: course.title,
          description: course.description ?? '',
          thumbnailUrl: course.thumbnailUrl ?? '',
        }
      : EMPTY_COURSE,
  );

  function handleChange(field: keyof CourseFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Titulo do curso e obrigatorio.');
      return;
    }
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      thumbnailUrl: form.thumbnailUrl.trim() || undefined,
    };
    setSaving(true);
    try {
      if (course) {
        await adminApi.updateCourse(course.id, payload);
        toast.success('Curso atualizado.');
      } else {
        await adminApi.createCourse(payload);
        toast.success('Curso criado com sucesso.');
      }
      onSaved();
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro ao salvar curso.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="themed-surface-card border themed-border rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b themed-border">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-brand-primary-light" />
            <h3 className="text-base font-bold themed-text">
              {course ? 'Editar Curso' : 'Novo Curso'}
            </h3>
          </div>
          <button onClick={onClose} className="themed-text-muted hover:themed-text transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <Input
            label="Titulo"
            placeholder="Ex: Formacao Creator Brandly"
            value={form.title}
            onChange={(e) => handleChange('title', e.target.value)}
            required
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium themed-text-secondary">Descricao</label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Descricao do curso..."
              rows={3}
              className="w-full rounded-xl border themed-border themed-surface px-3 py-2.5 text-sm themed-text placeholder:themed-text-muted focus:outline-none focus:border-brand-primary/50 transition-colors resize-none"
            />
          </div>
          <Input
            label="URL da Thumbnail"
            placeholder="https://..."
            value={form.thumbnailUrl}
            onChange={(e) => handleChange('thumbnailUrl', e.target.value)}
          />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button variant="primary" type="submit" loading={saving} className="flex-1">
              {course ? 'Salvar' : 'Criar Curso'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Lesson Modal ─────────────────────────────────────────────────────────────

interface LessonFormData {
  title: string;
  contentUrl: string;
  contentType: 'video' | 'text' | 'quiz';
  duration: string;
  orderIndex: string;
}

const EMPTY_LESSON: LessonFormData = {
  title: '',
  contentUrl: '',
  contentType: 'video',
  duration: '',
  orderIndex: '',
};

interface LessonModalProps {
  courseId: string;
  lesson?: AdminLesson | null;
  nextOrder?: number;
  onClose: () => void;
  onSaved: () => void;
}

function LessonModal({ courseId, lesson, nextOrder, onClose, onSaved }: LessonModalProps) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<LessonFormData>(() =>
    lesson
      ? {
          title: lesson.title,
          contentUrl: lesson.contentUrl ?? '',
          contentType: lesson.contentType,
          duration: lesson.duration?.toString() ?? '',
          orderIndex: lesson.orderIndex.toString(),
        }
      : { ...EMPTY_LESSON, orderIndex: (nextOrder ?? 1).toString() },
  );

  function handleChange(field: keyof LessonFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Titulo da licao e obrigatorio.');
      return;
    }
    const payload = {
      title: form.title.trim(),
      contentUrl: form.contentUrl.trim() || undefined,
      contentType: form.contentType,
      duration: form.duration ? parseInt(form.duration, 10) : undefined,
      orderIndex: form.orderIndex ? parseInt(form.orderIndex, 10) : 1,
    };
    setSaving(true);
    try {
      if (lesson) {
        await adminApi.updateLesson(lesson.id, payload);
        toast.success('Licao atualizada.');
      } else {
        await adminApi.createLesson(courseId, payload);
        toast.success('Licao criada.');
      }
      onSaved();
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro ao salvar licao.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="themed-surface-card border themed-border rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b themed-border">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-brand-primary-light" />
            <h3 className="text-base font-bold themed-text">
              {lesson ? 'Editar Licao' : 'Nova Licao'}
            </h3>
          </div>
          <button onClick={onClose} className="themed-text-muted hover:themed-text transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <Input
            label="Titulo"
            placeholder="Ex: Introducao ao UGC"
            value={form.title}
            onChange={(e) => handleChange('title', e.target.value)}
            required
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium themed-text-secondary">Tipo de conteudo</label>
            <select
              value={form.contentType}
              onChange={(e) => handleChange('contentType', e.target.value as LessonFormData['contentType'])}
              className="w-full rounded-xl border themed-border themed-surface px-3 py-2.5 text-sm themed-text focus:outline-none focus:border-brand-primary/50 transition-colors"
            >
              <option value="video">Video</option>
              <option value="text">Texto</option>
              <option value="quiz">Quiz</option>
            </select>
          </div>
          <Input
            label="URL do Conteudo"
            placeholder="https://..."
            value={form.contentUrl}
            onChange={(e) => handleChange('contentUrl', e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Duracao (minutos)"
              placeholder="Ex: 15"
              type="number"
              value={form.duration}
              onChange={(e) => handleChange('duration', e.target.value)}
            />
            <Input
              label="Ordem"
              placeholder="Ex: 1"
              type="number"
              value={form.orderIndex}
              onChange={(e) => handleChange('orderIndex', e.target.value)}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button variant="primary" type="submit" loading={saving} className="flex-1">
              {lesson ? 'Salvar' : 'Criar Licao'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Course Card ──────────────────────────────────────────────────────────────

interface CourseCardProps {
  course: AdminCourse;
  onToggle: (course: AdminCourse) => void;
  onEdit: (course: AdminCourse) => void;
  onClick: (course: AdminCourse) => void;
}

function CourseCard({ course, onToggle, onEdit, onClick }: CourseCardProps) {
  return (
    <div
      className="relative rounded-2xl border themed-border bg-white/5 backdrop-blur-sm overflow-hidden cursor-pointer hover:border-brand-primary/30 hover:bg-white/8 transition-all group"
      onClick={() => onClick(course)}
    >
      {/* Thumbnail strip */}
      {course.thumbnailUrl ? (
        <div className="h-32 overflow-hidden">
          <img
            src={course.thumbnailUrl}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      ) : (
        <div className="h-32 bg-gradient-to-br from-brand-primary/20 to-violet-600/10 flex items-center justify-center">
          <GraduationCap className="w-10 h-10 text-brand-primary/40" />
        </div>
      )}

      <div className="p-4">
        {/* Published badge */}
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-bold themed-text text-sm leading-snug flex-1 mr-2">{course.title}</h3>
          <span
            className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
              course.isPublished
                ? 'bg-emerald-500/15 text-emerald-400'
                : 'bg-white/8 themed-text-muted'
            }`}
          >
            {course.isPublished ? 'Publicado' : 'Rascunho'}
          </span>
        </div>

        {course.description && (
          <p className="text-xs themed-text-muted mb-3 line-clamp-2 leading-relaxed">
            {course.description}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 themed-text-muted" />
            <span className="text-xs themed-text-secondary">
              <span className="font-semibold themed-text">{course.lessonsCount ?? 0}</span> licoes
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 themed-text-muted" />
            <span className="text-xs themed-text-secondary">
              <span className="font-semibold themed-text">{course.enrolledCreators ?? course.enrolledCount ?? 0}</span> inscritos
            </span>
          </div>
        </div>

        {/* Completion */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1">
              <BarChart2 className="w-3 h-3 themed-text-muted" />
              <span className="text-[10px] themed-text-muted">Taxa de conclusao</span>
            </div>
            <span className="text-[10px] font-bold themed-text">{course.completionRate ?? 0}%</span>
          </div>
          <ProgressBar value={course.completionRate ?? 0} />
        </div>

        {/* Actions */}
        <div
          className="flex items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => onToggle(course)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              course.isPublished
                ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
            }`}
          >
            {course.isPublished ? (
              <><EyeOff className="w-3.5 h-3.5" /> Despublicar</>
            ) : (
              <><Eye className="w-3.5 h-3.5" /> Publicar</>
            )}
          </button>
          <button
            onClick={() => onEdit(course)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 themed-text-secondary hover:bg-white/10 hover:themed-text transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" /> Editar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Course Detail ────────────────────────────────────────────────────────────

type DetailTab = 'lessons' | 'progress';

interface CourseDetailProps {
  course: AdminCourse;
  onBack: () => void;
  onCourseUpdated: () => void;
}

function CourseDetail({ course, onBack, onCourseUpdated }: CourseDetailProps) {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<DetailTab>('lessons');
  const [lessons, setLessons] = useState<AdminLesson[]>([]);
  const [progress, setProgress] = useState<AdminCourseProgress[]>([]);
  const [loadingLessons, setLoadingLessons] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState<AdminLesson | null>(null);
  const [showCourseModal, setShowCourseModal] = useState(false);

  const fetchLessons = useCallback(async () => {
    setLoadingLessons(true);
    try {
      const res = await adminApi.courseLessons(course.id);
      setLessons(res.lessons ?? []);
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro ao carregar licoes.');
    } finally {
      setLoadingLessons(false);
    }
  }, [course.id, toast]);

  const fetchProgress = useCallback(async () => {
    setLoadingProgress(true);
    try {
      const res = await adminApi.courseProgress(course.id);
      setProgress(res.progress ?? []);
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro ao carregar progresso.');
    } finally {
      setLoadingProgress(false);
    }
  }, [course.id, toast]);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  useEffect(() => {
    if (activeTab === 'progress') {
      fetchProgress();
    }
  }, [activeTab, fetchProgress]);

  async function handleToggleLesson(lesson: AdminLesson) {
    try {
      await adminApi.toggleLessonPublish(lesson.id);
      toast.success(lesson.isPublished ? 'Licao despublicada.' : 'Licao publicada.');
      fetchLessons();
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro ao alterar status da licao.');
    }
  }

  function handleOpenCreateLesson() {
    setEditingLesson(null);
    setShowLessonModal(true);
  }

  function handleOpenEditLesson(lesson: AdminLesson) {
    setEditingLesson(lesson);
    setShowLessonModal(true);
  }

  function handleLessonSaved() {
    setShowLessonModal(false);
    setEditingLesson(null);
    fetchLessons();
  }

  function handleCourseSaved() {
    setShowCourseModal(false);
    onCourseUpdated();
  }

  const TABS: { id: DetailTab; label: string }[] = [
    { id: 'lessons', label: 'Licoes' },
    { id: 'progress', label: 'Progresso' },
  ];

  return (
    <div className="space-y-5">
      {/* Back + header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm themed-text-muted hover:themed-text transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Voltar
        </button>
      </div>

      {/* Course header card */}
      <Card>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            {course.thumbnailUrl ? (
              <img
                src={course.thumbnailUrl}
                alt={course.title}
                className="w-16 h-16 rounded-xl object-cover shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-primary/20 to-violet-600/10 flex items-center justify-center shrink-0">
                <GraduationCap className="w-7 h-7 text-brand-primary/60" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg font-bold themed-text">{course.title}</h2>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                    course.isPublished
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : 'bg-white/8 themed-text-muted'
                  }`}
                >
                  {course.isPublished ? 'Publicado' : 'Rascunho'}
                </span>
              </div>
              {course.description && (
                <p className="text-sm themed-text-secondary">{course.description}</p>
              )}
              <div className="flex items-center gap-4 mt-2">
                <span className="text-xs themed-text-muted">
                  <span className="font-semibold themed-text">{course.lessonsCount ?? 0}</span> licoes
                </span>
                <span className="text-xs themed-text-muted">
                  <span className="font-semibold themed-text">{course.enrolledCreators ?? course.enrolledCount ?? 0}</span> inscritos
                </span>
                <span className="text-xs themed-text-muted">
                  <span className="font-semibold themed-text">{course.completionRate ?? 0}%</span> conclusao
                </span>
              </div>
            </div>
          </div>
          <Button
            variant="secondary"
            icon={<Pencil className="w-4 h-4" />}
            onClick={() => setShowCourseModal(true)}
          >
            Editar
          </Button>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-xl w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20'
                : 'themed-text-muted hover:themed-text'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Licoes */}
      {activeTab === 'lessons' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm themed-text-secondary">{lessons.length} licoes</span>
            <Button
              variant="primary"
              icon={<Plus className="w-4 h-4" />}
              onClick={handleOpenCreateLesson}
            >
              Nova Licao
            </Button>
          </div>

          {loadingLessons ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : lessons.length === 0 ? (
            <Card>
              <div className="text-center py-10">
                <BookOpen className="w-8 h-8 themed-text-muted mx-auto mb-2" />
                <p className="themed-text-secondary text-sm">Nenhuma licao cadastrada ainda</p>
                <p className="text-xs themed-text-muted mt-1">
                  Clique em "Nova Licao" para comecar
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-2">
              {lessons
                .slice()
                .sort((a, b) => a.orderIndex - b.orderIndex)
                .map((lesson) => (
                  <div
                    key={lesson.id}
                    className="flex items-center gap-4 p-4 rounded-xl border themed-border bg-white/3 hover:bg-white/5 transition-colors"
                  >
                    {/* Order badge */}
                    <div className="w-7 h-7 rounded-lg bg-brand-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-brand-primary-light">
                        {lesson.orderIndex}
                      </span>
                    </div>

                    {/* Type icon */}
                    <div
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium shrink-0 ${
                        CONTENT_TYPE_COLORS[lesson.contentType] ?? 'bg-white/5 themed-text-muted'
                      }`}
                    >
                      {CONTENT_TYPE_ICONS[lesson.contentType]}
                      {CONTENT_TYPE_LABELS[lesson.contentType]}
                    </div>

                    {/* Title */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium themed-text truncate">{lesson.title}</p>
                    </div>

                    {/* Duration */}
                    <div className="flex items-center gap-1 shrink-0">
                      <Clock className="w-3.5 h-3.5 themed-text-muted" />
                      <span className="text-xs themed-text-muted">{formatDuration(lesson.duration)}</span>
                    </div>

                    {/* Published */}
                    <span
                      className={`shrink-0 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        lesson.isPublished
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'bg-white/8 themed-text-muted'
                      }`}
                    >
                      {lesson.isPublished ? 'Publicada' : 'Rascunho'}
                    </span>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleToggleLesson(lesson)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          lesson.isPublished
                            ? 'text-red-400/60 hover:text-red-400 hover:bg-red-500/10'
                            : 'text-emerald-400/60 hover:text-emerald-400 hover:bg-emerald-500/10'
                        }`}
                        title={lesson.isPublished ? 'Despublicar' : 'Publicar'}
                      >
                        {lesson.isPublished ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => handleOpenEditLesson(lesson)}
                        className="p-1.5 rounded-lg themed-text-muted hover:themed-text hover:bg-white/10 transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Progresso */}
      {activeTab === 'progress' && (
        <Card>
          {loadingProgress ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 rounded-lg bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : progress.length === 0 ? (
            <div className="text-center py-10">
              <Users className="w-8 h-8 themed-text-muted mx-auto mb-2" />
              <p className="themed-text-secondary text-sm">Nenhum creator inscrito ainda</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b themed-border">
                    <th className="text-left py-3 px-4 text-xs font-semibold themed-text-muted uppercase tracking-wider">
                      Creator
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-semibold themed-text-muted uppercase tracking-wider">
                      Licoes
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold themed-text-muted uppercase tracking-wider min-w-[160px]">
                      Progresso
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-semibold themed-text-muted uppercase tracking-wider">
                      Ultima Atividade
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y themed-border">
                  {progress.map((p) => (
                    <tr key={p.userId} className="hover:bg-white/3 transition-colors">
                      <td className="py-3 px-4 font-medium themed-text">{p.creatorName}</td>
                      <td className="py-3 px-4 text-center themed-text-secondary">
                        {p.completedLessons}/{p.totalLessons}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <ProgressBar value={p.completionPercent} />
                          </div>
                          <span className="text-xs font-semibold themed-text w-10 text-right">
                            {p.completionPercent}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right text-xs themed-text-muted">
                        {p.lastActivityAt ? formatDate(p.lastActivityAt) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Modals */}
      {showLessonModal && (
        <LessonModal
          courseId={course.id}
          lesson={editingLesson}
          nextOrder={lessons.length + 1}
          onClose={() => { setShowLessonModal(false); setEditingLesson(null); }}
          onSaved={handleLessonSaved}
        />
      )}
      {showCourseModal && (
        <CourseModal
          course={course}
          onClose={() => setShowCourseModal(false)}
          onSaved={handleCourseSaved}
        />
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminCourses() {
  const toast = useToast();
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<AdminCourse | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<AdminCourse | null>(null);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.coursesList();
      setCourses(res.courses ?? []);
      setTotal(res.total ?? 0);
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro ao carregar cursos.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  async function handleTogglePublish(course: AdminCourse) {
    try {
      await adminApi.toggleCoursePublish(course.id);
      toast.success(course.isPublished ? 'Curso despublicado.' : 'Curso publicado.');
      fetchCourses();
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro ao alterar status do curso.');
    }
  }

  function handleOpenEdit(course: AdminCourse) {
    setEditingCourse(course);
    setShowModal(true);
  }

  function handleModalSaved() {
    setShowModal(false);
    setEditingCourse(null);
    fetchCourses();
    // Refresh selected course data if we just edited it
    if (selectedCourse) {
      setSelectedCourse(null);
    }
  }

  // When in detail view and course was updated, re-fetch and reselect
  function handleCourseUpdated() {
    fetchCourses();
    setSelectedCourse(null);
  }

  // If a course is selected, show detail
  if (selectedCourse) {
    return (
      <PageContainer title="Admin — Formacao">
        <CourseDetail
          course={selectedCourse}
          onBack={() => setSelectedCourse(null)}
          onCourseUpdated={handleCourseUpdated}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Admin — Formacao">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 themed-text-secondary" />
            <h2 className="text-lg font-bold themed-text">Formacao (LMS)</h2>
            <Badge variant="primary">{total}</Badge>
          </div>
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => { setEditingCourse(null); setShowModal(true); }}
          >
            Novo Curso
          </Button>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : courses.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <GraduationCap className="w-10 h-10 themed-text-muted mx-auto mb-3" />
              <p className="themed-text-secondary">Nenhum curso cadastrado ainda</p>
              <p className="text-xs themed-text-muted mt-1">
                Clique em "Novo Curso" para comecar
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                onToggle={handleTogglePublish}
                onEdit={handleOpenEdit}
                onClick={setSelectedCourse}
              />
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <CourseModal
          course={editingCourse}
          onClose={() => { setShowModal(false); setEditingCourse(null); }}
          onSaved={handleModalSaved}
        />
      )}
    </PageContainer>
  );
}
