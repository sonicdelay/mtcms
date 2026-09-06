import { useStoreValue } from "../store";
import type { DeepKeys, WaveState } from "../store";

interface WaveBarProps {
  title?: string;
  className?: string;
  source?: DeepKeys<WaveState>;
  children?: React.ReactNode;
}

export default function WaveBar({ title, className, source = "sin", children }: WaveBarProps) {
  const value = useStoreValue(source) as number;

  const barWidth = ((value + 1) / 2) * 100;
  const hue = ((value + 1) / 2) * 360;

  return (
    <div className={className}>
      {title && <h2 className="mb-2 font-semibold">{title}</h2>}
      <div className="p-2 font-mono text-xs overflow-hidden">
        <div
          style={{
            width: `${barWidth}%`,
            height: 8,
            backgroundColor: `hsl(${hue}, 80%, 50%)`,
            borderRadius: 4,
            transition: "width 100ms linear",
          }}
        />
        <p className="mt-1 opacity-70">
          {source} = {value.toFixed(4)}
        </p>
      </div>
      {children}
    </div>
  );
}
