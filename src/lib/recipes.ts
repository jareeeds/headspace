import {
  BASKETS,
  DEFAULT_LAB,
  GRIND_MAX,
  GRIND_MIN,
  HEADSPACE_MAX,
  HEADSPACE_MIN,
  ROASTS,
  clamp,
  type LabState,
  type RoastId,
} from "@/lib/headspace";

export const STORE_KEY = "headspace.v1";
const MAX_RECIPES = 24;

export type Recipe = {
  id: string;
  name: string;
  savedAt: number;
  doseG: number;
  state: LabState;
};

export type RecipeStore = {
  state: LabState;
  recipes: Recipe[];
};

const ROAST_IDS = new Set(ROASTS.map((r) => r.id));
const BASKET_IDS = new Set(BASKETS.map((b) => b.id));

function asNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function parseLabState(raw: unknown): LabState {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_LAB };
  const o = raw as Record<string, unknown>;
  const roast: RoastId = ROAST_IDS.has(o.roast as RoastId) ? (o.roast as RoastId) : DEFAULT_LAB.roast;
  const basketId = typeof o.basketId === "string" && BASKET_IDS.has(o.basketId) ? o.basketId : DEFAULT_LAB.basketId;
  return {
    basketId,
    customDiameter: clamp(asNumber(o.customDiameter, DEFAULT_LAB.customDiameter), 49, 59),
    customDepth: clamp(asNumber(o.customDepth, DEFAULT_LAB.customDepth), 18, 32),
    headspaceMm: clamp(asNumber(o.headspaceMm, DEFAULT_LAB.headspaceMm), HEADSPACE_MIN, HEADSPACE_MAX),
    grindUm: clamp(asNumber(o.grindUm, DEFAULT_LAB.grindUm), GRIND_MIN, GRIND_MAX),
    roast,
    screenOn: Boolean(o.screenOn),
  };
}

export function parseStore(raw: unknown): RecipeStore {
  if (!raw || typeof raw !== "object") {
    return { state: { ...DEFAULT_LAB }, recipes: [] };
  }
  const o = raw as Record<string, unknown>;
  const recipes = Array.isArray(o.recipes)
    ? o.recipes
        .map((item) => {
          if (!item || typeof item !== "object") return null;
          const r = item as Record<string, unknown>;
          if (typeof r.id !== "string" || typeof r.name !== "string") return null;
          return {
            id: r.id,
            name: r.name.slice(0, 48),
            savedAt: asNumber(r.savedAt, Date.now()),
            doseG: asNumber(r.doseG, 0),
            state: parseLabState(r.state),
          } satisfies Recipe;
        })
        .filter((x): x is Recipe => x !== null)
        .slice(0, MAX_RECIPES)
    : [];
  return { state: parseLabState(o.state), recipes };
}

export function readStore(): RecipeStore | null {
  if (typeof window === "undefined") return null;
  try {
    const text = window.localStorage.getItem(STORE_KEY);
    if (!text) return null;
    return parseStore(JSON.parse(text));
  } catch {
    return null;
  }
}

export function writeStore(store: RecipeStore) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch {
    // Quota or private mode — fail quietly.
  }
}

export function upsertRecipe(recipes: Recipe[], name: string, state: LabState, doseG: number): Recipe[] {
  const trimmed = name.trim().slice(0, 48);
  if (!trimmed) return recipes;
  const existing = recipes.find((r) => r.name.toLowerCase() === trimmed.toLowerCase());
  const next: Recipe = {
    id: existing?.id ?? (crypto.randomUUID?.() || `r-${Date.now()}`),
    name: trimmed,
    savedAt: Date.now(),
    doseG,
    state: { ...state },
  };
  const rest = recipes.filter((r) => r.id !== next.id);
  return [next, ...rest].slice(0, MAX_RECIPES);
}

export function defaultRecipeName(state: LabState) {
  const basket = BASKETS.find((b) => b.id === state.basketId);
  const basketLabel = state.basketId === "custom" ? "Custom basket" : (basket?.name ?? "Basket");
  return `${basketLabel} · ${state.headspaceMm.toFixed(1)} mm`;
}
