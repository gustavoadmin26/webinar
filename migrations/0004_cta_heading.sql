ALTER TABLE site_content ADD COLUMN cta_heading TEXT NOT NULL DEFAULT 'QUERO PARTICIPAR DA AULA →';
UPDATE site_content SET cta = 'Entrar no grupo de WhatsApp' WHERE id = 1;
