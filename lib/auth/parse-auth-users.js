/**
 * Normaliza AUTH_USERS desde .env / Vercel (comillas extra, espacios, etc.).
 */
export function normalizeAuthUsersRaw(raw) {
  if (!raw || typeof raw !== "string") {
    return "";
  }

  let value = raw.trim();

  // Corrige pegados accidentales: AUTH_USERS=AUTH_USERS=[...]
  const jsonStart = value.indexOf("[");
  if (jsonStart > 0) {
    value = value.slice(jsonStart);
  }

  // Vercel a veces guarda el valor entre comillas simples o dobles externas.
  while (
    (value.startsWith("'") && value.endsWith("'")) ||
    (value.startsWith('"') && value.endsWith('"'))
  ) {
    value = value.slice(1, -1).trim();
  }

  return value;
}

export function parseAuthUsersJson(raw) {
  const normalized = normalizeAuthUsersRaw(raw);
  if (!normalized) {
    return null;
  }

  try {
    return JSON.parse(normalized);
  } catch {
    return null;
  }
}
