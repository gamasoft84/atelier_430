-- =============================================
-- ATELIER 430 — Schema inicial
-- Ejecutar en: Supabase > SQL Editor
-- =============================================

-- =============================================
-- TABLA: artworks
-- =============================================
CREATE TABLE artworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) UNIQUE NOT NULL,

  title VARCHAR(200) NOT NULL,
  description TEXT,
  ai_generated BOOLEAN DEFAULT false,
  manually_edited BOOLEAN DEFAULT false,

  category VARCHAR(20) NOT NULL CHECK (category IN ('religiosa', 'nacional', 'europea', 'moderna')),
  subcategory VARCHAR(50),
  tags TEXT[],

  technique VARCHAR(50),
  width_cm INTEGER,
  height_cm INTEGER,
  has_frame BOOLEAN DEFAULT false,
  frame_material VARCHAR(50),
  frame_color VARCHAR(50),

  price NUMERIC(10,2),
  original_price NUMERIC(10,2),
  cost NUMERIC(10,2),
  show_price BOOLEAN DEFAULT true,

  status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold', 'hidden')),
  reserved_until TIMESTAMP,
  reserved_by VARCHAR(100),

  sold_at TIMESTAMP,
  sold_price NUMERIC(10,2),
  sold_channel VARCHAR(50),
  sold_buyer_name VARCHAR(100),
  sold_buyer_contact VARCHAR(100),

  location_in_storage VARCHAR(50),
  admin_notes TEXT,

  views_count INTEGER DEFAULT 0,
  wishlist_count INTEGER DEFAULT 0,
  whatsapp_clicks INTEGER DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  published_at TIMESTAMP
);

CREATE INDEX idx_artworks_status ON artworks(status);
CREATE INDEX idx_artworks_category ON artworks(category);
CREATE INDEX idx_artworks_price ON artworks(price);
CREATE INDEX idx_artworks_code ON artworks(code);

-- =============================================
-- TABLA: artwork_images
-- =============================================
CREATE TABLE artwork_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artwork_id UUID REFERENCES artworks(id) ON DELETE CASCADE,
  cloudinary_url TEXT NOT NULL,
  cloudinary_public_id TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  position INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  alt_text VARCHAR(200),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_images_artwork ON artwork_images(artwork_id);

-- =============================================
-- TABLA: wishlist_items
-- =============================================
CREATE TABLE wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(100) NOT NULL,
  artwork_id UUID REFERENCES artworks(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(session_id, artwork_id)
);

CREATE INDEX idx_wishlist_session ON wishlist_items(session_id);

-- =============================================
-- TABLA: newsletter_subscribers
-- =============================================
CREATE TABLE newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100),
  preferences JSONB DEFAULT '{"categories": ["all"]}',
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed', 'bounced')),
  subscribed_at TIMESTAMP DEFAULT NOW(),
  unsubscribed_at TIMESTAMP
);

-- =============================================
-- TABLA: inquiries
-- =============================================
CREATE TABLE inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artwork_id UUID REFERENCES artworks(id),
  name VARCHAR(100),
  phone VARCHAR(20),
  email VARCHAR(255),
  message TEXT,
  source VARCHAR(50),
  status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'closed', 'converted')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- TABLA: site_settings
-- =============================================
CREATE TABLE site_settings (
  key VARCHAR(50) PRIMARY KEY,
  value JSONB,
  updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO site_settings (key, value) VALUES
  ('show_prices_globally', '{"enabled": true}'),
  ('total_inventory', '{"count": 430}'),
  ('contact_whatsapp', '{"phone": "+52XXXXXXXXXX"}'),
  ('hero_message', '{"title": "430 piezas. Una sola colección.", "subtitle": "Arte curado, listo para tu hogar"}');

-- =============================================
-- TABLA: import_jobs
-- =============================================
CREATE TABLE import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename VARCHAR(255),
  total_rows INTEGER,
  processed_rows INTEGER DEFAULT 0,
  successful_rows INTEGER DEFAULT 0,
  failed_rows INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  error_log JSONB,
  metadata JSONB,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_import_jobs_status ON import_jobs(status);

-- =============================================
-- TABLA: admin_activity
-- =============================================
CREATE TABLE admin_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action VARCHAR(50),
  entity_type VARCHAR(50),
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE artworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE artwork_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Artworks: público ve todo excepto 'hidden', admin ve todo
CREATE POLICY "Public can view non-hidden artworks"
  ON artworks FOR SELECT
  USING (status != 'hidden');

CREATE POLICY "Admin full access to artworks"
  ON artworks FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Imágenes: público puede ver
CREATE POLICY "Public can view images"
  ON artwork_images FOR SELECT
  USING (true);

CREATE POLICY "Admin manages images"
  ON artwork_images FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Wishlist: cualquiera gestiona el suyo
CREATE POLICY "Anyone can manage own wishlist"
  ON wishlist_items FOR ALL
  USING (true);

-- Newsletter: insertar es público, leer es admin
CREATE POLICY "Anyone can subscribe"
  ON newsletter_subscribers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admin manages subscribers"
  ON newsletter_subscribers FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Settings: público lee, admin escribe
CREATE POLICY "Public reads settings"
  ON site_settings FOR SELECT
  USING (true);

CREATE POLICY "Admin writes settings"
  ON site_settings FOR ALL
  USING (auth.uid() IS NOT NULL);

-- =============================================
-- FUNCIÓN: updated_at automático
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER artworks_updated_at
  BEFORE UPDATE ON artworks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
