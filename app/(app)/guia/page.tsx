import { getLeaderboard } from "@/lib/scoring";
import {
  formatARS,
  STAKE_PER_MATCH,
  TOTAL_MATCHES,
  PRIZE_SPLIT,
  PICK_WINDOW_HOURS,
} from "@/lib/constants";
import { ReplayTour } from "./ReplayTour";

export const dynamic = "force-dynamic";

export default async function GuiaPage() {
  const board = await getLeaderboard();
  const pot = board.projectedPot;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center">
        <h1 className="text-2xl font-black">📖 Guía rápida</h1>
        <p className="text-sm text-muted mt-1 mb-3">
          Todo lo que necesitás saber, en 1 minuto.
        </p>
        <ReplayTour />
      </div>

      <Step n={1} emoji="🔗" title="Entrá con tu link">
        Tu link personal te abre el sitio directo, sin contraseña. Guardalo en
        favoritos o en la pantalla de inicio del celu. No lo compartas: es tu
        identidad acá adentro.
      </Step>

      <Step n={2} emoji="👆" title="Elegí quién gana, partido por partido">
        En la pestaña <strong className="text-amber">Partidos</strong> vas a
        ver los partidos del Mundial. En cada uno,{" "}
        <strong>tocá el equipo que creés que va a ganar</strong>. Listo, eso es
        todo: quedás anotado y aparece &quot;📦 tu caja&quot; en el equipo que
        elegiste.
        <ul className="mt-2 space-y-1 text-muted">
          <li>
            ⏰ Cada partido se habilita{" "}
            <strong className="text-ink">{PICK_WINDOW_HOURS} horas antes</strong>{" "}
            de que empiece (antes se ve borroso).
          </li>
          <li>
            🔒 Cuando el partido arranca, <strong className="text-ink">se cierra</strong>:
            ya no podés elegir ni cambiar.
          </li>
          <li>🔁 Hasta que arranque, podés cambiar de equipo cuando quieras.</li>
        </ul>
      </Step>

      <Step n={3} emoji="📦" title="Sumá cajas (puntos)">
        Cuando termina el partido, el resultado se carga{" "}
        <strong>automáticamente</strong> y se reparten las cajas:
        <div className="grid grid-cols-3 gap-2 mt-3 text-center">
          <Box label="Tu equipo gana" value="+3 📦" color="text-emerald-400" />
          <Box label="Empate" value="+1 📦" color="text-amber" />
          <Box label="Tu equipo pierde" value="0 📦" color="text-muted" />
        </div>
        <p className="mt-2 text-muted">
          ⚠️ <strong className="text-rust">Si no elegís antes de que arranque,
          es como haber perdido: 0 cajas — pero el aporte lo pagás igual.
          </strong>{" "}
          Una vez que empieza el partido no se puede elegir ni cambiar. ¡No te
          duermas!
        </p>
      </Step>

      <Step n={4} emoji="💰" title="El pozo">
        <strong>
          Por cada partido que se juega, todos aportan{" "}
          {formatARS(STAKE_PER_MATCH)} — hayan elegido o no.
        </strong>{" "}
        Con {TOTAL_MATCHES} partidos y {board.memberCount} jugadores, el pozo
        final llega a <strong className="text-amber">{formatARS(pot)}</strong>.
        En la pantalla principal ves la barra de cómo se va llenando.
      </Step>

      <Step n={5} emoji="🏆" title="Los premios">
        Al final del Mundial, la <strong>Torre de Contenedores</strong> (tabla
        de posiciones) define quién se lleva el pozo:
        <div className="grid grid-cols-3 gap-2 mt-3 text-center">
          <Box
            label={`🥇 1° (${PRIZE_SPLIT[0] * 100}%)`}
            value={formatARS(pot * PRIZE_SPLIT[0])}
            color="text-amber"
          />
          <Box
            label={`🥈 2° (${PRIZE_SPLIT[1] * 100}%)`}
            value={formatARS(pot * PRIZE_SPLIT[1])}
            color="text-ink"
          />
          <Box
            label={`🥉 3° (${PRIZE_SPLIT[2] * 100}%)`}
            value={formatARS(pot * PRIZE_SPLIT[2])}
            color="text-rust"
          />
        </div>
      </Step>

      <section className="rounded-xl border border-line bg-steel-850 p-5">
        <h2 className="font-black mb-3">❓ Preguntas frecuentes</h2>
        <dl className="space-y-3 text-sm">
          <Faq q="¿Puedo cambiar mi elección?">
            Sí, todas las veces que quieras, hasta que arranque el partido.
          </Faq>
          <Faq q="¿Y si el partido empata y se define por penales?">
            <strong className="text-ink">
              El que gana los penales cuenta como ganador
            </strong>
            : 3 cajas para quienes lo eligieron, 0 para el resto — igual que
            una victoria normal. En la tarjeta lo ves como &quot;1-1 (pen)&quot;
            con el GANÓ en el equipo que se llevó la tanda.
          </Faq>
          <Faq q="¿Quién carga los resultados?">
            Nadie: se actualizan solos un rato después de cada partido. La
            tabla se recalcula automáticamente.
          </Faq>
          <Faq q="¿Y los cruces de octavos, cuartos, etc.?">
            Aparecen borrosos como &quot;Por confirmar&quot; y se habilitan
            cuando se definen los equipos.
          </Faq>
          <Faq q="¿Dónde veo cuánta plata puse?">
            En <strong>Mi cuenta</strong>: tu aporte acumulado, tus cajas y tu
            posición.
          </Faq>
          <Faq q="¿Qué pasa si dos quedamos con las mismas cajas?">
            Comparten posición. Desempata quien tenga{" "}
            <strong>más partidos ganados</strong> (los de 3 cajas). Si aun así
            siguen iguales, ese premio se <strong>reparte</strong> entre los
            empatados — nunca se decide por nombre.
          </Faq>
          <Faq q="Perdí mi link, ¿qué hago?">
            Pedíselo a Gabriel (admin), que puede reenviártelo o generarte uno
            nuevo.
          </Faq>
        </dl>
      </section>
    </div>
  );
}

function Step({
  n,
  emoji,
  title,
  children,
}: {
  n: number;
  emoji: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-line bg-steel-850 p-5 stack-in">
      <div className="flex items-center gap-3 mb-2">
        <span className="w-8 h-8 rounded-lg bg-amber text-steel-950 font-black flex items-center justify-center">
          {n}
        </span>
        <h2 className="font-black text-lg">
          {emoji} {title}
        </h2>
      </div>
      <div className="text-sm leading-relaxed">{children}</div>
    </section>
  );
}

function Box({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-lg border border-line bg-steel-900 p-3">
      <div className="text-[11px] text-muted">{label}</div>
      <div className={`font-black mt-1 ${color}`}>{value}</div>
    </div>
  );
}

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="font-bold text-ink">{q}</dt>
      <dd className="text-muted mt-0.5">{children}</dd>
    </div>
  );
}
