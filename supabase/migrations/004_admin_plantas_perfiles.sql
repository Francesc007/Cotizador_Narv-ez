-- Perfiles Admin Narvaez / Admin Tepexi (ejecutar DESPUES de crear usuarios en Supabase Auth)
-- Authentication -> Users con correos:
--   admin.narvaez@concretos.com
--   admin.tepexi@concretos.com

BEGIN;

UPDATE perfiles_usuarios
SET empresa_id = NULL, rol = 'admin'
WHERE correo = 'admin@concretos.com';

INSERT INTO perfiles_usuarios (id, correo, nombre_vendedor, empresa_id, rol)
SELECT
  u.id,
  u.email,
  CASE
    WHEN u.email = 'admin.narvaez@concretos.com' THEN 'Admin Narvaez'
    ELSE 'Admin Tepexi'
  END,
  CASE
    WHEN u.email = 'admin.narvaez@concretos.com' THEN 'narvaez'
    ELSE 'tepexi'
  END,
  'admin'
FROM auth.users u
WHERE u.email IN ('admin.narvaez@concretos.com', 'admin.tepexi@concretos.com')
ON CONFLICT (id) DO UPDATE SET
  correo = EXCLUDED.correo,
  nombre_vendedor = EXCLUDED.nombre_vendedor,
  empresa_id = EXCLUDED.empresa_id,
  rol = EXCLUDED.rol;

COMMIT;

-- Verificacion:
-- SELECT id, correo, nombre_vendedor, empresa_id, rol FROM perfiles_usuarios ORDER BY correo;
