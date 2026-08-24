/*
# Admin visibility and sample Routravel routes

## Resumen
Permite que el panel aprobado vea borradores y compras, y añade cuatro rutas iniciales para que la experiencia pública pueda probarse desde el primer acceso.

## Cambios de seguridad
- Los administradores aprobados pueden consultar todas las rutas, incluidas las no publicadas.
- Los administradores aprobados pueden consultar todas las compras.
- Los usuarios normales siguen viendo solo rutas publicadas y sus propias compras.

## Datos iniciales
Añade cuatro rutas de demostración publicadas con sus imágenes, descripciones y precios. Los enlaces de archivos quedan vacíos para que el administrador los complete desde el panel.
*/

DROP POLICY IF EXISTS "admin_read_all_routes" ON routes;
CREATE POLICY "admin_read_all_routes"
ON routes FOR SELECT
TO authenticated
USING (
  is_published = true
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
      AND profiles.status = 'aprobado'
  )
);

DROP POLICY IF EXISTS "admin_read_all_purchases" ON purchases;
CREATE POLICY "admin_read_all_purchases"
ON purchases FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
      AND profiles.status = 'aprobado'
  )
);

INSERT INTO routes (title, subtitle, description, image_url, price, is_published)
SELECT * FROM (VALUES
  ('7 días por la costa de Galicia', 'Vigo → Costa da Morte', 'Una semana entre acantilados, pueblos marineros y playas salvajes. Una ruta pensada para conducir sin prisa y parar donde el paisaje pide una foto.', 'https://images.unsplash.com/photo-1534938665420-4193effeabd4?auto=format&fit=crop&q=80&w=1200', 18.00, true),
  ('Islandia: la Ring Road completa', 'Reikiavik → Reikiavik', 'La vuelta completa a la isla del hielo y el fuego: cascadas, glaciares, baños termales y carreteras que parecen dibujadas para perderse.', 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&q=80&w=1200', 24.00, true),
  ('La Rioja: bébete el paisaje', 'Logroño → Logroño', 'Viñedos, bodegas familiares y carreteras secundarias que atraviesan un paisaje que cambia de color en cada estación.', 'https://images.unsplash.com/photo-1516594798947-e65505dbb29d?auto=format&fit=crop&q=80&w=1200', 15.00, true),
  ('Lanzarote: la isla del fuego', 'Arrecife → Haría', 'Volcanes, miradores y pueblos blancos. Una ruta circular para descubrir la cara más inesperada de la isla.', 'https://images.unsplash.com/photo-1533038590840-1cde6e668a91?auto=format&fit=crop&q=80&w=1200', 16.00, true)
) AS sample(title, subtitle, description, image_url, price, is_published)
WHERE NOT EXISTS (SELECT 1 FROM routes);
