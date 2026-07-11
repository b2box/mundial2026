import "server-only";
import { prisma } from "./prisma";
import { TEAMS } from "./teams";

// Sincronización automática de resultados + cruces de eliminatorias.
// Fuentes (en orden de preferencia):
//   1) football-data.org  (si FOOTBALL_DATA_TOKEN está seteado) — confiable
//   2) TheSportsDB        (gratis, sin key) — respaldo
// Corre al visitar el sitio, con throttle de 10 minutos.

const SYNC_INTERVAL_MS = 10 * 60 * 1000;
const META_KEY = "lastResultsSync";

// nombre en el sitio (es) -> nombres posibles en las APIs (en)
const NAME_MAP: Record<string, string[]> = {
  méxico: ["mexico"],
  sudáfrica: ["south africa"],
  "corea del sur": ["south korea", "korea republic"],
  chequia: ["czech republic", "czechia"],
  canadá: ["canada"],
  "bosnia y herzegovina": ["bosnia", "bosnia and herzegovina", "bosnia-herzegovina"],
  catar: ["qatar"],
  suiza: ["switzerland"],
  brasil: ["brazil"],
  marruecos: ["morocco"],
  haití: ["haiti"],
  escocia: ["scotland"],
  "estados unidos": ["usa", "united states"],
  paraguay: ["paraguay"],
  australia: ["australia"],
  turquía: ["turkey", "türkiye", "turkiye"],
  alemania: ["germany"],
  curazao: ["curacao", "curaçao"],
  "costa de marfil": ["ivory coast", "côte d'ivoire", "cote d'ivoire"],
  ecuador: ["ecuador"],
  "países bajos": ["netherlands"],
  japón: ["japan"],
  suecia: ["sweden"],
  túnez: ["tunisia"],
  bélgica: ["belgium"],
  egipto: ["egypt"],
  irán: ["iran", "ir iran"],
  "nueva zelanda": ["new zealand"],
  españa: ["spain"],
  "cabo verde": ["cape verde", "cabo verde"],
  "arabia saudita": ["saudi arabia"],
  uruguay: ["uruguay"],
  francia: ["france"],
  senegal: ["senegal"],
  irak: ["iraq"],
  noruega: ["norway"],
  argentina: ["argentina"],
  argelia: ["algeria"],
  austria: ["austria"],
  jordania: ["jordan"],
  portugal: ["portugal"],
  "rd congo": ["dr congo", "congo dr", "democratic republic of congo"],
  uzbekistán: ["uzbekistan"],
  colombia: ["colombia"],
  inglaterra: ["england"],
  croacia: ["croatia"],
  ghana: ["ghana"],
  panamá: ["panama"],
};

function norm(s: string): string {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9 ]/g, "")
    .trim();
}

function aliases(ourName: string): string[] {
  const en = NAME_MAP[ourName.toLowerCase()] ?? [];
  return [norm(ourName), ...en.map(norm)];
}

function teamsMatch(apiName: string, ourName: string): boolean {
  const a = norm(apiName);
  if (!a) return false;
  return aliases(ourName).some((b) => a === b || a.includes(b) || b.includes(a));
}

export function apiNameToOurs(apiName: string): string | null {
  const a = norm(apiName);
  if (!a) return null;
  for (const t of TEAMS) {
    if (t.name === "Por confirmar") continue;
    if (aliases(t.name).some((b) => a === b || a.includes(b) || b.includes(a)))
      return t.name;
  }
  return null;
}

function stageFromRound(round: string): string | null {
  const r = norm(round);
  if (r.includes("32")) return "Dieciseisavos";
  if (r.includes("16")) return "Octavos";
  if (r.includes("quarter") || r.includes("cuartos")) return "Cuartos";
  if (r.includes("semi")) return "Semifinal";
  if (r.includes("3rd") || r.includes("third") || r.includes("tercer"))
    return "Tercer puesto";
  if (r.includes("final")) return "Final";
  return null;
}

