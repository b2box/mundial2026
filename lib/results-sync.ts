import "server-only";
import { prisma } from "./prisma";

// Sincronización automática de resultados desde TheSportsDB (gratuita).
// Se dispara al visitar el sitio, con throttle de 10 minutos, así el admin
// no tiene que cargar nada. Los botones del panel quedan como respaldo.

const LEAGUE_ID = "4429"; // FIFA World Cup
const SEASON = "2026";
const SYNC_INTERVAL_MS = 10 * 60 * 1000;
const META_KEY = "lastResultsSync";

// nombre en el sitio (es) -> nombre en TheSportsDB (en)
const NAME_MAP: Record<string, string> = {
  mexico: "mexico",
  sudafrica: "south africa",
  "corea del sur": "south korea",
  chequia: "czech republic",
  canada: "canada",
  "bosnia y herzegovina": "bosnia",
  catar: "qatar",
  suiza: "switzerland",
  brasil: "brazil",
  marruecos: "morocco",
  haiti: "haiti",
  escocia: "scotland",
  "estados unidos": "usa",
  paraguay: "paraguay",
  australia: "australia",
  turquia: "turkey",
  alemania: "germany",
  curazao: "curacao",
  "costa de marfil": "ivory coast",
  ecuador: "ecuador",
  "paises bajos": "netherlands",
  japon: "japan",
  suecia: "sweden",
  tunez: "tunisia",
  belgica: "belgium",
  egipto: "egypt",
  iran: "iran",
  "nueva zelanda": "new zealand",
  espana: "spain",
  "cabo verde": "cape verde",
  "arabia saudita": "saudi arabia",
  uruguay: "uruguay",
  francia: "france",
  senegal: "senegal",
  irak: "iraq",
  noruega: "norway",
  argentina: "argentina",
  argelia: "algeria",
  austria: "austria",
  jordania: "jordan",
  portugal: "portugal",
  "rd congo": "dr congo",
  uzbekistan: "uzbekistan",
  colombia: "colombia",
  inglaterra: "england",
  croacia: "croatia",
  ghana: "ghana",
  panama: "panama",
};

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

function toEnglish(es: string): string {
  return NAME_MAP[norm(es)] ?? norm(es);
}

function teamsMatch(apiName: string, ourName: string): boolean {
  const a = norm(apiName);
  const b = toEnglish(ourName);
  return a.includes(b) || b.includes(a);
}

type ApiEvent = {
  strHomeTeam?: string;
  strAwayTeam?: string;
  intHomeScore?: string | number | null;
  intAwayScore?: string | number | null;
  strStatus?: string;
  dateEvent?: string;
};

export async function syncResults(): Promise<void> {
  try {
    // partidos que ya deberían tener resultado (arrancaron hace 105+ min)
    const pending = await prisma.match.findMany({
      where: {
        result: null,
        homeTeam: { not: "Por confirmar" },
        awayTeam: { not: "Por confirmar" },
        kickoff: { lte: new Date(Date.now() - 105 * 60 * 1000) },
      },
    });
    if (pending.length === 0) return;

    // throttle global (tabla Meta)
    const meta = await prisma.meta.findUnique({ where: { key: META_KEY } });
    if (meta && Date.now() - Number(meta.value) < SYNC_INTERVAL_MS) return;
    await prisma.meta.upsert({
      where: { key: META_KEY },
      update: { value: String(Date.now()) },
      create: { key: META_KEY, value: String(Date.now()) },
    });

    const key = process.env.SPORTSDB_KEY ?? "3";
    const res = await fetch(
      `https://www.thesportsdb.com/api/v1/json/${key}/eventsseason.php?id=${LEAGUE_ID}&s=${SEASON}`,
      { signal: AbortSignal.timeout(8000), cache: "no-store" }
    );
    if (!res.ok) return;
    const data = (await res.json()) as { events?: ApiEvent[] };
    const finished = (data.events ?? []).filter(
      (e) =>
        e.intHomeScore != null &&
        e.intAwayScore != null &&
        /finished|ft|aet|pen/i.test(e.strStatus ?? "FT")
    );
    if (finished.length === 0) return;

    for (const m of pending) {
      const ev = finished.find((e) => {
        const direct =
          teamsMatch(e.strHomeTeam ?? "", m.homeTeam) &&
          teamsMatch(e.strAwayTeam ?? "", m.awayTeam);
        const swapped =
          teamsMatch(e.strHomeTeam ?? "", m.awayTeam) &&
          teamsMatch(e.strAwayTeam ?? "", m.homeTeam);
        if (!direct && !swapped) return false;
        // misma fecha (±36 hs por zonas horarias)
        const d = new Date(`${e.dateEvent ?? ""}T12:00:00Z`).getTime();
        return !isNaN(d) && Math.abs(d - m.kickoff.getTime()) < 36 * 3600 * 1000;
      });
      if (!ev) continue;

      const evHomeIsOurHome = teamsMatch(ev.strHomeTeam ?? "", m.homeTeam);
      const hs = Number(ev.intHomeScore);
      const as = Number(ev.intAwayScore);
      const ourHome = evHomeIsOurHome ? hs : as;
      const ourAway = evHomeIsOurHome ? as : hs;
      const result =
        ourHome === ourAway ? "DRAW" : ourHome > ourAway ? "HOME" : "AWAY";

      await prisma.match.update({ where: { id: m.id }, data: { result } });
    }
  } catch {
    // la API puede fallar: se reintenta en la próxima visita.
    // El panel admin sigue teniendo botones manuales de respaldo.
  }
}
