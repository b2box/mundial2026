"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { WelcomeSplash } from "./WelcomeSplash";
import { TourGuide } from "./TourGuide";

const TOUR_KEY = "b2box_tour_done";

// Orquesta el onboarding: splash de entrada (si vino por su link) y después
// el tour interactivo paso a paso sobre la interfaz (solo la primera vez,
// o si se fuerza con ?tour=1 desde la Guía).
export function Onboarding({
  bienvenida,
  forceTour,
  name,
  color,
  projectedPot,
  stake,
}: {
  bienvenida: boolean;
  forceTour: boolean;
  name: string;
  color: string;
  projectedPot: number;
  stake: number;
}) {
  const [splashDone, setSplashDone] = useState(!bienvenida);
  const [tourActive, setTourActive] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!splashDone) return;
    const done = localStorage.getItem(TOUR_KEY);
    if (forceTour || !done) {
      setTourActive(true);
    } else if (bienvenida) {
      router.replace("/", { scroll: false });
    }
  }, [splashDone, forceTour, bienvenida, router]);

  function finishTour() {
    localStorage.setItem(TOUR_KEY, "1");
    setTourActive(false);
    router.replace("/", { scroll: false });
  }

  return (
    <>
      {!splashDone && (
        <WelcomeSplash
          name={name}
          color={color}
          onDone={() => setSplashDone(true)}
        />
      )}
      {tourActive && (
        <TourGuide
          projectedPot={projectedPot}
          stake={stake}
          onDone={finishTour}
        />
      )}
    </>
  );
}
