"use client";

export function DeleteButton({
  action,
  matchId,
}: {
  action: (fd: FormData) => void;
  matchId: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("¿Borrar este partido y sus pronósticos?")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="matchId" value={matchId} />
      <button className="text-xs text-rust/80 hover:text-rust border border-rust/30 hover:border-rust/60 rounded-md px-2.5 py-1.5 transition-colors">
        Borrar
      </button>
    </form>
  );
}
