export type RandomFn = () => number;

export const clamp = (value: number, min = 0, max = 1): number =>
  Math.max(min, Math.min(max, value));

export const lerp = (from: number, to: number, t: number): number => from + (to - from) * t;

export const distance = (x1: number, y1: number, x2: number, y2: number): number =>
  Math.hypot(x2 - x1, y2 - y1);

export const normalize = (weights: Record<string, number>): Record<string, number> => {
  const total = Object.values(weights).reduce((sum, value) => sum + Math.max(0, value), 0);

  if (total <= 0) {
    const keys = Object.keys(weights);
    const fallback = 1 / keys.length;
    return keys.reduce<Record<string, number>>((acc, key) => {
      acc[key] = fallback;
      return acc;
    }, {});
  }

  return Object.entries(weights).reduce<Record<string, number>>((acc, [key, value]) => {
    acc[key] = Math.max(0, value) / total;
    return acc;
  }, {});
};

export const weightedChoice = <T extends string>(
  weights: Record<T, number>,
  random: RandomFn
): T => {
  const normalized = normalize(weights) as Record<T, number>;
  const threshold = random();
  let rolling = 0;

  for (const [key, value] of Object.entries(normalized) as [T, number][]) {
    rolling += value;
    if (threshold <= rolling) {
      return key;
    }
  }

  return Object.keys(normalized)[0] as T;
};

const seedStringToInt = (seed: string): number => {
  let hash = 1779033703 ^ seed.length;
  for (let index = 0; index < seed.length; index += 1) {
    hash = Math.imul(hash ^ seed.charCodeAt(index), 3432918353);
    hash = (hash << 13) | (hash >>> 19);
  }
  return (hash >>> 0) || 1;
};

export const createSeededRandom = (seed: string): RandomFn => {
  let state = seedStringToInt(seed);

  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const randomBetween = (min: number, max: number, random: RandomFn): number =>
  min + (max - min) * random();