export type NormMatch = {
  home: string;
  away: string;
  hs: number | null;
  as: number | null;
  finished: boolean;
  date: string; // ISO
  stage: string | null; // instancia de eliminatoria, si aplica
  // ganador real (incluye definición por penales); null = deducir por goles
  winner: "HOME" | "AWAY" | "DRAW" | null;
};

// ---- Fuente 1: football-data.org ----
async function fromFootballData(): Promise<NormMatch[] | null> {
  const token = process.env.FOOTBALL_DATA_TOKEN;
  if (!token) return null;
  const res = await fetch(
    "https://api.football-data.org/v4/competitions/WC/matches",
    {
      headers: { "X-Auth-Token": token },
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    }
  );
  if (!res.ok) return null;
  const data = (await res.json()) as {
    matches?: Array<{
      utcDate: string;
      status: string;
      stage: string;
      homeTeam: { name?: string };
      awayTeam: { name?: string };
      score?: {
        winner?: string | null; // HOME_TEAM | AWAY_TEAM | DRAW
        duration?: string; // REGULAR | EXTRA_TIME | PENALTY_SHOOTOUT
        fullTime?: { home?: number | null; away?: number | null };
        penalties?: { home?: number | null; away?: number | null };
      };
    }>;
  };
  return (data.matches ?? [])
    .filter((m) => m.homeTeam?.name && m.awayTeam?.name)
    .map((m) => {
      const w = m.score?.winner;
      let winner: NormMatch["winner"] =
        w === "HOME_TEAM"
          ? "HOME"
          : w === "AWAY_TEAM"
            ? "AWAY"
            : w === "DRAW"
              ? "DRAW"
              : null;
      // si hubo tanda de penales, el ganador de la tanda manda
      const pens = m.score?.penalties;
      if (
        (winner === null || winner === "DRAW") &&
        pens?.home != null &&
        pens?.away != null &&
        pens.home !== pens.away
      ) {
        winner = pens.home > pens.away ? "HOME" : "AWAY";
      }
      return {
        home: m.homeTeam.name!,
        away: m.awayTeam.name!,
        hs: m.score?.fullTime?.home ?? null,
        as: m.score?.fullTime?.away ?? null,
        finished: m.status === "FINISHED",
        date: m.utcDate,
        stage: stageFromRound(m.stage),
        winner,
      };
    });
}

// ---- Fuente 2: TheSportsDB ----
// La key gratis devuelve ventanas chicas, así que combinamos dos endpoints:
//   eventsseason  -> calendario de la temporada (para cruces/programados)
//   eventspastleague -> los 15 resultados más recientes (recién jugados)
async function fromSportsDB(): Promise<NormMatch[] | null> {
  const key = process.env.SPORTSDB_KEY ?? "3";
  const base = `https://www.thesportsdb.com/api/v1/json/${key}`;

  type SdbEvent = {
    idEvent?: string;
    strHomeTeam?: string;
    strAwayTeam?: string;
    intHomeScore?: string | number | null;
    intAwayScore?: string | number | null;
    strStatus?: string;
    strRound?: string;
    dateEvent?: string;
    strTimestamp?: string;
  };

  async function grab(url: string, field: "events" | "results"): Promise<SdbEvent[]> {
    try {
      const r = await fetch(url, {
        signal: AbortSignal.timeout(8000),
        cache: "no-store",
      });
      if (!r.ok) return [];
      const j = (await r.json()) as Record<string, SdbEvent[] | null>;
      return j[field] ?? [];
    } catch {
      return [];
    }
  }

  const [season, past] = await Promise.all([
    grab(`${base}/eventsseason.php?id=4429&s=2026`, "events"),
    grab(`${base}/eventspastleague.php?id=4429`, "results"),
  ]);

  if (season.length === 0 && past.length === 0) return null;

  // combinar y deduplicar por idEvent (o por equipos+fecha)
  const byKey = new Map<string, SdbEvent>();
  for (const e of [...season, ...past]) {
    const k =
      e.idEvent ??
      `${e.strHomeTeam}|${e.strAwayTeam}|${e.dateEvent}`;
    // preferir la versión con goles cargados
    const prev = byKey.get(k);
    if (!prev || (e.intHomeScore != null && prev.intHomeScore == null)) {
      byKey.set(k, e);
    }
  }

  return [...byKey.values()]
    .filter((e) => e.strHomeTeam && e.strAwayTeam)
    .map((e) => {
      const hasScore = e.intHomeScore != null && e.intAwayScore != null;
      return {
        home: e.strHomeTeam!,
        away: e.strAwayTeam!,
        hs: hasScore ? Number(e.intHomeScore) : null,
        as: hasScore ? Number(e.intAwayScore) : null,
        finished:
          hasScore &&
          /finished|ft|aet|pen|match finished/i.test(e.strStatus ?? "FT"),
        date: e.strTimestamp || `${e.dateEvent ?? ""}T12:00:00Z`,
        stage: stageFromRound(e.strRound ?? ""),
        winner: null, // TheSportsDB no informa ganador por penales confiable
      };
    });
}

