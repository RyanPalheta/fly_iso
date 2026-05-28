'use client'

import { useState } from 'react'
import Image from 'next/image'
import { LandingStyles } from './_landing/landing-styles'
import { ContainerScroll } from '@/components/ui/container-scroll-animation'
import RadialOrbitalTimeline from '@/components/ui/radial-orbital-timeline'
import { FileText, AlertTriangle, Wrench, BarChart3, GraduationCap, ClipboardCheck, ShieldAlert, FileSignature, Truck, RefreshCw, Blocks, RotateCcw, Unlock } from 'lucide-react'
import { FeatureCard, CardHeader, CardHeading } from '@/components/ui/features-10'
import { Typewriter } from '@/components/ui/typewriter'
import { InfiniteSlider } from '@/components/ui/infinite-slider'
import { ProgressiveBlur } from '@/components/ui/progressive-blur'

// =============================================================================
// Fly ISO — Landing Page v2
// Convertido do design HTML exportado de Claude Design (claude.ai/design)
// Mantém pixel-perfect: cores, animações, tipografia, layout.
// =============================================================================

export default function LandingPage() {
  return (
    <>
      {/* Google Fonts — Manrope (display), Inter (body), JetBrains Mono (mono) */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap"
        rel="stylesheet"
      />
      <LandingStyles />

      <div className="lp-root">
        <NavTop />
        <Hero />
        <HeroScroll />
        <TrustBar />
        <Clients />
        <Pain />
        <Results />
        <How />
        <Modules />
        <FlyDoes />
        <Differentials />
        <Auditor />
        <Pricing />
        <Simulator />
        <Faq />
        <FinalCta />
        <Footer />
        <WhatsAppFloat />
      </div>
    </>
  )
}

// ── NAV ─────────────────────────────────────────────────────────────────────
function NavTop() {
  return (
    <nav className="top">
      <div className="inner">
        <a href="#" className="logo logo-img" aria-label="Fly ISO">
          <Image
            src="/fly-iso-logo.png"
            alt="Fly ISO"
            width={240}
            height={80}
            priority
            style={{ width: 'auto', height: 56, objectFit: 'contain' }}
          />
        </a>
        <div className="links">
          <a href="#modulos">Módulos</a>
          <a href="#precos">Preços</a>
          <a href="#simulador">Simulador</a>
          <a href="#faq">FAQ</a>
        </div>
        <a href="#agendar" className="btn btn-primary">Agendar demo →</a>
      </div>
    </nav>
  )
}

// ── HERO ────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="hero">
      <div className="wrap hero-grid">
        <div>
          <span className="eyebrow">SGQ · ISO 9001:2015 · PME industrial</span>
          <h1>
            ISO 9001 sem planilha,<br />
            <span className="accent">sem caos.</span>
          </h1>
          <p className="sub">
            Todos os departamentos conectados a uma central única.
            Implantação em <b style={{ color: 'var(--ink)' }}>3 semanas</b>, com nossa equipe ao seu lado.
          </p>
          <div className="ctas">
            <a href="#agendar" className="btn btn-primary btn-lg">
              Agendar demo grátis
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
            <a href="#simulador" className="btn btn-ghost btn-lg">Simular meu SGQ</a>
          </div>
          <div className="hero-meta">
            <span><b>30 min</b> · demo ao vivo</span>
            <span><b>0 fidelidade</b> · cancele quando quiser</span>
            <span><b>Brasil</b> · dados em território nacional</span>
          </div>
        </div>

        {/* HUB DIAGRAM */}
        <div>
          <div className="hub-stage">
            <div className="stamp">FIG.01 · arquitetura</div>
            <div className="stamp-r"><span className="live-dot"></span>monitoramento ativo</div>

            <svg className="hub-svg" viewBox="0 0 880 640" preserveAspectRatio="xMidYMid meet">
              {/* 8 connection lines */}
              <line className="conn c0" x1="440" y1="270" x2="440" y2="100" />
              <line className="conn c1" x1="520" y1="290" x2="700" y2="170" />
              <line className="conn c2" x1="520" y1="320" x2="780" y2="320" />
              <line className="conn c3" x1="520" y1="350" x2="700" y2="470" />
              <line className="conn c4" x1="440" y1="370" x2="440" y2="540" />
              <line className="conn c5" x1="360" y1="350" x2="180" y2="470" />
              <line className="conn c6" x1="360" y1="320" x2="100" y2="320" />
              <line className="conn c7" x1="360" y1="290" x2="180" y2="170" />

              {/* DEPT BOXES */}
              {[
                { x: 440, y: 100, n: '01', name: 'Produção',   cls: 'd0' },
                { x: 700, y: 170, n: '02', name: 'Qualidade',  cls: 'd1' },
                { x: 780, y: 320, n: '03', name: 'Engenharia', cls: 'd2' },
                { x: 700, y: 470, n: '04', name: 'Manutenção', cls: 'd3' },
                { x: 440, y: 540, n: '05', name: 'Logística',  cls: 'd4' },
                { x: 180, y: 470, n: '06', name: 'Compras',    cls: 'd5' },
                { x: 100, y: 320, n: '07', name: 'RH',         cls: 'd6' },
                { x: 180, y: 170, n: '08', name: 'Comercial',  cls: 'd7' },
              ].map((d) => (
                <g key={d.n} transform={`translate(${d.x}, ${d.y})`}>
                  <rect x="-78" y="-32" width="156" height="64" fill="white" stroke="#CBD5E1" strokeWidth="1.5" />
                  <rect className={`dot ${d.cls}`} x="-66" y="-20" width="10" height="10" />
                  <text x="-50" y="-7" fontFamily="JetBrains Mono" fontSize="9" fill="#64748B" letterSpacing="1">{`DEPT · ${d.n}`}</text>
                  <text x="-50" y="14" fontFamily="Manrope" fontWeight="700" fontSize="16" fill="#0F172A">{d.name}</text>
                </g>
              ))}

              {/* CENTER HUB */}
              <g transform="translate(440, 320)">
                <rect x="-95" y="-55" width="190" height="110" fill="#0F172A" />
                <rect x="-95" y="-55" width="190" height="22" fill="#1E40AF" />
                <text x="0" y="-40" fill="white" fontFamily="JetBrains Mono" fontSize="10" textAnchor="middle" letterSpacing="2">FLY · ISO 9001:2015</text>
                <text x="0" y="-6" fill="white" fontFamily="Manrope" fontWeight="800" fontSize="20" textAnchor="middle" letterSpacing="-0.5">Central de</text>
                <text x="0" y="16" fill="white" fontFamily="Manrope" fontWeight="800" fontSize="20" textAnchor="middle" letterSpacing="-0.5">Qualidade</text>
                <line x1="-70" y1="28" x2="70" y2="28" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                <circle cx="-46" cy="42" r="3" fill="#10B981">
                  <animate attributeName="opacity" values="1;0.3;1" dur="1.4s" repeatCount="indefinite" />
                </circle>
                <text x="-38" y="46" fill="#94A3B8" fontFamily="JetBrains Mono" fontSize="10" letterSpacing="1">8/8 ONLINE</text>
              </g>
            </svg>
          </div>
          <div className="hub-legend">
            <span className="it"><span className="sw" style={{ background: '#10B981' }}></span> Conforme</span>
            <span className="it"><span className="sw" style={{ background: '#F59E0B' }}></span> Atenção</span>
            <span className="it"><span className="sw" style={{ background: '#EF4444' }}></span> Não conformidade</span>
            <span className="it" style={{ marginLeft: 'auto', color: 'var(--mute)' }}>tempo real · atualiza a cada evento</span>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── HERO SCROLL ─────────────────────────────────────────────────────────────
function HeroScroll() {
  return (
    <section className="hero-scroll">
      <ContainerScroll
        titleComponent={
          <div className="hero-scroll-title">
            <span className="eyebrow">Veja em ação</span>
            <h2 className="sec-title hero-scroll-h2">
              A central de qualidade,<br />
              <span style={{ color: 'var(--blue)' }}>na sua tela.</span>
            </h2>
          </div>
        }
      >
        <Image
          src="/screen.png"
          alt="Dashboard Fly ISO"
          width={1400}
          height={720}
          className="mx-auto rounded-2xl object-cover h-full w-full object-left-top"
          draggable={false}
        />
      </ContainerScroll>
    </section>
  )
}

// ── TRUST BAR ───────────────────────────────────────────────────────────────
function TrustBar() {
  return (
    <div className="trust">
      <div className="wrap row">
        <span>Sem fidelidade</span>
        <span className="sep">·</span>
        <span>ISO 9001:2015</span>
        <span className="sep">·</span>
        <span>Implantação em 3 semanas</span>
        <span className="sep">·</span>
        <span>Dados no Brasil</span>
        <span className="sep">·</span>
        <span>Suporte por WhatsApp</span>
      </div>
    </div>
  )
}

// ── CLIENTS ─────────────────────────────────────────────────────────────────
function Clients() {
  const logos = [
    { id: 'petrobras', name: 'Petrobras',  src: '/clientes/Petrobras-Logo.png', h: 44 },
    { id: 'servmar',   name: 'Servmar',    src: '/clientes/servmar.png',         h: 36 },
    { id: 'democrata', name: 'Democrata',  src: '/clientes/logo-democrata.png',  h: 40 },
    { id: 'fruta',     name: 'Fruta',      src: '/clientes/logo-fruta.jpg',      h: 44 },
  ]

  return (
    <section className="clients">
      <div className="wrap clients-head">
        <span className="eyebrow">Quem confia</span>
        <p>Da indústria de óleo & gás à manufatura calçadista — empresas brasileiras que escolheram parar de gerir qualidade no Excel.</p>
      </div>

      <div className="clients-slider">
        <InfiniteSlider className="flex h-full w-full items-center" duration={32} gap={96}>
          {logos.map((l) => (
            <div key={l.id} className="clients-logo">
              <Image src={l.src} alt={l.name} width={220} height={l.h} style={{ height: l.h, width: 'auto', objectFit: 'contain' }} />
            </div>
          ))}
        </InfiniteSlider>
        <ProgressiveBlur
          className="pointer-events-none absolute top-0 left-0 h-full w-[200px]"
          direction="left"
          blurIntensity={1}
        />
        <ProgressiveBlur
          className="pointer-events-none absolute top-0 right-0 h-full w-[200px]"
          direction="right"
          blurIntensity={1}
        />
      </div>
    </section>
  )
}

// ── PAIN ────────────────────────────────────────────────────────────────────
function Pain() {
  const pains = [
    {
      titulo: 'Documento desatualizado no chão de fábrica.',
      sit: 'Você revisou. Mas a versão impressa de 2024 continua no posto.',
      antidote: 'Versão antiga **arquivada automaticamente**. Operador acessa só a vigente por QR.',
    },
    {
      titulo: 'NC aberta há meses, sem dono.',
      sit: '"Achei que era o fulano." A planilha virou cemitério de pendência.',
      antidote: 'Cada NC tem **responsável, prazo e CAPA**. Atrasou, escala.',
    },
    {
      titulo: 'Auditor amanhã. Nada centralizado.',
      sit: 'Três dias caçando registro em quatro pastas diferentes do drive.',
      antidote: 'Relatório por requisito **gerado em 1 clique**. Auditor recebe link.',
    },
  ]

  return (
    <section className="pain">
      <div className="wrap">
        <span className="eyebrow">A realidade do dia a dia</span>
        <h2 className="sec-title">Cenas que se repetem toda semana.</h2>

        <div className="pain-grid">
          {pains.map((p) => (
            <div className="pain-card" key={p.titulo}>
              <span className="badge">⚠ Risco de NC Maior</span>
              <h3>{p.titulo}</h3>
              <p className="sit">{p.sit}</p>
              <div className="antidote">
                <div className="a-ic">→</div>
                <div className="a-txt" dangerouslySetInnerHTML={{ __html: p.antidote.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>') }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── RESULTS ─────────────────────────────────────────────────────────────────
function Results() {
  return (
    <section className="results">
      <div className="wrap">
        <div className="head">
          <h2>O que muda em 90 dias.</h2>
          <p>{'// média observada entre clientes em produção. medido contra a linha de base do primeiro mês. amostra parcial — números atualizados a cada trimestre.'}</p>
        </div>
        <div className="stats-grid">
          <div className="stat">
            <div className="num"><span className="sym">−</span>87<span className="sym">%</span></div>
            <div className="lbl">tempo para fechar uma NC</div>
            <div className="sub">de 38 dias → 5 dias</div>
          </div>
          <div className="stat">
            <div className="num">100<span className="sym">%</span></div>
            <div className="lbl">rastreabilidade documental</div>
            <div className="sub">cada versão · cada acesso</div>
          </div>
          <div className="stat">
            <div className="num"><span className="sym">−</span>72<span className="sym">%</span></div>
            <div className="lbl">tempo de preparação para auditoria</div>
            <div className="sub">de 3 semanas → 4 dias</div>
          </div>
          <div className="stat">
            <div className="num">3<span className="sym">sem</span></div>
            <div className="lbl">para o SGQ entrar no ar</div>
            <div className="sub">implantação assistida</div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── HOW ─────────────────────────────────────────────────────────────────────
function How() {
  return (
    <section className="how" id="como">
      <div className="wrap">
        <span className="eyebrow">Como funciona</span>
        <h2 className="sec-title">Você não compra hoje. Marca uma conversa.</h2>

        <div className="steps">
          <div className="step">
            <div className="n">PASSO 01</div>
            <h3>Demo de 30 min</h3>
            <p>Você mostra seu cenário. A gente mostra o produto rodando no seu setor.</p>
            <span className="time">ao vivo · sem cartão</span>
          </div>
          <div className="step featured">
            <div className="n">PASSO 02</div>
            <h3>Configuramos juntos</h3>
            <p>Nossa equipe importa documentos, monta o organograma, treina seu time.</p>
            <span className="time">semanas 1 e 2</span>
          </div>
          <div className="step">
            <div className="n">PASSO 03</div>
            <h3>SGQ no ar</h3>
            <p>NCs sendo registradas, documentos controlados, indicadores rodando.</p>
            <span className="time">no fim da 3ª semana</span>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── MODULES ─────────────────────────────────────────────────────────────────
function Modules() {
  const timelineData = [
    {
      id: 1,
      title: 'Documentos',
      date: '§7.5',
      content: 'Controle de versão e distribuição. Aprovação multi-nível, QR por posto, histórico imutável.',
      category: 'Documentos',
      icon: FileText,
      relatedIds: [2, 6],
      status: 'completed' as const,
      energy: 100,
    },
    {
      id: 2,
      title: 'Não Conformidades',
      date: '§8.7',
      content: 'Tratativa com prazo e dono. Abertura via app, SLA por severidade, anexos: foto, PDF, áudio.',
      category: 'NC',
      icon: AlertTriangle,
      relatedIds: [1, 3],
      status: 'completed' as const,
      energy: 90,
    },
    {
      id: 3,
      title: 'CAPA',
      date: '§10.2',
      content: 'Ação corretiva com eficácia. 5 Porquês / Ishikawa, verificação 30/60/90, reabre se reincidir.',
      category: 'CAPA',
      icon: Wrench,
      relatedIds: [2, 4],
      status: 'in-progress' as const,
      energy: 80,
    },
    {
      id: 4,
      title: 'Indicadores',
      date: '§9.1',
      content: 'Monitoramento em tempo real. KPI com meta e tolerância, gráficos por processo, alerta de desvio.',
      category: 'KPI',
      icon: BarChart3,
      relatedIds: [3, 7],
      status: 'in-progress' as const,
      energy: 70,
    },
    {
      id: 5,
      title: 'Treinamentos',
      date: '§7.2',
      content: 'Competência e reciclagem. Matriz por cargo, retreinamento automático, certificado digital.',
      category: 'RH',
      icon: GraduationCap,
      relatedIds: [1, 6],
      status: 'in-progress' as const,
      energy: 60,
    },
    {
      id: 6,
      title: 'Auditorias',
      date: '§9.2',
      content: 'Checklist da norma embutido. Plano automatizado, coleta offline no app, relatório em 1 clique.',
      category: 'Auditoria',
      icon: ClipboardCheck,
      relatedIds: [1, 5, 8],
      status: 'pending' as const,
      energy: 50,
    },
    {
      id: 7,
      title: 'Riscos & Oportunidades',
      date: '§6.1',
      content: 'Pensamento baseado em risco. Matriz 5×5, plano de tratamento, revisão programada.',
      category: 'Risco',
      icon: ShieldAlert,
      relatedIds: [4, 8],
      status: 'pending' as const,
      energy: 40,
    },
    {
      id: 8,
      title: 'Registros',
      date: '§7.5.3',
      content: 'Templates sem código. Construtor drag & drop, assinatura eletrônica, retenção por tipo.',
      category: 'Registros',
      icon: FileSignature,
      relatedIds: [6, 9],
      status: 'pending' as const,
      energy: 30,
    },
    {
      id: 9,
      title: 'Fornecedores',
      date: '§8.4',
      content: 'Qualificação, avaliação e desempenho. Score por critério, requalificação programada, integração com NCs.',
      category: 'Suprimentos',
      icon: Truck,
      relatedIds: [2, 8],
      status: 'pending' as const,
      energy: 25,
    },
  ]

  return (
    <section id="modulos" className="mods-dark">
      <div className="wrap" style={{ paddingTop: 0, paddingBottom: 0 }}>
        <div className="head">
          <div>
            <span className="eyebrow eyebrow-dark">Módulos</span>
            <h2 className="sec-title sec-title-dark">Construído sobre a norma.</h2>
          </div>
          <p className="sec-sub sec-sub-dark" style={{ margin: 0, maxWidth: 360 }}>
            Cada módulo aponta o requisito da ISO 9001:2015. Clique nos nós para explorar.
          </p>
        </div>
      </div>
      <RadialOrbitalTimeline timelineData={timelineData} />
    </section>
  )
}

// ── FLY DOES (TYPEWRITER) ───────────────────────────────────────────────────
function FlyDoes() {
  return (
    <section className="fly-does">
      <div className="wrap">
        <span className="eyebrow eyebrow-dark">Enquanto você dorme</span>
        <h2 className="fly-does-title">
          <span>A Fly ISO </span>
          <Typewriter
            text={[
              'arquiva a versão antiga do documento.',
              'abre a NC e notifica o responsável.',
              'agenda o retreinamento do operador.',
              'calcula o indicador em tempo real.',
              'reabre a CAPA que reincidiu em 60 dias.',
              'monta o relatório de auditoria por requisito.',
              'envia o lembrete da revisão programada.',
              'gera o certificado digital de competência.',
            ]}
            speed={45}
            waitTime={1800}
            deleteSpeed={25}
            className="fly-does-accent"
            cursorChar="▌"
            cursorClassName="fly-does-cursor"
          />
        </h2>
        <p className="fly-does-sub">
          A plataforma executa em segundo plano o que sua equipe levaria semanas para fazer no Excel.
          Você cuida do negócio. A norma cuida-se sozinha.
        </p>
      </div>
    </section>
  )
}

// ── DIFFERENTIALS + COMPARE ─────────────────────────────────────────────────
function Differentials() {
  const diffs = [
    { n: '01', titulo: 'Retreinamento automático', desc: 'Documento revisado? Certificado vencido? O sistema agenda sozinho e bloqueia a função até concluir.' },
    { n: '02', titulo: 'Registros sem código',     desc: 'Cada empresa mede do seu jeito. Monte formulário, fluxo e relatório com drag and drop. Sem chamado pra TI.' },
    { n: '03', titulo: 'CAPA com eficácia real',   desc: 'Reabertura automática se o problema reincide em 30/60/90 dias. É o que a §10.2 pede.' },
    { n: '04', titulo: 'Sem fidelidade. De verdade.', desc: 'Cancele quando quiser, exporte tudo em PDF + JSON. Se a gente não estiver entregando, é justo poder sair.' },
  ]

  const rows = [
    'Controle de versão',
    'NC com prazo e dono',
    'Verificação de eficácia',
    'Relatório de auditoria automático',
    'Indicadores em tempo real',
    'Retreinamento automático',
    'Trilha de auditoria',
  ]

  const icons = [RefreshCw, Blocks, RotateCcw, Unlock]
  const diffsWithIcons = diffs.map((d, i) => ({ ...d, icon: icons[i] }))

  return (
    <section className="diff">
      <div className="wrap">
        <span className="eyebrow">Diferenciais</span>
        <h2 className="sec-title">O que outros não fazem — e a gente faz.</h2>

        <div className="diff10-grid">
          {diffsWithIcons.map((d) => (
            <FeatureCard key={d.n}>
              <CardHeader className="diff10-header">
                <CardHeading
                  icon={d.icon}
                  title={`Diferencial · ${d.n}`}
                  description={d.titulo}
                />
              </CardHeader>
              <div className="diff10-body">
                <p>{d.desc}</p>
              </div>
            </FeatureCard>
          ))}

          <FeatureCard className="diff10-compare">
            <h3 className="diff10-compare-title">
              Planilha &amp; e-mail × Fly ISO — a comparação honesta.
            </h3>
            <div className="diff10-compare-table">
              <table>
                <thead>
                  <tr>
                    <th></th>
                    <th>Planilha + email</th>
                    <th className="head-fly">Fly ISO</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r}>
                      <td className="lbl">{r}</td>
                      <td className="cell-n"><span>✗</span></td>
                      <td className="cell-y"><span>✓</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </FeatureCard>
        </div>
      </div>
    </section>
  )
}

// ── AUDITOR ─────────────────────────────────────────────────────────────────
function Auditor() {
  return (
    <section className="auditor">
      <div className="wrap">
        <span className="eyebrow">Quem está por trás</span>
        <h2 className="sec-title">A régua usada por quem certifica.</h2>
        <p className="sec-sub">
          Cada tela do Fly ISO foi validada por um Auditor Líder ISO 9001 reconhecido pelo IRCA Inglaterra —
          não por programadores adivinhando o que a norma pede.
        </p>

        <div className="aud-grid">
          <div>
            <div className="aud-portrait">
              <Image
                src="/rafael-palheta.jpg"
                alt="Rafael F. Palheta — Lead Auditor IRCA"
                fill
                sizes="(max-width: 768px) 320px, 360px"
                style={{ objectFit: 'cover', objectPosition: 'center top' }}
                priority={false}
              />
            </div>
            <div className="aud-name">Rafael F. Palheta</div>
            <div className="aud-role">
              <b>Lead Auditor IRCA</b> · Bureau Veritas (UK) · Master Coach em Gestão e Liderança · Manaus/AM
            </div>
          </div>

          <div>
            <div className="aud-stats">
              <div className="aud-stat">
                <div className="v">17</div>
                <div className="l">empresas certificadas pessoalmente em ISO 9001, 14001, 45001 e 13485</div>
              </div>
              <div className="aud-stat">
                <div className="v">26<span className="sym">a</span></div>
                <div className="l">de carreira dedicada exclusivamente a Sistemas de Gestão da Qualidade</div>
              </div>
              <div className="aud-stat">
                <div className="v">3</div>
                <div className="l">registros distintos como Lead Auditor — ABNT, Bureau Veritas e IRCA UK</div>
              </div>
            </div>

            <blockquote className="aud-quote">
              &ldquo;Em 26 anos auditando, vi muito sistema bonito que não passa em auditoria e muita planilha que passou.
              O Fly ISO foi pensado no oposto: é o que eu pediria se entrasse aqui como auditor terceiro.&rdquo;
              <span className="sig">— Rafael F. Palheta · Lead Auditor IRCA · BVBR0000172015</span>
            </blockquote>

            <div className="creds">
              <div className="cred">
                <div className="org">IRCA · UK</div>
                <div className="ttl">Lead Auditor ISO 9001</div>
                <div className="reg">Bureau Veritas · BVBR0000172015</div>
              </div>
              <div className="cred">
                <div className="org">IRCA · UK</div>
                <div className="ttl">Lead Auditor ISO 14001</div>
                <div className="reg">Bureau Veritas · BVBR0000189715</div>
              </div>
              <div className="cred">
                <div className="org">ABNT · ABENDI · RAC</div>
                <div className="ttl">Auditor Líder ISO 9001</div>
                <div className="reg">Reg. 33-9450 / 7958 / 24233-2</div>
              </div>
              <div className="cred">
                <div className="org">ANVISA</div>
                <div className="ttl">Auditor Interno RDC 665/2022</div>
                <div className="reg">BPF · produtos médicos</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── PRICING ─────────────────────────────────────────────────────────────────
function Pricing() {
  return (
    <section id="precos">
      <div className="wrap">
        <span className="eyebrow">Planos</span>
        <h2 className="sec-title">Preço transparente. Implantação inclusa no fluxo.</h2>
        <p className="sec-sub">Mensalidade em reais. Implantação cobrada uma única vez. Sem fidelidade.</p>

        <div className="pricing-grid">
          <div className="plan">
            <div className="name">Essencial</div>
            <div className="price"><span className="currency">R$</span>490<small>/mês</small></div>
            <div className="who">Até 25 colaboradores · 1 unidade</div>
            <div className="impl">
              <span>Implantação única</span>
              <b style={{ color: 'var(--ink)' }}>R$ 1.490</b>
            </div>
            <ul>
              <li>Documentos, NCs, Ações, Indicadores</li>
              <li>2 administradores</li>
              <li>Suporte por e-mail (24h úteis)</li>
              <li>5 GB de armazenamento</li>
            </ul>
            <a href="#agendar" className="btn btn-dark cta">Agendar demo</a>
            <span className="no-fid">⚡ Sem fidelidade</span>
          </div>

          <div className="plan featured">
            <span className="ribbon">⭑ Mais escolhido</span>
            <div className="name">Profissional</div>
            <div className="price"><span className="currency">R$</span>990<small>/mês</small></div>
            <div className="who">Até 100 colaboradores · 3 unidades</div>
            <div className="impl">
              <span>Implantação única</span>
              <b style={{ color: 'var(--ink)' }}>R$ 2.990</b>
            </div>
            <ul>
              <li>Todos os 8 módulos liberados</li>
              <li>Administradores ilimitados</li>
              <li>Suporte por WhatsApp (4h úteis)</li>
              <li>CAPA com eficácia + Auditorias</li>
              <li>Registros sem código</li>
              <li>50 GB de armazenamento</li>
            </ul>
            <a href="#agendar" className="btn btn-primary cta">Agendar demo</a>
            <span className="no-fid">⚡ Sem fidelidade</span>
          </div>

          <div className="plan">
            <div className="name">Corporativo</div>
            <div className="price" style={{ fontSize: 32, marginTop: 18 }}>Sob consulta</div>
            <div className="who">Multi-unidade · 100+ colaboradores</div>
            <div className="impl">
              <span>Implantação dedicada</span>
              <b style={{ color: 'var(--ink)' }}>Custom</b>
            </div>
            <ul>
              <li>Tudo do Profissional</li>
              <li>SSO, SAML, provisionamento</li>
              <li>SLA contratual + gerente dedicado</li>
              <li>API · integração ERP/BI</li>
              <li>Armazenamento ilimitado</li>
            </ul>
            <a href="#agendar" className="btn btn-dark cta">Falar com vendas</a>
            <span className="no-fid">⚡ Sem fidelidade</span>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── SIMULATOR ───────────────────────────────────────────────────────────────
type PainKey = 'nc' | 'docs' | 'train' | 'ind'

const PRIORITY_COPY: Record<PainKey, { module: string; why: string }> = {
  nc:    { module: 'Não Conformidades', why: 'Em 3 semanas, todas as NCs em andamento com responsável, prazo e CAPA.' },
  docs:  { module: 'Documentos',         why: 'Versão controlada, QR no posto, distribuição automática.' },
  train: { module: 'Treinamentos',       why: 'Matriz por cargo, retreinamento automático, certificado digital.' },
  ind:   { module: 'Indicadores',        why: 'KPIs com meta, gráficos por processo, alerta de desvio.' },
}

function Simulator() {
  const [colab, setColab] = useState(35)
  const [docs, setDocs]   = useState(80)
  const [pain, setPain]   = useState<PainKey>('nc')

  let plan: string, price: string
  if (colab <= 25 && docs <= 100) {
    plan = 'Essencial'
    price = 'R$ 490/mês · implantação R$ 1.490'
  } else if (colab <= 100 && docs <= 300) {
    plan = 'Profissional'
    price = 'R$ 990/mês · implantação R$ 2.990'
  } else {
    plan = 'Corporativo'
    price = 'Valor sob consulta · implantação dedicada'
  }

  const priorityMeta = PRIORITY_COPY[pain]

  return (
    <section className="sim" id="simulador">
      <div className="wrap inner">
        <span className="eyebrow sim-eyebrow">Simule seu SGQ</span>
        <h2 className="sec-title">30 segundos. Sem cadastro.</h2>
        <p className="sec-sub">Chegue na demo já sabendo por onde começar.</p>

        <div className="sim-grid">
          <div>
            <div className="q">
              <div className="qlabel">
                <span><span className="num">01 ·</span> Quantos colaboradores?</span>
                <span className="qval">{colab}</span>
              </div>
              <input
                className="slider" type="range" min={5} max={300} step={5}
                value={colab} onChange={(e) => setColab(Number(e.target.value))}
              />
              <div className="slider-ticks"><span>5</span><span>300+</span></div>
            </div>
            <div className="q">
              <div className="qlabel">
                <span><span className="num">02 ·</span> Documentos ativos hoje?</span>
                <span className="qval">{docs}</span>
              </div>
              <input
                className="slider" type="range" min={10} max={500} step={10}
                value={docs} onChange={(e) => setDocs(Number(e.target.value))}
              />
              <div className="slider-ticks"><span>10</span><span>500+</span></div>
            </div>
            <div className="q">
              <div className="qlabel">
                <span><span className="num">03 ·</span> Onde está sua dor maior?</span>
              </div>
              <div className="chips">
                {([
                  { v: 'nc',    label: 'Não conformidades' },
                  { v: 'docs',  label: 'Documentos' },
                  { v: 'train', label: 'Treinamentos' },
                  { v: 'ind',   label: 'Indicadores' },
                ] as Array<{ v: PainKey; label: string }>).map((c) => (
                  <button
                    key={c.v}
                    type="button"
                    className={`chip ${pain === c.v ? 'active' : ''}`}
                    onClick={() => setPain(c.v)}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="sim-out">
            <div className="lbl">Plano recomendado</div>
            <div className="plan-rec">{plan}</div>
            <div className="price-rec">{price}</div>
            <div className="div"></div>
            <div className="lbl">Por onde começar</div>
            <div className="priority" style={{ marginTop: 6 }}>
              Comece pelo módulo de <b>{priorityMeta.module}</b>. {priorityMeta.why}
            </div>
            <div className="summary">
              {'// configuração estimada'}<br />
              colaboradores: <b>{colab}</b><br />
              documentos: <b>{docs}</b><br />
              módulo prioritário: <b>{priorityMeta.module.toLowerCase()}</b><br />
              implantação: <b>3 semanas</b>
            </div>
            <a href="#agendar" className="btn btn-primary cta">Agendar demo personalizada →</a>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── FAQ ─────────────────────────────────────────────────────────────────────
const FAQS = [
  { q: 'Preciso de consultor para implantar?',
    a: 'Não. Nossa equipe faz a implantação inicial junto com você — incluso no valor único. Consultor externo é opcional.' },
  { q: 'Posso cancelar quando quiser?',
    a: 'Sim. Sem fidelidade. Avise com 30 dias e exportamos tudo em PDF + JSON, sem custo.' },
  { q: 'Onde meus dados ficam armazenados?',
    a: 'Servidores no Brasil (São Paulo). Criptografia AES-256. LGPD-compliant. Backup diário geo-redundante.' },
  { q: 'Funciona com múltiplas unidades?',
    a: 'Sim. Cada unidade com escopo próprio e visão consolidada no corporativo. Plano Profissional (3 unidades) ou Corporativo (ilimitado).' },
  { q: 'Quanto tempo até estar 100% operacional?',
    a: '3 semanas para o SGQ no ar. 90 dias para usar todos os módulos com fluidez.' },
  { q: 'E se eu já uso outra ferramenta?',
    a: 'A gente migra. Documentos, planilhas de NCs, registros de treinamento — no formato que tiver. Migração inicial (até 200 docs) inclusa.' },
  { q: 'Atendem outras normas além da 9001?',
    a: 'Hoje, foco é ISO 9001:2015. Estrutura serve para 14001 e 45001, mas checklists prontos ainda não. Roadmap aberto na demo.' },
  { q: 'Como é o suporte no dia a dia?',
    a: 'WhatsApp direto com equipe técnica. SLA de 4h úteis no Profissional, 1h útil no Corporativo. Sem bot.' },
]

function Faq() {
  const [open, setOpen] = useState<number>(0)

  return (
    <section className="faq" id="faq">
      <div className="wrap">
        <div className="faq-grid">
          <div>
            <span className="eyebrow">Perguntas frequentes</span>
            <h2 className="sec-title" style={{ fontSize: 'clamp(28px,3.4vw,38px)' }}>
              As coisas que a gente já te responderia na demo.
            </h2>
            <p className="sec-sub">Faltou alguma? Manda no WhatsApp.</p>
          </div>
          <div className="faq-list">
            {FAQS.map((f, i) => (
              <div key={f.q} className={`faq-item ${open === i ? 'open' : ''}`}>
                <button className="faq-q" onClick={() => setOpen(open === i ? -1 : i)}>
                  {f.q} <span className="plus">+</span>
                </button>
                <div className="faq-a"><p>{f.a}</p></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ── FINAL CTA ───────────────────────────────────────────────────────────────
function FinalCta() {
  return (
    <section className="final" id="agendar">
      <div className="wrap">
        <h2>Seu próximo auditor vai <em>gostar</em><br />do que vai ver.</h2>
        <p>30 minutos. Sem cartão, sem compromisso. A gente abre o produto e mostra o seu caso.</p>
        <div className="ctas">
          <a href="https://wa.me/559285460332" className="btn btn-wa btn-lg">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.5 14.4c-.3-.1-1.7-.9-2-1s-.5-.1-.7.1c-.2.3-.8 1-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3zM12 2C6.5 2 2 6.5 2 12c0 1.9.5 3.6 1.4 5.1L2 22l5-1.3c1.5.8 3.2 1.3 5 1.3 5.5 0 10-4.5 10-10S17.5 2 12 2zm0 18.3c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-3.2.8.9-3.1-.2-.3C3.9 15 3.5 13.5 3.5 12 3.5 7.3 7.3 3.5 12 3.5s8.5 3.8 8.5 8.5-3.8 8.3-8.5 8.3z" />
            </svg>
            Falar no WhatsApp
          </a>
          <a href="mailto:contato@flyiso.com.br" className="btn btn-ghost btn-lg btn-ghost-dark">
            contato@flyiso.com.br
          </a>
        </div>
        <div className="meta">demo · 30 min · ao vivo · sem cadastro</div>
      </div>
    </section>
  )
}

// ── FOOTER ──────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="grid">
          <div>
            <div className="logo logo-img">
              <Image
                src="/fly-iso-logo-white.png"
                alt="Fly ISO"
                width={120}
                height={120}
                style={{ width: 96, height: 'auto', objectFit: 'contain' }}
              />
            </div>
            <p className="about">Plataforma de SGQ para PMEs industriais. ISO 9001:2015 sem planilha, sem caos.</p>
          </div>
          <div className="col">
            <h5>Produto</h5>
            <a href="#modulos">Módulos</a>
            <a href="#precos">Preços</a>
            <a href="#simulador">Simulador</a>
            <a href="#faq">FAQ</a>
          </div>
          <div className="col">
            <h5>Empresa</h5>
            <a href="#">Sobre</a>
            <a href="#">Roadmap</a>
            <a href="#">Status</a>
            <a href="#">Privacidade</a>
          </div>
          <div className="col">
            <h5>Contato</h5>
            <a href="https://wa.me/559285460332">WhatsApp</a>
            <a href="mailto:contato@flyiso.com.br">contato@flyiso.com.br</a>
          </div>
        </div>
        <div className="bottom">
          <span>© 2026 Fly ISO</span>
          <span>app.flyiso.com.br</span>
        </div>
      </div>
    </footer>
  )
}

// ── WhatsApp float ──────────────────────────────────────────────────────────
function WhatsAppFloat() {
  return (
    <a href="https://wa.me/559285460332" className="wa-float" aria-label="WhatsApp">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
        <path d="M17.5 14.4c-.3-.1-1.7-.9-2-1s-.5-.1-.7.1c-.2.3-.8 1-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3zM12 2C6.5 2 2 6.5 2 12c0 1.9.5 3.6 1.4 5.1L2 22l5-1.3c1.5.8 3.2 1.3 5 1.3 5.5 0 10-4.5 10-10S17.5 2 12 2zm0 18.3c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-3.2.8.9-3.1-.2-.3C3.9 15 3.5 13.5 3.5 12 3.5 7.3 7.3 3.5 12 3.5s8.5 3.8 8.5 8.5-3.8 8.3-8.5 8.3z" />
      </svg>
    </a>
  )
}
