import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Star, Target, Palette, ShoppingBag, Zap, ArrowRight } from 'lucide-react';
import { onboardingApi, type CreatorDiagnostic } from '@/lib/api';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import ProgressBar from '@/components/ui/ProgressBar';

export default function BehavioralResult() {
  const navigate = useNavigate();
  const [result, setResult] = useState<CreatorDiagnostic | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await onboardingApi.behavioralResult();
        setResult(data.creatorDiagnostic);
      } catch { /* silent */ }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="themed-text-secondary">Analisando seu perfil...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-surface-bg flex items-center justify-center p-6">
        <div className="text-center">
          <p className="themed-text-secondary mb-4">Nenhum resultado encontrado.</p>
          <Button onClick={() => navigate('/onboarding')} icon={<ArrowRight className="w-4 h-4" />}>
            Fazer avaliacao
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-bg p-6">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <span className="text-6xl">{result.archetypeEmoji}</span>
          <h1 className="text-2xl font-bold themed-text">{result.title}</h1>
          <Badge variant="primary" className="text-base px-4 py-1">{result.archetype}</Badge>
          <p className="text-sm themed-text-secondary">{result.shortDescription}</p>
        </div>

        {/* Readiness score */}
        <Card glowing>
          <div className="text-center">
            <p className="text-xs font-semibold themed-text-secondary uppercase tracking-wider mb-2">Nivel de Prontidao</p>
            <div className="relative w-24 h-24 mx-auto mb-2">
              <svg width="96" height="96" className="-rotate-90">
                <circle cx="48" cy="48" r="40" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
                <circle
                  cx="48" cy="48" r="40" fill="none" stroke="#7C3AED" strokeWidth="8"
                  strokeDasharray={2 * Math.PI * 40}
                  strokeDashoffset={2 * Math.PI * 40 * (1 - result.readinessScore / 10)}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold themed-text">{result.readinessScore.toFixed(1)}</span>
              </div>
            </div>
            <Badge variant="primary">{result.level}</Badge>
          </div>
        </Card>

        {/* Strengths */}
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold themed-text-secondary">Seus Pontos Fortes</h3>
          </div>
          <div className="space-y-2">
            {result.strengths.map((s, i) => (
              <div key={i} className="flex items-start gap-2">
                <Sparkles className="w-3.5 h-3.5 text-brand-primary-light mt-0.5 shrink-0" />
                <span className="text-sm text-gray-300">{s}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Superpower */}
        <Card glowing accent="#7C3AED">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-brand-primary-light" />
            <h3 className="text-sm font-semibold themed-text-secondary">Superpoder</h3>
          </div>
          <p className="text-sm text-gray-300">{result.superpower}</p>
        </Card>

        {/* Content style + formats */}
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <Palette className="w-4 h-4 text-pink-400" />
            <h3 className="text-sm font-semibold themed-text-secondary">Estilo de Conteudo</h3>
          </div>
          <p className="text-sm text-gray-300 mb-3">{result.contentStyle}</p>
          <div className="flex flex-wrap gap-2">
            {result.idealFormats.map((f) => (
              <Badge key={f} variant="info">{f}</Badge>
            ))}
          </div>
        </Card>

        {/* Product match */}
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold themed-text-secondary">Produtos Ideais</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {result.productMatch.map((p) => (
              <Badge key={p} variant="success">{p}</Badge>
            ))}
          </div>
        </Card>

        {/* Motivation phrase */}
        <div className="text-center py-4">
          <p className="text-lg font-semibold text-brand-primary-light italic">"{result.motivationPhrase}"</p>
        </div>

        <Button onClick={() => navigate('/')} icon={<ArrowRight className="w-4 h-4" />} className="w-full">
          Ir para o Dashboard
        </Button>
      </div>
    </div>
  );
}
