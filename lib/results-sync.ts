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
      score?: { fullTime?: { home?: number | null; away?: number | null } };
    }>;
  };
  return (data.matches ?? [])
    .filter((m) => m.homeTeam?.name && m.awayTeam?.name)
    .map((m) => ({
      home: m.homeTeam.name!,
      away: m.awayTeam.name!,
      hs: m.score?.fullTime?.home ?? null,
      as: m.score?.fullTime?.away ?? null,
      finished: m.status === "FINISHED",
      date: m.utcDate,
      stage: stageFromRound(m.stage),
    }));
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
    const pending = await prisma.match.findMany({
      where: {
        result: null,
        homeTeam: { not: "Por confirmar" },
        awayTeam: { not: "Por confirmar" },
        kickoff: { lte: new Date(now - 105 * 60 * 1000) },
      },
    });
    const tbdSlots = await prisma.match.findMany({
      where: { OR: [{ homeTeam: "Por confirmar" }, { awayTeam: "Por confirmar" }] },
    });
    if (pending.length === 0 && tbdSlots.length === 0) return;

    const meta = await prisma.meta.findUnique({ where: { key: META_KEY } });
    if (meta && now - Number(meta.value) < SYNC_INTERVAL_MS) return;
    await prisma.meta.upsert({
      where: { key: META_KEY },
      update: { value: String(now) },
      create: { key: META_KEY, value: String(now) },
    });

    const { matches } = await fetchProviderData();
    if (matches.length === 0) return;
    const finished = matches.filter((m) => m.finished && m.hs != null);

    // 1) resultados con goles
    for (const m of pending) {
      const ev = finished.find((e) => {
        const direct = teamsMatch(e.home, m.homeTeam) && teamsMatch(e.away, m.awayTeam);
        const swap = teamsMatch(e.home, m.awayTeam) && teamsMatch(e.away, m.homeTeam);
        if (!direct && !swap) return false;
        const d = new Date(e.date).getTime();
        return isNaN(d) || Math.abs(d - m.kickoff.getTime()) < 48 * 3600 * 1000;
      });
      if (!ev) continue;
      const homeIsHome = teamsMatch(ev.home, m.homeTeam);
      const ourHome = homeIsHome ? ev.hs! : ev.as!;
      const ourAway = homeIsHome ? ev.as! : ev.hs!;
      const result = ourHome === ourAway ? "DRAW" : ourHome > ourAway ? "HOME" : "AWAY";
      await prisma.match.update({
        where: { id: m.id },
        data: { result, homeScore: ourHome, awayScore: ourAway },
      });
    }

    // 2) autocompletar cruces de eliminatorias
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
