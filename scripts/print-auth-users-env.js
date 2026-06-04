import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const jsonPath = join(__dirname, "..", "config", "auth-users.json");
const users = JSON.parse(readFileSync(jsonPath, "utf8"));

console.log("Pega esta linea completa en AUTH_USERS (.env.local y Vercel):\n");
console.log(`AUTH_USERS=${JSON.stringify(users)}`);