export type Diagnostic = {
  source: string;
  ok: boolean;
  total: number;
  finished: number;
  sample: { match: string; score: string; status: string }[];
  error?: string;
};

// Devuelve los datos crudos + de qué fuente, para el diagnóstico del admin.
export async function fetchProviderData(): Promise<{
  matches: NormMatch[];
  diag: Diagnostic;
}> {
  // intentar football-data primero
  try {
    const fd = await fromFootballData();
    if (fd && fd.length > 0) {
      return { matches: fd, diag: buildDiag("football-data.org", fd) };
    }
  } catch (e) {
    // sigue con el respaldo
    void e;
  }
  try {
    const sdb = await fromSportsDB();
    if (sdb) return { matches: sdb, diag: buildDiag("TheSportsDB", sdb) };
    return {
      matches: [],
      diag: {
        source: "TheSportsDB",
        ok: false,
        total: 0,
        finished: 0,
        sample: [],
        error: "La API respondió pero sin datos.",
      },
    };
  } catch (e) {
    return {
      matches: [],
      diag: {
        source: "ninguna",
        ok: false,
        total: 0,
        finished: 0,
        sample: [],
        error: e instanceof Error ? e.message : "Error de red",
      },
    };
  }
}

function buildDiag(source: string, ms: NormMatch[]): Diagnostic {
  const fin = ms.filter((m) => m.finished);
  return {
    source,
    ok: ms.length > 0,
    total: ms.length,
    finished: fin.length,
    sample: ms.slice(0, 5).map((m) => ({
      match: `${m.home} vs ${m.away}`,
      score: m.hs != null ? `${m.hs}-${m.as}` : "—",
      status: m.finished ? "FINALIZADO" : "programado",
    })),
  };
}

