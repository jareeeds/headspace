import { useEffect, useState } from "react";
import { Bookmark, Check, Copy, RotateCcw, Trash2 } from "lucide-react";
import { BASKETS, ROASTS, formatG, formatMm, grindBand, type LabState } from "@/lib/headspace";
import { defaultRecipeName, type Recipe } from "@/lib/recipes";
import { cn } from "@/lib/utils";

type Props = {
  state: LabState;
  doseG: number;
  recipes: Recipe[];
  loadedId: string | null;
  onSave: (name: string) => void;
  onLoad: (recipe: Recipe) => void;
  onDelete: (id: string) => void;
  onReset: () => void;
};

export function SavedRecipes({
  state,
  doseG,
  recipes,
  loadedId,
  onSave,
  onLoad,
  onDelete,
  onReset,
}: Props) {
  const [name, setName] = useState("");
  const [savedFlash, setSavedFlash] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setName(defaultRecipeName(state));
  }, [state.basketId, state.headspaceMm, state.customDiameter, state.customDepth]);

  const save = () => {
    const next = name.trim() || defaultRecipeName(state);
    onSave(next);
    setName(next);
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 1400);
  };

  const copy = async () => {
    const basket = BASKETS.find((b) => b.id === state.basketId);
    const roast = ROASTS.find((r) => r.id === state.roast)?.label ?? "Medium";
    const basketLabel =
      state.basketId === "custom"
        ? `Custom ${state.customDiameter.toFixed(1)} × ${state.customDepth.toFixed(1)} mm`
        : (basket?.name ?? "Basket");
    const text = [
      "Headspace recipe",
      `${basketLabel} · ${roast.toLowerCase()} roast`,
      `Grind ${state.grindUm} μm (${grindBand(state.grindUm).toLowerCase()})`,
      `Headspace ${formatMm(state.headspaceMm)} mm · dose ${formatG(doseG)} g`,
      state.screenOn ? "Puck screen 1.7 mm" : "No puck screen",
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      // Clipboard can be blocked; the save path still works.
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-medium tracking-tight">Save & reload</h2>
          <p className="mt-1 text-sm text-muted">
            Named recipes stay on this device. The live sliders come back when you return.
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className={cn(
            "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-medium",
            "bg-raised text-fg shadow-border transition-colors duration-150 hover:bg-line",
            "focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none",
          )}
        >
          <RotateCcw className="size-4" strokeWidth={2} />
          Reset
        </button>
      </div>

      <form
        className="flex flex-col gap-3 sm:flex-row sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <label className="min-w-0 flex-1">
          <span className="mb-1 block text-xs font-medium tracking-wide text-muted uppercase">Name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={48}
            placeholder="Home espresso"
            className={cn(
              "h-11 w-full rounded-md bg-raised px-3 text-sm text-fg shadow-border",
              "placeholder:text-subtle",
              "focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none",
            )}
          />
        </label>
        <div className="flex gap-2">
          <button
            type="submit"
            className={cn(
              "inline-flex min-h-11 min-w-28 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium",
              "transition-transform duration-150 ease-out active:scale-95",
              "bg-fg text-accent-fg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none",
            )}
          >
            {savedFlash ? <Check className="size-4" strokeWidth={2} /> : <Bookmark className="size-4" strokeWidth={2} />}
            {savedFlash ? "Saved" : "Save"}
          </button>
          <button
            type="button"
            onClick={copy}
            className={cn(
              "inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium",
              "bg-raised text-fg shadow-border transition-transform duration-150 ease-out",
              "hover:bg-line active:scale-95",
              "focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none",
            )}
          >
            {copied ? <Check className="size-4" strokeWidth={2} /> : <Copy className="size-4" strokeWidth={2} />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </form>

      {recipes.length === 0 ? (
        <p className="text-sm text-muted">Nothing named yet. Save the current basket and grind to reload it later.</p>
      ) : (
        <ul className="divide-y divide-line">
          {recipes.map((recipe) => {
            const basket = BASKETS.find((b) => b.id === recipe.state.basketId);
            const active = loadedId === recipe.id;
            return (
              <li key={recipe.id} className="flex items-center gap-2 py-3 first:pt-0 last:pb-0">
                <button
                  type="button"
                  onClick={() => onLoad(recipe)}
                  className={cn(
                    "min-h-11 min-w-0 flex-1 rounded-md px-2 py-2 text-left transition-colors duration-150",
                    "hover:bg-raised focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none",
                    active && "bg-raised",
                  )}
                >
                  <span className="block truncate text-sm font-medium">{recipe.name}</span>
                  <span className="mt-0.5 block font-mono text-xs tabular-nums text-muted">
                    {formatG(recipe.doseG)} g · {recipe.state.grindUm} μm · {formatMm(recipe.state.headspaceMm)} mm
                    {basket ? ` · ${basket.name}` : ""}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onLoad(recipe)}
                  className={cn(
                    "inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-md px-3 text-sm font-medium",
                    "bg-raised text-fg shadow-border transition-colors duration-150 hover:bg-line",
                    "focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none",
                  )}
                >
                  <RotateCcw className="size-4" strokeWidth={2} />
                  {active ? "Loaded" : "Reload"}
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${recipe.name}`}
                  onClick={() => onDelete(recipe.id)}
                  className="inline-flex size-11 shrink-0 items-center justify-center rounded-md text-muted transition-colors duration-150 hover:bg-raised hover:text-fg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                >
                  <Trash2 className="size-4" strokeWidth={2} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
