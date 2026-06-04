import { EMPRESA_IDS } from "@/lib/supabase/schema";

/** Direccion global: ve todas las plantas. */
export function isGlobalAdmin(user) {
  return user?.role === "admin" && (!user?.empresa || user.empresa === "all");
}

/** Admin ligado a una planta (narvaez | tepexi). */
export function isPlantAdmin(user) {
  return user?.role === "admin" && !isGlobalAdmin(user);
}

/**
 * Planta del admin de planta (perfil Supabase primero, luego sesion AUTH_USERS).
 * null = direccion global.
 */
export function getAdminPlantaScope(user, perfil) {
  if (user?.role !== "admin") {
    return null;
  }

  const fromPerfil = perfil?.empresa_id;
  if (fromPerfil === EMPRESA_IDS.NARVAEZ || fromPerfil === EMPRESA_IDS.TEPEXI) {
    return fromPerfil;
  }

  const fromSession = user.empresa;
  if (fromSession === EMPRESA_IDS.NARVAEZ || fromSession === EMPRESA_IDS.TEPEXI) {
    return fromSession;
  }

  return null;
}
