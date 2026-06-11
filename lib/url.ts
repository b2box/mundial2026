// Construye la URL base (https://dominio) a partir de los headers del request.
// Sirve para armar los links de acceso con el dominio real del deploy.
export function baseUrlFromHeaders(h: Headers): string {
  if (process.env.APP_BASE_URL) return process.env.APP_BASE_URL.replace(/\/$/, "");
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
