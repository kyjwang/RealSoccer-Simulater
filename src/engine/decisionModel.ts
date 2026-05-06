import { weightedChoice } from "@/engine/probability";
import { effectiveAttribute } from "@/engine/ratingModel";
import { getTacticModifiers } from "@/engine/tactics";
import type { RandomFn } from "@/engine/probability";
import type { PlayerRating } from "@/types/player";
import type { Team } from "@/types/team";

export type PossessionAction = "pass" | "dribble" | "shot" | "backpass" | "lose";

export type DecisionContext = {
  carrier: PlayerRating;
  carrierStamina: number;
  attackingTeam: Team;
  defendingTeam: Team;
  distanceToGoal: number;
  defensivePressure: number;
  supportScore: number;
  centrality: number;
};

const normalizePitchDistance = (distanceToGoal: number): number =>
  Math.max(0, Math.min(1, 1 - distanceToGoal / 100));

export const chooseAction = (context: DecisionContext, random: RandomFn): PossessionAction => {
  const tactic = getTacticModifiers(context.attackingTeam.tacticStyle);

  const shootingQuality = effectiveAttribute(context.carrier, "shooting", context.carrierStamina);
  const passingQuality = effectiveAttribute(context.carrier, "passing", context.carrierStamina);
  const dribblingQuality = effectiveAttribute(context.carrier, "dribbling", context.carrierStamina);

  const goalThreat = normalizePitchDistance(context.distanceToGoal);
  const fatigue = 1 - Math.max(0, Math.min(1, context.carrierStamina / 100));

  const shotWeight =
    (0.06 + goalThreat * 0.44 + shootingQuality * 0.4 - context.defensivePressure * 0.25) *
    tactic.shotBias;
  const passWeight =
    (0.24 + passingQuality * 0.34 + context.supportScore * 0.32 - context.defensivePressure * 0.12) *
    tactic.passBias;
  const dribbleWeight =
    (0.14 + dribblingQuality * 0.32 + context.centrality * 0.08 - context.defensivePressure * 0.2) *
    tactic.dribbleBias;
  const backpassWeight =
    (0.08 + context.defensivePressure * 0.42 + fatigue * 0.25 - goalThreat * 0.12) * tactic.backpassBias;
  const loseWeight = 0.04 + context.defensivePressure * 0.3 + fatigue * 0.15;

  return weightedChoice<PossessionAction>(
    {
      shot: Math.max(0.01, shotWeight),
      pass: Math.max(0.01, passWeight),
      dribble: Math.max(0.01, dribbleWeight),
      backpass: Math.max(0.01, backpassWeight),
      lose: Math.max(0.01, loseWeight)
    },
    random
  );
};
