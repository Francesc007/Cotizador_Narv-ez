// Registro central de identidad por empresa (multi-tenant).
// Los colores reales viven como variables CSS en app/globals.css
// (clases .theme-*). Aqui solo declaramos metadatos: logo, nombre y
// la clase de tema que activa la paleta correspondiente.
//
// Cuando se integre Supabase, `empresa_id` del perfil del usuario
// debe mapear a una de estas claves; no hace falta tocar la UI.

export const NEUTRAL_TENANT = {
  id: "neutral",
  name: "Ecosistema de Cotización Corporativo",
  shortName: "Corporativo",
  themeClass: "theme-neutral",
  logo: null,
  logos: ["/Logo-CN-Color.png", "/logo-tepexi.jpeg"],
};

export const TENANTS = {
  narvaez: {
    id: "narvaez",
    name: "Concretos Narváez",
    shortName: "Narváez",
    themeClass: "theme-narvaez",
    logo: "/Logo-CN-Color.png",
    logos: ["/Logo-CN-Color.png"],
  },
  tepexi: {
    id: "tepexi",
    name: "Concretos Tepexi",
    shortName: "Tepexi",
    themeClass: "theme-tepexi",
    logo: "/logo-tepexi.jpeg",
    logos: ["/logo-tepexi.jpeg"],
  },
};

// La direccion/SuperAdmin (empresa "all") ve ambas plantas: tema neutral.
export function getTenant(empresa) {
  if (!empresa || empresa === "all") {
    return NEUTRAL_TENANT;
  }
  return TENANTS[empresa] ?? NEUTRAL_TENANT;
}

export const TENANT_OPTIONS = [
  { value: "all", label: "Todas las plantas" },
  { value: "narvaez", label: "Concretos Narváez" },
  { value: "tepexi", label: "Concretos Tepexi" },
];
