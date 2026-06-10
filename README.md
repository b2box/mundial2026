# 📦 B2BOX CARGO CUP — El Prode del Contenedor

Sitio interno de B2BOX para el **Mundial 2026**. Cada miembro pronostica los
partidos eligiendo qué selección "mete en su contenedor". Acertar suma cajas
📦 y arma la tabla de posiciones (**La Torre de Contenedores**).

## Cómo funciona

- Cada miembro tiene **usuario y contraseña**.
- Por cada partido todos aportan **$1.000 ARS** al pozo.
- Antes de que arranque un partido, cada uno **elige un equipo** (su "caja"):
  - el equipo **gana** → **3 cajas**
  - **empate** → **1 caja**
  - el equipo **pierde** → **0 cajas**
- El pronóstico se **bloquea** cuando empieza el partido.
- El **pozo** se reparte al final entre el podio: **60% / 30% / 10%** (1°/2°/3°).
- Un **admin** (Gabriel) carga el fixture y los resultados desde `/admin`.

## Miembros (seed inicial)

Sol · Hans · Nico · Agus · Braian · Gabriel (admin) · Catalina

- **Usuario**: el nombre en minúscula (`sol`, `hans`, `gabriel`, …)
- **Contraseña inicial**: `b2box2026` (cambiala editando el seed o la DB)

## Stack

Next.js 16 (App Router) · React 19 · Tailwind v4 · Prisma + SQLite · sesiones
con JWT firmado (jose) · contraseñas con bcrypt.

## Correr en local

```bash
npm install
cp .env.example .env        # ajustá SESSION_SECRET
npm run db:push             # crea la base SQLite
npm run seed                # carga miembros + partidos de ejemplo
npm run dev                 # http://localhost:3000
```

## Deploy con link compartible

**Opción A — Host con disco persistente (Railway / Render / Fly):** funciona
tal cual con SQLite. Definí las env vars (`DATABASE_URL`, `SESSION_SECRET`) y
corré una vez `npm run db:push && npm run seed`.

**Opción B — Vercel (serverless):** el disco es efímero, así que necesitás una
base Postgres (Neon o Vercel Postgres tienen plan gratis):

1. En `prisma/schema.prisma` cambiá `provider = "sqlite"` por `provider = "postgresql"`.
2. Configurá en Vercel `DATABASE_URL` (la de Postgres) y `SESSION_SECRET`.
3. Deploy. Después corré una vez `npx prisma db push` y `npm run seed` contra esa DB.

## Uso del panel admin

1. Entrá como `gabriel`.
2. En **Admin** cargá cada partido (selecciones, instancia, grupo y horario).
3. Cuando termine un partido, marcá el resultado (Local / Empate / Visitante).
   La tabla y los puntajes se recalculan solos.

> Los 3 partidos de ejemplo se pueden borrar desde el panel.
