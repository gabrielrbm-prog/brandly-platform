import { db } from './connection.js';
import { levels, brands, briefings, courses, lessons } from './schema.js';

/**
 * Seed do banco de dados com dados iniciais.
 * Rodar: npx tsx packages/core/src/db/seed.ts
 */
async function seed() {
  console.log('Iniciando seed do banco Brandly...');

  // 1. Niveis de carreira
  console.log('  Inserindo niveis de carreira...');
  await db.insert(levels).values([
    { name: 'Seed', rank: 1, requiredQV: '0', requiredDirects: 0, requiredPML: '0', directCommissionDigital: '20', directCommissionPhysical: '5', infiniteBonusDigital: '0', infiniteBonusPhysical: '0' },
    { name: 'Spark', rank: 2, requiredQV: '500', requiredDirects: 2, requiredPML: '200', directCommissionDigital: '25', directCommissionPhysical: '8', infiniteBonusDigital: '1', infiniteBonusPhysical: '0.5' },
    { name: 'Flow', rank: 3, requiredQV: '2000', requiredDirects: 5, requiredPML: '800', directCommissionDigital: '30', directCommissionPhysical: '10', infiniteBonusDigital: '2', infiniteBonusPhysical: '1' },
    { name: 'Iconic', rank: 4, requiredQV: '5000', requiredDirects: 10, requiredPML: '2000', directCommissionDigital: '35', directCommissionPhysical: '13', infiniteBonusDigital: '3', infiniteBonusPhysical: '1.5' },
    { name: 'Vision', rank: 5, requiredQV: '15000', requiredDirects: 20, requiredPML: '5000', directCommissionDigital: '40', directCommissionPhysical: '15', infiniteBonusDigital: '5', infiniteBonusPhysical: '2.5' },
    { name: 'Empire', rank: 6, requiredQV: '50000', requiredDirects: 50, requiredPML: '15000', directCommissionDigital: '45', directCommissionPhysical: '18', infiniteBonusDigital: '7', infiniteBonusPhysical: '4' },
    { name: 'Infinity', rank: 7, requiredQV: '150000', requiredDirects: 100, requiredPML: '50000', directCommissionDigital: '50', directCommissionPhysical: '20', infiniteBonusDigital: '8', infiniteBonusPhysical: '5' },
  ]).onConflictDoNothing();

  // 2. Marcas parceiras iniciais
  console.log('  Inserindo marcas parceiras...');
  const insertedBrands = await db.insert(brands).values([
    { name: 'Yav Health', category: 'supplements', description: 'Suplementos naturais e vitaminas premium', minVideosPerMonth: 30, maxCreators: 50, isActive: true },
    { name: 'Native Cosmeticos', category: 'beauty', description: 'Cosmeticos naturais e veganos', minVideosPerMonth: 40, maxCreators: 80, isActive: true },
    { name: 'Foka Fitness', category: 'supplements', description: 'Whey protein e suplementos esportivos', minVideosPerMonth: 50, maxCreators: 100, isActive: true },
    { name: 'ETF Tecnologia', category: 'tech', description: 'Gadgets e acessorios tecnologicos', minVideosPerMonth: 20, maxCreators: 30, isActive: true },
    { name: 'Conectar Energy', category: 'food', description: 'Bebidas energeticas naturais', minVideosPerMonth: 30, maxCreators: 60, isActive: true },
    { name: 'Vyva Moda', category: 'fashion', description: 'Moda feminina acessivel e estilosa', minVideosPerMonth: 40, maxCreators: 70, isActive: true },
  ]).returning();

  // 3. Briefings para cada marca
  console.log('  Inserindo briefings...');
  for (const brand of insertedBrands) {
    await db.insert(briefings).values({
      brandId: brand.id,
      title: `Video UGC para ${brand.name}`,
      description: `Crie um video curto (30-60s) mostrando o produto da ${brand.name}. Use o roteiro gerado pela IA como base. Seja natural e autentico.`,
      tone: 'casual',
      doList: [
        'Mostrar o produto em uso real',
        'Falar dos beneficios de forma natural',
        'Usar boa iluminacao (luz natural ou ring light)',
        'Audio claro (sem barulho de fundo)',
        'CTA no final (link na bio / cupom)',
      ],
      dontList: [
        'Nao fazer claims medicos ou promessas exageradas',
        'Nao usar musica com copyright',
        'Nao filmar em ambiente bagunçado',
        'Nao usar filtros excessivos',
      ],
      exampleUrls: [],
      technicalRequirements: 'Duracao: 30-60s | Formato: vertical (9:16) | Resolucao: minimo 720p',
      isActive: true,
    });
  }

  // 4. Cursos da formacao
  console.log('  Inserindo cursos da formacao...');
  const course1 = await db.insert(courses).values({
    title: 'Modulo 1: Fundamentos de Creator',
    description: 'Comunicacao em video, estrutura UGC (hook + corpo + CTA), psicologia da conversao, padrao tecnico basico.',
    orderIndex: 1,
    isPublished: true,
  }).returning();

  const course2 = await db.insert(courses).values({
    title: 'Modulo 2: Producao Acelerada',
    description: 'Tecnica 3x3x2: como gravar 10 videos em 1 hora. Roteiros validados, edicao automatica com IA.',
    orderIndex: 2,
    isPublished: true,
  }).returning();

  const course3 = await db.insert(courses).values({
    title: 'Modulo 3: Brand Pessoal',
    description: 'Como construir marca pessoal enquanto faz UGC. Estrategia de crescimento organico, nicho e posicionamento.',
    orderIndex: 3,
    isPublished: true,
  }).returning();

  // 5. Aulas do Modulo 1
  console.log('  Inserindo aulas...');
  await db.insert(lessons).values([
    { courseId: course1[0].id, title: 'Como falar natural em video (sem ser robotico)', orderIndex: 1, duration: 900, isPublished: true },
    { courseId: course1[0].id, title: 'Estrutura UGC: Hook + Corpo + CTA', orderIndex: 2, duration: 1200, isPublished: true },
    { courseId: course1[0].id, title: 'Psicologia da conversao: o que faz um video vender', orderIndex: 3, duration: 1500, isPublished: true },
    { courseId: course1[0].id, title: 'Padrao tecnico basico: luz, audio e enquadramento', orderIndex: 4, duration: 1200, isPublished: true },
  ]);

  await db.insert(lessons).values([
    { courseId: course2[0].id, title: 'Tecnica 3x3x2: 10 videos em 1 hora', orderIndex: 1, duration: 1800, isPublished: true },
    { courseId: course2[0].id, title: 'Roteiros validados: como usar os templates', orderIndex: 2, duration: 900, isPublished: true },
    { courseId: course2[0].id, title: 'Edicao automatica com IA: 30 segundos por video', orderIndex: 3, duration: 1200, isPublished: true },
  ]);

  await db.insert(lessons).values([
    { courseId: course3[0].id, title: 'Construindo marca pessoal com UGC', orderIndex: 1, duration: 1500, isPublished: true },
    { courseId: course3[0].id, title: 'Estrategia de crescimento organico', orderIndex: 2, duration: 1200, isPublished: true },
    { courseId: course3[0].id, title: 'Nicho e posicionamento: como se diferenciar', orderIndex: 3, duration: 1500, isPublished: true },
  ]);

  console.log('\nSeed concluido com sucesso!');
  console.log('  7 niveis de carreira');
  console.log('  6 marcas parceiras');
  console.log('  6 briefings');
  console.log('  3 modulos de formacao');
  console.log('  10 aulas');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Erro no seed:', err);
  process.exit(1);
});
