import { hashPassword } from "../lib/auth/password.js";

const password = process.argv[2];

if (!password) {
  console.error("Uso: node scripts/hash-password.js \"TuContrasena\"");
  process.exit(1);
}

console.log(hashPassword(password));
