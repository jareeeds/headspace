import type { ReactNode } from "react";
import { Slider } from "@/components/ui/slider";
import {
  BASKETS,
  GRIND_MAX,
  GRIND_MIN,
  GRIND_STEP,
  HEADSPACE_MAX,
  HEADSPACE_MIN,
  ROASTS,
  SCREEN_MM,
  grindBand,
  type LabState,
} from "@/lib/headspace";
import { cn } from "@/lib/utils";

export type { LabState };

type Props = {
  state: LabState;
  onChange: (patch: Partial<LabState>) => void;
};

export function LabControls({ state, onChange }: Props) {
  const isCustom = state.basketId === "custom";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-display text-lg font-medium tracking-tight">Basket & recipe</h2>
        <p className="mt-1 text-sm text-muted">
          Geometry sets the volume. Grind and roast set how densely that volume packs.
        </p>
      </div>

      <fieldset>
        <legend className="mb-2 text-xs font-medium tracking-wide text-muted uppercase">Basket</legend>
        <div className="flex flex-wrap gap-2">
          {BASKETS.map((b) => {
            const active = state.basketId === b.id;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => onChange({ basketId: b.id })}
                className={cn(
                  "min-h-11 rounded-md px-3 py-2 text-left transition-colors duration-150",
                  "focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none",
                  active
                    ? "bg-fg text-accent-fg"
                    : "bg-raised text-fg shadow-border hover:bg-line",
                )}
              >
                <span className="block text-sm font-medium">{b.name}</span>
                <span className={cn("block text-xs", active ? "text-accent-fg/70" : "text-muted")}>
                  {b.subtitle}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {isCustom ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Diameter" value={`${state.customDiameter.toFixed(1)} mm`}>
            <Slider
              aria-label="Basket diameter in millimetres"
              min={49}
              max={59}
              step={0.1}
              value={state.customDiameter}
              onValueChange={(customDiameter) =>
                onChange({ customDiameter: Math.round(customDiameter * 10) / 10 })
              }
            />
          </Field>
          <Field label="Depth" value={`${state.customDepth.toFixed(1)} mm`}>
            <Slider
              aria-label="Basket depth in millimetres"
              min={18}
              max={32}
              step={0.5}
              value={state.customDepth}
              onValueChange={(customDepth) => onChange({ customDepth })}
            />
          </Field>
        </div>
      ) : null}

      <Field
        label="Headspace"
        value={`${state.headspaceMm.toFixed(1)} mm`}
        hint="Gap from shower screen (or puck screen) down to the tamped bed."
      >
        <Slider
          aria-label="Target headspace in millimetres"
          min={HEADSPACE_MIN}
          max={HEADSPACE_MAX}
          step={0.5}
          value={state.headspaceMm}
          onValueChange={(headspaceMm) => onChange({ headspaceMm })}
        />
        <div className="mt-1 flex justify-between text-xs text-subtle">
          <span>Tight</span>
          <span>Airy</span>
        </div>
      </Field>

      <Field label="Grind size" value={`${state.grindUm} μm`} hint={grindBand(state.grindUm)}>
        <Slider
          aria-label="Grind size in microns"
          min={GRIND_MIN}
          max={GRIND_MAX}
          step={GRIND_STEP}
          value={state.grindUm}
          onValueChange={(grindUm) => onChange({ grindUm })}
        />
        <div className="mt-1 flex justify-between text-xs text-subtle">
          <span>Finer</span>
          <span>Coarser</span>
        </div>
      </Field>

      <fieldset>
        <legend className="mb-2 text-xs font-medium tracking-wide text-muted uppercase">Roast</legend>
        <div className="grid grid-cols-3 gap-2">
          {ROASTS.map((r) => {
            const active = state.roast === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => onChange({ roast: r.id })}
                className={cn(
                  "min-h-11 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150",
                  "focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none",
                  active
                    ? "bg-fg text-accent-fg"
                    : "bg-raised text-fg shadow-border hover:bg-line",
                )}
              >
                {r.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-xs font-medium tracking-wide text-muted uppercase">Puck screen</legend>
        <div className="grid grid-cols-2 gap-2">
          {[
            { on: false, label: "None" },
            { on: true, label: `${SCREEN_MM} mm` },
          ].map((opt) => {
            const active = state.screenOn === opt.on;
            return (
              <button
                key={String(opt.on)}
                type="button"
                onClick={() => onChange({ screenOn: opt.on })}
                className={cn(
                  "min-h-11 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150",
                  "focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none",
                  active
                    ? "bg-fg text-accent-fg"
                    : "bg-raised text-fg shadow-border hover:bg-line",
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-muted">
          A puck screen occupies part of the gap, so the same visual clearance needs a slightly lower dose.
        </p>
      </fieldset>
    </div>
  );
}

function Field({
  label,
  value,
  hint,
  children,
}: {
  label: string;
  value: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-xs font-medium tracking-wide text-muted uppercase">{label}</p>
        <p className="font-mono text-sm tabular-nums text-fg">{value}</p>
      </div>
      {children}
      {hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </div>
  );
}
