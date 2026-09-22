/**
 * Espresso puck geometry.
 *
 * Tamped bulk density is calibrated so a VST 18 g basket (Ø 58.7 mm, 24 mm
 * deep) at 300 μm, medium roast, 4 mm headspace doses ~18 g — matching how
 * those baskets are used. Finer grinds pack denser (fines fill voids), so the
 * same headspace needs a heavier dose.
 */

export const GRIND_MIN = 180;
export const GRIND_MAX = 420;
export const GRIND_STEP = 5;

export const HEADSPACE_MIN = 1;
export const HEADSPACE_MAX = 10;

export type RoastId = "light" | "medium" | "dark";

export type LabState = {
  basketId: string;
  customDiameter: number;
  customDepth: number;
  headspaceMm: number;
  grindUm: number;
  roast: RoastId;
  screenOn: boolean;
};

export const DEFAULT_LAB: LabState = {
  basketId: "vst-18",
  customDiameter: 58.7,
  customDepth: 24,
  headspaceMm: 4,
  grindUm: 280,
  roast: "medium",
  screenOn: false,
};

export const ROASTS: { id: RoastId; label: string; densityMul: number; note: string }[] = [
  { id: "light", label: "Light", densityMul: 1.08, note: "Denser beans, less roast loss" },
  { id: "medium", label: "Medium", densityMul: 1, note: "Baseline density" },
  { id: "dark", label: "Dark", densityMul: 0.9, note: "More porous, lower bulk density" },
];

export type Basket = {
  id: string;
  name: string;
  subtitle: string;
  diameterMm: number;
  depthMm: number;
  ratedG: number;
};

export const BASKETS: Basket[] = [
  { id: "vst-15", name: "VST 15 g", subtitle: "58 mm · 22 mm", diameterMm: 58.7, depthMm: 22, ratedG: 15 },
  { id: "vst-18", name: "VST 18 g", subtitle: "58 mm · 24 mm", diameterMm: 58.7, depthMm: 24, ratedG: 18 },
  { id: "vst-20", name: "VST 20 g", subtitle: "58 mm · 26 mm", diameterMm: 58.7, depthMm: 26, ratedG: 20 },
  { id: "vst-22", name: "VST 22 g", subtitle: "58 mm · 28.5 mm", diameterMm: 58.7, depthMm: 28.5, ratedG: 22 },
  { id: "ims-18", name: "IMS 18/20 g", subtitle: "58 mm · 24.5 mm", diameterMm: 58.5, depthMm: 24.5, ratedG: 18 },
  { id: "stock-58", name: "Stock 58 mm", subtitle: "ridged double", diameterMm: 58, depthMm: 25, ratedG: 18 },
  { id: "breville-54", name: "Breville 54 mm", subtitle: "double · 24.5 mm", diameterMm: 54, depthMm: 24.5, ratedG: 18 },
  { id: "ninja-double", name: "Ninja Luxe double", subtitle: "53 mm · 18 g", diameterMm: 53, depthMm: 26.5, ratedG: 18 },
  { id: "ninja-quad", name: "Ninja Luxe quad", subtitle: "53 mm · 40 g", diameterMm: 53, depthMm: 58, ratedG: 40 },
  { id: "custom", name: "Custom", subtitle: "set Ø and depth", diameterMm: 58.7, depthMm: 24, ratedG: 18 },
];

export const ISO_LEVELS_MM = [2, 3, 4, 5, 6, 8] as const;

export const SCREEN_MM = 1.7;

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function basketAreaCm2(diameterMm: number) {
  const rCm = diameterMm / 20;
  return Math.PI * rCm * rCm;
}

/** Tamped bulk density, g/cm³. */
export function tampedDensityGcm3(grindUm: number, roastMul: number) {
  const t = clamp((grindUm - GRIND_MIN) / (GRIND_MAX - GRIND_MIN), 0, 1);
  // Fine espresso ~0.372, classic ~0.333, coarse/turbo ~0.293 (medium roast).
  const grindMul = 1.12 - 0.24 * Math.pow(t, 0.9);
  return 0.3325 * grindMul * roastMul;
}

export type Geometry = {
  diameterMm: number;
  depthMm: number;
  headspaceMm: number;
  grindUm: number;
  roastMul: number;
  screenMm: number;
};

export function puckHeightMm(g: Pick<Geometry, "depthMm" | "headspaceMm" | "screenMm">) {
  return g.depthMm - g.headspaceMm - g.screenMm;
}

export function doseForHeadspace(g: Geometry) {
  const height = puckHeightMm(g);
  if (height <= 0) return 0;
  const volCm3 = basketAreaCm2(g.diameterMm) * (height / 10);
  return tampedDensityGcm3(g.grindUm, g.roastMul) * volCm3;
}

export function headspaceForDose(
  doseG: number,
  g: Omit<Geometry, "headspaceMm">,
) {
  const density = tampedDensityGcm3(g.grindUm, g.roastMul);
  const area = basketAreaCm2(g.diameterMm);
  if (density <= 0 || area <= 0) return g.depthMm;
  const puckMm = (doseG / density / area) * 10;
  return g.depthMm - g.screenMm - puckMm;
}

/** Grams of coffee per millimetre of puck height. */
export function gramsPerMm(diameterMm: number, grindUm: number, roastMul: number) {
  return tampedDensityGcm3(grindUm, roastMul) * basketAreaCm2(diameterMm) * 0.1;
}

export function grindBand(grindUm: number) {
  if (grindUm < 230) return "Extra-fine espresso";
  if (grindUm < 280) return "Fine espresso";
  if (grindUm < 330) return "Classic espresso";
  if (grindUm < 380) return "Turbo / allongé";
  return "Coarse espresso";
}

export function formatG(n: number) {
  return n.toFixed(1);
}

export function formatMm(n: number) {
  return (Math.round(n * 10) / 10).toFixed(1);
}

export type ChartRow = {
  grind: number;
  target: number;
  imprint: number;
  [key: `hs${number}`]: number;
};

export function buildChartData(args: {
  diameterMm: number;
  depthMm: number;
  targetHs: number;
  roastMul: number;
  screenMm: number;
}): ChartRow[] {
  const rows: ChartRow[] = [];
  for (let grind = GRIND_MIN; grind <= GRIND_MAX; grind += GRIND_STEP) {
    const base = {
      diameterMm: args.diameterMm,
      depthMm: args.depthMm,
      grindUm: grind,
      roastMul: args.roastMul,
      screenMm: args.screenMm,
    };
    const row: ChartRow = {
      grind,
      target: round1(doseForHeadspace({ ...base, headspaceMm: args.targetHs })),
      imprint: round1(doseForHeadspace({ ...base, headspaceMm: 1 })),
    };
    for (const hs of ISO_LEVELS_MM) {
      row[`hs${hs}`] = round1(doseForHeadspace({ ...base, headspaceMm: hs }));
    }
    rows.push(row);
  }
  return rows;
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}