export async function syncResults(): Promise<void> {
  try {
    const now = Date.now();
    // partidos definidos sin resultado (para cerrarlos) + empates ya
    // cargados (para re-verificar si en realidad se definieron por penales)
    const active = await prisma.match.findMany({
      where: {
        OR: [{ result: null }, { result: "DRAW" }],
        homeTeam: { not: "Por confirmar" },
        awayTeam: { not: "Por confirmar" },
      },
    });
    const tbdSlots = await prisma.match.findMany({
      where: { OR: [{ homeTeam: "Por confirmar" }, { awayTeam: "Por confirmar" }] },
    });
    if (active.length === 0 && tbdSlots.length === 0) return;

    const meta = await prisma.meta.findUnique({ where: { key: META_KEY } });
    if (meta && now - Number(meta.value) < SYNC_INTERVAL_MS) return;
    await prisma.meta.upsert({
      where: { key: META_KEY },
      update: { value: String(now) },
      create: { key: META_KEY, value: String(now) },
    });

    const { matches } = await fetchProviderData();
    if (matches.length === 0) return;

    // busca el partido de la API que corresponde a uno nuestro (por equipos,
    // con una ventana de fecha amplia para tolerar horarios mal cargados)
    const findApi = (homeTeam: string, awayTeam: string, kickoff: Date) =>
      matches.find((e) => {
        const direct = teamsMatch(e.home, homeTeam) && teamsMatch(e.away, awayTeam);
        const swap = teamsMatch(e.home, awayTeam) && teamsMatch(e.away, homeTeam);
        if (!direct && !swap) return false;
        const d = new Date(e.date).getTime();
        return isNaN(d) || Math.abs(d - kickoff.getTime()) < 5 * 24 * 3600 * 1000;
      });

    for (const m of active) {
      const ev = findApi(m.homeTeam, m.awayTeam, m.kickoff);
      if (!ev) continue;

      const data: {
        kickoff?: Date;
        result?: string;
        homeScore?: number;
        awayScore?: number;
      } = {};

      // 1) corregir horario si difiere > 90 min del real (fuente: API)
      const apiDate = new Date(ev.date);
      if (
        !isNaN(apiDate.getTime()) &&
        Math.abs(apiDate.getTime() - m.kickoff.getTime()) > 90 * 60 * 1000
      ) {
        data.kickoff = apiDate;
      }

      // 2) cargar resultado si la API lo da por finalizado (no depende de
      //    nuestro horario, así un partido terminado queda cerrado igual).
      //    Usa el GANADOR real de la API cuando existe: en empates definidos
      //    por penales, el que ganó los penales cuenta como victoria (3/0).
      if (ev.finished && ev.hs != null && ev.as != null) {
        const homeIsHome = teamsMatch(ev.home, m.homeTeam);
        const ourHome = homeIsHome ? ev.hs : ev.as;
        const ourAway = homeIsHome ? ev.as : ev.hs;
        let result: string | null;
        if (ev.winner && ev.winner !== "DRAW") {
          result = homeIsHome ? ev.winner : ev.winner === "HOME" ? "AWAY" : "HOME";
        } else if (ev.winner === "DRAW") {
          result = "DRAW";
        } else if (ourHome !== ourAway) {
          result = ourHome > ourAway ? "HOME" : "AWAY";
        } else {
          // goles empatados y la fuente NO confirma ganador: en este Mundial
          // los empates se definen por penales, así que NO cerrar como
          // empate — queda pendiente hasta que football-data confirme quién
          // ganó la tanda.
          result = null;
        }
        if (result && result !== m.result) {
          data.result = result;
          if (ourHome !== m.homeScore) data.homeScore = ourHome;
          if (ourAway !== m.awayScore) data.awayScore = ourAway;
        }
      }

      if (Object.keys(data).length > 0) {
        await prisma.match.update({ where: { id: m.id }, data });
      }
    }

    // 3) autocompletar cruces de eliminatorias
    if (tbdSlots.length > 0) {
      const knockout = matches
        .filter((e) => e.stage && apiNameToOurs(e.home) && apiNameToOurs(e.away))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const used = new Set<string>();
      for (const ev of knockout) {
        const stage = ev.stage!;
        const home = apiNameToOurs(ev.home)!;
        const away = apiNameToOurs(ev.away)!;
        const exists = await prisma.match.findFirst({
          where: { stage, homeTeam: home, awayTeam: away },
        });
        if (exists) continue;
        const slot = tbdSlots.find(
          (s) =>
            s.stage === stage &&
            !used.has(s.id) &&
            (s.homeTeam === "Por confirmar" || s.awayTeam === "Por confirmar")
        );
        if (!slot) continue;
        used.add(slot.id);
        const d = new Date(ev.date);
        await prisma.match.update({
          where: { id: slot.id },
          data: {
            homeTeam: home,
            awayTeam: away,
            homeFlag: TEAMS.find((t) => t.name === home)?.flag ?? "🏳️",
            awayFlag: TEAMS.find((t) => t.name === away)?.flag ?? "🏳️",
            kickoff: isNaN(d.getTime()) ? slot.kickoff : d,
          },
        });
      }
    }
  } catch {
    // se reintenta en la próxima visita
  }
}
