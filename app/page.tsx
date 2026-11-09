'use client';
import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { ArrowRight, Video, MessageCircle } from 'lucide-react';
const DEFAULT_WHATSAPP = 'https://chat.whatsapp.com/LneJSfjsBHq1RJG8RINFIa?s=cl&p=i&mlu=4&ilr=4&iam=2';
// Brasília is UTC−03:00. All calculations use UTC so the visitor's timezone does not change the schedule.
export function nextClass(now: number): number {
  const local = new Date(now - 3 * 60 * 60 * 1000);
  const days = (4 - local.getUTCDay() + 7) % 7;
  let target = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() + days, 15);
  if (target <= now) target += 7 * 24 * 60 * 60 * 1000;
  return target;
}
function Countdown() {
  const [remaining, setRemaining] = useState<number | null>(null);
  useEffect(() => {
    let target = nextClass(Date.now());
    const update = () => { const now = Date.now(); if (now >= target) target = nextClass(now); setRemaining(Math.max(0, Math.floor((target - now) / 1000))); };
    update(); const timer = setInterval(update, 1000); return () => clearInterval(timer);
  }, []);
  const values = remaining === null ? ['—', '—', '—', '—'] : [Math.floor(remaining / 86400), Math.floor(remaining / 3600) % 24, Math.floor(remaining / 60) % 60, remaining % 60].map(v => String(v).padStart(2, '0'));
  return <div className="countdown" aria-label="Contagem regressiva para a próxima aula">{values.map((v, i) => <div className="time" key={i}><strong>{v}</strong><span>{['DIAS', 'HORAS', 'MINUTOS', 'SEGUNDOS'][i]}</span></div>)}</div>;
}
const DEFAULT_DESIGN = {"countdown":{"font_family":"Arial","desktop_size":34,"mobile_size":28,"background":"#02162c","color":"#f8fbff"},"brand":{"font_family":"Arial","desktop_size":20,"mobile_size":18,"background":"transparent","color":"#ffffff"},"schedule":{"font_family":"Arial","desktop_size":27,"mobile_size":18,"background":"transparent","color":"#ff744d"},"title":{"font_family":"Arial","desktop_size":64,"mobile_size":36,"background":"transparent","color":"#00d8f5"},"intro":{"font_family":"Arial","desktop_size":30,"mobile_size":19,"background":"transparent","color":"#f8fbff"},"subtitle":{"font_family":"Arial","desktop_size":36,"mobile_size":18,"background":"transparent","color":"#f8fbff"},"cta":{"font_family":"Arial","desktop_size":32,"mobile_size":17,"background":"#12bd70","color":"#ffffff"},"footer":{"font_family":"Arial","desktop_size":22,"mobile_size":14,"background":"transparent","color":"#e2e9f1"}};
const DEFAULT_CONTENT = {
  design: DEFAULT_DESIGN,
  event_date: 'QUINTA-FEIRA, ÀS 12H | AULA AO VIVO E GRATUITA',
  title: 'ARQUITETURA DE CRESCIMENTO™',
  subtitle: 'Os 5 passos para atrair mais clientes, vender mais e fazer sua empresa crescer.',
  body_text: 'Sua empresa não precisa apenas de mais clientes. Precisa de um método para crescer.',
  cta: 'QUERO PARTICIPAR DA AULA',
  footer: 'Ao vivo pelo Google Meet | 45 a 60 minutos'
};
let pageviewSent = false;
export default function Home() {
  const [content, setContent] = useState(DEFAULT_CONTENT);
  useEffect(() => {
    fetch('/conteudo', { cache: 'no-store' })
      .then(response => response.ok ? response.json() : null)
      .then(data => { if (data) setContent({ ...DEFAULT_CONTENT, ...data }); })
      .catch(() => {});
  }, []);
  const titleParts = content.title.split(' DE ');
  const sectionStyle = (name: keyof typeof DEFAULT_DESIGN) => { const d = content.design?.[name] || DEFAULT_DESIGN[name]; return { '--section-font': d.font_family, '--section-desktop': `${d.desktop_size}px`, '--section-mobile': `${d.mobile_size}px`, '--section-bg': d.background, '--section-color': d.color } as CSSProperties; };
  useEffect(() => {
    if (pageviewSent || process.env.NODE_ENV === 'development') return;
    pageviewSent = true;
    fetch('/eventos/visualizacao', { method: 'POST', keepalive: true }).catch(() => {});
  }, []);

  return <main>
    <header className="topbar"><div className="topbar-inner"><p>A PRÓXIMA AULA COMEÇA EM</p><div className="divider"/><Countdown/></div></header>
    <section className="hero" aria-labelledby="headline">
      <svg className="giant-mark" viewBox="23 12 61 78" aria-hidden="true" focusable="false">
        <defs>
          <filter id="logo-symbol-alpha" colorInterpolationFilters="sRGB">
            <feColorMatrix type="luminanceToAlpha" />
            <feComponentTransfer><feFuncA type="table" tableValues="1 0" /></feComponentTransfer>
            <feComposite in2="SourceAlpha" operator="in" />
          </filter>
          <mask id="logo-symbol-mask" maskUnits="userSpaceOnUse" x="23" y="12" width="61" height="78" style={{ maskType: 'alpha' }}>
            <image href="/gdm-logo.png" width="320" height="101" filter="url(#logo-symbol-alpha)" />
          </mask>
        </defs>
        <rect x="23" y="12" width="61" height="78" fill="currentColor" mask="url(#logo-symbol-mask)" />
      </svg>
      <div className="glow glow-left" aria-hidden="true"/><div className="glow glow-right" aria-hidden="true"/>
      <svg className="waves" viewBox="0 0 1600 260" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="wave"><stop stopColor="#009bff"/><stop offset=".18" stopColor="#00e7ff"/><stop offset=".5" stopColor="#004b9a" stopOpacity="0"/><stop offset=".85" stopColor="#00e7ff"/><stop offset="1" stopColor="#007dff"/></linearGradient></defs>{Array.from({length: 9}, (_,i) => <path key={i} d={`M-100 ${25+i*15} C220 ${-10+i*10},250 ${260+i*6},800 ${300+i*4} S1350 ${130+i*14},1700 ${105+i*15}`} fill="none" stroke="url(#wave)" strokeWidth={i===0?3:1} opacity={1-i*.09}/>)}</svg>
      <div className="content">
        <a href="#headline" className="brand" style={sectionStyle("brand")} aria-label="GDM Company"><img src="/gdm-logo-clean.svg?v=3" width="490" height="160" alt="GDM Company" fetchPriority="high" /></a>
        <p className="schedule" style={sectionStyle("schedule")}><span>{content.event_date}</span></p>
        <h1 id="headline" style={sectionStyle("title")}>{titleParts.length > 1 ? <><span className="highlight">{titleParts[0]} DE</span><br className="desktop-break"/> <em>{titleParts.slice(1).join(" DE ")}</em></> : <em>{content.title}</em>}</h1>
        <p className="intro" style={sectionStyle("intro")}>{content.body_text}</p>
        <p className="subtitle" style={sectionStyle("subtitle")}><span className="dash"/> <span>{content.subtitle}</span><span className="dash"/></p>
        <a className="cta" style={sectionStyle("cta")} href={process.env.NODE_ENV === 'development' ? DEFAULT_WHATSAPP : '/ir/whatsapp'} target="_blank" rel="noopener noreferrer"><MessageCircle className="whatsapp" aria-hidden="true"/><span>{content.cta}</span><ArrowRight className="arrow" aria-hidden="true"/></a>
        <p className="details" style={sectionStyle("footer")}><Video aria-hidden="true"/><span>{content.footer}</span></p>
      </div>
    </section>
  </main>;
}
