import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ISO_LEVELS_MM,
  buildChartData,
  formatG,
  type ChartRow,
} from "@/lib/headspace";

type Props = {
  diameterMm: number;
  depthMm: number;
  targetHs: number;
  roastMul: number;
  screenMm: number;
  grindUm: number;
  doseG: number;
  onGrindChange: (grind: number) => void;
};

const GHOST = "color-mix(in oklab, var(--color-fg) 22%, transparent)";
const HERO = "var(--color-accent)";
const IMPRINT = "color-mix(in oklab, var(--color-danger) 70%, transparent)";

export function IsoChart({
  diameterMm,
  depthMm,
  targetHs,
  roastMul,
  screenMm,
  grindUm,
  doseG,
  onGrindChange,
}: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const data = useMemo(
    () => buildChartData({ diameterMm, depthMm, targetHs, roastMul, screenMm }),
    [diameterMm, depthMm, targetHs, roastMul, screenMm],
  );

  const yDomain = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    for (const row of data) {
      min = Math.min(min, row.target, row.hs8);
      max = Math.max(max, row.target, row.imprint, row.hs2);
    }
    const pad = Math.max(1.2, (max - min) * 0.12);
    return [Math.max(8, Math.floor(min - pad)), Math.ceil(max + pad)] as [number, number];
  }, [data]);

  const targetInPresets = (ISO_LEVELS_MM as readonly number[]).includes(targetHs);

  return (
    <div className="flex h-full min-h-80 flex-col">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted uppercase">Iso-headspace</p>
          <h2 className="font-display text-xl font-medium tracking-tight md:text-2xl">
            Dose versus grind
          </h2>
        </div>
        <p className="max-w-xs text-right text-xs text-muted">
          Each line holds headspace constant. Finer grind, heavier dose.
        </p>
      </div>

      <div className="mt-4 min-h-0 flex-1">
        {mounted ? (
          <ResponsiveContainer width="100%" height="100%" minHeight={280}>
            <LineChart
              data={data}
              margin={{ top: 8, right: 12, left: 8, bottom: 4 }}
              onClick={(e) => {
                const g = e?.activeLabel;
                if (typeof g === "number") onGrindChange(g);
                if (typeof g === "string") onGrindChange(Number(g));
              }}
            >
              <CartesianGrid stroke="var(--color-line)" strokeDasharray="3 6" vertical={false} />
              <XAxis
                dataKey="grind"
                type="number"
                domain={[180, 420]}
                ticks={[180, 230, 280, 330, 380, 420]}
                tickFormatter={(v) => (v === 180 ? "Fine" : v === 420 ? "Coarse" : `${v}`)}
                stroke="var(--color-subtle)"
                tick={{ fill: "var(--color-muted)", fontSize: 11, fontFamily: "var(--font-sans)" }}
                axisLine={{ stroke: "var(--color-line)" }}
                tickLine={false}
              />
              <YAxis
                domain={yDomain}
                stroke="var(--color-subtle)"
                tick={{ fill: "var(--color-muted)", fontSize: 11, fontFamily: "var(--font-mono)" }}
                axisLine={false}
                tickLine={false}
                width={44}
                tickFormatter={(v) => `${v}`}
              />
              <Tooltip content={<ChartTooltip targetHs={targetHs} />} />

              <Line
                type="monotone"
                dataKey="imprint"
                stroke={IMPRINT}
                strokeWidth={1}
                strokeDasharray="4 4"
                dot={false}
                isAnimationActive={false}
                name="1 mm imprint"
              />

              {ISO_LEVELS_MM.map((hs) => {
                if (targetInPresets && hs === targetHs) return null;
                return (
                  <Line
                    key={hs}
                    type="monotone"
                    dataKey={`hs${hs}`}
                    stroke={GHOST}
                    strokeWidth={1.25}
                    dot={false}
                    isAnimationActive={false}
                    name={`${hs} mm`}
                  />
                );
              })}

              <Line
                type="monotone"
                dataKey="target"
                stroke={HERO}
                strokeWidth={2.5}
                dot={false}
                isAnimationActive={false}
                name={`${targetHs} mm`}
                activeDot={{ r: 5, fill: HERO, stroke: "var(--color-bg)", strokeWidth: 2 }}
              />

              <ReferenceDot
                x={grindUm}
                y={Number(doseG.toFixed(1))}
                r={6}
                fill="var(--color-fg)"
                stroke="var(--color-bg)"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-80 rounded-lg bg-raised" />
        )}
      </div>

      <div className="mt-1 flex justify-between text-xs text-subtle">
        <span>Finer, μm</span>
        <span>Dose, g (vertical)</span>
        <span>Coarser, μm</span>
      </div>

      <ul className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
        <li className="flex items-center gap-2">
          <span className="inline-block h-0.5 w-5 bg-accent" />
          {targetHs.toFixed(1)} mm target
        </li>
        <li className="flex items-center gap-2">
          <span className="inline-block h-px w-5 bg-fg/30" />
          Other gaps
        </li>
        <li className="flex items-center gap-2">
          <span className="inline-block w-5 border-t border-dashed border-danger" />
          1 mm imprint line
        </li>
        <li className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-fg" />
          Your setting
        </li>
      </ul>
    </div>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
  targetHs,
}: {
  active?: boolean;
  payload?: Array<{ dataKey?: string | number; value?: number; payload?: ChartRow }>;
  label?: number | string;
  targetHs: number;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;
  const grind = typeof label === "number" ? label : row.grind;

  return (
    <div className="rounded-md border border-line bg-surface px-3 py-2 shadow-border">
      <p className="font-mono text-xs text-muted">{grind} μm</p>
      <p className="mt-1 font-mono text-sm text-fg">
        {formatG(row.target)} g
        <span className="ml-2 text-xs text-muted">at {targetHs.toFixed(1)} mm</span>
      </p>
      <p className="mt-1 text-xs text-subtle">Click the chart to set grind</p>
    </div>
  );
}
