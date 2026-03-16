import type { FastifyInstance } from 'fastify';

const baseStyle = `
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: #09090b;
      color: #e4e4e7;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 16px;
      line-height: 1.7;
      padding: 2rem 1rem;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
    }
    header {
      border-bottom: 1px solid #27272a;
      padding-bottom: 1.5rem;
      margin-bottom: 2rem;
    }
    .logo {
      font-size: 1.5rem;
      font-weight: 700;
      color: #a78bfa;
      letter-spacing: -0.02em;
    }
    h1 {
      font-size: 2rem;
      font-weight: 700;
      color: #f4f4f5;
      margin-top: 0.5rem;
      letter-spacing: -0.03em;
    }
    .meta {
      font-size: 0.875rem;
      color: #71717a;
      margin-top: 0.4rem;
    }
    h2 {
      font-size: 1.15rem;
      font-weight: 600;
      color: #a78bfa;
      margin-top: 2.5rem;
      margin-bottom: 0.75rem;
      padding-left: 0.75rem;
      border-left: 3px solid #7C3AED;
    }
    p {
      color: #a1a1aa;
      margin-bottom: 0.75rem;
    }
    ul {
      color: #a1a1aa;
      margin-bottom: 0.75rem;
      padding-left: 1.5rem;
    }
    li {
      margin-bottom: 0.4rem;
    }
    footer {
      margin-top: 3rem;
      padding-top: 1.5rem;
      border-top: 1px solid #27272a;
      font-size: 0.8rem;
      color: #52525b;
      text-align: center;
    }
    footer a {
      color: #7C3AED;
      text-decoration: none;
    }
    @media (max-width: 600px) {
      h1 { font-size: 1.5rem; }
      body { padding: 1.5rem 1rem; }
    }
  </style>
`;

const termosHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Termos de Uso — Brandly</title>
  ${baseStyle}
</head>
<body>
  <div class="container">
    <header>
      <div class="logo">Brandly</div>
      <h1>Termos de Uso</h1>
      <p class="meta">Brandly Tecnologia LTDA &nbsp;·&nbsp; Vigencia: Marco de 2026</p>
    </header>

    <h2>1. Aceitacao dos Termos</h2>
    <p>
      Ao se cadastrar na plataforma Brandly, voce declara ter lido, compreendido e concordado
      integralmente com estes Termos de Uso. Caso nao concorde com qualquer disposicao aqui
      contida, nao prossiga com o cadastro nem utilize os servicos.
    </p>

    <h2>2. Descricao do Servico</h2>
    <p>
      A Brandly e uma plataforma de creator economy que conecta criadores de conteudo (creators)
      a marcas parceiras. Por meio da plataforma, os usuarios podem:
    </p>
    <ul>
      <li>Produzir e enviar videos de conteudo UGC para aprovacao das marcas;</li>
      <li>Receber remuneracao por producao aprovada e por comissao em vendas;</li>
      <li>Acessar ferramentas de inteligencia artificial para geracao de roteiros e edicao de videos;</li>
      <li>Construir e gerenciar uma rede de indicacao (afiliados) com plano de compensacao;</li>
      <li>Acompanhar metricas de desempenho em tempo real pelo dashboard.</li>
    </ul>

    <h2>3. Elegibilidade e Cadastro</h2>
    <p>
      O uso da plataforma e restrito a pessoas com 18 anos ou mais, capazes de praticar atos da
      vida civil na forma da legislacao brasileira. Voce e responsavel pela veracidade das
      informacoes fornecidas no cadastro e pela seguranca de suas credenciais de acesso.
    </p>

    <h2>4. Regras de Uso</h2>
    <p>E expressamente proibido:</p>
    <ul>
      <li>Publicar, enviar ou distribuir conteudo ilegal, difamatório, discriminatorio ou obsceno;</li>
      <li>Praticar spam ou envio massivo de mensagens nao solicitadas;</li>
      <li>Fraudar metricas de desempenho, visualizacoes ou indicacoes;</li>
      <li>Utilizar bots, scripts automatizados ou qualquer mecanismo para simular atividade humana;</li>
      <li>Violar direitos de propriedade intelectual de terceiros;</li>
      <li>Tentar acessar areas restritas da plataforma sem autorizacao;</li>
      <li>Revender, sublicenciar ou explorar comercialmente o acesso sem consentimento expresso da Brandly.</li>
    </ul>

    <h2>5. Propriedade Intelectual</h2>
    <p>
      Todo o codigo-fonte, design, logotipos, textos e demais elementos da plataforma sao de
      propriedade exclusiva da Brandly Tecnologia LTDA e protegidos pela legislacao de direitos
      autorais. Ao enviar conteudo para a plataforma, o creator concede a Brandly licenca nao
      exclusiva, gratuita e mundial para exibir, distribuir e promover esse conteudo no contexto
      das campanhas contratadas pelas marcas parceiras.
    </p>

    <h2>6. Pagamentos e Comissoes</h2>
    <p>
      Os valores de remuneracao por producao, comissoes sobre vendas e bonus de rede estao
      descritos no plano de compensacao vigente, disponivel no painel do creator. A Brandly reserva
      o direito de ajustar os valores mediante aviso previo de 30 dias. Pagamentos estao sujeitos a
      aprovacao dos videos e validacao de vendas pelas marcas parceiras.
    </p>

    <h2>7. Limitacao de Responsabilidade</h2>
    <p>
      A Brandly nao se responsabiliza por perdas indiretas, lucros cessantes, danos emergentes ou
      qualquer outro prejuizo decorrente do uso ou da impossibilidade de uso da plataforma, exceto
      nos casos previstos na legislacao vigente. A disponibilidade do servico pode ser interrompida
      para manutencao, atualizacoes ou por causas de forca maior.
    </p>

    <h2>8. Rescisao de Conta</h2>
    <p>
      A Brandly pode suspender ou encerrar a conta do usuario, a qualquer momento e sem aviso previo,
      em caso de violacao destes Termos ou comportamento que cause dano a plataforma, marcas parceiras
      ou outros usuarios. O usuario tambem pode encerrar sua conta a qualquer momento mediante
      solicitacao em privacidade@brandly.com.br, sem prejuizo das obrigacoes pendentes.
    </p>

    <h2>9. Alteracoes nos Termos</h2>
    <p>
      Estes Termos podem ser atualizados periodicamente. A continuidade no uso da plataforma apos
      publicacao das alteracoes implica aceitacao automatica dos novos termos. Alteracoes substanciais
      serao comunicadas por email com antecedencia minima de 15 dias.
    </p>

    <h2>10. Foro e Legislacao Aplicavel</h2>
    <p>
      Estes Termos sao regidos pela legislacao brasileira. Para a resolucao de quaisquer controversias
      oriundas deste instrumento, fica eleito o foro da comarca do domicilio da Brandly Tecnologia LTDA,
      com renuncia expressa a qualquer outro, por mais privilegiado que seja.
    </p>

    <footer>
      &copy; 2026 Brandly Tecnologia LTDA — Todos os direitos reservados
      &nbsp;|&nbsp; <a href="/legal/privacidade">Politica de Privacidade</a>
    </footer>
  </div>
