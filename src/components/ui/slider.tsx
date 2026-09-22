import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

type Props = {
  value: number;
  min: number;
  max: number;
  step?: number;
  onValueChange: (value: number) => void;
  "aria-label": string;
  className?: string;
};

export function Slider({
  value,
  min,
  max,
  step = 1,
  onValueChange,
  className,
  ...rest
}: Props) {
  return (
    <SliderPrimitive.Root
      value={[value]}
      min={min}
      max={max}
      step={step}
      onValueChange={(v) => onValueChange(v[0] ?? value)}
      className={cn(
        "relative flex h-11 w-full touch-none items-center select-none",
        className,
      )}
      {...rest}
    >
      <SliderPrimitive.Track className="relative h-1 w-full grow overflow-hidden rounded-full bg-fg/10">
        <SliderPrimitive.Range className="absolute h-full bg-accent" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        className={cn(
          "block size-5 rounded-full bg-fg shadow-[0_0_0_4px_var(--color-bg)]",
          "transition-transform duration-150 ease-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
          "active:scale-95",
        )}
      />
    </SliderPrimitive.Root>
  );
}
