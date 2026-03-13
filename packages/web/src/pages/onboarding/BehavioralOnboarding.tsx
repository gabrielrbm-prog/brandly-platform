import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import { onboardingApi, type OnboardingQuestion } from '@/lib/api';
import Button from '@/components/ui/Button';
import ProgressBar from '@/components/ui/ProgressBar';

export default function BehavioralOnboarding() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<OnboardingQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string | string[] | number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const result = await onboardingApi.behavioralQuestions();
        setQuestions(result.questions);
      } catch { /* silent */ }
      finally { setLoading(false); }
    })();
  }, []);

  function setAnswer(qId: number, value: string | string[] | number) {
    setAnswers((prev) => ({ ...prev, [qId]: value }));
  }

  function toggleMulti(qId: number, val: string) {
    const current = (answers[qId] as string[]) ?? [];
    const next = current.includes(val) ? current.filter((v) => v !== val) : [...current, val];
    setAnswer(qId, next);
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await onboardingApi.submitBehavioral(answers);
      navigate('/onboarding/result', { replace: true });
    } catch (err: any) {
      alert(err.message ?? 'Erro ao enviar respostas.');
    } finally { setSubmitting(false); }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-bg flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-surface-bg flex items-center justify-center">
        <p className="text-gray-400">Nenhuma pergunta encontrada.</p>
      </div>
    );
  }

  const q = questions[current];
  const isLast = current === questions.length - 1;
  const hasAnswer = answers[q.id] !== undefined && (Array.isArray(answers[q.id]) ? (answers[q.id] as string[]).length > 0 : true);

  return (
    <div className="min-h-screen bg-surface-bg flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="w-5 h-5 text-brand-primary" />
          <span className="text-sm font-semibold text-gray-300">Perfil Comportamental</span>
          <span className="text-xs text-gray-500 ml-auto">{current + 1}/{questions.length}</span>
        </div>
        <ProgressBar value={current + 1} max={questions.length} color="#7C3AED" />
      </div>

      {/* Question */}
      <div className="flex-1 flex flex-col justify-center p-6 max-w-lg mx-auto w-full">
        <p className="text-xs font-semibold text-brand-primary-light uppercase tracking-wider mb-2">{q.category}</p>
        <h2 className="text-xl font-bold text-white mb-2">{q.question}</h2>
        {q.subtitle && <p className="text-sm text-gray-400 mb-6">{q.subtitle}</p>}

        {/* Options */}
        {(q.type === 'single' || q.type === 'swipe') && q.options && (
          <div className="space-y-2">
            {q.options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setAnswer(q.id, opt.value)}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                  answers[q.id] === opt.value
                    ? 'bg-brand-primary/15 border-brand-primary text-brand-primary-light'
                    : 'bg-surface border-gray-700 text-gray-300 hover:border-gray-600'
                }`}
              >
                {opt.emoji && <span className="mr-2">{opt.emoji}</span>}
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {q.type === 'multiple' && q.options && (
          <div className="space-y-2">
            {q.options.map((opt) => {
              const selected = ((answers[q.id] as string[]) ?? []).includes(opt.value);
              return (
                <button
                  key={opt.value}
                  onClick={() => toggleMulti(q.id, opt.value)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-colors flex items-center gap-2 ${
                    selected
                      ? 'bg-brand-primary/15 border-brand-primary text-brand-primary-light'
                      : 'bg-surface border-gray-700 text-gray-300 hover:border-gray-600'
                  }`}
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    selected ? 'border-brand-primary bg-brand-primary' : 'border-gray-600'
                  }`}>
                    {selected && <CheckCircle className="w-3 h-3 text-white" />}
                  </div>
                  {opt.emoji && <span>{opt.emoji}</span>}
                  {opt.label}
                </button>
              );
            })}
          </div>
        )}

        {q.type === 'slider' && q.sliderConfig && (
          <div className="space-y-4">
            <input
              type="range"
              min={q.sliderConfig.min}
              max={q.sliderConfig.max}
              value={(answers[q.id] as number) ?? Math.floor((Number(q.sliderConfig.min) + Number(q.sliderConfig.max)) / 2)}
              onChange={(e) => setAnswer(q.id, Number(e.target.value))}
              className="w-full accent-brand-primary"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>{q.sliderConfig.minLabel}</span>
              <span className="text-brand-primary-light font-bold">{answers[q.id] ?? '—'}</span>
              <span>{q.sliderConfig.maxLabel}</span>
            </div>
          </div>
        )}

        {q.type === 'grid' && q.options && (
          <div className="grid grid-cols-2 gap-2">
            {q.options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setAnswer(q.id, opt.value)}
                className={`px-3 py-3 rounded-xl border text-center transition-colors ${
                  answers[q.id] === opt.value
                    ? 'bg-brand-primary/15 border-brand-primary text-brand-primary-light'
                    : 'bg-surface border-gray-700 text-gray-300 hover:border-gray-600'
                }`}
              >
                {opt.emoji && <span className="block text-2xl mb-1">{opt.emoji}</span>}
                <span className="text-sm">{opt.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="p-4 border-t border-gray-800 flex justify-between gap-3">
        <Button
          variant="ghost"
          onClick={() => setCurrent(Math.max(0, current - 1))}
          disabled={current === 0}
          icon={<ArrowLeft className="w-4 h-4" />}
        >
          Anterior
        </Button>
        {isLast ? (
          <Button onClick={handleSubmit} loading={submitting} disabled={!hasAnswer} icon={<CheckCircle className="w-4 h-4" />}>
            Finalizar
          </Button>
        ) : (
          <Button onClick={() => setCurrent(current + 1)} disabled={!hasAnswer} icon={<ArrowRight className="w-4 h-4" />}>
            Proximo
          </Button>
        )}
      </div>
    </div>
  );
}