</body>
</html>`;

const privacidadeHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Politica de Privacidade — Brandly</title>
  ${baseStyle}
</head>
<body>
  <div class="container">
    <header>
      <div class="logo">Brandly</div>
      <h1>Politica de Privacidade</h1>
      <p class="meta">Brandly Tecnologia LTDA &nbsp;·&nbsp; Vigencia: Marco de 2026 &nbsp;·&nbsp; Em conformidade com a LGPD (Lei 13.709/2018)</p>
    </header>

    <h2>1. Dados Coletados</h2>
    <p>Coletamos as seguintes categorias de dados pessoais:</p>
    <ul>
      <li><strong style="color:#e4e4e7;">Identificacao:</strong> nome completo, email, CPF (para emissao de notas e pagamentos);</li>
      <li><strong style="color:#e4e4e7;">Redes sociais:</strong> handles e metricas do Instagram e TikTok conectados via integracao OAuth;</li>
      <li><strong style="color:#e4e4e7;">Conteudo gerado:</strong> videos enviados, roteiros criados e campanhas participadas;</li>
      <li><strong style="color:#e4e4e7;">Dados financeiros:</strong> dados bancarios para saque (chave Pix) e historico de pagamentos;</li>
      <li><strong style="color:#e4e4e7;">Dados de uso:</strong> logs de acesso, dispositivo, endereco IP, e interacoes com a plataforma;</li>
      <li><strong style="color:#e4e4e7;">Perfil comportamental:</strong> respostas do questionario de onboarding utilizadas para personalizacao.</li>
    </ul>

    <h2>2. Finalidade do Tratamento</h2>
    <p>Utilizamos seus dados para:</p>
    <ul>
      <li>Operacao e entrega dos servicos da plataforma;</li>
      <li>Processamento de pagamentos, comissoes e bonus de rede;</li>
      <li>Analise de desempenho de conteudo e geração de relatorios para marcas parceiras;</li>
      <li>Geracao de roteiros personalizados por inteligencia artificial;</li>
      <li>Comunicacao transacional (confirmacoes, alertas e suporte);</li>
      <li>Cumprimento de obrigacoes legais e regulatorias.</li>
    </ul>

    <h2>3. Compartilhamento de Dados</h2>
    <p>Seus dados podem ser compartilhados com:</p>
    <ul>
      <li><strong style="color:#e4e4e7;">Marcas parceiras:</strong> exclusivamente metricas de desempenho anonimizadas e dados de performance de campanhas em que voce participa;</li>
      <li><strong style="color:#e4e4e7;">Processadores de pagamento:</strong> dados necessarios para transferencias bancarias e emissao de notas fiscais;</li>
      <li><strong style="color:#e4e4e7;">Provedores de infraestrutura:</strong> servicos de nuvem e banco de dados utilizados na operacao da plataforma (ex.: Railway, Neon PostgreSQL);</li>
      <li><strong style="color:#e4e4e7;">Autoridades competentes:</strong> quando exigido por lei, ordem judicial ou regulatoria.</li>
    </ul>
    <p>Nao vendemos dados pessoais a terceiros, em hipotese alguma.</p>

    <h2>4. Armazenamento e Seguranca</h2>
    <p>
      Seus dados sao armazenados em servidores seguros com criptografia em transito (TLS 1.2+)
      e em repouso. Senhas sao armazenadas exclusivamente como hash bcrypt — nunca em texto claro.
      Tokens de autenticacao utilizam JWT com tempo de expiracao configurado. Adotamos praticas
      de segurança alinhadas ao OWASP Top 10.
    </p>
    <p>
      Os dados sao mantidos enquanto a conta estiver ativa. Apos o encerramento, os dados sao
      retidos por ate 5 anos para cumprimento de obrigacoes legais e tributarias, exceto quando
      a exclusao for requerida antes desse prazo por motivo legalmente previsto.
    </p>

    <h2>5. Direitos do Titular (LGPD)</h2>
    <p>Em conformidade com a Lei Geral de Protecao de Dados (Lei 13.709/2018), voce tem direito a:</p>
    <ul>
      <li><strong style="color:#e4e4e7;">Acesso:</strong> solicitar relatorio completo dos dados que mantemos sobre voce;</li>
      <li><strong style="color:#e4e4e7;">Correcao:</strong> corrigir dados incompletos, inexatos ou desatualizados;</li>
      <li><strong style="color:#e4e4e7;">Exclusao:</strong> requerer a exclusao de dados desnecessarios ou tratados em desconformidade com a lei;</li>
      <li><strong style="color:#e4e4e7;">Portabilidade:</strong> receber seus dados em formato estruturado e interoperavel;</li>
      <li><strong style="color:#e4e4e7;">Oposicao:</strong> opor-se ao tratamento de dados realizado com base em interesse legitimo;</li>
      <li><strong style="color:#e4e4e7;">Revogacao do consentimento:</strong> retirar consentimento a qualquer momento, sem efeito retroativo.</li>
    </ul>
    <p>Para exercer seus direitos, envie solicitacao para <a href="mailto:privacidade@brandly.com.br" style="color:#7C3AED;">privacidade@brandly.com.br</a>. Respondemos em ate 15 dias uteis.</p>

    <h2>6. Cookies e Tecnologias de Rastreamento</h2>
    <p>Utilizamos cookies estritamente necessarios para:</p>
    <ul>
      <li>Manutencao da sessao autenticada do usuario;</li>
      <li>Seguranca e prevencao de fraudes;</li>
      <li>Preferencias de interface salvas localmente.</li>
    </ul>
    <p>
      Nao utilizamos cookies de rastreamento publicitario ou de terceiros sem consentimento explicito.
      Voce pode configurar seu navegador para recusar cookies, mas isso pode afetar o funcionamento
      de partes da plataforma que dependem de autenticacao.
    </p>

    <h2>7. Transferencia Internacional de Dados</h2>
    <p>
      Alguns de nossos provedores de infraestrutura podem estar localizados fora do Brasil. Nesses
      casos, garantimos que a transferencia obedece aos mecanismos de protecao previstos na LGPD,
      incluindo clausulas contratuais padrao e adequacao do nivel de protecao do pais receptor.
    </p>

    <h2>8. Alteracoes nesta Politica</h2>
    <p>
      Esta Politica pode ser atualizada periodicamente. A versao vigente sempre estara disponivel
      em <strong style="color:#e4e4e7;">/legal/privacidade</strong>. Alteracoes relevantes serao
      comunicadas por email com antecedencia minima de 15 dias.
    </p>

    <h2>9. Contato e Encarregado (DPO)</h2>
    <p>
      Para duvidas, solicitacoes ou reclamacoes relacionadas ao tratamento de dados pessoais,
      entre em contato com nosso Encarregado de Protecao de Dados:
    </p>
    <ul>
      <li>Email: <a href="mailto:privacidade@brandly.com.br" style="color:#7C3AED;">privacidade@brandly.com.br</a></li>
      <li>Empresa: Brandly Tecnologia LTDA</li>
    </ul>
    <p>
      Voce tambem pode registrar reclamacao perante a Autoridade Nacional de Protecao de Dados
      (ANPD) em <a href="https://www.gov.br/anpd" style="color:#7C3AED;" target="_blank" rel="noopener noreferrer">www.gov.br/anpd</a>.
    </p>

    <footer>
      &copy; 2026 Brandly Tecnologia LTDA — Todos os direitos reservados
      &nbsp;|&nbsp; <a href="/legal/termos">Termos de Uso</a>
    </footer>
  </div>
</body>
</html>`;

export async function legalRoutes(app: FastifyInstance) {
  // GET /legal/termos
  app.get('/termos', async (request, reply) => {
    reply.type('text/html').send(termosHtml);
  });

  // GET /legal/privacidade
  app.get('/privacidade', async (request, reply) => {
    reply.type('text/html').send(privacidadeHtml);
  });
}
