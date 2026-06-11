import "server-only";
import { prisma } from "./prisma";
import { MEMBERS } from "./members";

let done = false;

// Crea los miembros (con su token) si todavía no existen. Idempotente.
// Se usa en producción donde no se corre `npm run seed` a mano.
export async function ensureSeeded() {
  if (done) return;
  try {
    const count = await prisma.user.count();
    if (count === 0) {
      for (const m of MEMBERS) {
        await prisma.user.upsert({
          where: { username: m.username },
          update: {},
          create: {
            username: m.username,
            name: m.name,
            color: m.color,
            isAdmin: m.isAdmin,
            token: m.token,
          },
        });
      }
    }
    done = true;
  } catch {
    // si la base aún no está lista, se reintenta en el próximo request
  }
}
