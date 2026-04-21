import { useEffect, useState } from 'react';
import { Instagram, Mail } from 'lucide-react';
import { brandPortalApi, type BrandCreator } from '@/lib/api';

export default function BrandCreators() {
  const [creators, setCreators] = useState<BrandCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    brandPortalApi
      .creators()
      .then((d) => setCreators(d.creators))
      .finally(() => setLoading(false));
  }, []);

  const filtered = creators.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold themed-text mb-2">Creators</h1>
      <p className="themed-text-muted mb-6">
        {creators.length} creator{creators.length !== 1 ? 's' : ''} vinculado{creators.length !== 1 ? 's' : ''} a sua marca
      </p>

      <input
        type="text"
        placeholder="Buscar por nome ou email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-4 py-2 mb-4 rounded-lg themed-surface-card border themed-border themed-text placeholder:themed-text-muted focus:outline-none focus:border-brand-primary"
      />

      {loading ? (
        <div className="text-center py-12 themed-text-muted">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 themed-text-muted">
          {creators.length === 0 ? 'Nenhum creator vinculado ainda' : 'Nenhum resultado'}
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((creator) => (
            <div
              key={creator.id}
              className="themed-surface-card border themed-border rounded-xl p-4 flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-primary to-brand-primary-light flex items-center justify-center text-white font-bold">
                {creator.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold themed-text truncate">{creator.name}</div>
                <div className="flex items-center gap-3 text-xs themed-text-muted mt-1">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {creator.email}
                  </span>
                  {creator.instagramHandle && (
                    <span className="flex items-center gap-1">
                      <Instagram className="w-3 h-3" />@{creator.instagramHandle}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right text-xs themed-text-muted hidden sm:block">
                Desde {new Date(creator.connectedAt).toLocaleDateString('pt-BR')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
