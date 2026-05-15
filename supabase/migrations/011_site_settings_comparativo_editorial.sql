-- Textos del comparativo editorial (público + admin). Editable en /admin/configuracion
INSERT INTO site_settings (key, value)
VALUES (
  'comparativo_editorial',
  jsonb_build_object(
    'tagline', 'ARTE QUE TRANSFORMA ESPACIOS',
    'footer', 'COLECCIÓN MÉXICO | OBRAS ORIGINALES | PIEZAS ÚNICAS'
  )
)
ON CONFLICT (key) DO NOTHING;
