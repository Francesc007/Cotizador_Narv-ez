-- Perfiles demo (ejecutar DESPUES de crear usuarios en Supabase Auth)
-- Dashboard → Authentication → Users → Add user
--
-- vendedor@concretos.com  / Vendedor2026!
-- vendedor@tepexi.com     / Tepexi2026!
-- admin@concretos.com     / Admin2026!
--
-- Luego reemplaza los UUID abajo por los id reales de auth.users:

/*
INSERT INTO perfiles_usuarios (id, correo, nombre_vendedor, empresa_id, rol) VALUES
  ('UUID-VENDEDOR-NARVAEZ', 'vendedor@concretos.com', 'Vendedor Narváez', 'narvaez', 'vendedor'),
  ('UUID-VENDEDOR-TEPEXI',  'vendedor@tepexi.com',    'Vendedor Tepexi',  'tepexi',  'vendedor'),
  ('UUID-ADMIN',            'admin@concretos.com',    'Dirección',        NULL,      'admin')
ON CONFLICT (id) DO NOTHING;
*/

-- Consulta util para obtener UUIDs de auth.users:
-- SELECT id, email FROM auth.users;
