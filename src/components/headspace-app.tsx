import { useEffect, useState } from "react";
import { IsoChart } from "@/components/iso-chart";
import { LabControls } from "@/components/lab-controls";
import { PuckDiagram } from "@/components/puck-diagram";
import { SavedRecipes } from "@/components/saved-recipes";
import {
  BASKETS,
  DEFAULT_LAB,
  GRIND_MAX,
  GRIND_MIN,
  ROASTS,
  SCREEN_MM,
  clamp,
  doseForHeadspace,
  formatG,
  formatMm,
  gramsPerMm,
  puckHeightMm,
  tampedDensityGcm3,
  type LabState,
} from "@/lib/headspace";
import {
  readStore,
  upsertRecipe,
  writeStore,
  type Recipe,
} from "@/lib/recipes";

export function HeadspaceApp() {
  const [state, setState] = useState<LabState>(DEFAULT_LAB);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [loadedName, setLoadedName] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const store = readStore();
    if (store) {
      setState(store.state);
      setRecipes(store.recipes);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    writeStore({ state, recipes });
  }, [hydrated, state, recipes]);

  const patch = (next: Partial<LabState>) => {
    setState((s) => ({ ...s, ...next }));
    setLoadedId(null);
  };

  const loadRecipe = (recipe: Recipe) => {
    setState({ ...recipe.state });
    setLoadedId(recipe.id);
    setLoadedName(recipe.name);
    window.setTimeout(() => setLoadedName(null), 1800);
  };

  const saveRecipe = (name: string) => {
    const next = upsertRecipe(recipes, name, state, doseG);
    setRecipes(next);
    setLoadedId(next[0]?.id ?? null);
  };

  const deleteRecipe = (id: string) => {
    setRecipes((list) => list.filter((r) => r.id !== id));
    if (loadedId === id) setLoadedId(null);
  };

  const reset = () => {
    setState({ ...DEFAULT_LAB });
    setLoadedId(null);
  };

  const basket = BASKETS.find((b) => b.id === state.basketId) ?? BASKETS[1]!;
  const diameterMm = state.basketId === "custom" ? state.customDiameter : basket.diameterMm;
  const depthMm = state.basketId === "custom" ? state.customDepth : basket.depthMm;
  const roastMul = ROASTS.find((r) => r.id === state.roast)?.densityMul ?? 1;
  const screenMm = state.screenOn ? SCREEN_MM : 0;

  const geometry = {
    diameterMm,
    depthMm,
    headspaceMm: state.headspaceMm,
    grindUm: state.grindUm,
    roastMul,
    screenMm,
  };

  const doseG = doseForHeadspace(geometry);
  const puckMm = Math.max(puckHeightMm(geometry), 0);
  const density = tampedDensityGcm3(state.grindUm, roastMul);
  const gPerMm = gramsPerMm(diameterMm, state.grindUm, roastMul);

  const step = 50;
  const canGoFiner = state.grindUm - step >= GRIND_MIN;
  const compareGrind = canGoFiner
    ? state.grindUm - step
    : Math.min(GRIND_MAX, state.grindUm + step);
  const compareDose = doseForHeadspace({ ...geometry, grindUm: compareGrind });
  const delta = canGoFiner ? compareDose - doseG : doseG - compareDose;
  const insight = canGoFiner
    ? `Grind ${step} μm finer and add ${formatG(Math.abs(delta))} g to keep ${formatMm(state.headspaceMm)} mm of headspace.`
    : `Grind ${step} μm coarser and drop ${formatG(Math.abs(delta))} g to keep ${formatMm(state.headspaceMm)} mm of headspace.`;

  const samples = [200, 250, 300, 350, 400].map((grind) => ({
    grind,
    dose: doseForHeadspace({ ...geometry, grindUm: grind }),
  }));

  const overflowing = puckMm <= 0;
  const tight = state.headspaceMm < 1.5;

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <header className="stagger-in mx-auto flex max-w-6xl flex-col gap-4 px-4 pt-8 pb-6 md:flex-row md:items-end md:justify-between md:pt-12">
        <div>
          <p className="text-xs font-medium tracking-widest text-muted uppercase">Espresso geometry</p>
          <h1 className="font-display mt-1 text-4xl font-medium tracking-tight md:text-5xl">Headspace</h1>
        </div>
        <p className="max-w-md text-sm text-muted md:text-right">
          Finer coffee packs denser. To hold the same gap under the shower screen, dose up as you grind down.
        </p>
      </header>

      <main className="mx-auto grid max-w-6xl gap-4 px-4 pb-16 lg:grid-cols-12">
        <section className="order-2 rounded-2xl bg-surface p-4 shadow-border lg:order-1 lg:col-span-7 lg:row-span-2 lg:p-6">
          <div className="h-80 md:h-96">
            <IsoChart
              diameterMm={diameterMm}
              depthMm={depthMm}
              targetHs={state.headspaceMm}
              roastMul={roastMul}
              screenMm={screenMm}
              grindUm={state.grindUm}
              doseG={doseG}
              onGrindChange={(grindUm) => patch({ grindUm: clamp(grindUm, GRIND_MIN, GRIND_MAX) })}
            />
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-80 text-left text-sm">
              <caption className="mb-2 text-left text-xs text-muted">
                Dose required for {formatMm(state.headspaceMm)} mm headspace
              </caption>
              <thead>
                <tr className="border-b border-line text-xs tracking-wide text-muted uppercase">
                  <th className="py-2 pr-3 font-medium">Grind</th>
                  {samples.map((s) => (
                    <th key={s.grind} className="py-2 pr-3 font-medium">
                      {s.grind} μm
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th className="py-2 pr-3 font-medium text-muted">Dose</th>
                  {samples.map((s) => (
                    <td key={s.grind} className="py-2 pr-3 font-mono tabular-nums">
                      {formatG(s.dose)} g
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="order-1 rounded-2xl bg-surface p-4 shadow-border lg:order-2 lg:col-span-5 lg:p-5">
          <p className="text-xs font-medium tracking-wide text-muted uppercase">Dose for this gap</p>
          <p className="font-display mt-1 text-5xl font-medium tracking-tight tabular-nums">
            {overflowing ? "—" : formatG(doseG)}
            <span className="ml-2 text-2xl text-muted">{overflowing ? "" : "g"}</span>
          </p>
          <p className="mt-3 text-sm text-fg">
            {loadedName ? `Reloaded “${loadedName}”.` : insight}
          </p>
          <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-line pt-4">
            <Stat label="Puck height" value={overflowing ? "—" : `${formatMm(puckMm)} mm`} />
            <Stat label="Density" value={`${density.toFixed(3)} g/ml`} />
            <Stat label="1 mm of bed" value={`${gPerMm.toFixed(2)} g`} />
          </dl>
          {tight ? (
            <p className="mt-3 text-sm text-danger">
              Below ~1.5 mm the puck often kisses the screen as you lock in.
            </p>
          ) : null}
        </section>

        <section className="order-3 rounded-2xl bg-surface p-4 shadow-border lg:order-2 lg:col-span-5 lg:p-5">
          <PuckDiagram
            geometry={geometry}
            doseG={doseG}
            basketName={
              state.basketId === "custom"
                ? `Custom ${diameterMm.toFixed(1)} × ${depthMm.toFixed(1)} mm`
                : basket.name
            }
          />
        </section>

        <section className="order-4 rounded-2xl bg-surface p-4 shadow-border lg:col-span-7 lg:p-6">
          <LabControls state={state} onChange={patch} />
        </section>

        <section className="order-5 rounded-2xl bg-surface p-4 shadow-border lg:col-span-5 lg:p-6">
          <SavedRecipes
            state={state}
            doseG={doseG}
            recipes={recipes}
            loadedId={loadedId}
            onSave={saveRecipe}
            onLoad={loadRecipe}
            onDelete={deleteRecipe}
            onReset={reset}
          />
        </section>

        <article className="order-6 grid gap-6 rounded-2xl bg-surface p-5 shadow-border lg:col-span-12 lg:grid-cols-3 lg:p-6">
          <div>
            <h2 className="font-display text-lg font-medium tracking-tight">Why the line slopes</h2>
            <p className="mt-2 text-sm text-muted">
              After a firm tamp, finer particles settle into the voids between larger ones. Bulk density
              rises, so the same grams occupy less height. To restore the original gap you add dose — not
              because the shot needs more coffee, but because the bed got shorter.
            </p>
          </div>
          <div>
            <h2 className="font-display text-lg font-medium tracking-tight">How to use it</h2>
            <p className="mt-2 text-sm text-muted">
              Pick the basket you actually use, choose a working headspace (2–5 mm is the usual window),
              then set the grind you are on. The highlighted curve is the dose that holds that gap.
              Click the chart to jump grind. A puck screen eats part of the gap, so the curve drops.
            </p>
          </div>
          <div>
            <h2 className="font-display text-lg font-medium tracking-tight">What this is not</h2>
            <p className="mt-2 text-sm text-muted">
              Shot time lives on a different curve. A higher dose also adds resistance, so you often grind
              coarser to keep flow — even as this chart asks for more coffee to hold headspace. Treat the
              numbers as a directional model, not a lab measurement of your particular beans.
            </p>
          </div>
        </article>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs tracking-wide text-muted uppercase">{label}</dt>
      <dd className="mt-1 font-mono text-sm tabular-nums">{value}</dd>
    </div>
  );
}
