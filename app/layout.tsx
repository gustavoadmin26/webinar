import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
export const metadata: Metadata = {
  title: 'Os 5 passos para sua empresa crescer | GDM Company',
  description: 'Toda quinta-feira às 12h: uma aula gratuita e ao vivo sobre marketing, vendas e crescimento. Entre no grupo do WhatsApp.',
  robots: { index: true, follow: true },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>
    {children}
    <Script id="meta-pixel" strategy="afterInteractive">{`
      !function(f,b,e,v,n,t,s){
        if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;
        s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s);
      }(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '806423535300335');
      fbq('track', 'PageView');
    `}</Script>
    <noscript>
      <img height="1" width="1" style={{ display: 'none' }} alt=""
        src="https://www.facebook.com/tr?id=806423535300335&ev=PageView&noscript=1" />
    </noscript>
  </body></html>;
}
