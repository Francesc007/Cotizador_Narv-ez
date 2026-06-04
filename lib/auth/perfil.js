import { getPerfilByCorreo } from "@/lib/supabase/cotizaciones";

export async function userWithPerfilId(user) {
  if (!user?.email) {
    return user;
  }

  try {
    const perfil = await getPerfilByCorreo(user.email);
    return { ...user, perfilId: perfil?.id ?? null };
  } catch {
    return { ...user, perfilId: null };
  }
}
