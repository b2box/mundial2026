import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = "b2box2026";

const MEMBERS = [
  { username: "gabriel", name: "Gabriel", color: "#a855f7", isAdmin: true },
  { username: "sol", name: "Sol", color: "#f59e0b", isAdmin: false },
  { username: "hans", name: "Hans", color: "#3b82f6", isAdmin: false },
  { username: "nico", name: "Nico", color: "#ef4444", isAdmin: false },
  { username: "agus", name: "Agus", color: "#22c55e", isAdmin: false },
  { username: "braian", name: "Braian", color: "#f97316", isAdmin: false },
  { username: "catalina", name: "Catalina", color: "#ec4899", isAdmin: false },
];

// Partidos de EJEMPLO para probar la app. El admin puede borrarlos/editarlos
// y cargar el fixture real desde el panel /admin.
const SAMPLE_MATCHES = [
  {
    stage: "Fase de grupos",
    group: "A",
    homeTeam: "México",
    homeFlag: "🇲🇽",
    awayTeam: "Por confirmar",
    awayFlag: "🏳️",
    kickoff: new Date("2026-06-11T20:00:00-03:00"),
  },
  {
    stage: "Fase de grupos",
    group: "D",
    homeTeam: "Argentina",
    homeFlag: "🇦🇷",
    awayTeam: "Por confirmar",
    awayFlag: "🏳️",
    kickoff: new Date("2026-06-13T16:00:00-03:00"),
  },
  {
    stage: "Fase de grupos",
    group: "B",
    homeTeam: "Canadá",
    homeFlag: "🇨🇦",
    awayTeam: "Por confirmar",
    awayFlag: "🏳️",
    kickoff: new Date("2026-06-12T20:00:00-03:00"),
  },
];

async function main() {
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  for (const m of MEMBERS) {
    await prisma.user.upsert({
      where: { username: m.username },
      update: { name: m.name, color: m.color, isAdmin: m.isAdmin },
      create: { ...m, passwordHash },
    });
  }
  console.log(`✓ ${MEMBERS.length} miembros cargados (pass: ${DEFAULT_PASSWORD})`);

  const count = await prisma.match.count();
  if (count === 0) {
    for (const match of SAMPLE_MATCHES) {
      await prisma.match.create({ data: match });
    }
    console.log(`✓ ${SAMPLE_MATCHES.length} partidos de ejemplo cargados`);
  } else {
    console.log(`• Ya hay ${count} partidos, no se cargan ejemplos`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
