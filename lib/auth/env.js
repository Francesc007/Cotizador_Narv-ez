import { parseAuthUsersJson } from "./parse-auth-users";

/**
 * Valida variables de entorno del login propio (no Supabase Auth).
 * Devuelve un mensaje para logs; no exponer detalles al cliente en producción.
 */
export function getAuthEnvProblem() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    return "AUTH_SECRET ausente o menor de 32 caracteres";
  }

  const raw = process.env.AUTH_USERS;
  if (!raw?.trim()) {
    return "AUTH_USERS no definido";
  }

  const parsed = parseAuthUsersJson(raw);
  if (!parsed) {
    return "AUTH_USERS no es JSON valido";
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    return "AUTH_USERS debe ser un arreglo JSON con al menos un usuario";
  }

  return null;
}

export function authConfigErrorForClient() {
  if (process.env.NODE_ENV !== "production") {
    return getAuthEnvProblem();
  }
  return getAuthEnvProblem() ? "El servidor no esta configurado para iniciar sesion." : null;
}
