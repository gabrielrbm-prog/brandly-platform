import { db } from './connection.js';
import { levels, brands, briefings, courses, lessons, products, users, liveEvents, successCases } from './schema.js';
import bcrypt from 'bcryptjs';

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

  // 6. Produtos para cada marca
  console.log('  Inserindo produtos...');
  for (const brand of insertedBrands) {
    const isPhysical = ['supplements', 'beauty', 'food', 'fashion'].includes(brand.category);
    await db.insert(products).values([
      {
        name: `${brand.name} — Produto Principal`,
        type: isPhysical ? 'physical' : 'digital',
        price: isPhysical ? '149.90' : '297.00',
        brandId: brand.id,
        commissionPercent: isPhysical ? '15' : '40',
        status: 'active',
      },
      {
        name: `${brand.name} — Kit Iniciante`,
        type: isPhysical ? 'physical' : 'digital',
        price: isPhysical ? '89.90' : '197.00',
        brandId: brand.id,
        commissionPercent: isPhysical ? '12' : '35',
        status: 'active',
      },
    ]).onConflictDoNothing();
  }

  // 7. Admin user
  console.log('  Inserindo admin user...');
  const adminHash = await bcrypt.hash('admin123', 10);
  await db.insert(users).values({
    name: 'Admin Brandly',
    email: 'admin@brandly.com.br',
    passwordHash: adminHash,
    role: 'admin',
    referralCode: 'ADMIN001',
    status: 'active',
    onboardingCompleted: true,
  }).onConflictDoNothing();

  // 8. Live Events
  console.log('  Inserindo live events...');
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextMonth = new Date();
  nextMonth.setDate(nextMonth.getDate() + 30);

  await db.insert(liveEvents).values([
    { title: 'Live de Boas-Vindas — Conheca o Sistema Brandly', instructorName: 'Gabriel Rubim', scheduledAt: nextWeek },
    { title: 'Workshop: Seus Primeiros 10 Videos UGC', instructorName: 'Raquel Guerreiro', scheduledAt: nextMonth },
  ]).onConflictDoNothing();

  // 9. Success Cases
  console.log('  Inserindo success cases...');
  await db.insert(successCases).values([
    { title: 'De 0 a R$3.000/mes em 45 dias', story: 'Carolina comecou sem experiencia e em 45 dias ja estava faturando R$3.000/mes com videos UGC para 3 marcas parceiras. O segredo? Consistencia e a tecnica 3x3x2.', earnings: '3000', isPublished: true },
    { title: 'Demitida e agora ganhando mais que CLT', story: 'Fernanda foi demitida e encontrou na Brandly uma nova carreira. Em 60 dias conquistou R$4.500/mes produzindo videos para marcas de beleza e suplementos.', earnings: '4500', isPublished: true },
  ]).onConflictDoNothing();

  console.log('\nSeed concluido com sucesso!');
  console.log('  7 niveis de carreira');
  console.log('  6 marcas parceiras + 12 produtos');
  console.log('  6 briefings');
  console.log('  3 modulos de formacao + 10 aulas');
  console.log('  1 admin user (admin@brandly.com.br / admin123)');
  console.log('  2 live events + 2 success cases');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Erro no seed:', err);
  process.exit(1);
});
