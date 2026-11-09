CREATE TABLE IF NOT EXISTS site_content (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  event_date TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  body_text TEXT NOT NULL,
  cta TEXT NOT NULL,
  footer TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO site_content (id, event_date, title, subtitle, body_text, cta, footer)
VALUES (
  1,
  'QUINTA-FEIRA, ÀS 12H | AULA AO VIVO E GRATUITA',
  'ARQUITETURA DE CRESCIMENTO™',
  'Os 5 passos para atrair mais clientes, vender mais e fazer sua empresa crescer.',
  'Sua empresa não precisa apenas de mais clientes. Precisa de um método para crescer.',
  'QUERO PARTICIPAR DA AULA',
  'Ao vivo pelo Google Meet | 45 a 60 minutos'
);