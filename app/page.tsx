'use client';
import { useEffect, useState } from 'react';
import { ArrowRight, CalendarDays, Video, MessageCircle } from 'lucide-react';
const WHATSAPP = 'https://chat.whatsapp.com/BiUNRhP5e3t7AD71nHfhFn?s=cl&p=i&mlu=4&ilr=4&iam=2';
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
export default function Home() {
  return <main>
    <header className="topbar"><div className="topbar-inner"><p>A PRÓXIMA AULA COMEÇA EM</p><div className="divider"/><Countdown/></div></header>
    <section className="hero" aria-labelledby="headline">
      <div className="giant-mark" aria-hidden="true">g</div>
      <div className="glow glow-left" aria-hidden="true"/><div className="glow glow-right" aria-hidden="true"/>
      <svg className="waves" viewBox="0 0 1600 260" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="wave"><stop stopColor="#009bff"/><stop offset=".18" stopColor="#00e7ff"/><stop offset=".5" stopColor="#004b9a" stopOpacity="0"/><stop offset=".85" stopColor="#00e7ff"/><stop offset="1" stopColor="#007dff"/></linearGradient></defs>{Array.from({length: 9}, (_,i) => <path key={i} d={`M-100 ${25+i*15} C220 ${-10+i*10},250 ${260+i*6},800 ${300+i*4} S1350 ${130+i*14},1700 ${105+i*15}`} fill="none" stroke="url(#wave)" strokeWidth={i===0?3:1} opacity={1-i*.09}/>)}</svg>
      <div className="content">
        <a href="#headline" className="brand" aria-label="GDM Company"><img src="/gdm-logo.png" width="320" height="101" alt="GDM Company" fetchPriority="high" /></a>
        <p className="schedule"><CalendarDays aria-hidden="true"/><span>Toda Quinta às 12h, Ao Vivo:</span></p>
        <h1 id="headline"><span className="highlight">Os 5 Passos</span> Para Atrair<br className="desktop-break"/> Mais Clientes, Vender Mais<br className="desktop-break"/> e Fazer Sua Empresa <em>Crescer</em></h1>
        <p className="subtitle"><span className="dash"/> <span>O método utilizado pelas maiores empresas do <strong>Vale do Silício.</strong></span><span className="dash"/></p>
        <a className="cta" href={WHATSAPP} target="_blank" rel="noopener noreferrer"><MessageCircle className="whatsapp" aria-hidden="true"/><span>Entrar no grupo do WhatsApp</span><ArrowRight className="arrow" aria-hidden="true"/></a>
        <p className="details"><Video aria-hidden="true"/><span>Aula gratuita pelo <strong>Google Meet.</strong> De 45 a 60 minutos.</span></p>
        <p className="timezone">Todas as quintas-feiras • 12h no horário de Brasília</p>
      </div>
    </section>
  </main>;
}
