import { verifyPassword } from "./password";

function nombreDesdeEmail(correo) {
  const localPart = correo.trim().split("@")[0] || "";
  if (!localPart) return "Usuario";

  return localPart
    .replace(/[._-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function parseAuthUsers() {
  const raw = process.env.AUTH_USERS;
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(
      (user) =>
        user &&
        typeof user.email === "string" &&
        typeof user.passwordHash === "string" &&
        (user.role === "vendedor" || user.role === "admin")
    );
  } catch {
    return [];
  }
}

function normalizeEmpresa(empresa, role) {
  if (typeof empresa === "string") {
    const value = empresa.trim().toLowerCase();
    if (value) {
      return value;
    }
  }
  // Sin empresa explicita: admin = dirección (todas), vendedor = narvaez.
  return role === "admin" ? "all" : "narvaez";
}

export function authenticateUser(email, password) {
  const normalizedEmail = email.trim().toLowerCase();
  const users = parseAuthUsers();
  const user = users.find((entry) => entry.email.toLowerCase() === normalizedEmail);

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return null;
  }

  return {
    email: user.email,
    role: user.role,
    name: user.name || nombreDesdeEmail(user.email),
    empresa: normalizeEmpresa(user.empresa, user.role),
  };
}
