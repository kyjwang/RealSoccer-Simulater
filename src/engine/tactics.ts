import type { TacticStyle } from "@/types/team";

export type TacticModifiers = {
  passBias: number;
  dribbleBias: number;
  shotBias: number;
  backpassBias: number;
  pressIntensity: number;
  defensiveCompactness: number;
  verticality: number;
};

const STYLE_MODIFIERS: Record<TacticStyle, TacticModifiers> = {
  possession: {
    passBias: 1.18,
    dribbleBias: 0.92,
    shotBias: 0.95,
    backpassBias: 1.12,
    pressIntensity: 1,
    defensiveCompactness: 1.05,
    verticality: 0.86
  },
  balanced: {
    passBias: 1,
    dribbleBias: 1,
    shotBias: 1,
    backpassBias: 1,
    pressIntensity: 1,
    defensiveCompactness: 1,
    verticality: 1
  },
  counter: {
    passBias: 0.95,
    dribbleBias: 1.1,
    shotBias: 1.08,
    backpassBias: 0.88,
    pressIntensity: 0.98,
    defensiveCompactness: 1.08,
    verticality: 1.2
  },
  highPress: {
    passBias: 1,
    dribbleBias: 0.98,
    shotBias: 1.03,
    backpassBias: 0.92,
    pressIntensity: 1.18,
    defensiveCompactness: 0.95,
    verticality: 1.04
  },
  longBall: {
    passBias: 0.9,
    dribbleBias: 0.94,
    shotBias: 1.05,
    backpassBias: 0.8,
    pressIntensity: 0.92,
    defensiveCompactness: 0.98,
    verticality: 1.28
  }
};

export const getTacticModifiers = (style: TacticStyle): TacticModifiers => STYLE_MODIFIERS[style];
