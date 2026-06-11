export const STAKE_PER_MATCH = Number(process.env.STAKE_PER_MATCH ?? "500");

// Total de partidos del Mundial 2026 (72 de grupos + 32 de eliminatorias)
export const TOTAL_MATCHES = 104;

// Puntaje por resultado del equipo elegido
export const POINTS = {
  WIN: 3,
  DRAW: 1,
  LOSS: 0,
} as const;

// Reparto del pozo final (podio)
export const PRIZE_SPLIT = [0.6, 0.3, 0.1]; // 1°, 2°, 3°

export const COMPANY = "B2BOX";
export const APP_NAME = "B2BOX CARGO CUP";
export const APP_TAGLINE = "El Prode del Contenedor · Mundial 2026";

// Zona horaria de referencia para mostrar horarios (Argentina)
export const TZ = "America/Argentina/Buenos_Aires";

export function formatARS(n: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);
}
