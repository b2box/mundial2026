import { PrismaClient } from "@prisma/client";
import { MEMBERS } from "../lib/members";

const prisma = new PrismaClient();

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
];

async function main() {
  for (const m of MEMBERS) {
    await prisma.user.upsert({
      where: { username: m.username },
      update: { name: m.name, color: m.color, isAdmin: m.isAdmin, token: m.token },
      create: {
        username: m.username,
        name: m.name,
        color: m.color,
        isAdmin: m.isAdmin,
        token: m.token,
      },
    });
  }
  console.log(`✓ ${MEMBERS.length} miembros cargados (acceso por link único)`);

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
