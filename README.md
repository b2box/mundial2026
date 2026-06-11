# 📦 B2BOX CARGO CUP — El Prode del Contenedor

Sitio interno de B2BOX para el **Mundial 2026**. Cada miembro pronostica los
partidos eligiendo qué selección "mete en su contenedor". Acertar suma cajas
📦 y arma la tabla de posiciones (**La Torre de Contenedores**).

## Cómo funciona

- **Sin usuario ni contraseña**: cada miembro entra con su **link único** de
  acceso (tipo token). Abre el link y queda adentro 180 días — lo guarda en
  favoritos.
- Por cada partido todos aportan **$1.000 ARS** al pozo.
- Antes de que arranque un partido, cada uno **elige un equipo** (su "caja"):
  - el equipo **gana** → **3 cajas**
  - **empate** → **1 caja**
  - el equipo **pierde** → **0 cajas**
- El pronóstico se **bloquea** cuando empieza el partido.
- El **pozo** se reparte al final entre el podio: **60% / 30% / 10%** (1°/2°/3°).
- El **admin** (Gabriel) carga el fixture y los resultados desde `/admin`, y
  desde ahí copia y reparte los links de acceso de cada miembro.

## Acceso por link

- Cada miembro tiene una URL: `https://TU-DOMINIO/acceso/<token>`.
- El admin ve todos los links en **Admin → Links de acceso** (con botón Copiar).
- Si un link se filtra, el admin lo **regenera** y el anterior deja de servir.
- Miembros iniciales: Sol · Hans · Nico · Agus · Braian · **Gabriel (admin)** ·
  Catalina (se editan en `lib/members.ts`).

## Stack

Next.js 16 (App Router) · React 19 · Tailwind v4 · Prisma + Postgres · sesión
con JWT firmado (jose).

## Deploy en Vercel (link compartible, gratis)

1. **Importá** este repo en [vercel.com/new](https://vercel.com/new).
2. **Base de datos**: en el proyecto de Vercel → pestaña **Storage** → agregá
   **Neon** (Postgres, plan free). Eso setea `DATABASE_URL` automáticamente.
3. **Variable de entorno**: agregá `SESSION_SECRET` con un valor largo y
   aleatorio (`openssl rand -base64 48`).
4. **Deploy**. El build crea las tablas solo (`prisma db push`) y los miembros
   se crean automáticamente la primera vez que alguien entra.
5. Entrá con el **link de admin** (el de Gabriel), cargá el fixture y repartí
   los links del resto.

> Alternativa con disco persistente (Railway/Render): cambiá en
> `prisma/schema.prisma` el provider a `sqlite` y `DATABASE_URL` a
> `file:./dev.db`.

## Correr en local

```bash
npm install
cp .env.example .env        # poné el DATABASE_URL de Neon y un SESSION_SECRET
npm run db:push             # crea las tablas
npm run seed                # carga miembros + partidos de ejemplo
npm run dev                 # http://localhost:3000
```

## Uso del panel admin

1. Entrá con el link de **Gabriel**.
2. En **Admin** cargá los partidos. Tenés **carga masiva**: pegás una línea por
   partido con el formato
   `Local | Visitante | 2026-06-11 20:00 | Grupo | Instancia`.
3. Cuando termine un partido, marcá el resultado (Local / Empate / Visitante).
   La tabla y los puntajes se recalculan solos.

> Los partidos de ejemplo se pueden borrar desde el panel.
