export const STAKE_PER_MATCH = Number(process.env.STAKE_PER_MATCH ?? "1000");

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

export function formatARS(n: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);
}
