import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'Os 5 passos para sua empresa crescer | GDM Company',
  description: 'Toda quinta-feira às 12h: uma aula gratuita e ao vivo sobre marketing, vendas e crescimento. Entre no grupo do WhatsApp.',
  robots: { index: true, follow: true },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
