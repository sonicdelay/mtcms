import { useStoreValue } from "../store";
import type { DeepKeys, WaveState } from "../store";

interface WaveProps {
  title?: string;
  className?: string;
  source?: DeepKeys<WaveState>;
  children?: React.ReactNode;
}

export default function Wave({ title, className, source = "sin", children }: WaveProps) {
  const value = useStoreValue(source) as number;

  const normalized = (value + 1) / 2;
  const hue = normalized * 120;

    const waveClassName = ["Wave", className].filter(Boolean).join(" ");

  return (
    <div className={waveClassName}>
      {title && <h2 className="mb-2 font-semibold">{title}</h2>}
      <div className="font-mono text-4xl font-bold" style={{ color: `hsl(${hue}, 90%, 45%)` }}>
        {value.toFixed(4)}
      </div>
      <svg viewBox="0 0 200 60" className="mt-2 w-full" style={{ maxWidth: 300 }}>
        <line x1="0" y1="30" x2="200" y2="30" stroke="#ccc" strokeWidth="0.5" />
        <circle
          cx={normalized * 200}
          cy={30 - value * 25}
          r="6"
          fill={`hsl(${hue}, 90%, 45%)`}
        />
      </svg>
      {children}
    </div>
  );
}
