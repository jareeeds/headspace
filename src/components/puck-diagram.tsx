import { formatG, formatMm, puckHeightMm, type Geometry } from "@/lib/headspace";

type Props = {
  geometry: Geometry;
  doseG: number;
  basketName: string;
};

export function PuckDiagram({ geometry, doseG, basketName }: Props) {
  const { depthMm, headspaceMm, screenMm } = geometry;
  const puckMm = Math.max(puckHeightMm(geometry), 0);
  const usable = Math.max(depthMm, 1);
  const imprint = headspaceMm < 1.5;
  const airy = headspaceMm > 6.5;

  const W = 280;
  const H = 300;
  const left = 40;
  const right = 196;
  const top = 40;
  const bottom = 262;
  const innerH = bottom - top;
  const taper = 8;

  const px = (mm: number) => top + (mm / usable) * innerH;
  const screenY = px(0);
  const puckScreenY = screenMm > 0 ? px(screenMm) : screenY;
  const puckTopY = px(screenMm + headspaceMm);
  const gapPx = puckTopY - puckScreenY;
  const labelInside = gapPx > 22;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-lg font-medium tracking-tight">Puck section</h2>
        <p className="text-xs text-muted">{basketName}</p>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mx-auto h-64 w-full max-w-sm text-fg"
        role="img"
        aria-label={`Basket cross-section. ${formatG(doseG)} gram puck, ${formatMm(puckMm)} millimetres tall, ${formatMm(headspaceMm)} millimetres of headspace.`}
      >
        <defs>
          <pattern
            id="puck-hatch"
            width="6"
            height="6"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(28)"
          >
            <line x1="0" y1="0" x2="0" y2="6" stroke="var(--color-puck-top)" strokeWidth="1.4" />
          </pattern>
          <linearGradient id="puck-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-puck-top)" />
            <stop offset="100%" stopColor="var(--color-puck)" />
          </linearGradient>
        </defs>

        <line
          x1={left - 10}
          y1={screenY}
          x2={right + 10}
          y2={screenY}
          stroke="var(--color-steel)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {Array.from({ length: 9 }, (_, i) => {
          const x = left + ((right - left) * i) / 8;
          return <circle key={i} cx={x} cy={screenY} r="1.6" fill="var(--color-bg)" />;
        })}
        <text
          x={(left + right) / 2}
          y={screenY - 12}
          textAnchor="middle"
          fill="var(--color-muted)"
          fontSize="10"
          fontFamily="var(--font-sans)"
        >
          Shower screen
        </text>

        <path
          d={`M ${left} ${top} L ${left + taper} ${bottom} L ${right - taper} ${bottom} L ${right} ${top}`}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="1.5"
        />
        <line
          x1={left + taper}
          y1={bottom}
          x2={right - taper}
          y2={bottom}
          stroke="var(--color-accent)"
          strokeWidth="2"
        />

        <polygon
          points={`${left},${puckScreenY} ${right},${puckScreenY} ${right - ((puckTopY - top) / innerH) * taper},${puckTopY} ${left + ((puckTopY - top) / innerH) * taper},${puckTopY}`}
          fill="var(--color-fg)"
          opacity="0.05"
        />

        {screenMm > 0 ? (
          <line
            x1={left + 4}
            y1={puckScreenY}
            x2={right - 4}
            y2={puckScreenY}
            stroke="var(--color-accent)"
            strokeWidth="2"
            strokeDasharray="3 2"
          />
        ) : null}

        <polygon
          points={`${left + ((puckTopY - top) / innerH) * taper},${puckTopY} ${right - ((puckTopY - top) / innerH) * taper},${puckTopY} ${right - taper},${bottom} ${left + taper},${bottom}`}
          fill="url(#puck-fill)"
        />
        <polygon
          points={`${left + ((puckTopY - top) / innerH) * taper},${puckTopY} ${right - ((puckTopY - top) / innerH) * taper},${puckTopY} ${right - taper},${bottom} ${left + taper},${bottom}`}
          fill="url(#puck-hatch)"
          opacity="0.35"
        />

        <line
          x1={right + 16}
          y1={puckScreenY}
          x2={right + 16}
          y2={puckTopY}
          stroke="var(--color-accent)"
          strokeWidth="1"
        />
        <line
          x1={right + 12}
          y1={puckScreenY}
          x2={right + 20}
          y2={puckScreenY}
          stroke="var(--color-accent)"
        />
        <line
          x1={right + 12}
          y1={puckTopY}
          x2={right + 20}
          y2={puckTopY}
          stroke="var(--color-accent)"
        />

        {labelInside ? (
          <text
            x={(left + right) / 2}
            y={(puckScreenY + puckTopY) / 2 + 4}
            textAnchor="middle"
            fill="var(--color-fg)"
            fontSize="11"
            fontFamily="var(--font-mono)"
          >
            {formatMm(headspaceMm)} mm gap
          </text>
        ) : (
          <text
            x={right + 24}
            y={(puckScreenY + puckTopY) / 2 + 4}
            fill="var(--color-fg)"
            fontSize="11"
            fontFamily="var(--font-mono)"
          >
            {formatMm(headspaceMm)} mm
          </text>
        )}

        <text
          x={(left + right) / 2}
          y={(puckTopY + bottom) / 2 - 6}
          textAnchor="middle"
          fill="var(--color-fg)"
          fontSize="13"
          fontFamily="var(--font-display)"
        >
          {formatG(doseG)} g
        </text>
        <text
          x={(left + right) / 2}
          y={(puckTopY + bottom) / 2 + 12}
          textAnchor="middle"
          fill="var(--color-fg)"
          opacity="0.75"
          fontSize="10"
          fontFamily="var(--font-sans)"
        >
          {formatMm(puckMm)} mm bed
        </text>
      </svg>

      <p className={imprint || airy ? "text-sm text-danger" : "text-sm text-muted"}>
        {imprint
          ? "Tight headspace — the puck may imprint on the shower screen when you lock in."
          : airy
            ? "Generous headspace — water can pool and swirl before it meets the puck, which often channels."
            : "This gap is in the usual 2–6 mm working window for a level, unimprinted puck."}
      </p>
    </div>
  );
}
