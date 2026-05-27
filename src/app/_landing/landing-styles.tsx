/**
 * Estilos da Landing Page — escopados sob .lp-root para não vazar
 * para o dashboard ou outras páginas. Preservam o design v2 entregue
 * pelo Claude Design (HTML/CSS original).
 */
export function LandingStyles() {
  return (
    <style>{`
.lp-root {
  --blue: #1E40AF;
  --blue-2: #0EA5E9;
  --blue-deep: #0B2A8C;
  --green: #10B981;
  --amber: #F59E0B;
  --red: #EF4444;
  --ink: #0F172A;
  --ink-2: #1E293B;
  --paper: #F8FAFC;
  --paper-2: #F1F5F9;
  --line: #E2E8F0;
  --line-2: #CBD5E1;
  --mute: #64748B;
  --mute-2: #475569;
  --yellow: #FACC15;
  --yellow-2: #EAB308;
  --bg: #ffffff;
  --r: 4px;

  background: var(--bg);
  color: var(--ink);
  font-family: 'Inter', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
  font-size: 16px;
  line-height: 1.55;
  scroll-behavior: smooth;
}
.lp-root *, .lp-root *::before, .lp-root *::after { box-sizing: border-box; }
.lp-root h1, .lp-root h2, .lp-root h3, .lp-root h4 {
  font-family: 'Manrope', sans-serif; letter-spacing: -0.02em; margin: 0; color: var(--ink);
}
.lp-root h1 { font-weight: 800; }
.lp-root h2 { font-weight: 700; }
.lp-root .mono { font-family: 'JetBrains Mono', ui-monospace, monospace; }
.lp-root a { color: inherit; text-decoration: none; }
.lp-root button { font-family: inherit; cursor: pointer; border: none; background: none; }

/* layout */
.lp-root .wrap { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
.lp-root section { padding: 96px 0; }
.lp-root .eyebrow {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase;
  color: var(--blue); font-weight: 500;
  display: inline-flex; align-items: center; gap: 8px;
}
.lp-root .eyebrow::before { content: ""; width: 18px; height: 1px; background: var(--blue); }

/* nav */
.lp-root nav.top {
  position: sticky; top: 0; z-index: 50;
  background: rgba(255,255,255,0.85);
  backdrop-filter: saturate(1.4) blur(10px);
  border-bottom: 1px solid var(--line);
}
.lp-root nav.top .inner {
  max-width: 1200px; margin: 0 auto; padding: 14px 24px;
  display: flex; align-items: center; justify-content: space-between;
}
.lp-root nav.top .links { display: flex; gap: 32px; }
.lp-root nav.top .links a { color: var(--mute-2); font-size: 14px; font-weight: 500; }
.lp-root nav.top .links a:hover { color: var(--ink); }
.lp-root .logo { display: flex; align-items: center; gap: 10px; }
.lp-root .logo .mark { width: 32px; height: 24px; }
.lp-root .logo .logo-text { font-family: 'Manrope', sans-serif; font-weight: 800; font-size: 19px; letter-spacing: -0.02em; }
.lp-root .logo .logo-text b { color: var(--blue); font-weight: 800; }

/* buttons */
.lp-root .btn {
  display: inline-flex; align-items: center; gap: 10px;
  height: 44px; padding: 0 20px; border-radius: 2px;
  font-weight: 600; font-size: 14px; letter-spacing: -0.005em;
  transition: transform .15s ease, box-shadow .2s ease, background .2s ease, color .2s ease;
  white-space: nowrap;
}
.lp-root .btn-primary {
  background: var(--yellow); color: var(--ink);
  box-shadow: 0 1px 0 rgba(15,23,42,0.08), 0 8px 24px -8px rgba(250,204,21,0.6);
}
.lp-root .btn-primary:hover { background: var(--yellow-2); transform: translateY(-1px); }
.lp-root .btn-ghost { background: transparent; color: var(--ink); border: 1px solid var(--line-2); }
.lp-root .btn-ghost:hover { border-color: var(--ink); }
.lp-root .btn-ghost-dark { background: rgba(255,255,255,0.08); color: white; border-color: rgba(255,255,255,0.2); }
.lp-root .btn-dark { background: var(--ink); color: white; }
.lp-root .btn-dark:hover { background: var(--ink-2); }
.lp-root .btn-wa { background: #25D366; color: white; }
.lp-root .btn-lg { height: 56px; padding: 0 28px; font-size: 15px; }

/* HERO */
.lp-root .hero {
  padding: 72px 0 96px;
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(1200px 600px at 85% -10%, rgba(30,64,175,0.06), transparent 60%),
    radial-gradient(800px 400px at 15% 110%, rgba(14,165,233,0.05), transparent 60%),
    #fff;
}
.lp-root .hero-grid {
  display: grid; grid-template-columns: 1fr 1.1fr; gap: 60px; align-items: center;
}
.lp-root .hero h1 {
  font-size: clamp(40px, 5.4vw, 64px);
  line-height: 1.02;
  letter-spacing: -0.035em;
  margin-top: 22px;
}
.lp-root .hero h1 .accent {
  color: var(--blue);
  position: relative;
  white-space: nowrap;
}
.lp-root .hero h1 .accent::after {
  content: ""; position: absolute; left: 0; right: 0; bottom: 4px; height: 12px;
  background: var(--yellow); opacity: 0.35; z-index: -1;
}
.lp-root .hero .sub {
  margin-top: 22px; font-size: 18px; color: var(--mute-2); max-width: 480px; line-height: 1.5;
}
.lp-root .hero .ctas { margin-top: 32px; display: flex; gap: 10px; flex-wrap: wrap; }
.lp-root .hero-meta {
  margin-top: 28px; display: flex; gap: 24px; flex-wrap: wrap;
  font-family: 'JetBrains Mono', monospace; font-size: 11.5px; color: var(--mute-2);
}
.lp-root .hero-meta span b { color: var(--ink); font-weight: 600; }

/* HUB DIAGRAM */
.lp-root .hub-stage {
  position: relative; width: 100%; aspect-ratio: 11 / 8;
  background: var(--paper); border: 1px solid var(--line); overflow: hidden;
}
.lp-root .hub-stage::before {
  content: ""; position: absolute; inset: 0;
  background-image:
    linear-gradient(rgba(30,64,175,0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(30,64,175,0.05) 1px, transparent 1px);
  background-size: 40px 40px; pointer-events: none;
}
.lp-root .hub-stage .stamp {
  position: absolute; top: 14px; left: 16px;
  font-family: 'JetBrains Mono', monospace; font-size: 10px; color: var(--mute);
  letter-spacing: 0.1em; text-transform: uppercase;
}
.lp-root .hub-stage .stamp-r {
  position: absolute; top: 14px; right: 16px;
  font-family: 'JetBrains Mono', monospace; font-size: 10px; color: var(--mute);
  letter-spacing: 0.1em; text-transform: uppercase;
  display: inline-flex; align-items: center; gap: 6px;
}
.lp-root .hub-stage .stamp-r .live-dot {
  width: 6px; height: 6px; background: var(--green);
  animation: lp-blink 1.4s ease-in-out infinite;
}
@keyframes lp-blink { 0%,100%{opacity:1} 50%{opacity:.3} }
.lp-root .hub-svg { position: absolute; inset: 0; width: 100%; height: 100%; }
.lp-root .hub-svg .conn {
  stroke-width: 2.5; fill: none; stroke-dasharray: 5 7;
  animation: lp-dashflow 1.3s linear infinite, lp-statusCycle 16s ease-in-out infinite;
}
@keyframes lp-dashflow { to { stroke-dashoffset: -12; } }
@keyframes lp-statusCycle {
  0%, 64%   { stroke: #10B981; }
  68%, 76%  { stroke: #F59E0B; }
  80%, 88%  { stroke: #EF4444; }
  92%, 100% { stroke: #10B981; }
}
@keyframes lp-statusFill {
  0%, 64%   { fill: #10B981; }
  68%, 76%  { fill: #F59E0B; }
  80%, 88%  { fill: #EF4444; }
  92%, 100% { fill: #10B981; }
}
.lp-root .hub-svg .dot { animation: lp-statusFill 16s ease-in-out infinite; }
.lp-root .c0, .lp-root .d0 { animation-delay:   0s, 0s; }
.lp-root .c1, .lp-root .d1 { animation-delay:  -2s, -2s; }
.lp-root .c2, .lp-root .d2 { animation-delay:  -4s, -4s; }
.lp-root .c3, .lp-root .d3 { animation-delay:  -6s, -6s; }
.lp-root .c4, .lp-root .d4 { animation-delay:  -8s, -8s; }
.lp-root .c5, .lp-root .d5 { animation-delay: -10s, -10s; }
.lp-root .c6, .lp-root .d6 { animation-delay: -12s, -12s; }
.lp-root .c7, .lp-root .d7 { animation-delay: -14s, -14s; }

.lp-root .hub-legend {
  display: flex; gap: 18px; margin-top: 14px;
  font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--mute-2);
  flex-wrap: wrap;
}
.lp-root .hub-legend .it { display: inline-flex; align-items: center; gap: 8px; }
.lp-root .hub-legend .sw { width: 10px; height: 10px; }

/* trust bar */
.lp-root .trust { background: var(--ink); color: white; padding: 22px 0; }
.lp-root .trust .row {
  display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 18px;
  font-family: 'Manrope', sans-serif; font-weight: 600; font-size: 13.5px;
}
.lp-root .trust .row span { display: inline-flex; align-items: center; gap: 8px; }
.lp-root .trust .row span::before { content: ""; width: 6px; height: 6px; background: var(--yellow); display: inline-block; }
.lp-root .trust .row .sep { color: rgba(255,255,255,0.25); }
.lp-root .trust .row .sep::before { display: none; }

/* section title */
.lp-root .sec-title { font-size: clamp(32px, 4.2vw, 46px); line-height: 1.05; max-width: 740px; margin-top: 14px; }
.lp-root .sec-sub { color: var(--mute-2); font-size: 16.5px; max-width: 620px; margin-top: 12px; }

/* PAIN */
.lp-root .pain { background: var(--paper); }
.lp-root .pain-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 44px; }
.lp-root .pain-card {
  background: white; border: 1px solid var(--line); border-radius: var(--r); padding: 26px;
  position: relative;
}
.lp-root .pain-card .badge {
  display: inline-flex; align-items: center; gap: 6px;
  background: #FEE2E2; color: #B91C1C;
  padding: 4px 8px;
  font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 600;
  letter-spacing: 0.06em; text-transform: uppercase;
}
.lp-root .pain-card h3 { font-size: 22px; margin-top: 16px; line-height: 1.2; }
.lp-root .pain-card .sit { color: var(--mute-2); margin-top: 10px; font-size: 14.5px; }
.lp-root .pain-card .antidote {
  margin-top: 18px; padding-top: 14px; border-top: 1px dashed var(--line-2);
  display: flex; gap: 10px; align-items: flex-start;
}
.lp-root .pain-card .antidote .a-ic {
  flex-shrink: 0; width: 22px; height: 22px; background: var(--blue);
  color: white; font-size: 13px; display: grid; place-items: center; font-weight: 700;
}
.lp-root .pain-card .antidote .a-txt { font-size: 13.5px; color: var(--ink); line-height: 1.45; }
.lp-root .pain-card .antidote .a-txt b { color: var(--blue); }

/* RESULTS */
.lp-root .results {
  background: var(--ink); color: white; padding: 80px 0;
  position: relative; overflow: hidden;
}
.lp-root .results::before {
  content: ""; position: absolute; inset: 0;
  background:
    radial-gradient(500px 250px at 15% 30%, rgba(30,64,175,0.4), transparent 60%),
    radial-gradient(500px 250px at 85% 70%, rgba(14,165,233,0.25), transparent 60%);
  pointer-events: none;
}
.lp-root .results .wrap { position: relative; }
.lp-root .results .head { display: flex; justify-content: space-between; align-items: flex-end; gap: 40px; flex-wrap: wrap; }
.lp-root .results h2 { color: white; font-size: clamp(28px, 3.6vw, 40px); max-width: 600px; line-height: 1.1; }
.lp-root .results .head p { color: rgba(255,255,255,0.65); font-size: 14.5px; max-width: 360px; font-family: 'JetBrains Mono', monospace; line-height: 1.6; }
.lp-root .stats-grid {
  display: grid; grid-template-columns: repeat(4, 1fr);
  margin-top: 48px; border: 1px solid rgba(255,255,255,0.1);
}
.lp-root .stat { padding: 28px; border-right: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.02); }
.lp-root .stat:last-child { border-right: none; }
.lp-root .stat .num {
  font-family: 'Manrope', sans-serif; font-weight: 800; font-size: 56px;
  letter-spacing: -0.04em; line-height: 1; color: white;
  display: flex; align-items: baseline; gap: 4px;
}
.lp-root .stat .num .sym { color: var(--yellow); font-size: 36px; font-weight: 700; }
.lp-root .stat .lbl { margin-top: 14px; font-size: 14px; color: rgba(255,255,255,0.85); line-height: 1.4; font-weight: 500; }
.lp-root .stat .sub {
  margin-top: 8px; font-family: 'JetBrains Mono', monospace; font-size: 10.5px;
  color: rgba(255,255,255,0.45); letter-spacing: 0.04em; text-transform: uppercase;
}

/* HOW */
.lp-root .how { background: white; }
.lp-root .steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-top: 48px; }
.lp-root .step { background: var(--paper); border: 1px solid var(--line); border-radius: var(--r); padding: 26px; position: relative; }
.lp-root .step .n { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--blue); letter-spacing: 0.1em; font-weight: 600; }
.lp-root .step h3 { font-size: 22px; margin-top: 14px; }
.lp-root .step p { color: var(--mute-2); margin-top: 8px; font-size: 14.5px; }
.lp-root .step .time {
  margin-top: 16px; display: inline-flex; align-items: center; gap: 8px;
  font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--mute-2);
  padding: 4px 10px; background: white; border: 1px solid var(--line);
}
.lp-root .step.featured { background: var(--ink); border-color: var(--ink); color: white; }
.lp-root .step.featured h3 { color: white; }
.lp-root .step.featured p { color: rgba(255,255,255,0.7); }
.lp-root .step.featured .n { color: var(--yellow); }
.lp-root .step.featured .time { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.7); border-color: rgba(255,255,255,0.15); }

/* MODULES */
.lp-root .mods .head { display: flex; align-items: flex-end; justify-content: space-between; gap: 40px; flex-wrap: wrap; }
.lp-root .mods-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-top: 44px; }
.lp-root .mod {
  position: relative; background: white; border: 1px solid var(--line); border-radius: var(--r);
  padding: 22px; cursor: pointer; overflow: hidden;
  transition: border-color .25s ease, transform .25s ease, box-shadow .25s ease;
}
.lp-root .mod:hover {
  border-color: var(--blue);
  box-shadow: 0 10px 40px -15px rgba(30,64,175,0.35);
  transform: translateY(-2px);
}
.lp-root .mod .iso { font-family: 'JetBrains Mono', monospace; font-size: 22px; color: var(--blue); font-weight: 500; letter-spacing: -0.02em; }
.lp-root .mod h4 { font-family: 'Manrope', sans-serif; font-weight: 700; font-size: 17px; margin-top: 18px; letter-spacing: -0.01em; }
.lp-root .mod .desc { color: var(--mute); font-size: 13px; margin-top: 6px; min-height: 36px; }
.lp-root .mod .feats { margin-top: 16px; max-height: 0; overflow: hidden; transition: max-height .35s ease; }
.lp-root .mod:hover .feats { max-height: 160px; }
.lp-root .mod .feats ul { list-style: none; padding: 0; margin: 0; }
.lp-root .mod .feats li {
  font-size: 12px; color: var(--ink-2);
  padding: 6px 0; border-top: 1px solid var(--line);
  display: flex; align-items: center; gap: 8px;
}
.lp-root .mod .feats li::before { content: ""; width: 5px; height: 5px; background: var(--blue); }
.lp-root .mod .arrow {
  position: absolute; top: 22px; right: 22px;
  width: 28px; height: 28px;
  border: 1px solid var(--line); display: grid; place-items: center;
  transition: background .2s, color .2s, border-color .2s;
  color: var(--mute);
}
.lp-root .mod:hover .arrow { background: var(--blue); border-color: var(--blue); color: white; }

/* DIFFERENTIALS + COMPARE */
.lp-root .diff { background: var(--paper); }
.lp-root .diff-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 36px; margin-top: 44px; align-items: start; }
.lp-root .diff-list { display: flex; flex-direction: column; gap: 12px; }
.lp-root .diff-item {
  background: white; border: 1px solid var(--line); border-radius: var(--r); padding: 22px 24px;
  display: grid; grid-template-columns: 36px 1fr; gap: 18px;
}
.lp-root .diff-item .num { font-family: 'JetBrains Mono', monospace; color: var(--blue); font-weight: 600; font-size: 13px; padding-top: 2px; }
.lp-root .diff-item h4 { font-family: 'Manrope', sans-serif; font-size: 17px; font-weight: 700; }
.lp-root .diff-item p { color: var(--mute-2); margin: 6px 0 0; font-size: 14px; }

.lp-root .compare {
  background: var(--ink); color: white;
  border-radius: var(--r); padding: 28px;
  position: sticky; top: 90px;
}
.lp-root .compare h3 { color: white; font-size: 22px; }
.lp-root .compare .sub { color: rgba(255,255,255,0.6); font-size: 13.5px; margin-top: 6px; }
.lp-root .ctable { margin-top: 22px; width: 100%; border-collapse: collapse; }
.lp-root .ctable th, .lp-root .ctable td { padding: 12px 10px; border-bottom: 1px solid rgba(255,255,255,0.08); font-size: 13px; text-align: left; }
.lp-root .ctable th { color: rgba(255,255,255,0.5); font-family: 'JetBrains Mono', monospace; font-weight: 500; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.06em; }
.lp-root .ctable th:nth-child(2), .lp-root .ctable th:nth-child(3),
.lp-root .ctable td:nth-child(2), .lp-root .ctable td:nth-child(3) { text-align: center; width: 110px; }
.lp-root .ctable td.lbl { color: white; }
.lp-root .ctable .y { color: var(--green); font-weight: 700; }
.lp-root .ctable .n { color: var(--red); font-weight: 700; }
.lp-root .ctable .col-fly { background: rgba(30,64,175,0.18); }
.lp-root .ctable .head-fly { color: var(--yellow); }

/* AUDITOR */
.lp-root .auditor { background: white; }
.lp-root .aud-grid { display: grid; grid-template-columns: 360px 1fr; gap: 48px; margin-top: 44px; align-items: start; }
.lp-root .aud-portrait {
  position: relative; aspect-ratio: 3 / 4;
  background: var(--ink); color: white;
  display: grid; place-items: center; overflow: hidden;
}
.lp-root .aud-portrait::before {
  content: ""; position: absolute; inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
  background-size: 32px 32px;
}
.lp-root .aud-portrait .mono-bg {
  position: absolute; inset: 0;
  background: linear-gradient(180deg, transparent 0%, transparent 60%, rgba(30,64,175,0.35) 100%);
}
.lp-root .aud-portrait .initials {
  position: relative; z-index: 1;
  font-family: 'Manrope', sans-serif; font-weight: 800; font-size: 140px;
  letter-spacing: -0.05em; line-height: 1; color: white;
}
.lp-root .aud-portrait .ph-tag {
  position: absolute; top: 14px; left: 16px; z-index: 1;
  font-family: 'JetBrains Mono', monospace; font-size: 10px;
  color: rgba(255,255,255,0.5); letter-spacing: 0.12em; text-transform: uppercase;
}
.lp-root .aud-portrait .ph-tag::before {
  content: ""; display: inline-block; width: 14px; height: 1px;
  background: rgba(255,255,255,0.5); margin-right: 8px; vertical-align: middle;
}
.lp-root .aud-portrait .ph-foot {
  position: absolute; bottom: 14px; left: 16px; right: 16px; z-index: 1;
  display: flex; justify-content: space-between; align-items: flex-end;
  font-family: 'JetBrains Mono', monospace; font-size: 10px; color: rgba(255,255,255,0.55);
  letter-spacing: 0.06em; text-transform: uppercase;
}
.lp-root .aud-portrait .ph-foot .yellow { color: var(--yellow); }
.lp-root .aud-name {
  margin-top: 18px; font-family: 'Manrope', sans-serif; font-weight: 800; font-size: 22px;
  letter-spacing: -0.02em; color: var(--ink);
}
.lp-root .aud-role { margin-top: 4px; font-size: 13.5px; color: var(--mute-2); }
.lp-root .aud-role b { color: var(--ink); font-weight: 600; }

.lp-root .aud-stats { display: grid; grid-template-columns: repeat(3, 1fr); border: 1px solid var(--line); margin-bottom: 28px; }
.lp-root .aud-stat { padding: 22px 20px; border-right: 1px solid var(--line); }
.lp-root .aud-stat:last-child { border-right: none; }
.lp-root .aud-stat .v {
  font-family: 'Manrope', sans-serif; font-weight: 800; font-size: 48px;
  color: var(--blue); letter-spacing: -0.03em; line-height: 1;
}
.lp-root .aud-stat .v .sym { color: var(--ink); font-size: 28px; font-weight: 700; }
.lp-root .aud-stat .l { margin-top: 10px; font-size: 13px; color: var(--mute-2); line-height: 1.4; }
.lp-root .aud-quote {
  border-left: 3px solid var(--blue);
  padding: 14px 0 14px 22px;
  margin: 0 0 28px;
  font-family: 'Manrope', sans-serif; font-weight: 600; font-size: 19px;
  color: var(--ink); line-height: 1.4; letter-spacing: -0.01em;
}
.lp-root .aud-quote .sig {
  margin-top: 14px; display: block;
  font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 500;
  color: var(--mute); letter-spacing: 0.04em; text-transform: uppercase;
}
.lp-root .creds { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.lp-root .cred { border: 1px solid var(--line); padding: 14px 16px; display: flex; flex-direction: column; gap: 4px; }
.lp-root .cred .org { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: var(--blue); letter-spacing: 0.1em; text-transform: uppercase; font-weight: 600; }
.lp-root .cred .ttl { font-family: 'Manrope', sans-serif; font-weight: 700; font-size: 14px; color: var(--ink); letter-spacing: -0.01em; }
.lp-root .cred .reg { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--mute); margin-top: 2px; }

/* PRICING */
.lp-root .pricing-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 44px; }
.lp-root .plan {
  background: white; border: 1px solid var(--line); border-radius: var(--r); padding: 32px 28px;
  position: relative; display: flex; flex-direction: column;
}
.lp-root .plan.featured { border-color: var(--blue); box-shadow: 0 30px 60px -30px rgba(30,64,175,0.4); background: linear-gradient(180deg, #ffffff, #FAFCFF); }
.lp-root .plan .ribbon {
  position: absolute; top: -1px; left: 28px;
  background: var(--blue); color: white;
  padding: 5px 12px;
  font-family: 'JetBrains Mono', monospace; font-size: 10.5px; font-weight: 600; letter-spacing: 0.06em;
}
.lp-root .plan .name { font-family: 'Manrope', sans-serif; font-weight: 700; font-size: 18px; }
.lp-root .plan .price { margin-top: 14px; font-family: 'Manrope', sans-serif; font-weight: 800; font-size: 44px; letter-spacing: -0.03em; color: var(--ink); }
.lp-root .plan .price small { font-size: 14px; font-weight: 500; color: var(--mute); letter-spacing: 0; }
.lp-root .plan .price .currency { font-size: 22px; vertical-align: top; color: var(--mute-2); font-weight: 600; }
.lp-root .plan .who { color: var(--mute-2); font-size: 13.5px; margin-top: 4px; }
.lp-root .plan .impl {
  margin-top: 16px; padding: 10px 14px; background: var(--paper-2);
  font-family: 'JetBrains Mono', monospace; font-size: 11.5px; color: var(--ink-2);
  display: flex; justify-content: space-between; align-items: center;
}
.lp-root .plan ul { list-style: none; padding: 0; margin: 20px 0 0; flex: 1; }
.lp-root .plan ul li { font-size: 14px; padding: 7px 0; color: var(--ink-2); display: flex; gap: 10px; align-items: flex-start; }
.lp-root .plan ul li::before { content: "✓"; color: var(--green); font-weight: 700; flex-shrink: 0; }
.lp-root .plan .cta { margin-top: 22px; }
.lp-root .plan .no-fid {
  margin-top: 14px; display: inline-flex; align-items: center; gap: 6px;
  background: var(--yellow); color: var(--ink);
  padding: 5px 10px;
  font-family: 'JetBrains Mono', monospace; font-size: 10.5px; font-weight: 700;
  letter-spacing: 0.06em;
}

/* SIMULATOR */
.lp-root .sim { background: var(--ink); color: white; position: relative; overflow: hidden; }
.lp-root .sim::before {
  content: ""; position: absolute; inset: 0;
  background:
    radial-gradient(600px 300px at 20% 0%, rgba(30,64,175,0.4), transparent 60%),
    radial-gradient(500px 300px at 90% 100%, rgba(14,165,233,0.3), transparent 60%);
  pointer-events: none;
}
.lp-root .sim .inner { position: relative; z-index: 1; }
.lp-root .sim h2, .lp-root .sim .sec-title { color: white; }
.lp-root .sim .sec-sub { color: rgba(255,255,255,0.7); }
.lp-root .sim-eyebrow { color: var(--yellow); }
.lp-root .sim-eyebrow::before { background: var(--yellow); }
.lp-root .sim-grid {
  display: grid; grid-template-columns: 1.2fr 1fr; gap: 32px; margin-top: 44px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: var(--r); padding: 36px;
}
.lp-root .q { margin-bottom: 24px; }
.lp-root .q .qlabel {
  display: flex; justify-content: space-between; align-items: baseline;
  font-family: 'Manrope', sans-serif; font-weight: 600; font-size: 14.5px; color: white;
}
.lp-root .q .qlabel .num { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--yellow); }
.lp-root .q .qval { color: var(--yellow); font-family: 'JetBrains Mono', monospace; font-weight: 600; }
.lp-root .slider {
  -webkit-appearance: none; appearance: none;
  width: 100%; height: 4px; background: rgba(255,255,255,0.15);
  margin-top: 14px; outline: none;
}
.lp-root .slider::-webkit-slider-thumb {
  -webkit-appearance: none; appearance: none;
  width: 20px; height: 20px; background: var(--yellow); cursor: pointer;
  box-shadow: 0 0 0 4px rgba(250,204,21,0.2);
}
.lp-root .slider::-moz-range-thumb {
  width: 20px; height: 20px; background: var(--yellow); cursor: pointer; border: none;
}
.lp-root .slider-ticks {
  display: flex; justify-content: space-between;
  font-family: 'JetBrains Mono', monospace; font-size: 10.5px;
  color: rgba(255,255,255,0.45); margin-top: 6px;
}
.lp-root .chips { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
.lp-root .chip {
  padding: 8px 14px;
  background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12);
  color: rgba(255,255,255,0.85); font-size: 13px; font-weight: 500; cursor: pointer;
  transition: all .15s;
}
.lp-root .chip:hover { border-color: rgba(255,255,255,0.3); }
.lp-root .chip.active { background: var(--yellow); border-color: var(--yellow); color: var(--ink); }

.lp-root .sim-out {
  background: white; color: var(--ink);
  border-radius: var(--r); padding: 28px;
  display: flex; flex-direction: column;
}
.lp-root .sim-out .lbl { font-family: 'JetBrains Mono', monospace; font-size: 10.5px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--mute); }
.lp-root .sim-out .plan-rec { font-family: 'Manrope', sans-serif; font-weight: 800; font-size: 32px; color: var(--blue); margin-top: 4px; letter-spacing: -0.02em; }
.lp-root .sim-out .price-rec { font-family: 'Manrope', sans-serif; font-size: 15px; color: var(--ink-2); margin-top: 4px; }
.lp-root .sim-out .div { height: 1px; background: var(--line); margin: 20px 0; }
.lp-root .sim-out .priority { font-size: 13.5px; color: var(--ink-2); line-height: 1.55; }
.lp-root .sim-out .priority b { color: var(--blue); }
.lp-root .sim-out .summary {
  margin-top: 14px; background: var(--paper);
  padding: 12px 14px;
  font-family: 'JetBrains Mono', monospace; font-size: 11.5px; color: var(--mute-2);
  line-height: 1.65;
}
.lp-root .sim-out .summary b { color: var(--ink); font-weight: 600; }
.lp-root .sim-out .cta { margin-top: auto; padding-top: 22px; }

/* FAQ */
.lp-root .faq { background: var(--paper); }
.lp-root .faq-grid { display: grid; grid-template-columns: 1fr 1.5fr; gap: 48px; align-items: start; margin-top: 44px; }
.lp-root .faq-list { display: flex; flex-direction: column; gap: 8px; }
.lp-root .faq-item { background: white; border: 1px solid var(--line); overflow: hidden; }
.lp-root .faq-q {
  width: 100%; text-align: left; padding: 20px 24px;
  display: flex; justify-content: space-between; align-items: center; gap: 16px;
  font-family: 'Manrope', sans-serif; font-weight: 600; font-size: 15px; color: var(--ink);
}
.lp-root .faq-q .plus {
  width: 26px; height: 26px; flex-shrink: 0;
  background: var(--paper-2); display: grid; place-items: center;
  font-size: 18px; color: var(--mute-2); font-weight: 400;
  transition: transform .2s, background .2s, color .2s;
}
.lp-root .faq-item.open .plus { background: var(--ink); color: white; transform: rotate(45deg); }
.lp-root .faq-a {
  max-height: 0; overflow: hidden;
  transition: max-height .35s ease;
  padding: 0 24px;
  color: var(--mute-2); font-size: 14.5px;
}
.lp-root .faq-item.open .faq-a { max-height: 240px; padding-bottom: 20px; }

/* FINAL CTA */
.lp-root .final {
  background: linear-gradient(135deg, #0B2A8C 0%, #1E40AF 50%, #0F172A 120%);
  color: white; text-align: center; padding: 110px 0;
  position: relative; overflow: hidden;
}
.lp-root .final::before {
  content: ""; position: absolute; inset: 0;
  background:
    radial-gradient(circle at 30% 20%, rgba(250,204,21,0.12), transparent 50%),
    radial-gradient(circle at 70% 80%, rgba(14,165,233,0.2), transparent 50%);
}
.lp-root .final h2 {
  position: relative; color: white; font-size: clamp(40px, 5.5vw, 60px); line-height: 1.05;
  max-width: 880px; margin: 0 auto; letter-spacing: -0.035em;
}
.lp-root .final h2 em { font-style: normal; color: var(--yellow); }
.lp-root .final p { position: relative; max-width: 520px; margin: 22px auto 0; color: rgba(255,255,255,0.75); font-size: 17px; }
.lp-root .final .ctas { position: relative; margin-top: 40px; display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
.lp-root .final .meta { position: relative; margin-top: 34px; font-family: 'JetBrains Mono', monospace; font-size: 12px; color: rgba(255,255,255,0.5); }

/* FOOTER */
.lp-root footer { background: var(--ink); color: rgba(255,255,255,0.6); padding: 60px 0 32px; }
.lp-root footer .grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 40px; margin-bottom: 40px; }
.lp-root footer h5 { color: white; font-family: 'Manrope', sans-serif; font-weight: 700; font-size: 13px; margin: 0 0 14px; letter-spacing: 0.02em; }
.lp-root footer .col a { display: block; padding: 5px 0; font-size: 13.5px; }
.lp-root footer .col a:hover { color: white; }
.lp-root footer .about { font-size: 14px; max-width: 320px; margin-top: 14px; }
.lp-root footer .bottom {
  border-top: 1px solid rgba(255,255,255,0.08); padding-top: 22px;
  display: flex; justify-content: space-between; font-size: 12px; flex-wrap: wrap; gap: 10px;
  font-family: 'JetBrains Mono', monospace;
}

/* WhatsApp float */
.lp-root .wa-float {
  position: fixed; bottom: 22px; right: 22px; z-index: 60;
  width: 58px; height: 58px;
  background: #25D366;
  color: white; display: grid; place-items: center;
  box-shadow: 0 8px 30px -5px rgba(37,211,102,0.5), 0 4px 12px rgba(15,23,42,0.2);
  transition: transform .2s ease;
}
.lp-root .wa-float:hover { transform: scale(1.06); }
.lp-root .wa-float::before {
  content: ""; position: absolute; inset: 0;
  background: #25D366; opacity: 0.5;
  animation: lp-pulse 2s ease-out infinite;
}
@keyframes lp-pulse {
  0% { transform: scale(1); opacity: 0.5; }
  100% { transform: scale(1.6); opacity: 0; }
}
.lp-root .wa-float svg { position: relative; z-index: 1; }

/* responsive */
@media (max-width: 980px) {
  .lp-root .hero-grid { grid-template-columns: 1fr; }
  .lp-root .pain-grid, .lp-root .steps, .lp-root .pricing-grid { grid-template-columns: 1fr; }
  .lp-root .mods-grid { grid-template-columns: repeat(2, 1fr); }
  .lp-root .diff-grid { grid-template-columns: 1fr; }
  .lp-root .sim-grid { grid-template-columns: 1fr; padding: 24px; }
  .lp-root .faq-grid { grid-template-columns: 1fr; }
  .lp-root .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .lp-root .stat:nth-child(2) { border-right: none; }
  .lp-root .stat:nth-child(1), .lp-root .stat:nth-child(2) { border-bottom: 1px solid rgba(255,255,255,0.1); }
  .lp-root .aud-grid { grid-template-columns: 1fr; gap: 32px; }
  .lp-root .aud-portrait { max-width: 320px; }
  .lp-root .aud-stats { grid-template-columns: 1fr; }
  .lp-root .aud-stat { border-right: none; border-bottom: 1px solid var(--line); }
  .lp-root .aud-stat:last-child { border-bottom: none; }
  .lp-root .creds { grid-template-columns: 1fr; }
  .lp-root footer .grid { grid-template-columns: 1fr 1fr; }
  .lp-root nav.top .links { display: none; }
  .lp-root section { padding: 64px 0; }
}
    `}</style>
  )
}
