// Fixture oficial del Mundial 2026 (Canadá/México/EE.UU.)
// Horarios en hora argentina (ART, UTC-3). Fase de grupos: 72 partidos.
// Eliminatorias: 32 partidos con equipos "Por confirmar" que el admin
// completa (botón Editar) a medida que se definen los cruces.
import { TBD } from "./teams";

export type FixtureMatch = {
  stage: string;
  group: string | null;
  home: string;
  away: string;
  kickoff: string; // ISO con offset -03:00
};

const G = "Fase de grupos";

export const FIXTURE_2026: FixtureMatch[] = [
  // ===== GRUPO A =====
  { stage: G, group: "A", home: "México", away: "Sudáfrica", kickoff: "2026-06-11T16:00:00-03:00" },
  { stage: G, group: "A", home: "Corea del Sur", away: "Chequia", kickoff: "2026-06-11T23:00:00-03:00" },
  { stage: G, group: "A", home: "Chequia", away: "Sudáfrica", kickoff: "2026-06-18T13:00:00-03:00" },
  { stage: G, group: "A", home: "México", away: "Corea del Sur", kickoff: "2026-06-18T22:00:00-03:00" },
  { stage: G, group: "A", home: "Chequia", away: "México", kickoff: "2026-06-24T22:00:00-03:00" },
  { stage: G, group: "A", home: "Sudáfrica", away: "Corea del Sur", kickoff: "2026-06-24T22:00:00-03:00" },

  // ===== GRUPO B =====
  { stage: G, group: "B", home: "Canadá", away: "Bosnia y Herzegovina", kickoff: "2026-06-12T16:00:00-03:00" },
  { stage: G, group: "B", home: "Catar", away: "Suiza", kickoff: "2026-06-13T16:00:00-03:00" },
  { stage: G, group: "B", home: "Suiza", away: "Bosnia y Herzegovina", kickoff: "2026-06-18T16:00:00-03:00" },
  { stage: G, group: "B", home: "Canadá", away: "Catar", kickoff: "2026-06-18T19:00:00-03:00" },
  { stage: G, group: "B", home: "Suiza", away: "Canadá", kickoff: "2026-06-24T16:00:00-03:00" },
  { stage: G, group: "B", home: "Bosnia y Herzegovina", away: "Catar", kickoff: "2026-06-24T16:00:00-03:00" },

  // ===== GRUPO C =====
  { stage: G, group: "C", home: "Brasil", away: "Marruecos", kickoff: "2026-06-13T19:00:00-03:00" },
  { stage: G, group: "C", home: "Haití", away: "Escocia", kickoff: "2026-06-13T21:00:00-03:00" },
  { stage: G, group: "C", home: "Escocia", away: "Marruecos", kickoff: "2026-06-19T19:00:00-03:00" },
  { stage: G, group: "C", home: "Brasil", away: "Haití", kickoff: "2026-06-19T22:00:00-03:00" },
  { stage: G, group: "C", home: "Escocia", away: "Brasil", kickoff: "2026-06-24T19:00:00-03:00" },
  { stage: G, group: "C", home: "Marruecos", away: "Haití", kickoff: "2026-06-24T19:00:00-03:00" },

  // ===== GRUPO D =====
  { stage: G, group: "D", home: "Estados Unidos", away: "Paraguay", kickoff: "2026-06-12T22:00:00-03:00" },
  { stage: G, group: "D", home: "Australia", away: "Turquía", kickoff: "2026-06-14T01:00:00-03:00" },
  { stage: G, group: "D", home: "Estados Unidos", away: "Australia", kickoff: "2026-06-19T19:00:00-03:00" },
  { stage: G, group: "D", home: "Turquía", away: "Paraguay", kickoff: "2026-06-20T00:00:00-03:00" },
  { stage: G, group: "D", home: "Turquía", away: "Estados Unidos", kickoff: "2026-06-25T23:00:00-03:00" },
  { stage: G, group: "D", home: "Paraguay", away: "Australia", kickoff: "2026-06-25T23:00:00-03:00" },

  // ===== GRUPO E =====
  { stage: G, group: "E", home: "Alemania", away: "Curazao", kickoff: "2026-06-14T13:00:00-03:00" },
  { stage: G, group: "E", home: "Costa de Marfil", away: "Ecuador", kickoff: "2026-06-14T19:00:00-03:00" },
  { stage: G, group: "E", home: "Alemania", away: "Costa de Marfil", kickoff: "2026-06-20T13:00:00-03:00" },
  { stage: G, group: "E", home: "Curazao", away: "Ecuador", kickoff: "2026-06-20T19:00:00-03:00" },
  { stage: G, group: "E", home: "Ecuador", away: "Alemania", kickoff: "2026-06-25T21:00:00-03:00" },
  { stage: G, group: "E", home: "Curazao", away: "Costa de Marfil", kickoff: "2026-06-25T21:00:00-03:00" },

  // ===== GRUPO F =====
  { stage: G, group: "F", home: "Países Bajos", away: "Japón", kickoff: "2026-06-14T17:00:00-03:00" },
  { stage: G, group: "F", home: "Suecia", away: "Túnez", kickoff: "2026-06-14T23:00:00-03:00" },
  { stage: G, group: "F", home: "Países Bajos", away: "Suecia", kickoff: "2026-06-20T14:00:00-03:00" },
  { stage: G, group: "F", home: "Túnez", away: "Japón", kickoff: "2026-06-21T01:00:00-03:00" },
  { stage: G, group: "F", home: "Japón", away: "Suecia", kickoff: "2026-06-25T20:00:00-03:00" },
  { stage: G, group: "F", home: "Túnez", away: "Países Bajos", kickoff: "2026-06-25T20:00:00-03:00" },

  // ===== GRUPO G =====
  { stage: G, group: "G", home: "Bélgica", away: "Egipto", kickoff: "2026-06-15T16:00:00-03:00" },
  { stage: G, group: "G", home: "Irán", away: "Nueva Zelanda", kickoff: "2026-06-15T22:00:00-03:00" },
  { stage: G, group: "G", home: "Bélgica", away: "Irán", kickoff: "2026-06-21T16:00:00-03:00" },
  { stage: G, group: "G", home: "Egipto", away: "Nueva Zelanda", kickoff: "2026-06-21T22:00:00-03:00" },
  { stage: G, group: "G", home: "Egipto", away: "Irán", kickoff: "2026-06-26T00:00:00-03:00" },
  { stage: G, group: "G", home: "Nueva Zelanda", away: "Bélgica", kickoff: "2026-06-26T00:00:00-03:00" },

  // ===== GRUPO H =====
  { stage: G, group: "H", home: "España", away: "Cabo Verde", kickoff: "2026-06-15T13:00:00-03:00" },
  { stage: G, group: "H", home: "Arabia Saudita", away: "Uruguay", kickoff: "2026-06-15T20:00:00-03:00" },
  { stage: G, group: "H", home: "España", away: "Arabia Saudita", kickoff: "2026-06-21T13:00:00-03:00" },
  { stage: G, group: "H", home: "Uruguay", away: "Cabo Verde", kickoff: "2026-06-21T20:00:00-03:00" },
  { stage: G, group: "H", home: "Uruguay", away: "España", kickoff: "2026-06-26T21:00:00-03:00" },
  { stage: G, group: "H", home: "Cabo Verde", away: "Arabia Saudita", kickoff: "2026-06-26T21:00:00-03:00" },

  // ===== GRUPO I =====
  { stage: G, group: "I", home: "Francia", away: "Senegal", kickoff: "2026-06-16T16:00:00-03:00" },
  { stage: G, group: "I", home: "Irak", away: "Noruega", kickoff: "2026-06-16T22:00:00-03:00" },
  { stage: G, group: "I", home: "Francia", away: "Irak", kickoff: "2026-06-22T16:00:00-03:00" },
  { stage: G, group: "I", home: "Noruega", away: "Senegal", kickoff: "2026-06-22T21:00:00-03:00" },
  { stage: G, group: "I", home: "Noruega", away: "Francia", kickoff: "2026-06-26T16:00:00-03:00" },
  { stage: G, group: "I", home: "Senegal", away: "Irak", kickoff: "2026-06-26T16:00:00-03:00" },

  // ===== GRUPO J =====
  { stage: G, group: "J", home: "Austria", away: "Jordania", kickoff: "2026-06-16T01:00:00-03:00" },
  { stage: G, group: "J", home: "Argentina", away: "Argelia", kickoff: "2026-06-16T22:00:00-03:00" },
  { stage: G, group: "J", home: "Argentina", away: "Austria", kickoff: "2026-06-22T14:00:00-03:00" },
  { stage: G, group: "J", home: "Jordania", away: "Argelia", kickoff: "2026-06-23T00:00:00-03:00" },
  { stage: G, group: "J", home: "Argentina", away: "Jordania", kickoff: "2026-06-27T23:00:00-03:00" },
  { stage: G, group: "J", home: "Argelia", away: "Austria", kickoff: "2026-06-27T23:00:00-03:00" },

  // ===== GRUPO K =====
  { stage: G, group: "K", home: "Portugal", away: "RD Congo", kickoff: "2026-06-17T14:00:00-03:00" },
  { stage: G, group: "K", home: "Colombia", away: "Uzbekistán", kickoff: "2026-06-17T23:00:00-03:00" },
  { stage: G, group: "K", home: "Portugal", away: "Uzbekistán", kickoff: "2026-06-23T14:00:00-03:00" },
  { stage: G, group: "K", home: "Colombia", away: "RD Congo", kickoff: "2026-06-23T23:00:00-03:00" },
  { stage: G, group: "K", home: "Colombia", away: "Portugal", kickoff: "2026-06-27T20:30:00-03:00" },
  { stage: G, group: "K", home: "RD Congo", away: "Uzbekistán", kickoff: "2026-06-27T20:30:00-03:00" },

  // ===== GRUPO L =====
  { stage: G, group: "L", home: "Inglaterra", away: "Croacia", kickoff: "2026-06-17T19:00:00-03:00" },
  { stage: G, group: "L", home: "Ghana", away: "Panamá", kickoff: "2026-06-18T17:00:00-03:00" },
  { stage: G, group: "L", home: "Inglaterra", away: "Ghana", kickoff: "2026-06-23T17:00:00-03:00" },
  { stage: G, group: "L", home: "Croacia", away: "Panamá", kickoff: "2026-06-23T20:00:00-03:00" },
  { stage: G, group: "L", home: "Panamá", away: "Inglaterra", kickoff: "2026-06-27T18:00:00-03:00" },
  { stage: G, group: "L", home: "Croacia", away: "Ghana", kickoff: "2026-06-27T18:00:00-03:00" },

  // ===== DIECISEISAVOS (16) — cruces por definir =====
  { stage: "Dieciseisavos", group: null, home: TBD, away: TBD, kickoff: "2026-06-28T16:00:00-03:00" },
  { stage: "Dieciseisavos", group: null, home: TBD, away: TBD, kickoff: "2026-06-28T20:00:00-03:00" },
  { stage: "Dieciseisavos", group: null, home: TBD, away: TBD, kickoff: "2026-06-29T13:00:00-03:00" },
  { stage: "Dieciseisavos", group: null, home: TBD, away: TBD, kickoff: "2026-06-29T17:00:00-03:00" },
  { stage: "Dieciseisavos", group: null, home: TBD, away: TBD, kickoff: "2026-06-29T21:00:00-03:00" },
  { stage: "Dieciseisavos", group: null, home: TBD, away: TBD, kickoff: "2026-06-30T13:00:00-03:00" },
  { stage: "Dieciseisavos", group: null, home: TBD, away: TBD, kickoff: "2026-06-30T17:00:00-03:00" },
  { stage: "Dieciseisavos", group: null, home: TBD, away: TBD, kickoff: "2026-06-30T21:00:00-03:00" },
  { stage: "Dieciseisavos", group: null, home: TBD, away: TBD, kickoff: "2026-07-01T13:00:00-03:00" },
  { stage: "Dieciseisavos", group: null, home: TBD, away: TBD, kickoff: "2026-07-01T17:00:00-03:00" },
  { stage: "Dieciseisavos", group: null, home: TBD, away: TBD, kickoff: "2026-07-01T21:00:00-03:00" },
  { stage: "Dieciseisavos", group: null, home: TBD, away: TBD, kickoff: "2026-07-02T13:00:00-03:00" },
  { stage: "Dieciseisavos", group: null, home: TBD, away: TBD, kickoff: "2026-07-02T17:00:00-03:00" },
  { stage: "Dieciseisavos", group: null, home: TBD, away: TBD, kickoff: "2026-07-02T21:00:00-03:00" },
  { stage: "Dieciseisavos", group: null, home: TBD, away: TBD, kickoff: "2026-07-03T16:00:00-03:00" },
  { stage: "Dieciseisavos", group: null, home: TBD, away: TBD, kickoff: "2026-07-03T20:00:00-03:00" },

  // ===== OCTAVOS (8) =====
  { stage: "Octavos", group: null, home: TBD, away: TBD, kickoff: "2026-07-04T16:00:00-03:00" },
  { stage: "Octavos", group: null, home: TBD, away: TBD, kickoff: "2026-07-04T20:00:00-03:00" },
  { stage: "Octavos", group: null, home: TBD, away: TBD, kickoff: "2026-07-05T16:00:00-03:00" },
  { stage: "Octavos", group: null, home: TBD, away: TBD, kickoff: "2026-07-05T20:00:00-03:00" },
  { stage: "Octavos", group: null, home: TBD, away: TBD, kickoff: "2026-07-06T16:00:00-03:00" },
  { stage: "Octavos", group: null, home: TBD, away: TBD, kickoff: "2026-07-06T20:00:00-03:00" },
  { stage: "Octavos", group: null, home: TBD, away: TBD, kickoff: "2026-07-07T16:00:00-03:00" },
  { stage: "Octavos", group: null, home: TBD, away: TBD, kickoff: "2026-07-07T20:00:00-03:00" },

  // ===== CUARTOS (4) =====
  { stage: "Cuartos", group: null, home: TBD, away: TBD, kickoff: "2026-07-09T17:00:00-03:00" },
  { stage: "Cuartos", group: null, home: TBD, away: TBD, kickoff: "2026-07-10T17:00:00-03:00" },
  { stage: "Cuartos", group: null, home: TBD, away: TBD, kickoff: "2026-07-11T13:00:00-03:00" },
  { stage: "Cuartos", group: null, home: TBD, away: TBD, kickoff: "2026-07-11T17:00:00-03:00" },

  // ===== SEMIFINALES (2) =====
  { stage: "Semifinal", group: null, home: TBD, away: TBD, kickoff: "2026-07-14T17:00:00-03:00" },
  { stage: "Semifinal", group: null, home: TBD, away: TBD, kickoff: "2026-07-15T17:00:00-03:00" },

  // ===== TERCER PUESTO =====
  { stage: "Tercer puesto", group: null, home: TBD, away: TBD, kickoff: "2026-07-18T17:00:00-03:00" },

  // ===== FINAL =====
  { stage: "Final", group: null, home: TBD, away: TBD, kickoff: "2026-07-19T16:00:00-03:00" },
];
