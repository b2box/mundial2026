"use client";

export function ReplayTour() {
  return (
    <button
      onClick={() => {
        localStorage.removeItem("b2box_tour_done");
        window.location.href = "/?tour=1";
      }}
      className="rounded-lg border border-amber/50 text-amber hover:bg-amber/10 font-bold px-4 py-2 text-sm transition-colors"
    >
      🔁 Volver a ver el tour interactivo
    </button>
  );
}
